import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { fail } from '../utils/response';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      fail(res, 'Validation failed', 422, result.error.flatten().fieldErrors);
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      fail(res, 'Invalid query parameters', 422, result.error.flatten().fieldErrors);
      return;
    }
    next();
  };
}
