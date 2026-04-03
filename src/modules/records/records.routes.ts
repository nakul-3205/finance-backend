import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { adminOnly, analystOrAdmin, allRoles } from '../../middleware/role';
import { validate } from '../../middleware/validate';
import * as ctrl from './records.controller';
import { createRecordSchema, updateRecordSchema } from './records.schema';

const router = Router();

// All record routes require a valid token
router.use(authenticate);

// ── VIEWER / ANALYST / ADMIN ─────────────────────────────────────────────────
router.get('/',             allRoles,        ctrl.listRecords);
router.get('/categories',   allRoles,        ctrl.listCategories);
router.get('/:id',          allRoles,        ctrl.getRecord);

// ── ANALYST / ADMIN ──────────────────────────────────────────────────────────
router.post('/',            analystOrAdmin,  validate(createRecordSchema), ctrl.createRecord);
router.patch('/:id',        analystOrAdmin,  validate(updateRecordSchema), ctrl.updateRecord);

// ── ADMIN only ────────────────────────────────────────────────────────────────
router.delete('/:id',       adminOnly,       ctrl.deleteRecord);
router.post('/:id/restore', adminOnly,       ctrl.restoreRecord);

export default router;
