import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password123!';
const DEFAULT_PHOTO_BYTES = 180_000;

async function main() {
  console.log('Seeding database with test users...');

  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.report.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.user.deleteMany();

  const premiumPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Premium Plus',
      description: 'Monthly subscription',
      stripePriceId: 'price_premium_monthly_usd_20',
      durationDays: 30,
      isActive: true,
    },
  });

  const passwordHash = await bcryptjs.hash(DEFAULT_PASSWORD, 10);

  const commonPhotoA = {
    isPrimary: true,
    isApproved: true,
    isBlurred: true,
    mimeType: 'image/webp',
    fileSizeBytes: DEFAULT_PHOTO_BYTES,
  };

  const commonPhotoB = {
    isPrimary: false,
    isApproved: false,
    isBlurred: true,
    mimeType: 'image/webp',
    fileSizeBytes: DEFAULT_PHOTO_BYTES,
  };

  const user1 = await prisma.user.create({
    data: {
      email: 'ahmed@example.com',
      passwordHash,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: 'Ahmed Hassan',
          alias: 'Ahmed',
          gender: 'MALE',
          dateOfBirth: new Date('1992-05-15'),
          country: 'United Kingdom',
          city: 'London',
          region: 'Greater London',
          nationality: 'Egyptian',
          ethnicity: 'Arab',
          practicingLevel: 'Practicing',
          prayerHabit: '5 times daily',
          height: '178cm',
          weight: 82,
          bodyShape: 'Athletic',
          hijabOrBeard: 'Full beard',
          madhhabOrManhaj: "Shafi'i",
          maritalStatus: 'married',
          numberOfChildren: 1,
          childrenLivingWithMe: 1,
          willingToRelocate: 'maybe',
          spouseStatusPreferences: JSON.stringify(['virgin', 'separated']),
          about: 'Practicing Muslim seeking a righteous spouse according to Islamic values.',
          preferences: 'Family oriented and serious about nikah.',
          profession: 'Software Engineer',
          education: "Master's Degree",
          onboardingCompletedAt: new Date(),
          status: 'APPROVED',
          photos: {
            create: [
              {
                ...commonPhotoA,
                url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed',
              },
              {
                ...commonPhotoB,
                url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed2',
              },
            ],
          },
        },
      },
      subscriptions: {
        create: {
          planId: premiumPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          stripeCustomerId: 'cus_test_1',
          stripeSubscriptionId: 'sub_test_1',
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'fatima@example.com',
      passwordHash,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: 'Fatima Khan',
          alias: 'Fatima',
          gender: 'FEMALE',
          dateOfBirth: new Date('1995-08-22'),
          country: 'United Kingdom',
          city: 'Manchester',
          region: 'Greater Manchester',
          nationality: 'Pakistani',
          ethnicity: 'South Asian',
          practicingLevel: 'Practicing',
          prayerHabit: '5 times daily',
          height: '165cm',
          weight: 60,
          bodyShape: 'Average',
          hijabOrBeard: 'Hijab',
          madhhabOrManhaj: 'Hanafi',
          maritalStatus: 'virgin',
          numberOfChildren: 0,
          willingToRelocate: 'yes',
          spouseStatusPreferences: JSON.stringify(['virgin', 'divorced']),
          waliName: 'Mohammad Khan',
          waliRelationship: 'Father',
          waliEmail: 'wali.fatima@example.com',
          waliPhone: '+447700900111',
          about: 'Practicing sister looking for a respectful, responsible husband.',
          preferences: 'Practicing, mature, and family-focused.',
          profession: 'Healthcare Professional',
          education: "Bachelor's Degree",
          onboardingCompletedAt: new Date(),
          status: 'APPROVED',
          photos: {
            create: [
              {
                ...commonPhotoA,
                url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
              },
            ],
          },
        },
      },
      subscriptions: {
        create: {
          planId: premiumPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          stripeCustomerId: 'cus_test_2',
          stripeSubscriptionId: 'sub_test_2',
        },
      },
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'ali@example.com',
      passwordHash,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: 'Ali Malik',
          alias: 'Ali',
          gender: 'MALE',
          dateOfBirth: new Date('1990-03-10'),
          country: 'United Kingdom',
          city: 'Birmingham',
          region: 'West Midlands',
          nationality: 'British-Pakistani',
          ethnicity: 'South Asian',
          practicingLevel: 'Very practicing',
          prayerHabit: '5 times daily',
          height: '181cm',
          weight: 86,
          bodyShape: 'Muscular',
          hijabOrBeard: 'Full beard',
          madhhabOrManhaj: 'Hanafi',
          maritalStatus: 'separated',
          numberOfChildren: 2,
          childrenLivingWithMe: 0,
          willingToRelocate: 'no',
          spouseStatusPreferences: JSON.stringify(['virgin', 'married', 'separated']),
          about: 'Entrepreneur seeking a spouse with strong Islamic values.',
          preferences: 'Open to relocation discussion for the right match.',
          profession: 'Business Owner',
          education: "Master's Degree",
          onboardingCompletedAt: new Date(),
          status: 'APPROVED',
          photos: {
            create: [
              {
                ...commonPhotoA,
                url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ali',
              },
            ],
          },
        },
      },
    },
  });

  // User 4: Incomplete female profile (for testing female wizard with Step 5 - Wali info)
  const user4 = await prisma.user.create({
    data: {
      email: 'aisha@example.com',
      passwordHash,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          // Step 1: Basic Info (COMPLETE)
          fullName: 'Aisha Rahman',
          alias: 'Aisha',
          gender: 'FEMALE',
          dateOfBirth: new Date('1996-03-15'),
          country: 'United Kingdom',
          city: 'Birmingham',
          region: 'West Midlands',
          nationality: 'British',
          ethnicity: 'South Asian',

          // Step 2: Islamic Info (COMPLETE)
          practicingLevel: 'Practicing',
          prayerHabit: '5 times daily',
          height: '162cm',
          weight: 58,
          bodyShape: 'Average',
          hijabOrBeard: 'Hijab',
          madhhabOrManhaj: 'Hanafi',

          // Step 3: Marital/Family (INCOMPLETE - NOT SET)
          // maritalStatus: null,
          // numberOfChildren: null,
          // childrenLivingWithMe: null,
          // willingToRelocate: null,

          // Step 4: Preferences (INCOMPLETE - NOT SET)
          // spouseStatusPreferences: null,

          // Step 5: Wali Info (INCOMPLETE - NOT SET)
          // waliName: null,
          // waliRelationship: null,
          // waliEmail: null,
          // waliPhone: null,

          // Not completed yet
          onboardingCompletedAt: null,
          status: 'PENDING_REVIEW',
        },
      },
    },
  });

  // User 5: Incomplete onboarding (for testing wizard flow)
  const user5 = await prisma.user.create({
    data: {
      email: 'yusuf@example.com',
      passwordHash,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: 'Yusuf Ibrahim',
          gender: 'MALE',
          dateOfBirth: new Date('1994-07-10'),
          country: 'United Kingdom',
          city: 'Glasgow',
          nationality: 'British',
          practicingLevel: 'Practicing',
          prayerHabit: '5 times daily',
          height: '175cm',
          bodyShape: 'Average',
          hijabOrBeard: 'Trimmed',
          madhhabOrManhaj: 'Hanafi',
          // Incomplete: missing maritalStatus, willingToRelocate, spouseStatusPreferences
          // onboardingCompletedAt is NULL (not set)
          status: 'PENDING_REVIEW',
        },
      },
    },
  });

  // User 6: Female with annulled status and max photos
  const user6 = await prisma.user.create({
    data: {
      email: 'zainab@example.com',
      passwordHash,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: 'Zainab Ali',
          alias: 'Zainab',
          gender: 'FEMALE',
          dateOfBirth: new Date('1996-02-14'),
          country: 'United Kingdom',
          city: 'Bradford',
          region: 'West Yorkshire',
          nationality: 'Pakistani',
          ethnicity: 'South Asian',
          practicingLevel: 'Very practicing',
          prayerHabit: '5 times daily',
          height: '162cm',
          weight: 55,
          bodyShape: 'Average',
          hijabOrBeard: 'Niqab',
          madhhabOrManhaj: 'Hanafi',
          maritalStatus: 'annulled',
          numberOfChildren: 0,
          willingToRelocate: 'maybe',
          spouseStatusPreferences: JSON.stringify(['virgin', 'annulled']),
          waliName: 'Tariq Ali',
          waliRelationship: 'Brother',
          waliEmail: 'wali.zainab@example.com',
          waliPhone: '+447700900333',
          about: 'Seeking a righteous spouse for a halal marriage.',
          preferences: 'Strong deen and good character.',
          profession: 'Teacher',
          education: "Bachelor's Degree",
          onboardingCompletedAt: new Date(),
          status: 'APPROVED',
          photos: {
            create: [
              {
                ...commonPhotoA,
                url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zainab1',
              },
              {
                ...commonPhotoB,
                url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zainab2',
              },
              {
                ...commonPhotoB,
                url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zainab3',
              },
              {
                ...commonPhotoB,
                url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zainab4',
              },
              {
                ...commonPhotoB,
                url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zainab5',
              },
            ],
          },
        },
      },
    },
  });

  // User 7: Minimum age test (14 years old)
  const fourteenYearsAgo = new Date();
  fourteenYearsAgo.setFullYear(fourteenYearsAgo.getFullYear() - 14);
  fourteenYearsAgo.setMonth(0); // January
  fourteenYearsAgo.setDate(1);

  const user7 = await prisma.user.create({
    data: {
      email: 'sara@example.com',
      passwordHash,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: 'Sara Ahmed',
          alias: 'Sara',
          gender: 'FEMALE',
          dateOfBirth: fourteenYearsAgo,
          country: 'United Kingdom',
          city: 'London',
          nationality: 'British',
          ethnicity: 'Arab',
          practicingLevel: 'Practicing',
          prayerHabit: 'Regularly',
          height: '160cm',
          bodyShape: 'Average',
          hijabOrBeard: 'Hijab',
          madhhabOrManhaj: "Shafi'i",
          maritalStatus: 'virgin',
          numberOfChildren: 0,
          willingToRelocate: 'yes',
          spouseStatusPreferences: JSON.stringify(['virgin']),
          waliName: 'Khalid Ahmed',
          waliRelationship: 'Father',
          waliEmail: 'wali.sara@example.com',
          waliPhone: '+447700900444',
          about: 'Young sister seeking a spouse with strong Islamic values.',
          preferences: 'Practicing and family-oriented.',
          onboardingCompletedAt: new Date(),
          status: 'APPROVED',
          // No photos for this user
        },
      },
    },
  });

  await prisma.messageThread.create({
    data: {
      participantAId: user1.id,
      participantBId: user2.id,
      messages: {
        create: [
          {
            senderId: user1.id,
            content:
              'Assalamu alaikum, I came across your profile and felt we might be compatible.',
            isRead: true,
          },
          {
            senderId: user2.id,
            content: 'Wa alaikum assalam. JazakAllah for reaching out respectfully.',
            isRead: true,
          },
        ],
      },
    },
  });

  await prisma.report.create({
    data: {
      reporterId: user1.id,
      reason: 'Test report for moderation workflow',
      status: 'OPEN',
    },
  });

  console.log('\n✅ Seed complete! Test users created:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email                    | 🔑 Password     | 📋 Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(
    'ahmed@example.com           | Password123!   | ✅ COMPLETE (Male, married, 2 photos)'
  );
  console.log(
    'fatima@example.com          | Password123!   | ✅ COMPLETE (Female, virgin, 1 photo)'
  );
  console.log(
    'ali@example.com             | Password123!   | ✅ COMPLETE (Male, separated, 1 photo)'
  );
  console.log(
    'aisha@example.com           | Password123!   | ⚠️  INCOMPLETE (Female - test Steps 3-5 + Wali)'
  );
  console.log(
    'yusuf@example.com           | Password123!   | ⚠️  INCOMPLETE (Male - test Steps 3-4)'
  );
  console.log(
    'zainab@example.com          | Password123!   | ✅ COMPLETE (Female, annulled, 5 photos MAX)'
  );
  console.log(
    'sara@example.com            | Password123!   | ✅ COMPLETE (Female, age 14 MIN, no photos)'
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
