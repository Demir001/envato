import { Router } from 'express';
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItemById,
  listInventoryItems,
  updateInventoryItem,
  adjustInventoryStock, // Added for stock adjustment
} from './inventory.controller';
import {
  protect,
  authorize,
  checkTenant,
} from '../../../middleware/authMiddleware';
import { validateRequest } from '../../../middleware/validationMiddleware';
import {
  adjustStockSchema,
  createItemSchema,
  itemIdSchema,
  listInventorySchema,
  updateItemSchema,
} from './inventory.validation';

const router = Router();

// Apply 'protect' (authentication) and 'checkTenant' (isolation) to all routes
router.use(protect, checkTenant);

// Only Admin and Reception can manage inventory
const manageRoles = ['admin', 'reception'];

/**
 * @route   GET /api/v1/inventory
 * @desc    List and search inventory items (paginated)
 * @access  Private (Admin, Reception)
 */
router.get(
  '/',
  authorize(...manageRoles),
  validateRequest(listInventorySchema),
  listInventoryItems,
);

/**
 * @route   POST /api/v1/inventory
 * @desc    Create a new inventory item
 * @access  Private (Admin, Reception)
 */
router.post(
  '/',
  authorize(...manageRoles),
  validateRequest(createItemSchema),
  createInventoryItem,
);

/**
 * @route   POST /api/v1/inventory/:id/adjust
 * @desc    Adjust the stock quantity of an item
 * @access  Private (Admin, Reception)
 */
router.post(
  '/:id/adjust',
  authorize(...manageRoles),
  validateRequest(adjustStockSchema),
  adjustInventoryStock,
);

/**
 * @route   GET /api/v1/inventory/:id
 * @desc    Get a single inventory item by ID
 * @access  Private (Admin, Reception)
 */
router.get(
  '/:id',
  authorize(...manageRoles),
  validateRequest(itemIdSchema),
  getInventoryItemById,
);

/**
 * @route   PUT /api/v1/inventory/:id
 * @desc    Update an inventory item's details
 * @access  Private (Admin, Reception)
 */
router.put(
  '/:id',
  authorize(...manageRoles),
  validateRequest(updateItemSchema),
  updateInventoryItem,
);

/**
 * @route   DELETE /api/v1/inventory/:id
 * @desc    Delete an inventory item
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authorize('admin'), // Only admin can hard-delete items
  validateRequest(itemIdSchema),
  deleteInventoryItem,
);

export default router;