import { Router } from 'express';
import { getSettings, updateSettings } from './settings.controller';
import {
  protect,
  authorize,
  checkTenant,
} from '../../../middleware/authMiddleware';
import { validateRequest } from '../../../middleware/validationMiddleware';
import { updateSettingsSchema } from './settings.validation';

const router = Router();

// Apply 'protect' (authentication) and 'checkTenant' (isolation)
router.use(protect, checkTenant);

/**
 * @route   GET /api/v1/settings
 * @desc    Get the settings for the current clinic
 * @access  Private (Admin, Reception)
 * @note    Reception needs this for opening hours, holidays, etc.
 */
router.get('/', authorize('admin', 'reception'), getSettings);

/**
 * @route   PUT /api/v1/settings
 * @desc    Update the settings for the current clinic
 * @access  Private (Admin only)
 */
router.put(
  '/',
  authorize('admin'),
  validateRequest(updateSettingsSchema),
  updateSettings,
);

export default router;