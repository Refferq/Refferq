import { db } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    await db.seedDatabase();
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🏁 Seeding completed');
  });