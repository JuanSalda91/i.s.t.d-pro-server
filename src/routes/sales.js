const express = require('express');
const router = express.Router();

const {
    createSale,
    getSales,
    getSaleById,
    updateSaleStatus,
    deleteSale,
    getSalesStats,
    getSalesReport,
} = require('../controllers/saleController.js');

const { protect, authorize } = require('../middleware/auth.js');

// Create a new sale
router.post('/', protect, createSale);

// Get sales report
router.get('/report', protect, getSalesReport);

// Get sales statistics (admin only)
router.get('/stats', protect, authorize('admin'), getSalesStats);

// Get all sales (admin only)
router.get('/', protect, authorize('admin'), getSales);

// Get a single sale by ID
router.get('/:id', protect, getSaleById);

// Update sale status (seller only)
router.put('/:id', protect, updateSaleStatus);

// Delete a sale (seller only)
router.delete('/:id', protect, deleteSale);

module.exports = router;