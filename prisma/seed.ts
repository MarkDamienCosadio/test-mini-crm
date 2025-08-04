import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'] 
});

async function main() {
  console.log(' Starting seed...');


  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(' Database connection successful');
  } catch (error) {
    console.error(' Database connection failed', error);
    return;
  }

  const leads = Array.from({ length: 50 }, () => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    propertyInterest: faker.helpers.arrayElement(['LOT', 'CONDO', 'HOUSE']),
    source: faker.helpers.arrayElement(['SOCIAL_MEDIA', 'INTERNET', 'REFERRAL', 'WALK_IN']),
    transaction: faker.helpers.arrayElement(['BUYING', 'SELLING']),
    status: faker.helpers.arrayElement(['NEW', 'CONTACTED', 'SCHEDULED_VISIT', 'CLOSED', 'DROPPED']),
    notes: {
      create: {
        content: `Details: ${faker.music.genre()} artist, plays ${faker.music.songName()}`
      }
    }
  }));

  for (const [index, lead] of leads.entries()) {
    try {
      await prisma.lead.create({
        data: lead
      });
      console.log(`✓ Created lead ${index + 1}/50`);
    } catch (error) {
      console.error(`Failed to create lead ${index + 1}:`, error);
    }
  }

  console.log('🎉 Successfully seeded 50 leads with notes');
}

main()
  .catch(e => {
    console.error(' Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });