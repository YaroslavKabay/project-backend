import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin1234!', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@project.ua' },
    update: {},
    create: {
      email: 'admin@project.ua',
      passwordHash,
      name: 'Super Admin',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user seeded');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
