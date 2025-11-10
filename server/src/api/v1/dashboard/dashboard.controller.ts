import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { DashboardService } from './dashboard.service';
import { AuthRequest } from '../../../middleware/authMiddleware';
import { ApiResponse } from '../../../utils/ApiResponse';
import { DashboardQueryInput } from './dashboard.validation';

/**
 * @desc    Get aggregated dashboard data
 * @route   GET /api/v1/dashboard
 * @access  Private (Admin, Doctor, Reception)
 */
export const getDashboardData = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userRole = req.user!.role;
    const userId = req.user!.id; // For doctor-specific data
    const query = req.query as unknown as DashboardQueryInput;

    // The service can optionally filter data based on userRole and userId
    const data = await DashboardService.getAggregatedData(
      tenantId,
      query,
      userRole,
      userId,
    );

    ApiResponse.ok(res, 'Dashboard data fetched successfully', data);
  },
);