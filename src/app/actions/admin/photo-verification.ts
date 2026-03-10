'use server';

import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';
import { Prisma } from '@prisma/client';

export interface PhotoForVerification {
  id: string;
  profileId: string;
  userAlias: string;
  userEmail: string;
  url: string;
  mimeType: string;
  fileSizeBytes: number;
  isPrimary: boolean;
  isApproved: boolean;
  isBlurred: boolean;
  createdAt: string;
  profileStatus: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';
  profileRiskLabel: 'GREEN' | 'AMBER' | 'RED';
}

interface PaginatedPhotosResponse {
  success: boolean;
  data?: {
    photos: PhotoForVerification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: { general?: string };
}

interface PhotoActionResult {
  success: boolean;
  message?: string;
  errors?: { general?: string };
}

export async function getPendingPhotos(filters?: {
  status?: 'PENDING' | 'APPROVED';
  profileRiskLevel?: 'GREEN' | 'AMBER' | 'RED';
  search?: string;
  sortBy?: 'createdAt' | 'fileSizeBytes';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<PaginatedPhotosResponse> {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PHOTOS);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized to view photos' },
    };
  }

  try {
    const {
      status = 'PENDING',
      profileRiskLevel,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters || {};

    const where: Prisma.PhotoWhereInput = {};

    if (status === 'PENDING') {
      where.isApproved = false;
    } else if (status === 'APPROVED') {
      where.isApproved = true;
    }

    if (profileRiskLevel || search) {
      where.profile = {};

      if (profileRiskLevel) {
        where.profile.riskLabel = profileRiskLevel;
      }

      if (search) {
        where.profile.OR = [
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { alias: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const total = await prisma.photo.count({ where });

    const photos = await prisma.photo.findMany({
      where,
      include: {
        profile: {
          select: {
            alias: true,
            fullName: true,
            user: {
              select: {
                email: true,
              },
            },
            riskLabel: true,
            status: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder as Prisma.SortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = photos.map((photo) => {
      const profile = photo.profile;
      return {
        id: photo.id,
        profileId: photo.profileId,
        userAlias: profile.alias || profile.fullName || 'N/A',
        userEmail: profile.user.email,
        url: photo.url,
        mimeType: photo.mimeType,
        fileSizeBytes: photo.fileSizeBytes,
        isPrimary: photo.isPrimary,
        isApproved: photo.isApproved,
        isBlurred: photo.isBlurred,
        createdAt: photo.createdAt.toISOString(),
        profileStatus: profile.status as 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED',
        profileRiskLabel: profile.riskLabel as 'GREEN' | 'AMBER' | 'RED',
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        photos: data,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching pending photos:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch photos' },
    };
  }
}

export async function approvePhoto(photoId: string, reason?: string): Promise<PhotoActionResult> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PHOTOS);

  if (!access.authorized || !access.userId) {
    return {
      success: false,
      errors: { general: 'Not authorized to approve photos' },
    };
  }

  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return {
        success: false,
        errors: { general: 'Photo not found' },
      };
    }

    await prisma.photo.update({
      where: { id: photoId },
      data: {
        isApproved: true,
        isBlurred: false,
      },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'PHOTO_APPROVED',
        targetType: 'Photo',
        targetId: photoId,
        reason,
        metadata: { profileId: photo.profileId } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      message: 'Photo approved successfully',
    };
  } catch (error) {
    console.error('Error approving photo:', error);
    return {
      success: false,
      errors: { general: 'Failed to approve photo' },
    };
  }
}

export async function rejectPhoto(
  photoId: string,
  reason: string
): Promise<PhotoActionResult> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PHOTOS);

  if (!access.authorized || !access.userId) {
    return {
      success: false,
      errors: { general: 'Not authorized to reject photos' },
    };
  }

  if (!reason || reason.trim().length === 0) {
    return {
      success: false,
      errors: { general: 'Rejection reason is required' },
    };
  }

  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return {
        success: false,
        errors: { general: 'Photo not found' },
      };
    }

    // For rejected photos, we delete them rather than keeping them marked as rejected
    await prisma.photo.delete({
      where: { id: photoId },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'PHOTO_REJECTED',
        targetType: 'Photo',
        targetId: photoId,
        reason,
        metadata: { profileId: photo.profileId } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      message: 'Photo rejected and removed successfully',
    };
  } catch (error) {
    console.error('Error rejecting photo:', error);
    return {
      success: false,
      errors: { general: 'Failed to reject photo' },
    };
  }
}

export async function blurPhoto(photoId: string, reason?: string): Promise<PhotoActionResult> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PHOTOS);

  if (!access.authorized || !access.userId) {
    return {
      success: false,
      errors: { general: 'Not authorized to blur photos' },
    };
  }

  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return {
        success: false,
        errors: { general: 'Photo not found' },
      };
    }

    await prisma.photo.update({
      where: { id: photoId },
      data: {
        isBlurred: true,
      },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: 'PHOTO_BLURRED',
        targetType: 'Photo',
        targetId: photoId,
        reason,
        metadata: { profileId: photo.profileId } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      message: 'Photo blurred successfully',
    };
  } catch (error) {
    console.error('Error blurring photo:', error);
    return {
      success: false,
      errors: { general: 'Failed to blur photo' },
    };
  }
}

export async function getPhotoVerificationStats() {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.VERIFY_PHOTOS);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const [pending, approved, blurred, total] = await Promise.all([
      prisma.photo.count({ where: { isApproved: false } }),
      prisma.photo.count({ where: { isApproved: true } }),
      prisma.photo.count({ where: { isBlurred: true } }),
      prisma.photo.count(),
    ]);

    return {
      success: true,
      data: {
        pending,
        approved,
        blurred,
        total,
      },
    };
  } catch (error) {
    console.error('Error fetching photo stats:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch stats' },
    };
  }
}
