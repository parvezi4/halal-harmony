import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

const MAX_PHOTOS_PER_PROFILE = 5;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function getProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    include: {
      photos: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({
    photos: profile.photos,
    maxPhotos: MAX_PHOTOS_PER_PROFILE,
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll('photos')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
  }

  if (profile.photos.length + files.length > MAX_PHOTOS_PER_PROFILE) {
    return NextResponse.json(
      {
        error: `Maximum ${MAX_PHOTOS_PER_PROFILE} photos allowed per profile`,
      },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: 'Only JPG, PNG, and WebP files are allowed',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: 'Each photo must be 2MB or smaller',
        },
        { status: 400 }
      );
    }
  }

  const uploadRoot = path.join(process.cwd(), 'public', 'uploads', session.user.id);
  await mkdir(uploadRoot, { recursive: true });

  const createdPhotos = [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const ext = path.extname(file.name) || '.jpg';
    const baseName = sanitizeFileName(path.basename(file.name, ext));
    const fileName = `${Date.now()}_${i}_${baseName}${ext}`;
    const filePath = path.join(uploadRoot, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/${session.user.id}/${fileName}`;

    const created = await prisma.photo.create({
      data: {
        profileId: profile.id,
        url,
        mimeType: file.type,
        fileSizeBytes: file.size,
        isPrimary: profile.photos.length === 0 && i === 0,
        isApproved: false,
        isBlurred: true,
      },
    });
    createdPhotos.push(created);
  }

  return NextResponse.json({
    success: true,
    photos: createdPhotos,
    message: 'Photos uploaded successfully. Photos are blurred until exchange approval.',
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const photoId = body?.photoId as string | undefined;

  if (!photoId) {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
  }

  const targetPhoto = profile.photos.find((photo) => photo.id === photoId);
  if (!targetPhoto) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.photo.updateMany({
      where: { profileId: profile.id },
      data: { isPrimary: false },
    }),
    prisma.photo.update({
      where: { id: photoId },
      data: { isPrimary: true },
    }),
  ]);

  const updatedProfile = await getProfile(session.user.id);
  return NextResponse.json({
    success: true,
    photos: updatedProfile?.photos ?? [],
    message: 'Primary photo updated',
  });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const photoId = body?.photoId as string | undefined;

  if (!photoId) {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
  }

  const targetPhoto = profile.photos.find((photo) => photo.id === photoId);
  if (!targetPhoto) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  await prisma.photo.delete({ where: { id: photoId } });

  const remainingPhotos = await prisma.photo.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: 'asc' },
  });

  if (targetPhoto.isPrimary && remainingPhotos.length > 0) {
    await prisma.photo.update({
      where: { id: remainingPhotos[0].id },
      data: { isPrimary: true },
    });
  }

  if (targetPhoto.url.startsWith('/uploads/')) {
    const fileOnDisk = path.join(process.cwd(), 'public', targetPhoto.url.replace(/^\//, ''));
    try {
      await unlink(fileOnDisk);
    } catch {
      // Ignore missing file errors and return success for DB cleanup.
    }
  }

  const updatedProfile = await getProfile(session.user.id);
  return NextResponse.json({
    success: true,
    photos: updatedProfile?.photos ?? [],
    message: 'Photo deleted',
  });
}
