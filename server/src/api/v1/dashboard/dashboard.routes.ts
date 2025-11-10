import { Router } from 'express';
import { getDashboardData } from './dashboard.controller';
import {
  protect,
  authorize,
  checkTenant,
} from '../../../middleware/authMiddleware';
import { validateRequest } from '../../../middleware/validationMiddleware';
import { dashboardQuerySchema } from './dashboard.validation';

const router = Router();

// Apply 'protect' (authentication) and 'checkTenant' (isolation)
router.use(protect, checkTenant);

/**
 * @route   GET /api/v1/dashboard
 * @desc    Get aggregated dashboard data (KPIs, charts)
 * @access  Private (Admin, Doctor, Reception)
 * @note    All roles can view the dashboard.
 * We can optionally show different data based on role in the service.
 */
router.get(
  '/',
  authorize('admin', 'doctor', 'reception'),
  validateRequest(dashboardQuerySchema),
  getDashboardData,
);

// Note: Additional routes could be added here for specific reports, e.g.:
// router.get('/sales-report', authorize('admin'), getSalesReport);
// router.get('/patient-report', authorize('admin'), getPatientReport);
// For this project, we'll keep it to one main endpoint.

export default router;