import { prisma } from '@/lib/prisma';
import { Gender } from '@prisma/client';
import bcryptjs from 'bcryptjs';

/**
 * Photo Database Constraint Tests
 *
 * Tests the database-level enforcement of photo constraints:
 * - MIME type validation (jpeg, png, webp only)
 * - File size validation (> 0 and <= 2MB)
 * - Photo limit per profile (max 5)
 * - NOT NULL constraints on metadata fields
 */

describe('Photo Database Constraints', () => {
  let testUserId: string;
  let testProfileId: string;

  beforeAll(async () => {
    // Create a test user and profile for all tests
    const passwordHash = await bcryptjs.hash('TestPassword123!', 10);

    const user = await prisma.user.create({
      data: {
        email: `photo-test-${Date.now()}@example.com`,
        passwordHash,
      },
    });
    testUserId = user.id;

    const profile = await prisma.profile.create({
      data: {
        userId: testUserId,
        gender: Gender.MALE,
        onboardingCompletedAt: new Date(),
      },
    });
    testProfileId = profile.id;
  });

  afterAll(async () => {
    // Cleanup: delete all photos, profile, and user
    await prisma.photo.deleteMany({ where: { profileId: testProfileId } });
    await prisma.profile.delete({ where: { id: testProfileId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  beforeEach(async () => {
    // Clean up photos before each test
    await prisma.photo.deleteMany({ where: { profileId: testProfileId } });
  });

  describe('MIME Type Constraint', () => {
    it('should accept image/jpeg as valid MIME type', async () => {
      const photo = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/photo.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 100000,
        },
      });

      expect(photo.mimeType).toBe('image/jpeg');
    });

    it('should accept image/png as valid MIME type', async () => {
      const photo = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/photo.png',
          mimeType: 'image/png',
          fileSizeBytes: 100000,
        },
      });

      expect(photo.mimeType).toBe('image/png');
    });

    it('should accept image/webp as valid MIME type', async () => {
      const photo = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/photo.webp',
          mimeType: 'image/webp',
          fileSizeBytes: 100000,
        },
      });

      expect(photo.mimeType).toBe('image/webp');
    });

    it('should reject invalid MIME type (image/gif)', async () => {
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/photo.gif',
            mimeType: 'image/gif',
            fileSizeBytes: 100000,
          },
        })
      ).rejects.toThrow(/photo_mime_type_allowed_chk/);
    });

    it('should reject invalid MIME type (application/pdf)', async () => {
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/file.pdf',
            mimeType: 'application/pdf',
            fileSizeBytes: 100000,
          },
        })
      ).rejects.toThrow(/photo_mime_type_allowed_chk/);
    });

    it('should reject invalid MIME type (text/plain)', async () => {
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/file.txt',
            mimeType: 'text/plain',
            fileSizeBytes: 100000,
          },
        })
      ).rejects.toThrow(/photo_mime_type_allowed_chk/);
    });
  });

  describe('File Size Constraint', () => {
    it('should accept valid file size at minimum (1 byte)', async () => {
      const photo = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/tiny.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1,
        },
      });

      expect(photo.fileSizeBytes).toBe(1);
    });

    it('should accept valid file size at maximum (2MB)', async () => {
      const maxSize = 2 * 1024 * 1024; // 2,097,152 bytes

      const photo = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/large.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: maxSize,
        },
      });

      expect(photo.fileSizeBytes).toBe(maxSize);
    });

    it('should accept valid file size in middle range (1MB)', async () => {
      const size = 1024 * 1024; // 1,048,576 bytes

      const photo = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/medium.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: size,
        },
      });

      expect(photo.fileSizeBytes).toBe(size);
    });

    it('should reject file size of 0 bytes', async () => {
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/empty.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: 0,
          },
        })
      ).rejects.toThrow(/photo_file_size_max_2mb_chk/);
    });

    it('should reject negative file size', async () => {
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/invalid.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: -1000,
          },
        })
      ).rejects.toThrow(/photo_file_size_max_2mb_chk/);
    });

    it('should reject file size exceeding 2MB (2MB + 1 byte)', async () => {
      const tooLarge = 2 * 1024 * 1024 + 1; // 2,097,153 bytes

      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/toolarge.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: tooLarge,
          },
        })
      ).rejects.toThrow(/photo_file_size_max_2mb_chk/);
    });

    it('should reject file size way beyond limit (10MB)', async () => {
      const wayTooLarge = 10 * 1024 * 1024; // 10,485,760 bytes

      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/huge.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: wayTooLarge,
          },
        })
      ).rejects.toThrow(/photo_file_size_max_2mb_chk/);
    });
  });

  describe('Photo Limit Per Profile (Max 5)', () => {
    it('should allow creating exactly 5 photos for a profile', async () => {
      const photos = [];

      for (let i = 1; i <= 5; i++) {
        const photo = await prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: `/uploads/test/photo${i}.jpg`,
            mimeType: 'image/jpeg',
            fileSizeBytes: 100000,
          },
        });
        photos.push(photo);
      }

      expect(photos.length).toBe(5);

      const count = await prisma.photo.count({
        where: { profileId: testProfileId },
      });
      expect(count).toBe(5);
    });

    it('should reject 6th photo when profile already has 5 photos', async () => {
      // Create 5 photos
      for (let i = 1; i <= 5; i++) {
        await prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: `/uploads/test/photo${i}.jpg`,
            mimeType: 'image/jpeg',
            fileSizeBytes: 100000,
          },
        });
      }

      // Try to create the 6th photo
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/photo6.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: 100000,
          },
        })
      ).rejects.toThrow(/A profile can have at most 5 photos/);
    });

    it('should allow creating 1 photo when profile has 0 photos', async () => {
      const photo = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/first.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 100000,
        },
      });

      expect(photo).toBeDefined();
      expect(photo.profileId).toBe(testProfileId);
    });

    it('should allow adding photos up to limit after deletion', async () => {
      // Create 5 photos
      const photos = [];
      for (let i = 1; i <= 5; i++) {
        const photo = await prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: `/uploads/test/photo${i}.jpg`,
            mimeType: 'image/jpeg',
            fileSizeBytes: 100000,
          },
        });
        photos.push(photo);
      }

      // Delete 2 photos
      await prisma.photo.delete({ where: { id: photos[0].id } });
      await prisma.photo.delete({ where: { id: photos[1].id } });

      // Should now be able to add 2 more photos
      const newPhoto1 = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/new1.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 100000,
        },
      });

      const newPhoto2 = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/new2.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 100000,
        },
      });

      expect(newPhoto1).toBeDefined();
      expect(newPhoto2).toBeDefined();

      const finalCount = await prisma.photo.count({
        where: { profileId: testProfileId },
      });
      expect(finalCount).toBe(5);
    });

    it('should enforce limit across multiple profiles independently', async () => {
      // Create second profile
      const passwordHash = await bcryptjs.hash('TestPassword123!', 10);
      const user2 = await prisma.user.create({
        data: {
          email: `photo-test-2-${Date.now()}@example.com`,
          passwordHash,
        },
      });

      const profile2 = await prisma.profile.create({
        data: {
          userId: user2.id,
          gender: Gender.FEMALE,
          onboardingCompletedAt: new Date(),
        },
      });

      try {
        // Fill first profile with 5 photos
        for (let i = 1; i <= 5; i++) {
          await prisma.photo.create({
            data: {
              profileId: testProfileId,
              url: `/uploads/test/p1-photo${i}.jpg`,
              mimeType: 'image/jpeg',
              fileSizeBytes: 100000,
            },
          });
        }

        // Should still be able to add photos to second profile
        for (let i = 1; i <= 5; i++) {
          await prisma.photo.create({
            data: {
              profileId: profile2.id,
              url: `/uploads/test/p2-photo${i}.jpg`,
              mimeType: 'image/jpeg',
              fileSizeBytes: 100000,
            },
          });
        }

        const count1 = await prisma.photo.count({
          where: { profileId: testProfileId },
        });
        const count2 = await prisma.photo.count({
          where: { profileId: profile2.id },
        });

        expect(count1).toBe(5);
        expect(count2).toBe(5);
      } finally {
        // Cleanup second profile
        await prisma.photo.deleteMany({ where: { profileId: profile2.id } });
        await prisma.profile.delete({ where: { id: profile2.id } });
        await prisma.user.delete({ where: { id: user2.id } });
      }
    });
  });

  describe('NOT NULL Constraints', () => {
    it('should reject photo creation without mimeType', async () => {
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/photo.jpg',
            // @ts-expect-error Testing NULL constraint
            mimeType: null,
            fileSizeBytes: 100000,
          },
        })
      ).rejects.toThrow();
    });

    it('should reject photo creation without fileSizeBytes', async () => {
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/photo.jpg',
            mimeType: 'image/jpeg',
            // @ts-expect-error Testing NULL constraint
            fileSizeBytes: null,
          },
        })
      ).rejects.toThrow();
    });

    it('should require both mimeType and fileSizeBytes', async () => {
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/photo.jpg',
            // @ts-expect-error Testing NULL constraint
            mimeType: null,
            // @ts-expect-error Testing NULL constraint
            fileSizeBytes: null,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Combined Constraint Validation', () => {
    it('should accept photo with all valid constraints', async () => {
      const photo = await prisma.photo.create({
        data: {
          profileId: testProfileId,
          url: '/uploads/test/valid.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 500000, // 500KB
          isPrimary: true,
          isApproved: false,
          isBlurred: true,
        },
      });

      expect(photo).toBeDefined();
      expect(photo.mimeType).toBe('image/jpeg');
      expect(photo.fileSizeBytes).toBe(500000);
      expect(photo.isPrimary).toBe(true);
      expect(photo.isApproved).toBe(false);
      expect(photo.isBlurred).toBe(true);
    });

    it('should reject photo violating multiple constraints', async () => {
      await expect(
        prisma.photo.create({
          data: {
            profileId: testProfileId,
            url: '/uploads/test/invalid.gif',
            mimeType: 'image/gif', // Invalid MIME type
            fileSizeBytes: 0, // Invalid size
          },
        })
      ).rejects.toThrow();
    });
  });
});
