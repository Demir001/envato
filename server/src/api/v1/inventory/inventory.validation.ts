import { z } from 'zod';

/**
 * Zod schema for validating the inventory item ID in params.
 */
export const itemIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Item ID must be a number'),
  }),
});

/**
 * Zod schema for validating list/search query parameters for inventory.
 */
export const listInventorySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
    search: z.string().optional(),
    lowStock: z.enum(['true', 'false']).optional(),
  }),
});

/**
 * Zod schema for the body of a new inventory item.
 */
const itemBodySchema = z.object({
  name: z.string().min(2, 'Item name is required'),
  category: z.string().nullable().optional(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
  lowStockThreshold: z
    .number()
    .int('Threshold must be an integer')
    .min(0, 'Threshold cannot be negative')
    .default(10),
  supplier: z.string().nullable().optional(),
});

/**
 * Zod schema for creating a new inventory item.
 */
export const createItemSchema = z.object({
  body: itemBodySchema,
});

/**
 * Zod schema for updating an existing inventory item.
 * All fields are optional.
 */
export const updateItemSchema = z.object({
  params: itemIdSchema.shape.params,
  body: itemBodySchema.partial(), // Makes all fields optional
});

/**
 * Zod schema for adjusting the stock quantity.
 */
export const adjustStockSchema = z.object({
  params: itemIdSchema.shape.params,
  body: z.object({
    amount: z
      .number()
      .int('Amount must be an integer')
      // Allow positive or negative, but not zero
      .refine((val) => val !== 0, 'Amount cannot be zero'),
    notes: z.string().optional(),
  }),
});

// Export inferred types
export type ListInventoryQueryInput = z.infer<
  typeof listInventorySchema
>['query'];
export type CreateItemInput = z.infer<typeof createItemSchema>['body'];
export type UpdateItemInput = z.infer<typeof updateItemSchema>['body'];
export type AdjustStockInput = z.infer<typeof adjustStockSchema>['body'];