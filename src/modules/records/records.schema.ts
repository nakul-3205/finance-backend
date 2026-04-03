import { z } from 'zod';
import { RecordType } from '../../types/enums';

const isoDate = z
  .string()
  .refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid date — use ISO format e.g. 2024-03-15' })
  .transform((v) => new Date(v));

export const createRecordSchema = z.object({
  amount:   z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be > 0'),
  type:     z.nativeEnum(RecordType, { errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }) }),
  category: z.string().min(1, 'Category is required').max(80),
  date:     isoDate,
  notes:    z.string().max(500).optional(),
});

export const updateRecordSchema = z.object({
  amount:   z.number().positive('Amount must be > 0').optional(),
  type:     z.nativeEnum(RecordType).optional(),
  category: z.string().min(1).max(80).optional(),
  date:     isoDate.optional(),
  notes:    z.string().max(500).optional(),
});

export const listRecordsQuerySchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  type:      z.nativeEnum(RecordType).optional(),
  category:  z.string().optional(),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid startDate' }).transform((v) => new Date(v)).optional(),
  endDate:   z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid endDate'   }).transform((v) => new Date(v)).optional(),
  search:    z.string().optional(),
  sortBy:    z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
