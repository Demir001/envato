import { z } from 'zod';

// ISO Date regex (YYYY-MM-DD)
const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// Status enum for billing
const invoiceStatusSchema = z.enum(['pending', 'paid', 'overdue']);

/**
 * Zod schema for a single invoice item (when creating/updating).
 */
const invoiceItemSchema = z.object({
  description: z.string().min(2, 'Item description is required'),
  quantity: z
    .number()
    .int()
    .positive('Quantity must be a positive number')
    .min(1, 'Quantity must be at least 1'),
  unitPrice: z
    .number()
    .positive('Unit price must be a positive number (greater than 0)'),
  // 'total' will be calculated on the backend
});

/**
 * Zod schema for validating the invoice ID in params.
 */
export const invoiceIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invoice ID must be a number'),
  }),
});

/**
 * Zod schema for creating a new invoice.
 */
export const createInvoiceSchema = z.object({
  body: z.object({
    patientId: z.number().int().positive('Patient ID is required'),
    issueDate: isoDateString,
    dueDate: isoDateString,
    status: invoiceStatusSchema.optional().default('pending'),
    notes: z.string().nullable().optional(),
    items: z
      .array(invoiceItemSchema)
      .min(1, 'Invoice must have at least one item'),
  }),
  // .refine((data) => new Date(data.dueDate) >= new Date(data.issueDate), {
  //   message: "Due date must be on or after the issue date",
  //   path: ["dueDate"],
  // }),
});

/**
 * Zod schema for updating an existing invoice.
 * All fields are optional.
 */
export const updateInvoiceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invoice ID must be a number'),
  }),
  body: z.object({
    // patientId is generally not updatable for an existing invoice
    issueDate: isoDateString.optional(),
    dueDate: isoDateString.optional(),
    status: invoiceStatusSchema.optional(),
    notes: z.string().nullable().optional(),
    // We allow replacing all items. Partial item update is too complex for v1.
    items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item').optional(),
  }),
});

/**
 * Zod schema for validating list/search query parameters for invoices.
 */
export const listInvoicesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
    search: z.string().optional(),
    status: invoiceStatusSchema.optional(),
    patientId: z.string().regex(/^\d+$/).optional(),
    startDate: isoDateString.optional(),
    endDate: isoDateString.optional(),
  }),
});

// Export inferred types
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body'];
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>['body'];
export type ListInvoicesQueryInput = z.infer<
  typeof listInvoicesSchema
>['query'];