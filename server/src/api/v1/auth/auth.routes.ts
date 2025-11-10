import { Router } from 'express';
import { loginUser, registerUser, getMyProfile } from './auth.controller';
import { protect } from '../../../middleware/authMiddleware';
import { validateRequest } from '../../../middleware/validationMiddleware';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', validateRequest(loginSchema), loginUser);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user (and potentially a new clinic/tenant)
 * @access  Public (or Admin only, depending on business logic)
 * @note    For this project, we'll allow public registration for a new clinic.
 */
router.post('/register', validateRequest(registerSchema), registerUser);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get the profile of the currently logged-in user
 * @access  Private (Protected)
 */
router.get('/me', protect, getMyProfile);

export default router;