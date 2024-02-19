import { PrismaClient } from '@prisma/client';

// Taken from https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices#solution
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var globalPrisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const RevokeDB = globalThis.globalPrisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.globalPrisma = RevokeDB;
