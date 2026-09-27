import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export async function runSeed() {
  const identifier = process.env.SUPERADMIN_IDENTIFIER || 'superadmin';
  const password = process.env.SUPERADMIN_PASSWORD || 'AdminExamora2026!';
  const fullName = process.env.SUPERADMIN_NAME || 'Super Administrator';

  console.log(`Checking superadmin user: ${identifier}...`);

  const existing = await prisma.user.findFirst({
    where: {
      role: UserRole.SUPERADMIN,
      identifier: identifier,
    },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    const superadmin = await prisma.user.create({
      data: {
        role: UserRole.SUPERADMIN,
        identifier: identifier,
        passwordHash: passwordHash,
        fullName: fullName,
        isActive: true,
      },
    });
    console.log(`Superadmin created successfully! ID: ${superadmin.id}`);
  } else {
    console.log(`Superadmin already exists. Skipping.`);
  }
}

runSeed()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
