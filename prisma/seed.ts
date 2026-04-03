import { PrismaClient, Role, RecordType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const [adminPass, analystPass, viewerPass] = await Promise.all([
    bcrypt.hash('Admin@123', 12),
    bcrypt.hash('Analyst@123', 12),
    bcrypt.hash('Viewer@123', 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@finance.dev' },
    update: {},
    create: { name: 'System Admin', email: 'admin@finance.dev', password: adminPass, role: Role.ADMIN },
  });

  await prisma.user.upsert({
    where: { email: 'analyst@finance.dev' },
    update: {},
    create: { name: 'Jane Analyst', email: 'analyst@finance.dev', password: analystPass, role: Role.ANALYST },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@finance.dev' },
    update: {},
    create: { name: 'John Viewer', email: 'viewer@finance.dev', password: viewerPass, role: Role.VIEWER },
  });

  const records = [
    { amount: 85000, type: RecordType.INCOME,  category: 'Salary',          date: new Date('2024-01-15'), notes: 'Monthly salary Jan' },
    { amount: 12000, type: RecordType.EXPENSE, category: 'Rent',             date: new Date('2024-01-01'), notes: 'Office rent January' },
    { amount: 3200,  type: RecordType.EXPENSE, category: 'Utilities',        date: new Date('2024-01-05'), notes: 'Electricity and internet' },
    { amount: 45000, type: RecordType.INCOME,  category: 'Consulting',       date: new Date('2024-02-10'), notes: 'Q4 consulting project' },
    { amount: 8500,  type: RecordType.EXPENSE, category: 'Software',         date: new Date('2024-02-14'), notes: 'SaaS subscriptions' },
    { amount: 6700,  type: RecordType.EXPENSE, category: 'Travel',           date: new Date('2024-02-20'), notes: 'Client visit expenses' },
    { amount: 92000, type: RecordType.INCOME,  category: 'Salary',          date: new Date('2024-02-15'), notes: 'Monthly salary Feb' },
    { amount: 12000, type: RecordType.EXPENSE, category: 'Rent',             date: new Date('2024-02-01'), notes: 'Office rent February' },
    { amount: 15000, type: RecordType.INCOME,  category: 'Consulting',       date: new Date('2024-03-05'), notes: 'New client onboarding' },
    { amount: 4100,  type: RecordType.EXPENSE, category: 'Marketing',        date: new Date('2024-03-12'), notes: 'Ad campaigns Q1' },
    { amount: 92000, type: RecordType.INCOME,  category: 'Salary',          date: new Date('2024-03-15'), notes: 'Monthly salary Mar' },
    { amount: 2800,  type: RecordType.EXPENSE, category: 'Office Supplies',  date: new Date('2024-03-18'), notes: 'Stationery and equipment' },
  ];

  for (const r of records) {
    await prisma.financialRecord.create({ data: { ...r, createdBy: admin.id } });
  }

  console.log('\nSeed complete!');
  console.log('Admin    →  admin@finance.dev    /  Admin@123');
  console.log('Analyst  →  analyst@finance.dev  /  Analyst@123');
  console.log('Viewer   →  viewer@finance.dev   /  Viewer@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
