import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { BillingService } from './billing.service';
import { AuthRequest } from '../../../middleware/authMiddleware';
import { ApiResponse } from '../../../utils/ApiResponse';
import {
  CreateInvoiceInput,
  ListInvoicesQueryInput,
  UpdateInvoiceInput,
} from './billing.validation';
import { generateInvoicePDF } from '../../../utils/pdfGenerator'; // PDF helper

/**
 * @desc    List and search invoices (paginated)
 * @route   GET /api/v1/billing
 * @access  Private (Admin, Reception)
 */
export const listInvoices = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const query = req.query as unknown as ListInvoicesQueryInput;

    const result = await BillingService.list(tenantId, query);
    ApiResponse.ok(res, 'Invoices fetched successfully', result);
  },
);

/**
 * @desc    Create a new invoice
 * @route   POST /api/v1/billing
 * @access  Private (Admin, Reception)
 */
export const createInvoice = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const invoiceData = req.body as CreateInvoiceInput;

    const newInvoice = await BillingService.create(tenantId, invoiceData);
    ApiResponse.created(res, 'Invoice created successfully', newInvoice);
  },
);

/**
 * @desc    Get a single invoice by ID
 * @route   GET /api/v1/billing/:id
 * @access  Private (Admin, Reception)
 */
export const getInvoiceById = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const invoiceId = parseInt(req.params.id, 10);

    const invoice = await BillingService.getById(tenantId, invoiceId);
    ApiResponse.ok(res, 'Invoice fetched successfully', invoice);
  },
);

/**
 * @desc    Get a single invoice as a PDF
 * @route   GET /api/v1/billing/:id/pdf
 * @access  Private (Admin, Reception)
 */
export const getInvoiceAsPDF = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const invoiceId = parseInt(req.params.id, 10);

    // 1. Fetch invoice details (Service.getById returns full details)
    const invoiceDetails = await BillingService.getById(tenantId, invoiceId);

    // 2. Fetch clinic details (for the PDF header)
    const clinicDetails = await BillingService.getClinicDetails(tenantId);

    // 3. Generate the PDF buffer
    const pdfBuffer = await generateInvoicePDF(invoiceDetails, clinicDetails);

    // 4. Send the PDF as a response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Invoice-${invoiceDetails.invoiceNumber}.pdf"`,
    );
    res.send(pdfBuffer);
  },
);

/**
 * @desc    Update an invoice
 * @route   PUT /api/v1/billing/:id
 * @access  Private (Admin, Reception)
 */
export const updateInvoice = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const invoiceId = parseInt(req.params.id, 10);
    const invoiceData = req.body as UpdateInvoiceInput;

    const updatedInvoice = await BillingService.update(
      tenantId,
      invoiceId,
      invoiceData,
    );
    ApiResponse.ok(res, 'Invoice updated successfully', updatedInvoice);
  },
);

/**
 * @desc    Delete an invoice
 * @route   DELETE /api/v1/billing/:id
 * @access  Private (Admin)
 */
export const deleteInvoice = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const invoiceId = parseInt(req.params.id, 10);

    await BillingService.delete(tenantId, invoiceId);
    ApiResponse.ok(res, 'Invoice deleted successfully', { id: invoiceId });
  },
);