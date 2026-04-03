import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { adminOnly } from '../../middleware/role';
import { validate, validateQuery } from '../../middleware/validate';
import * as ctrl from './users.controller';
import {
  listUsersQuerySchema,
  updateUserSchema,
  updateRoleSchema,
  updateStatusSchema,
} from './users.schema';

const router = Router();

// Every user-management route: must be logged in AND be an ADMIN
router.use(authenticate, adminOnly);

router.get('/',                validateQuery(listUsersQuerySchema), ctrl.listUsers);
router.get('/:id',                                                  ctrl.getUser);
router.patch('/:id',           validate(updateUserSchema),          ctrl.updateUser);
router.patch('/:id/role',      validate(updateRoleSchema),          ctrl.updateRole);
router.patch('/:id/status',    validate(updateStatusSchema),        ctrl.updateStatus);
router.delete('/:id',                                               ctrl.deleteUser);

export default router;
