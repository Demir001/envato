import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
  updateUserPassword,
} from './user.controller';
import {
  protect,
  authorize,
  checkTenant,
} from '../../../middleware/authMiddleware';
import { validateRequest } from '../../../middleware/validationMiddleware';
import {
  createUserSchema,
  listUsersSchema,
  updateUserSchema,
  userIdSchema,
  changePasswordSchema,
} from './user.validation';

const router = Router();

// Apply 'protect' (authentication) and 'checkTenant' (isolation) to all routes
router.use(protect, checkTenant);

// All routes in this module are for 'Admin' only
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/users
 * @desc    List and search staff users (paginated)
 * @access  Private (Admin)
 */
router.get('/', validateRequest(listUsersSchema), listUsers);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new staff user (Doctor, Reception)
 * @access  Private (Admin)
 */
router.post('/', validateRequest(createUserSchema), createUser);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get a single staff user by ID
 * @access  Private (Admin)
 */
router.get('/:id', validateRequest(userIdSchema), getUserById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update a staff user's details
 * @access  Private (Admin)
 */
router.put('/:id', validateRequest(updateUserSchema), updateUser);

/**
 * @route   PUT /api/v1/users/:id/password
 * @desc    Change a staff user's password
 * @access  Private (Admin)
 */
router.put(
  '/:id/password',
  validateRequest(changePasswordSchema),
  updateUserPassword,
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete a staff user
 * @access  Private (Admin)
 */
router.delete('/:id', validateRequest(userIdSchema), deleteUser);

export default router;