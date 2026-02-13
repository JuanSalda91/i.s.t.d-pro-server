const express = require('express');
const router = express.Router();

/**
 * Import Invoice Controller
 * 
 * Import specific functions from invoiceController.js
 * These hanlde all business logic for invoice operations
 */

const {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoiceStatus,
    deleteInvoice,
    getInvoiceStats,
    getInvoicesByStatus
} = require ('../controllers/invoiceController.js');

const { protect, authorize } = require('../middleware/auth.js');
const { generateInvoicePdf } = require('../utils/invoicePdf.js');
const Invoice = require('../models/Invoice.js');

/**
 * Import Auth middleware
 * 
 * protect = verify jwt toekn (authentication)
 * authorize = check user role (authorization)
 */
const { protect, authorize} = require('../middleware/auth.js');

/**
 * ===============
 * INVOICE ROUTES
 * ===============
 * 
 * All routes require authentication (Admin Only)
 * Some routes require admin authorization
 */

//Create new invoice
//generate invoice from exisitng sale
router.post('/', protect, createInvoice);

//Get invoice statistics (admin Only)
router.get('/stats', protect, authorize('admin'), getInvoiceStats);

//Get invoice by status (protected)
router.get('/status/:status', protect, getInvoicesByStatus);


// Get invoice PDF (protected)
// GET /api/invoices/:id/pdf
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('sellerId', 'name email')
      .populate('saleId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Authorization: same rule as getInvoiceById
    if (
      req.user.role !== 'admin' &&
      invoice.sellerId._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this invoice PDF' });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${invoice.invoiceNumber}.pdf`
    );

    // Generate PDF directly into response stream
    generateInvoicePdf(invoice, res);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res
      .status(500)
      .json({ message: 'Error generating invoice PDF', error: error.message });
  }
});

//Get all invoices(admin Only)
router.get('/', protect, authorize('admin'), getInvoices);

//Get single invoice by ID (protected)
router.get('/:id', protect, getInvoiceById);

//Update invoice (protected)
router.put('/:id', protect, updateInvoiceStatus);

//Delete invoice (protected)
router.delete('/:id', protect, deleteInvoice);

module.exports = router;