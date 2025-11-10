import { Router } from 'express';
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  listInvoices,
  updateInvoice,
  getInvoiceAsPDF, // Added for PDF export
} from './billing.controller';
import {
  protect,
  authorize,
  checkTenant,
} from '../../../middleware/authMiddleware';
import { validateRequest } from '../../../middleware/validationMiddleware';
import {
  createInvoiceSchema,
  invoiceIdSchema,
  listInvoicesSchema,
  updateInvoiceSchema,
} from './billing.validation';

const router = Router();

// Apply 'protect' (authentication) and 'checkTenant' (isolation) to all routes
router.use(protect, checkTenant);

// Only Admin and Reception can manage billing
const manageRoles = ['admin', 'reception'];

/**
 * @route   GET /api/v1/billing
 * @desc    List and search invoices (paginated)
 * @access  Private (Admin, Reception)
 */
router.get(
  '/',
  authorize(...manageRoles),
  validateRequest(listInvoicesSchema),
  listInvoices,
);

/**
 * @route   POST /api/v1/billing
 * @desc    Create a new invoice
 * @access  Private (Admin, Reception)
 */
router.post(
  '/',
  authorize(...manageRoles),
  validateRequest(createInvoiceSchema),
  createInvoice,
);

/**
 * @route   GET /api/v1/billing/:id
 * @desc    Get a single invoice by ID
 * @access  Private (Admin, Reception)
 */
router.get(
  '/:id',
  authorize(...manageRoles),
  validateRequest(invoiceIdSchema),
  getInvoiceById,
);

/**
 * @route   GET /api/v1/billing/:id/pdf
 * @desc    Get a single invoice as a PDF file
 * @access  Private (Admin, Reception)
 * @note    This fulfills the PDF export requirement.
 */
router.get(
  '/:id/pdf',
  authorize(...manageRoles),
  validateRequest(invoiceIdSchema),
  getInvoiceAsPDF,
);

/**
 * @route   PUT /api/v1/billing/:id
 * @desc    Update an invoice (status, items)
 * @access  Private (Admin, Reception)
 */
router.put(
  '/:id',
  authorize(...manageRoles),
  validateRequest(updateInvoiceSchema),
  updateInvoice,
);

/**
 * @route   DELETE /api/v1/billing/:id
 * @desc    Delete an invoice
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authorize('admin'), // Only admin can hard-delete invoices
  validateRequest(invoiceIdSchema),
  deleteInvoice,
);

export default router;