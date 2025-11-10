import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import expressAsyncHandler from 'express-async-handler';
import { ApiError } from './errorHandler';
import { getDb } from '../config/database';

// Extend the Express Request type to include the user property
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'doctor' | 'reception';
    tenantId: string;
  };
}

/**
 * JWT Verification Middleware
 * Protects routes by checking for a valid JWT token in the Authorization header.
 * Attaches the decoded user payload to req.user.
 */
export const protect = expressAsyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        // Get token from header (e.g., "Bearer <token>")
        token = req.headers.authorization.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET as string,
        ) as JwtPayload;

        // --- Fetch user from DB to ensure they still exist ---
        // This is crucial. A user might be deleted, but their token might still be valid.
        const db = getDb();
        const user = db
          .prepare(
            'SELECT id, email, role, tenantId FROM users WHERE id = ? AND isActive = 1',
          )
          .get(decoded.id);

        if (!user) {
          throw new ApiError(401, 'User not found. Token is invalid.');
        }

        // Attach user object to the request
        req.user = user as AuthRequest['user'];
        next();
      } catch (error) {
        console.error('Token verification failed:', error);
        throw new ApiError(401, 'Not authorized, token failed');
      }
    }

    if (!token) {
      throw new ApiError(401, 'Not authorized, no token');
    }
  },
);

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if the authenticated user (from 'protect' middleware) has one of the allowed roles.
 *
 * @example router.get('/', protect, authorize('admin', 'doctor'), getDashboard);
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Forbidden. User role '${req.user?.role}' is not authorized to access this resource.`,
      );
    }
    next();
  };
};

/**
 * Tenant Isolation Middleware
 * Ensures that the authenticated user's tenantId is attached to the request.
 * This is a lightweight check; actual data filtering must happen in services/controllers.
 */
export const checkTenant = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user?.tenantId) {
    throw new ApiError(
      400,
      'Invalid user profile. No clinic (tenantId) associated with this account.',
    );
  }
  // This middleware doesn't filter data itself, but ensures the tenantId
  // is available for all subsequent database queries in the services.
  next();
};