import { prisma } from '../../config/prisma';

function dateFilter(start?: Date, end?: Date): Record<string, unknown> {
  if (!start && !end) return {};
  const f: Record<string, Date> = {};
  if (start) f.gte = start;
  if (end)   f.lte = end;
  return { date: f };
}

// ─── summary ──────────────────────────────────────────────────────────────────

export async function getSummary(start?: Date, end?: Date) {
  const df = dateFilter(start, end);

  const [income, expense, total, recent] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { type: 'INCOME', deletedAt: null, ...df },
      _sum: { amount: true }, _count: true,
    }),
    prisma.financialRecord.aggregate({
      where: { type: 'EXPENSE', deletedAt: null, ...df },
      _sum: { amount: true }, _count: true,
    }),
    prisma.financialRecord.count({ where: { deletedAt: null, ...df } }),
    prisma.financialRecord.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, amount: true, type: true,
        category: true, date: true, notes: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  const totalIncome  = income._sum.amount  ?? 0;
  const totalExpense = expense._sum.amount ?? 0;

  return {
    totalIncome,
    totalExpense,
    netBalance:    totalIncome - totalExpense,
    totalRecords:  total,
    incomeCount:   income._count,
    expenseCount:  expense._count,
    recentActivity: recent,
  };
}

// ─── category totals ──────────────────────────────────────────────────────────

export async function getCategoryTotals(type?: 'INCOME' | 'EXPENSE', start?: Date, end?: Date) {
  const where: Record<string, unknown> = { deletedAt: null, ...dateFilter(start, end) };
  if (type) where.type = type;

  const rows = await prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    where,
    _sum:   { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  type Row = { category: string; type: string; _sum: { amount: number | null }; _count: { id: number } };
  return rows.map((r: Row) => ({
    category: r.category,
    type:     r.type,
    total:    r._sum.amount ?? 0,
    count:    r._count.id,
  }));
}

// ─── monthly trends ───────────────────────────────────────────────────────────

export async function getMonthlyTrends(year?: number) {
  const y = year ?? new Date().getFullYear();

  const records = await prisma.financialRecord.findMany({
    where: {
      deletedAt: null,
      date: { gte: new Date(`${y}-01-01`), lte: new Date(`${y}-12-31T23:59:59`) },
    },
    select: { amount: true, type: true, date: true },
  });

  type MonthBucket = { income: number; expense: number; net: number };
  const months: Record<number, MonthBucket> = {};
  for (let m = 1; m <= 12; m++) months[m] = { income: 0, expense: 0, net: 0 };

  for (const r of records) {
    const m = new Date(r.date).getMonth() + 1;
    if (r.type === 'INCOME') months[m].income  += r.amount;
    else                     months[m].expense += r.amount;
    months[m].net = months[m].income - months[m].expense;
  }

  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return Object.entries(months).map(([m, data]) => ({
    month: Number(m),
    label: labels[Number(m) - 1],
    year:  y,
    ...data,
  }));
}

// ─── weekly trends ────────────────────────────────────────────────────────────

export async function getWeeklyTrends(weeksBack = 8) {
  const since = new Date();
  since.setDate(since.getDate() - weeksBack * 7);

  const records = await prisma.financialRecord.findMany({
    where: { deletedAt: null, date: { gte: since } },
    select: { amount: true, type: true, date: true },
    orderBy: { date: 'asc' },
  });

  function isoWeek(d: Date): number {
    const tmp = new Date(d);
    tmp.setHours(0, 0, 0, 0);
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
    const jan4 = new Date(tmp.getFullYear(), 0, 4);
    return 1 + Math.round(((tmp.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  }

  const map: Record<string, { week: number; year: number; income: number; expense: number; net: number }> = {};

  for (const r of records) {
    const d    = new Date(r.date);
    const week = isoWeek(d);
    const yr   = d.getFullYear();
    const key  = `${yr}-W${String(week).padStart(2, '0')}`;

    if (!map[key]) map[key] = { week, year: yr, income: 0, expense: 0, net: 0 };

    if (r.type === 'INCOME') map[key].income  += r.amount;
    else                     map[key].expense += r.amount;
    map[key].net = map[key].income - map[key].expense;
  }

  return Object.entries(map)
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => a.year - b.year || a.week - b.week);
}

// ─── recent activity ──────────────────────────────────────────────────────────

export async function getRecentActivity(limit = 10) {
  return prisma.financialRecord.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true, amount: true, type: true,
      category: true, date: true, notes: true, createdAt: true,
      user: { select: { id: true, name: true } },
    },
  });
}

// ─── top categories ───────────────────────────────────────────────────────────

export async function getTopCategories(limit = 5) {
  const [topIncome, topExpense] = await Promise.all([
    prisma.financialRecord.groupBy({
      by: ['category'],
      where: { type: 'INCOME', deletedAt: null },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    }),
    prisma.financialRecord.groupBy({
      by: ['category'],
      where: { type: 'EXPENSE', deletedAt: null },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    }),
  ]);

  type CatRow = { category: string; _sum: { amount: number | null } };
  return {
    topIncomeCategories:  topIncome .map((r: CatRow) => ({ category: r.category, total: r._sum.amount ?? 0 })),
    topExpenseCategories: topExpense.map((r: CatRow) => ({ category: r.category, total: r._sum.amount ?? 0 })),
  };
}
