import { Response } from 'express';

export function ok(res: Response, data: unknown, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function fail(res: Response, message: string, status = 400, errors?: unknown) {
  const body: Record<string, unknown> = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(status).json(body);
}
