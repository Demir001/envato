import PDFDocument from 'pdfkit';
import { IInvoiceDetails } from '../api/v1/billing/billing.types';

// Helper type for clinic details (from billing.service)
type IClinicDetails = {
  name: string;
  address: string | null;
  phone: string | null;
  currencySymbol: string;
};

/**
 * Generates an invoice PDF using pdfkit.
 * @param invoice - The full invoice details.
 * @param clinic - The clinic's details.
 * @returns A Promise that resolves with the PDF as a Buffer.
 */
export const generateInvoicePDF = (
  invoice: IInvoiceDetails,
  clinic: IClinicDetails,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        font: 'Helvetica',
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // --- PDF Content ---
      const Gutter = 50;
      const TopMargin = 50;
      const ContentWidth = doc.page.width - Gutter * 2;

      // 1. Header (Clinic Logo/Name and "INVOICE")
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(clinic.name.toUpperCase(), Gutter, TopMargin, {
          width: ContentWidth / 2,
        });

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('FATURA / INVOICE', Gutter, TopMargin, {
          width: ContentWidth,
          align: 'right',
        });

      // Clinic Address
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      if (clinic.address) {
        doc.text(clinic.address, Gutter, doc.y, {
          width: ContentWidth / 2,
        });
      }
      if (clinic.phone) {
        doc.text(clinic.phone, Gutter, doc.y, { width: ContentWidth / 2 });
      }

      // Invoice Meta (Number, Date)
      const metaTop = doc.y - 30; // Align with clinic address
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Fatura No:`, Gutter, metaTop, {
        width: ContentWidth,
        align: 'right',
      });
      doc.font('Helvetica').text(invoice.invoiceNumber, { align: 'right' });
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(`Düzenlenme Tarihi:`, { align: 'right' });
      doc.font('Helvetica').text(invoice.issueDate, { align: 'right' });
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(`Son Ödeme Tarihi:`, { align: 'right' });
      doc.font('Helvetica').text(invoice.dueDate, { align: 'right' });

      const headerBottom = Math.max(doc.y, metaTop + 60); // Ensure we are below both columns
      doc.y = headerBottom + 20;

      // 2. Bill To (Patient Details)
      doc.fontSize(10).font('Helvetica-Bold').text('HASTA BİLGİLERİ (BILL TO):');
      doc.moveDown(0.5);
      doc.font('Helvetica').text(invoice.patientName);
      if (invoice.patientAddress) doc.text(invoice.patientAddress);
      if (invoice.patientEmail) doc.text(invoice.patientEmail);

      // 3. Invoice Table
      doc.y = doc.y + 30; // Space before table
      const tableTop = doc.y;

      // Table Headers
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Açıklama', Gutter, tableTop);
      doc.text('Miktar', Gutter + 300, tableTop, { width: 50, align: 'right' });
      doc.text('Birim Fiyat', Gutter + 360, tableTop, {
        width: 70,
        align: 'right',
      });
      doc.text('Toplam', Gutter + 430, tableTop, {
        width: 70,
        align: 'right',
      });
      doc.y = tableTop + 20;
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(Gutter, doc.y - 8)
        .lineTo(Gutter + ContentWidth, doc.y - 8)
        .stroke();

      // Table Rows
      doc.fontSize(10).font('Helvetica');
      let rowY = doc.y;
      invoice.items.forEach((item) => {
        doc.text(item.description, Gutter, rowY);
        doc.text(item.quantity.toString(), Gutter + 300, rowY, {
          width: 50,
          align: 'right',
        });
        doc.text(
          `${item.unitPrice.toFixed(2)} ${clinic.currencySymbol}`,
          Gutter + 360,
          rowY,
          { width: 70, align: 'right' },
        );
        doc.text(
          `${item.total.toFixed(2)} ${clinic.currencySymbol}`,
          Gutter + 430,
          rowY,
          { width: 70, align: 'right' },
        );
        rowY += 20;
      });

      doc.y = rowY + 10;
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(Gutter, doc.y - 8)
        .lineTo(Gutter + ContentWidth, doc.y - 8)
        .stroke();

      // 4. Totals
      doc.moveDown(2);
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('GENEL TOPLAM:', Gutter + 250, doc.y, {
        width: 150,
        align: 'right',
      });
      doc.text(
        `${invoice.totalAmount.toFixed(2)} ${clinic.currencySymbol}`,
        Gutter + 410,
        doc.y,
        { width: 90, align: 'right' },
      );

      // 5. Footer (Status and Notes)
      doc.y = doc.page.height - 100; // Position footer
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`DURUM: ${invoice.status.toUpperCase()}`, Gutter, doc.y, {
        align: 'left',
      });

      if (invoice.notes) {
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Notlar: ${invoice.notes}`, { align: 'left' });
      }

      // --- Finalize PDF ---
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};