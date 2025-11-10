/**
 * Interface representing an Inventory (Stock) Item.
 * Aligns with the 'inventory_items' table schema.
 */
export interface IInventoryItem {
  id: number;
  tenantId: string;
  name: string;
  category: string | null;
  quantity: number;
  lowStockThreshold: number; // e.g., 10. Alert when quantity <= threshold
  supplier: string | null;
  lastRestockDate: string | null; // ISO Date string (YYYY-MM-DD)
}

/**
 * Type for query parameters when listing inventory items.
 */
export interface IListInventoryQuery {
  page?: string;
  limit?: string;
  search?: string; // Search by name or category
  lowStock?: 'true' | 'false'; // Filter by items at or below threshold
}

/**
 * Interface for the paginated response when listing items.
 */
export interface IPaginatedInventory {
  items: IInventoryItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

/**
 * Type for creating a new inventory item.
 */
export type ICreateInventoryItemPayload = Omit<
  IInventoryItem,
  'id' | 'tenantId' | 'lastRestockDate'
>;

/**
 * Type for updating an existing inventory item.
 * All fields are optional.
 */
export type IUpdateInventoryItemPayload = Partial<ICreateInventoryItemPayload>;

/**
 * Type for adjusting the stock quantity (increment/decrement).
 */
export type IAdjustStockPayload = {
  // Positive number to add, negative number to remove
  amount: number;
  notes?: string; // e.g., "Manual count adjustment", "Used in procedure"
};