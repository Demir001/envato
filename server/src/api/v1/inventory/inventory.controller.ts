import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { InventoryService } from './inventory.service';
import { AuthRequest } from '../../../middleware/authMiddleware';
import { ApiResponse } from '../../../utils/ApiResponse';
import {
  CreateItemInput,
  ListInventoryQueryInput,
  UpdateItemInput,
  AdjustStockInput,
} from './inventory.validation';

/**
 * @desc    List and search inventory items
 * @route   GET /api/v1/inventory
 * @access  Private (Admin, Reception)
 */
export const listInventoryItems = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const query = req.query as unknown as ListInventoryQueryInput;

    const result = await InventoryService.list(tenantId, query);
    ApiResponse.ok(res, 'Inventory items fetched successfully', result);
  },
);

/**
 * @desc    Create a new inventory item
 * @route   POST /api/v1/inventory
 * @access  Private (Admin, Reception)
 */
export const createInventoryItem = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const itemData = req.body as CreateItemInput;

    const newItem = await InventoryService.create(tenantId, itemData);
    ApiResponse.created(res, 'Inventory item created successfully', newItem);
  },
);

/**
 * @desc    Get a single inventory item by ID
 * @route   GET /api/v1/inventory/:id
 * @access  Private (Admin, Reception)
 */
export const getInventoryItemById = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const itemId = parseInt(req.params.id, 10);

    const item = await InventoryService.getById(tenantId, itemId);
    ApiResponse.ok(res, 'Inventory item fetched successfully', item);
  },
);

/**
 * @desc    Update an inventory item's details
 * @route   PUT /api/v1/inventory/:id
 * @access  Private (Admin, Reception)
 */
export const updateInventoryItem = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const itemId = parseInt(req.params.id, 10);
    const itemData = req.body as UpdateItemInput;

    const updatedItem = await InventoryService.update(
      tenantId,
      itemId,
      itemData,
    );
    ApiResponse.ok(res, 'Inventory item updated successfully', updatedItem);
  },
);

/**
 * @desc    Adjust the stock quantity of an item
 * @route   POST /api/v1/inventory/:id/adjust
 * @access  Private (Admin, Reception)
 */
export const adjustInventoryStock = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const itemId = parseInt(req.params.id, 10);
    const { amount, notes } = req.body as AdjustStockInput;

    const updatedItem = await InventoryService.adjustStock(
      tenantId,
      itemId,
      amount,
      notes,
    );
    ApiResponse.ok(res, 'Stock adjusted successfully', updatedItem);
  },
);

/**
 * @desc    Delete an inventory item
 * @route   DELETE /api/v1/inventory/:id
 * @access  Private (Admin)
 */
export const deleteInventoryItem = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const itemId = parseInt(req.params.id, 10);

    await InventoryService.delete(tenantId, itemId);
    ApiResponse.ok(res, 'Inventory item deleted successfully', { id: itemId });
  },
);