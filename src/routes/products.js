const express = require('express');
const router = express.Router();

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    getProductStats,
    getProductsByCategory,
} = require('../controllers/productController.js');

/**
 * IMPORT: Authentication Middleware
 */
const { protect, authorize, } = require('../middleware/auth.js');

/**
 * ==========================================
 * PRODUCT ROUTES
 * ==========================================
 */

/**
 * ROUTE: GET /api/products/low-stock
 * PURPOSE: Get products with stock at or below minStock level
 */
router.get('/low-stock', protect, getLowStockProducts);

/**
 * ROUTE: GET /api/products/stats
 * PURPOSE: Get aggregate statistics about all products
 */
router.get('/stats', protect, getProductStats);

/**
 * ROUTE: GET /api/products/category-stats
 * PURPOSE: Get products grouped and analyzed by category
 */
router.get('/category-stats', protect, getProductsByCategory);

/**
 * ==========================================
 * MAIN PRODUCT ROUTES
 * ==========================================
 */

/**
 * ROUTE: GET /api/products
 * PURPOSE: Get all products with optional filtering
 */
router.get('/', getProducts);

/**
 * ROUTE: POST /api/products
 * PURPOSE: Create a new product
 */
router.post('/', protect, authorize('admin'), createProduct);

/**
 * ROUTE: GET /api/products/:id
 * PURPOSE: Get detailed information about a specific product
 */
router.get('/:id', getProductById);

/**
 * ROUTE: PUT /api/products/:id
 * PURPOSE: Update an existing product
 */
router.put('/:id', protect, authorize('admin'), updateProduct);

/**
 * ROUTE: DELETE /api/products/:id
 * PURPOSE: Delete a product from inventory
 */
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;