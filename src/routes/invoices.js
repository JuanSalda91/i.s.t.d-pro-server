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

//Get all invoices(admin Only)
router.get('/', protect, authorize('admin'), getInvoices);

//Get invoice statistics (admin Only)
router.get('/stats', protect, authorize('admin'), getInvoiceStats);

//Get invoice by status (protected)
router.get('/status/:status', protect, getInvoicesByStatus);

//Get single invoice by ID (protected)
router.get('/:id', protect, getInvoiceById);

//Update invoice (protected)
router.put('/:id', protect, updateInvoiceStatus);

//Delete invoice (protected)
router.delete('/:id', protect, deleteInvoice);

module.exports = router;