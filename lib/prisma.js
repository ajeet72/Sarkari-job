import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis; // ✅ use globalThis (works in both Node + Edge)

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'], // optional but helps catch runtime errors
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
