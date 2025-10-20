const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Connection successful');
    const result = await prisma.$queryRaw`SELECT current_database(), current_user`;
    console.log('Database info:', result);
    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

test();
