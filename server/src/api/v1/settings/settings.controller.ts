import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { SettingsService } from './settings.service';
import { AuthRequest } from '../../../middleware/authMiddleware';
import { ApiResponse } from '../../../utils/ApiResponse';
import { UpdateSettingsInput } from './settings.validation';

/**
 * @desc    Get the settings for the current clinic
 * @route   GET /api/v1/settings
 * @access  Private (Admin, Reception)
 */
export const getSettings = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;

    const settings = await SettingsService.get(tenantId);
    ApiResponse.ok(res, 'Settings fetched successfully', settings);
  },
);

/**
 * @desc    Update the settings for the current clinic
 * @route   PUT /api/v1/settings
 * @access  Private (Admin)
 */
export const updateSettings = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const settingsData = req.body as UpdateSettingsInput;

    const updatedSettings = await SettingsService.update(
      tenantId,
      settingsData,
    );
    ApiResponse.ok(res, 'Settings updated successfully', updatedSettings);
  },
);