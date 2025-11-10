import { getDb } from '../../../config/database';
import { ApiError } from '../../../middleware/errorHandler';
import {
  CreateItemInput,
  ListInventoryQueryInput,
  UpdateItemInput,
} from './inventory.validation';
import { IInventoryItem, IPaginatedInventory } from './inventory.types';

export class InventoryService {
  /**
   * Get an item by ID, ensuring it belongs to the correct tenant.
   * Internal helper function.
   */
  static async getById(
    tenantId: string,
    id: number,
  ): Promise<IInventoryItem> {
    const db = getDb();
    const item: IInventoryItem = db
      .prepare('SELECT * FROM inventory_items WHERE id = ? AND tenantId = ?')
      .get(id, tenantId) as IInventoryItem;

    if (!item) {
      throw new ApiError(404, 'Inventory item not found.');
    }
    return item;
  }

  /**
   * List and search inventory items with pagination.
   */
  static async list(
    tenantId: string,
    query: ListInventoryQueryInput,
  ): Promise<IPaginatedInventory> {
    const db = getDb();

    // Destructure and parse query parameters (DÜZELTİLDİ)
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const { search = '', lowStock } = query;

    const offset = (page - 1) * limit;

    // --- Build dynamic query ---
    const params: (string | number)[] = [tenantId];
    let whereClause = 'WHERE tenantId = ?';

    if (search) {
      whereClause += ' AND (name LIKE ? OR category LIKE ? OR supplier LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (lowStock === 'true') {
      // Find items where quantity is at or below the threshold
      whereClause += ' AND quantity <= lowStockThreshold';
    }

    // --- Get Total Count ---
    const countResult: { count: number } = db
      .prepare(`SELECT COUNT(*) as count FROM inventory_items ${whereClause}`)
      .get(...params) as { count: number };

    const totalItems = countResult.count;
    const totalPages = Math.ceil(totalItems / limit);

    // --- Get Paginated Data ---
    const queryParams = [...params, limit, offset];
    const items: IInventoryItem[] = db
      .prepare(
        `SELECT * FROM inventory_items 
         ${whereClause} 
         ORDER BY name ASC 
         LIMIT ? OFFSET ?`,
      )
      .all(...queryParams) as IInventoryItem[];

    return {
      items,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    };
  }

  /**
   * Create a new inventory item.
   */
  static async create(
    tenantId: string,
    data: CreateItemInput,
  ): Promise<IInventoryItem> {
    const db = getDb();

    // Check for duplicate item name within the same tenant
    const existing = db
      .prepare('SELECT id FROM inventory_items WHERE name = ? AND tenantId = ?')
      .get(data.name, tenantId);
    if (existing) {
      throw new ApiError(409, 'An item with this name already exists.');
    }

    const {
      name,
      category = null,
      quantity,
      lowStockThreshold,
      supplier = null,
    } = data;

    const stmt = db.prepare(
      `INSERT INTO inventory_items (tenantId, name, category, quantity, lowStockThreshold, supplier)
       VALUES (@tenantId, @name, @category, @quantity, @lowStockThreshold, @supplier)`,
    );

    try {
      const info = stmt.run({
        tenantId,
        name,
        category,
        quantity,
        lowStockThreshold,
        supplier,
      });

      // Fetch and return the newly created item
      return (await this.getById(
        tenantId,
        info.lastInsertRowid as number,
      )) as IInventoryItem;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ApiError(409, 'Item name must be unique.');
      }
      throw new ApiError(500, `Failed to create item: ${error.message}`);
    }
  }

  /**
   * Update an existing inventory item's details (not quantity).
   */
  static async update(
    tenantId: string,
    id: number,
    data: UpdateItemInput,
  ): Promise<IInventoryItem> {
    const db = getDb();

    // First, verify the item exists and belongs to this tenant
    await this.getById(tenantId, id);

    // Dynamically build the SET clause based on provided data
    const fields = Object.keys(data).filter(
      (key) => data[key as keyof UpdateItemInput] !== undefined,
    );
    if (fields.length === 0) {
      throw new ApiError(400, 'No fields provided for update.');
    }

    // Prevent quantity from being updated via this route
    if (fields.includes('quantity')) {
      throw new ApiError(
        400,
        'Quantity cannot be updated directly. Use the /adjust endpoint.',
      );
    }

    const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
    const params = { ...data, id, tenantId };

    try {
      const stmt = db.prepare(
        `UPDATE inventory_items SET ${setClause} WHERE id = @id AND tenantId = @tenantId`,
      );
      stmt.run(params);

      // Return the updated item record
      return await this.getById(tenantId, id);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ApiError(
          409,
          'Update failed: An item with this name already exists.',
        );
      }
      throw new ApiError(500, `Failed to update item: ${error.message}`);
    }
  }

  /**
   * Adjusts the stock quantity of an item.
   * (DÜZELTİLDİ: 'await' ve 'transaction' mantığı düzeltildi)
   */
  static async adjustStock(
    tenantId: string,
    id: number,
    amount: number,
    _notes?: string, // 'notes' kullanılmadığı için '_' eklendi
  ): Promise<IInventoryItem> {
    const db = getDb();

    // 1. Get current item *before* transaction (DÜZELTİLDİ)
    const item = (await this.getById(tenantId, id)) as IInventoryItem;

    // 2. Calculate new quantity
    const newQuantity = item.quantity + amount;
    if (newQuantity < 0) {
      throw new ApiError(
        400,
        `Adjustment failed. Cannot have negative stock. Current stock: ${item.quantity}.`,
      );
    }

    try {
      // 3. Run the synchronous transaction
      const adjustStockTx = db.transaction(() => {
        const stmt = db.prepare(
          'UPDATE inventory_items SET quantity = ? WHERE id = ? AND tenantId = ?',
        );
        stmt.run(newQuantity, id, tenantId);

        // 4. TODO: Log this transaction to an 'inventory_logs' table
        // (Skipped for v1, but 'notes' field is for this)

        // Update restock date if stock was added
        if (amount > 0) {
          db.prepare(
            'UPDATE inventory_items SET lastRestockDate = ? WHERE id = ?',
          ).run(new Date().toISOString().split('T')[0], id);
        }
      });
      
      adjustStockTx();

      // 5. Return the updated item
      return await this.getById(tenantId, id);
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to adjust stock: ${error.message}`);
    }
  }

  /**
   * Delete an inventory item.
   */
  static async delete(tenantId: string, id: number): Promise<{ id: number }> {
    const db = getDb();

    // 1. Verify item exists and belongs to the tenant
    await this.getById(tenantId, id);

    // 2. Perform deletion
    const info = db
      .prepare('DELETE FROM inventory_items WHERE id = ? AND tenantId = ?')
      .run(id, tenantId);

    if (info.changes === 0) {
      throw new ApiError(404, 'Item not found or already deleted.');
    }

    return { id };
  }
}