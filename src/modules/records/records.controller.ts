import { Response } from 'express';
import { RecordType } from '../../types/enums';
import { AuthRequest } from '../../middleware/auth';
import * as svc from './records.service';
import { ok, fail } from '../../utils/response';

export async function listRecords(req: AuthRequest, res: Response) {
  try {
    const q = req.query as Record<string, string | undefined>;
    const result = await svc.listRecords({
      page:      Number(q.page  ?? 1),
      limit:     Number(q.limit ?? 20),
      type:      q.type      as RecordType | undefined,
      category:  q.category,
      startDate: q.startDate ? new Date(q.startDate) : undefined,
      endDate:   q.endDate   ? new Date(q.endDate)   : undefined,
      search:    q.search,
      sortBy:    (q.sortBy    as 'date' | 'amount' | 'createdAt') ?? 'date',
      sortOrder: (q.sortOrder as 'asc'  | 'desc')                 ?? 'desc',
    });
    return ok(res, result);
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to list records', e.status ?? 500);
  }
}

export async function getRecord(req: AuthRequest, res: Response) {
  try {
    return ok(res, await svc.getRecordById(req.params.id));
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch record', e.status ?? 500);
  }
}

export async function createRecord(req: AuthRequest, res: Response) {
  try {
    const record = await svc.createRecord({ ...req.body, createdBy: req.user!.id });
    return ok(res, record, 'Record created', 201);
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to create record', e.status ?? 500);
  }
}

export async function updateRecord(req: AuthRequest, res: Response) {
  try {
    return ok(res, await svc.updateRecord(req.params.id, req.body), 'Record updated');
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to update record', e.status ?? 500);
  }
}

export async function deleteRecord(req: AuthRequest, res: Response) {
  try {
    await svc.softDelete(req.params.id);
    return ok(res, null, 'Record deleted');
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to delete record', e.status ?? 500);
  }
}

export async function restoreRecord(req: AuthRequest, res: Response) {
  try {
    return ok(res, await svc.restoreRecord(req.params.id), 'Record restored');
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to restore record', e.status ?? 500);
  }
}

export async function listCategories(_req: AuthRequest, res: Response) {
  try {
    return ok(res, await svc.listCategories());
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch categories', e.status ?? 500);
  }
}
