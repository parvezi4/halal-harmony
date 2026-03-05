import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with mock data...');

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.report.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data');

  // Create subscription plans
  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Premium Plus',
      description: 'Monthly subscription',
      stripePriceId: 'price_premium_monthly_usd_20',
      durationDays: 30,
      isActive: true,
    },
  });

  console.log('✓ Created subscription plans');

  // Create test users (passwords: all "Password123!")
  const hashedPassword = await bcryptjs.hash('Password123!', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'ahmed@example.com',
      passwordHash: hashedPassword,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          alias: 'Ahmed Hassan',
          gender: 'MALE',
          dateOfBirth: new Date('1992-05-15'),
          ageRangeLabel: '28–32',
          country: 'United Kingdom',
          city: 'London',
          region: 'Greater London',
          nationality: 'Egyptian',
          practicingLevel: 'Consistent',
          prayerHabit: 'Prays 5x daily',
          hijabOrBeard: 'Full beard',
          madhhabOrManhaj: "Shafi'i",
          smoking: false,
          maritalStatus: 'Never Married',
          hasChildren: false,
          education: "Master's Degree",
          profession: 'Software Engineer',
          familyBackground: 'Well-established family',
          about:
            'Alhamdulillah, I am a practicing Muslim seeking a righteous partner. I believe in building a family rooted in Islamic values.',
          preferences: 'Looking for someone who is practicing and family-oriented.',
          willingToRelocate: true,
          showExactAge: true,
          showExactCity: true,
          photosVisibleTo: 'SUBSCRIBERS_ONLY',
          status: 'APPROVED',
          photos: {
            create: {
              url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed',
              isPrimary: true,
              isApproved: true,
            },
          },
        },
      },
      subscriptions: {
        create: {
          planId: basicPlan.id,
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
      passwordHash: hashedPassword,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          alias: 'Fatima Khan',
          gender: 'FEMALE',
          dateOfBirth: new Date('1995-08-22'),
          ageRangeLabel: '25–29',
          country: 'United Kingdom',
          city: 'Manchester',
          region: 'Greater Manchester',
          nationality: 'Pakistani',
          practicingLevel: 'Striving',
          prayerHabit: 'Prays 5x daily',
          hijabOrBeard: 'Wears hijab',
          madhhabOrManhaj: 'Hanafi',
          smoking: false,
          maritalStatus: 'Never Married',
          hasChildren: false,
          education: "Bachelor's Degree",
          profession: 'Healthcare Professional',
          familyBackground: 'Traditional, close-knit family',
          about:
            'I am a practicing Muslim woman seeking a sincere and kind-hearted partner who shares my values.',
          preferences: 'Looking for someone who is practicing, respectful, and family-focused.',
          willingToRelocate: true,
          waliName: 'Mohammad Khan',
          waliRelationship: 'Father',
          waliContact: 'wali@example.com',
          showExactAge: true,
          showExactCity: false,
          photosVisibleTo: 'SUBSCRIBERS_ONLY',
          status: 'APPROVED',
          photos: {
            create: {
              url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
              isPrimary: true,
              isApproved: true,
            },
          },
        },
      },
      subscriptions: {
        create: {
          planId: basicPlan.id,
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
      passwordHash: hashedPassword,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          alias: 'Ali Malik',
          gender: 'MALE',
          dateOfBirth: new Date('1990-03-10'),
          ageRangeLabel: '30–35',
          country: 'United Kingdom',
          city: 'Birmingham',
          region: 'West Midlands',
          nationality: 'British-Pakistani',
          practicingLevel: 'Very Consistent',
          prayerHabit: 'Prays 5x daily',
          hijabOrBeard: 'Full beard',
          madhhabOrManhaj: 'Deobandi',
          smoking: false,
          maritalStatus: 'Never Married',
          hasChildren: false,
          education: "Master's Degree",
          profession: 'Business Owner',
          familyBackground: 'Established business family',
          about:
            'Young entrepreneur seeking a righteous life partner to build a Islamic household.',
          preferences: 'Looking for someone practicing, educated, and family-conscious.',
          willingToRelocate: false,
          showExactAge: true,
          showExactCity: true,
          photosVisibleTo: 'ALL_MEMBERS',
          status: 'APPROVED',
          photos: {
            create: {
              url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ali',
              isPrimary: true,
              isApproved: true,
            },
          },
        },
      },
    },
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'aisha@example.com',
      passwordHash: hashedPassword,
      role: 'MEMBER',
      emailVerified: new Date(),
      profile: {
        create: {
          alias: 'Aisha Ahmed',
          gender: 'FEMALE',
          dateOfBirth: new Date('1993-11-30'),
          ageRangeLabel: '25–30',
          country: 'United Kingdom',
          city: 'Leeds',
          region: 'West Yorkshire',
          nationality: 'Egyptian',
          practicingLevel: 'Striving',
          prayerHabit: 'Prays 5x daily',
          hijabOrBeard: 'Wears headscarf',
          madhhabOrManhaj: "Shafi'i",
          smoking: false,
          maritalStatus: 'Never Married',
          hasChildren: false,
          education: 'Professional Qualification',
          profession: 'Project Manager',
          familyBackground: 'Professional family',
          about:
            'I believe in building a marriage based on mutual respect and Islamic principles. Open to discussion.',
          preferences: 'Seeking someone serious about marriage and Islamic growth.',
          willingToRelocate: true,
          waliName: 'Abdullah Ahmed',
          waliRelationship: 'Father',
          waliContact: 'wali.aisha@example.com',
          showExactAge: false,
          showExactCity: true,
          photosVisibleTo: 'SUBSCRIBERS_ONLY',
          status: 'APPROVED',
          photos: {
            create: {
              url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aisha',
              isPrimary: true,
              isApproved: true,
            },
          },
        },
      },
    },
  });

  console.log('✓ Created 4 test users with profiles and photos');

  // Create a message thread between Ahmed and Fatima
  const thread = await prisma.messageThread.create({
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
            content: 'Wa alaikum assalam wa rahmatullahi wa barakatuh! Thank you for reaching out.',
            isRead: true,
          },
          {
            senderId: user1.id,
            content: 'It would be great to know more about you. What are your interests?',
            isRead: false,
          },
        ],
      },
    },
  });

  console.log('✓ Created message thread with sample messages');

  // Create a report
  await prisma.report.create({
    data: {
      reporterId: user1.id,
      reason: 'Test report for moderation workflow',
      status: 'OPEN',
    },
  });

  console.log('✓ Created sample report');

  console.log('🎉 Seeding complete!');
  console.log('\n📋 Test Credentials:');
  console.log('   Email: ahmed@example.com | Password: Password123!');
  console.log('   Email: fatima@example.com | Password: Password123!');
  console.log('   Email: ali@example.com | Password: Password123!');
  console.log('   Email: aisha@example.com | Password: Password123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
