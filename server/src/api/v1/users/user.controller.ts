import { Response } from 'express'; // 'Request' importu kaldırıldı
import expressAsyncHandler from 'express-async-handler';
import { UserService } from './user.service';
import { AuthRequest } from '../../../middleware/authMiddleware';
import { ApiResponse } from '../../../utils/ApiResponse';
import {
  CreateUserInput,
  ListUsersQueryInput,
  UpdateUserInput,
  ChangePasswordInput,
} from './user.validation';
import { ApiError } from '../../../middleware/errorHandler'; // Bu import Adım 154'te eklenmişti

/**
 * @desc    List and search staff users
 * @route   GET /api/v1/users
 * @access  Private (Admin)
 */
export const listUsers = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const query = req.query as unknown as ListUsersQueryInput;

    const result = await UserService.list(tenantId, query);
    ApiResponse.ok(res, 'Users fetched successfully', result);
  },
);

/**
 * @desc    Create a new staff user
 * @route   POST /api/v1/users
 * @access  Private (Admin)
 */
export const createUser = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userData = req.body as CreateUserInput;

    const newUser = await UserService.create(tenantId, userData);
    ApiResponse.created(res, 'User created successfully', newUser);
  },
);

/**
 * @desc    Get a single staff user by ID
 * @route   GET /api/v1/users/:id
 * @access  Private (Admin)
 */
export const getUserById = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId = parseInt(req.params.id, 10);

    // Prevent admin from fetching their own profile via this endpoint
    if (userId === req.user!.id) {
      throw new ApiError(
        400,
        'Please use the /auth/me endpoint to fetch your own profile.',
      );
    }

    const user = await UserService.getById(tenantId, userId);
    ApiResponse.ok(res, 'User fetched successfully', user);
  },
);

/**
 * @desc    Update a staff user's details
 * @route   PUT /api/v1/users/:id
 * @access  Private (Admin)
 */
export const updateUser = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId = parseInt(req.params.id, 10);
    const userData = req.body as UpdateUserInput;

    // Prevent admin from updating their own profile via this endpoint
    if (userId === req.user!.id) {
      throw new ApiError(
        400,
        'Cannot update your own profile via this endpoint.',
      );
    }

    const updatedUser = await UserService.update(tenantId, userId, userData);
    ApiResponse.ok(res, 'User updated successfully', updatedUser);
  },
);

/**
 * @desc    Change a staff user's password
 * @route   PUT /api/v1/users/:id/password
 * @access  Private (Admin)
 */
export const updateUserPassword = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId = parseInt(req.params.id, 10);
    const { newPassword } = req.body as ChangePasswordInput;

    await UserService.updatePassword(tenantId, userId, newPassword);
    ApiResponse.ok(res, "User's password updated successfully", { id: userId });
  },
);

/**
 * @desc    Delete a staff user
 * @route   DELETE /api/v1/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId = parseInt(req.params.id, 10);

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      throw new ApiError(400, 'You cannot delete your own account.');
    }

    await UserService.delete(tenantId, userId);
    ApiResponse.ok(res, 'User deleted successfully', { id: userId });
  },
);