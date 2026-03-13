import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const password = process.argv[2] || 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.admin.findUnique({ where: { username: 'admin' } });
  if (existing) {
    await prisma.admin.update({ where: { username: 'admin' }, data: { passwordHash } });
    console.log(`Updated admin password.`);
  } else {
    await prisma.admin.create({ data: { id: crypto.randomUUID(), username: 'admin', passwordHash } });
    console.log(`Created admin user.`);
  }
  console.log(`Username: admin  |  Password: ${password}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
