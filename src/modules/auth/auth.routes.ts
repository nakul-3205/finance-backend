import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as ctrl from './auth.controller';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.schema';

const router = Router();

// ── public ──────────────────────────────────────────────────────────────────
router.post('/register',        validate(registerSchema),       ctrl.register);
router.post('/login',           validate(loginSchema),          ctrl.login);
router.post('/logout',                                          ctrl.logout);
router.post('/refresh-token',   validate(refreshTokenSchema),   ctrl.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password',  validate(resetPasswordSchema),  ctrl.resetPassword);

// ── protected ────────────────────────────────────────────────────────────────
router.get( '/me',              authenticate,                                          ctrl.me);
router.post('/change-password', authenticate, validate(changePasswordSchema),          ctrl.changePassword);

export default router;
