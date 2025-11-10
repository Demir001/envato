/**
 * Interface for an individual item on an invoice.
 * Aligns with the 'invoice_items' table.
 */
export interface IInvoiceItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number; // quantity * unitPrice
}

/**
 * Interface for the main Invoice object.
 * Aligns with the 'invoices' table.
 */
export interface IInvoice {
  id: number;
  tenantId: string;
  patientId: number;
  invoiceNumber: string; // e.g., "INV-2024-001"
  issueDate: string; // ISO Date string (YYYY-MM-DD)
  dueDate: string; // ISO Date string (YYYY-MM-DD)
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  notes: string | null;
  createdAt: string; // ISO DateTime string
}

/**
 * Interface for the full invoice details, including its line items
 * and patient information.
 */
export interface IInvoiceDetails extends IInvoice {
  patientName: string;
  patientEmail: string | null;
  patientAddress: string | null;
  items: IInvoiceItem[];
}

/**
 * Type for query parameters when listing invoices.
 */
export interface IListInvoicesQuery {
  page?: string;
  limit?: string;
  search?: string; // Search by patient name or invoice number
  status?: 'pending' | 'paid' | 'overdue';
  patientId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

/**
 * Interface for the paginated response when listing invoices.
 */
export interface IPaginatedInvoices {
  invoices: (IInvoice & { patientName: string })[]; // List view includes patient name
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

/**
 * Type for the 'items' array when creating or updating an invoice.
 * 'id' is optional (present only when updating).
 */
type InvoiceItemInput = Omit<IInvoiceItem, 'id' | 'invoiceId' | 'total'>;

/**
 * Type for creating a new invoice.
 */
export type ICreateInvoicePayload = {
  patientId: number;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status?: 'pending' | 'paid';
  notes?: string | null;
  items: InvoiceItemInput[];
};

/**
 * Type for updating an existing invoice.
 * All fields are optional.
 */
export type IUpdateInvoicePayload = Partial<
  Omit<ICreateInvoicePayload, 'patientId'> & { status?: 'pending' | 'paid' | 'overdue' }
>;