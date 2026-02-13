const PDFDocument = require('pdfkit');

/**
 * Generates a simple invoice PDF into the given writable stream.
 * 'invoice' is a populated Invoice document (with saleId + sellerId)
 */

function generateInvoicePdf(invoice, stream) {
    const doc = new PDFDocument({ margin: 50 });

    //pipe PDF to the stream (express response or file)
    doc.pipe(stream);

    //========== HEADER ==========
    doc
    .fontSize(20)
    .text('I.S.T.D PRO - Invoice', { align: 'left' })
    .moveDown();

    doc
    .fontSize(12)
    .text(`Invoice #: ${invoice.invoiceNumber}`)
    .text(`Status: ${invoice.status}`)
    .text(`Invoice Date: ${invoice.invoiceDate.toDateString()}`)
    .text(`Due Date: ${invoice.dueDate.toDateString()}`)
    .modeDown();
};

