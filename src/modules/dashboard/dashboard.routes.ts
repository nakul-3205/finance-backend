import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { allRoles, analystOrAdmin } from '../../middleware/role';
import * as ctrl from './dashboard.controller';

const router = Router();

router.use(authenticate);

// ── All roles (VIEWER / ANALYST / ADMIN) ─────────────────────────────────────
router.get('/summary',         allRoles,        ctrl.getSummary);
router.get('/recent',          allRoles,        ctrl.getRecentActivity);

// ── ANALYST / ADMIN only ──────────────────────────────────────────────────────
router.get('/category-totals', analystOrAdmin,  ctrl.getCategoryTotals);
router.get('/trends/monthly',  analystOrAdmin,  ctrl.getMonthlyTrends);
router.get('/trends/weekly',   analystOrAdmin,  ctrl.getWeeklyTrends);
router.get('/top-categories',  analystOrAdmin,  ctrl.getTopCategories);

export default router;
