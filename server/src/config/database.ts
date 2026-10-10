import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('[DATABASE] Connected to SQLite/PostgreSQL database via Prisma successfully.');
  } catch (error) {
    console.error('[DATABASE] Database connection failure:', error);
    process.exit(1);
  }
}
