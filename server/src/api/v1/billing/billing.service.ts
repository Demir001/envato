import { getDb } from '../../../config/database';
import { ApiError } from '../../../middleware/errorHandler';
import {
  CreateInvoiceInput,
  ListInvoicesQueryInput,
  UpdateInvoiceInput,
} from './billing.validation';
import {
  IInvoiceDetails,
  IInvoiceItem,
  IPaginatedInvoices,
} from './billing.types';

// Helper type for clinic details
type IClinicDetails = {
  name: string;
  address: string | null;
  phone: string | null;
  // from settings
  currencySymbol: string;
};

export class BillingService {
  /**
   * Fetches the full details for a single invoice, including items and patient info.
   */
  static async getById(
    tenantId: string,
    invoiceId: number,
  ): Promise<IInvoiceDetails> {
    const db = getDb();

    // 1. Get main invoice data and patient data
    const invoiceSql = `
      SELECT 
        i.*,
        p.name as patientName,
        p.email as patientEmail,
        p.address as patientAddress
      FROM invoices i
      JOIN patients p ON i.patientId = p.id
      WHERE i.id = ? AND i.tenantId = ?
    `;
    const invoice = db
      .prepare(invoiceSql)
      .get(invoiceId, tenantId) as IInvoiceDetails;

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found.');
    }

    // 2. Get invoice items
    const itemsSql = `SELECT * FROM invoice_items WHERE invoiceId = ?`;
    const items: IInvoiceItem[] = db
      .prepare(itemsSql)
      .all(invoiceId) as IInvoiceItem[];

