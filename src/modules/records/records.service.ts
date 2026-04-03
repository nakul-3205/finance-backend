import { RecordType } from '../../types/enums';
import { prisma } from '../../config/prisma';

interface ListParams {
  page: number;
  limit: number;
  type?: RecordType;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  sortBy: 'date' | 'amount' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

const recordSelect = {
  id: true, amount: true, type: true,
  category: true, date: true, notes: true,
  createdAt: true, updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
};

function buildWhere(p: ListParams): Record<string, unknown> {
  const where: Record<string, unknown> = { deletedAt: null };

  if (p.type)     where.type     = p.type;
  if (p.category) where.category = { contains: p.category };

  if (p.startDate || p.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (p.startDate) dateFilter.gte = p.startDate;
    if (p.endDate)   dateFilter.lte = p.endDate;
    where.date = dateFilter;
  }

  if (p.search) {
    where.OR = [
      { notes:    { contains: p.search } },
      { category: { contains: p.search } },
    ];
  }

  return where;
}

// ─── list ─────────────────────────────────────────────────────────────────────

export async function listRecords(p: ListParams) {
  const where = buildWhere(p);
  const skip  = (p.page - 1) * p.limit;

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      select: recordSelect,
      skip,
      take: p.limit,
      orderBy: { [p.sortBy]: p.sortOrder },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records,
    pagination: { total, page: p.page, limit: p.limit, totalPages: Math.ceil(total / p.limit) },
  };
}

// ─── get one ──────────────────────────────────────────────────────────────────

export async function getRecordById(id: string) {
  const record = await prisma.financialRecord.findFirst({ where: { id, deletedAt: null }, select: recordSelect });
  if (!record) throw { status: 404, message: 'Record not found' };
  return record;
}

// ─── create ───────────────────────────────────────────────────────────────────

export async function createRecord(data: {
  amount: number; type: RecordType; category: string; date: Date; notes?: string; createdBy: string;
}) {
  return prisma.financialRecord.create({ data, select: recordSelect });
}

// ─── update ───────────────────────────────────────────────────────────────────

export async function updateRecord(
  id: string,
  data: { amount?: number; type?: RecordType; category?: string; date?: Date; notes?: string },
) {
  const existing = await prisma.financialRecord.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw { status: 404, message: 'Record not found' };
  return prisma.financialRecord.update({ where: { id }, data, select: recordSelect });
}

// ─── soft delete ──────────────────────────────────────────────────────────────

export async function softDelete(id: string) {
  const existing = await prisma.financialRecord.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw { status: 404, message: 'Record not found' };
  await prisma.financialRecord.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ─── restore ──────────────────────────────────────────────────────────────────

export async function restoreRecord(id: string) {
  const existing = await prisma.financialRecord.findFirst({ where: { id, deletedAt: { not: null } } });
  if (!existing) throw { status: 404, message: 'Deleted record not found' };
  return prisma.financialRecord.update({ where: { id }, data: { deletedAt: null }, select: recordSelect });
}

// ─── categories list ──────────────────────────────────────────────────────────

export async function listCategories() {
  const rows = await prisma.financialRecord.groupBy({
    by: ['category'],
    where: { deletedAt: null },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });
  type CatRow = { category: string; _count: { category: number } };
  return rows.map((r: CatRow) => ({ category: r.category, count: r._count.category }));
}
