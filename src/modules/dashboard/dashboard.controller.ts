import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as svc from './dashboard.service';
import { ok, fail } from '../../utils/response';

export async function getSummary(req: AuthRequest, res: Response) {
  try {
    const { startDate, endDate } = req.query as Record<string, string | undefined>;
    return ok(res, await svc.getSummary(
      startDate ? new Date(startDate) : undefined,
      endDate   ? new Date(endDate)   : undefined,
    ));
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch summary', e.status ?? 500);
  }
}

export async function getCategoryTotals(req: AuthRequest, res: Response) {
  try {
    const { type, startDate, endDate } = req.query as Record<string, string | undefined>;
    return ok(res, await svc.getCategoryTotals(
      type as 'INCOME' | 'EXPENSE' | undefined,
      startDate ? new Date(startDate) : undefined,
      endDate   ? new Date(endDate)   : undefined,
    ));
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch category totals', e.status ?? 500);
  }
}

export async function getMonthlyTrends(req: AuthRequest, res: Response) {
  try {
    const year = req.query.year ? Number(req.query.year) : undefined;
    return ok(res, await svc.getMonthlyTrends(year));
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch monthly trends', e.status ?? 500);
  }
}

export async function getWeeklyTrends(req: AuthRequest, res: Response) {
  try {
    const weeksBack = req.query.weeksBack ? Number(req.query.weeksBack) : 8;
    return ok(res, await svc.getWeeklyTrends(weeksBack));
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch weekly trends', e.status ?? 500);
  }
}

export async function getRecentActivity(req: AuthRequest, res: Response) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    return ok(res, await svc.getRecentActivity(limit));
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch recent activity', e.status ?? 500);
  }
}

export async function getTopCategories(req: AuthRequest, res: Response) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    return ok(res, await svc.getTopCategories(limit));
  } catch (e: any) {
    return fail(res, e.message ?? 'Failed to fetch top categories', e.status ?? 500);
  }
}