    invoice.items = items;
    return invoice;
  }

  /**
   * Fetches the clinic's details for the PDF header.
   */
  static async getClinicDetails(tenantId: string): Promise<IClinicDetails> {
    const db = getDb();
    // Get info from 'clinics' table and 'settings' table
    const sql = `
      SELECT 
        c.name, c.address, c.phone,
        s.currencySymbol
      FROM clinics c
      LEFT JOIN settings s ON c.id = s.tenantId
      WHERE c.id = ?
    `;
    let details = db.prepare(sql).get(tenantId) as IClinicDetails;

    if (!details) {
      throw new ApiError(404, 'Clinic details not found.');
    }
    
    // Fallback for settings
    if (!details.currencySymbol) {
        details.currencySymbol = '$';
    }

    return details;
  }

  /**
   * List and search invoices with pagination.
   */
  static async list(
    tenantId: string,
    query: ListInvoicesQueryInput,
  ): Promise<IPaginatedInvoices> {
    const db = getDb();
    
    // Destructure and parse query parameters (DÜZELTİLDİ)
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const {
      search = '',
      status,
      patientId,
      startDate,
      endDate,
    } = query;

    const offset = (page - 1) * limit;

    // --- Build dynamic query ---
    const params: (string | number)[] = [tenantId];
    let whereClause = 'WHERE i.tenantId = ?';

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR i.invoiceNumber LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }
    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }
    if (patientId) {
      whereClause += ' AND i.patientId = ?';
      params.push(patientId);
    }
    if (startDate) {
      whereClause += ' AND i.issueDate >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND i.issueDate <= ?';
      params.push(endDate);
    }

    // --- Get Total Count ---
    const countSql = `
      SELECT COUNT(i.id) as count 
      FROM invoices i
      LEFT JOIN patients p ON i.patientId = p.id
      ${whereClause}
    `;
    const countResult: { count: number } = db
      .prepare(countSql)
      .get(...params) as { count: number };
      
    const totalItems = countResult.count;
    const totalPages = Math.ceil(totalItems / limit);

    // --- Get Paginated Data ---
    const dataSql = `
      SELECT i.*, p.name as patientName
      FROM invoices i
      LEFT JOIN patients p ON i.patientId = p.id
      ${whereClause}
      ORDER BY i.issueDate DESC
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, limit, offset];
    const invoices = db.prepare(dataSql).all(...queryParams) as any[];

    return {
      invoices,
      pagination: { totalItems, totalPages, currentPage: page, pageSize: limit },
    };
  }

  /**
   * Generates the next sequential invoice number for the tenant.
   * e.g., "INV-2024-001", "INV-2024-002"
   */
  private static async getNextInvoiceNumber(
    db: any,
    tenantId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const sql = `
      SELECT invoiceNumber 
      FROM invoices 
      WHERE tenantId = ? AND invoiceNumber LIKE ?
      ORDER BY invoiceNumber DESC 
      LIMIT 1
    `;
    const lastInvoice = db.prepare(sql).get(tenantId, `${prefix}%`) as
      | { invoiceNumber: string }
      | undefined;

    let nextId = 1;
    if (lastInvoice) {
      const lastIdStr = lastInvoice.invoiceNumber.split(prefix)[1];
      const lastId = parseInt(lastIdStr, 10);
      if (!isNaN(lastId)) {
        nextId = lastId + 1;
      }
    }

    return `${prefix}${nextId.toString().padStart(4, '0')}`;
  }

  /**
   * Create a new invoice and its items in a transaction.
   */
  static async create(
    tenantId: string,
    data: CreateInvoiceInput,
  ): Promise<IInvoiceDetails> {
    const db = getDb();
    
    // Use a transaction to ensure all or nothing
    const createInvoiceTx = db.transaction(() => {
      const { patientId, issueDate, dueDate, status, notes, items } = data;

      // 1. Verify Patient
      const patient = db
        .prepare('SELECT id FROM patients WHERE id = ? AND tenantId = ?')
        .get(patientId, tenantId);
      if (!patient) {
        throw new ApiError(404, 'Patient not found.');
      }

      // 2. Generate Invoice Number
      const invoiceNumber = this.getNextInvoiceNumber(db, tenantId);

      // 3. Calculate Total Amount
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      // 4. Insert Main Invoice
      const invoiceStmt = db.prepare(
        `INSERT INTO invoices (tenantId, patientId, invoiceNumber, issueDate, dueDate, totalAmount, status, notes)
         VALUES (@tenantId, @patientId, @invoiceNumber, @issueDate, @dueDate, @totalAmount, @status, @notes)`,
      );
      const info = invoiceStmt.run({
        tenantId,
        patientId,
        invoiceNumber,
        issueDate,
        dueDate,
        totalAmount: totalAmount.toFixed(2), // Store as fixed decimal
        status: status || 'pending',
        notes,
      });
      const newInvoiceId = info.lastInsertRowid as number;

      // 5. Insert Invoice Items
      const itemStmt = db.prepare(
        `INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, total)
         VALUES (@invoiceId, @description, @quantity, @unitPrice, @total)`,
      );
      for (const item of items) {
        itemStmt.run({
          invoiceId: newInvoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          total: (item.quantity * item.unitPrice).toFixed(2),
        });
      }

      return newInvoiceId;
    });

    try {
      const newId = createInvoiceTx();
      // Return the full, detailed invoice
      return await this.getById(tenantId, newId);
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Update an existing invoice.
   */
  static async update(
    tenantId: string,
    id: number,
    data: UpdateInvoiceInput,
  ): Promise<IInvoiceDetails> {
    const db = getDb();
    
    const updateInvoiceTx = db.transaction(() => {
      // 1. Verify existing invoice (DÜZELTİLDİ: 'existing' kaldırıldı)
      this.getById(tenantId, id);
      
      const { issueDate, dueDate, status, notes, items } = data;

      // 2. Build SET clause for main invoice table
      const mainFields: Partial<UpdateInvoiceInput & { totalAmount?: number }> = {
        issueDate, dueDate, status, notes
      };
      
      let newTotalAmount: number | undefined;
      // If items are being replaced, we must recalculate the total
      if (items && items.length > 0) {
        newTotalAmount = items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        );
        mainFields.totalAmount = newTotalAmount;
      }

      const setFields = Object.keys(mainFields)
        .filter(key => mainFields[key as keyof typeof mainFields] !== undefined)
        .map(key => `${key} = @${key}`);

      // 3. Update main invoice if there are fields to update
      if (setFields.length > 0) {
        const sql = `UPDATE invoices SET ${setFields.join(', ')} WHERE id = @id AND tenantId = @tenantId`;
        db.prepare(sql).run({ ...mainFields, id, tenantId });
      }

      // 4. If items are provided, delete old items and insert new ones
      if (items && items.length > 0) {
        // Delete old items
        db.prepare('DELETE FROM invoice_items WHERE invoiceId = ?').run(id);

        // Insert new items
        const itemStmt = db.prepare(
          `INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, total)
           VALUES (@invoiceId, @description, @quantity, @unitPrice, @total)`,
        );
        for (const item of items) {
          itemStmt.run({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2),
            total: (item.quantity * item.unitPrice).toFixed(2),
          });
        }
      }
      return id; // Return the ID
    });

    try {
      const updatedId = updateInvoiceTx();
      return await this.getById(tenantId, updatedId);
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update invoice: ${error.message}`);
    }
  }

  /**
   * Delete an invoice and its items.
   */
  static async delete(tenantId: string, id: number): Promise<{ id: number }> {
    const db = getDb();
    
    // 1. Verify it exists (handles tenant isolation)
    await this.getById(tenantId, id);

    // 2. Delete. 'ON DELETE CASCADE' in the 'invoice_items' schema
    // should automatically delete the items.
    const info = db
      .prepare('DELETE FROM invoices WHERE id = ? AND tenantId = ?')
      .run(id, tenantId);

    if (info.changes === 0) {
      throw new ApiError(404, 'Invoice not found or already deleted.');
    }
    
    return { id };
  }
}