import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../../middleware/authMiddleware';
import { ApiResponse } from '../../../utils/ApiResponse';

/**
 * @desc    Authenticate (login) a user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const loginUser = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    
    // Note: We don't send the token in the response body for security.
    // An alternative (and more secure) method is setting an httpOnly cookie.
    // But for a stateless API used by a SPA, returning it is standard.
    // The frontend must store it securely (e.g., in memory, not localStorage).
    
    ApiResponse.ok(res, 'Login successful', result);
  },
);

/**
 * @desc    Register a new user and clinic
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registerUser = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { clinicName, userName, email, password } = req.body;

    const result = await AuthService.register({
      clinicName,
      userName,
      email,
      password,
    });
    
    ApiResponse.created(res, 'Registration successful. Please log in.', result);
  },
);

/**
 * @desc    Get current user's profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMyProfile = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    // req.user is attached by the 'protect' middleware
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    const userProfile = await AuthService.getProfile(userId, tenantId);
    
    ApiResponse.ok(res, 'Profile fetched successfully', userProfile);
  },
);