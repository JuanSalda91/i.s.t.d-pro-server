const Invoice = require('../models/Invoice.js');
const Sale = require('../models/Sale.js');
const Product = require('../models/Product.js');

/**
 * Helper Function:
 * 
 * Format: INV-YYYY-XXXX
 * Example: INV-2026-0001, INV-2026-0002
 */

const generateInvoiceNumber = async () => {
    try {
        const currentYear = new Date().getFullYear();

        const lastInvoice = await Invoice.findOne({
            invoiceNumber: new RegExp(`INV-${currentYear}`)
        }).sort({ invoiceNumber: -1 });

        let count = 0;
        if (lastInvoice) {
            const matches = lastInvoice.invoiceNumber.match(/INV-\d+-(d+)/);
            if (matches) {
                count = parseInt(matches[1]);
            }
        }

        count++;
        const paddedCount = String(count).padStart(4, '0');
        return `INV-${currentYear}-${paddedCount}`;
    } catch (error) {
        throw new error('Error generating invoice number');
    }
};

