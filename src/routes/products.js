const express = require('express');
const router = express.Router();

/**
 * IMPORT: Product Controller
 * 
 * Imports all product controller functions:
 * - getProducts: List all products
 * - getProductById: Get single product
 * - createProduct: Create new product
 * - updateProduct: Update product
 * - deleteProduct: Delete product
 * - getLowStockProducts: Get low-stock items
 * - getProductStats: Get statistics
 * - getProductsByCategory: Get by category
 */
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    getProductStats,
    getProductsByCategory
} = require('../controllers/productController.js');

/**
 * IMPORT: Authentication Middleware
 * 
 * protect: Verifies JWT token and authenticates user
 * authorize: Checks if user has required role
 */
const { protect, authorize, } = require('../middleware/auth.js');

/**
 * ==========================================
 * PRODUCT ROUTES
 * ==========================================
 * 
 * Route organization:
 * - Public routes: Listed first
 * - Protected routes: Require JWT authentication
 * - Admin routes: Require JWT + admin role
 * 
 * Middleware chain example:
 * router.post('/create', protect, authorize('admin'), createProduct)
 * 
 * Execution order:
 * 1. protect middleware: Verify JWT token
 * 2. authorize middleware: Check if role is 'admin'
 * 3. If both pass: createProduct controller executes
 * 4. If either fails: Request stopped, error returned
 */

/**
 * ==========================================
 * SPECIAL ROUTES (Must be before :id routes)
 * ==========================================
 * 
 * These must come BEFORE router.get('/:id')
 * Otherwise, /low-stock will be interpreted as /:id with id="low-stock"
 * 
 * Example problem if ordered wrong:
 * router.get('/:id') first → /low-stock matches as /:id
 * router.get('/low-stock') second → Never reached
 */

/**
 * ROUTE: GET /api/products/low-stock
 * 
 * PURPOSE: Get products with stock at or below minStock level
 * 
 * PROTECTED: Yes (JWT required)
 * REQUIRES ROLE: Any authenticated user (employee or admin)
 * 
 * EXAMPLE REQUEST:
 * GET /api/products/low-stock
 * Authorization: Bearer <jwt_token>
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "count": 5,
 *   "data": [
 *     {
 *       "_id": "65a1fd98f66d453210cde123",
 *       "sku": "PROD-001",
 *       "name": "Samsung TV",
 *       "stock": 2,
 *       "minStock": 10,
 *       ...
 *     },
 *     {...},
 *     {...}
 *   ]
 * }
 * 
 * USE CASE: Dashboard shows low-stock alerts
 */
router.get('/low-stock', protect, getLowStockProducts);

/**
 * ROUTE: GET /api/products/stats
 * 
 * PURPOSE: Get aggregate statistics about all products
 * 
 * PROTECTED: Yes (JWT required)
 * REQUIRES ROLE: Any authenticated user
 * 
 * EXAMPLE REQUEST:
 * GET /api/products/stats
 * Authorization: Bearer <jwt_token>
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "_id": null,
 *     "totalProducts": 45,
 *     "totalStock": 1250,
 *     "avgPrice": 599.99,
 *     "avgCost": 350.00,
 *     "maxPrice": 2499.99,
 *     "minPrice": 9.99
 *   }
 * }
 * 
 * USE CASE: Dashboard shows inventory summary
 */
router.get('/stats', protect, getProductStats);

/**
 * ROUTE: GET /api/products/category-stats
 * 
 * PURPOSE: Get products grouped and analyzed by category
 * 
 * PROTECTED: Yes (JWT required)
 * REQUIRES ROLE: Any authenticated user
 * 
 * EXAMPLE REQUEST:
 * GET /api/products/category-stats
 * Authorization: Bearer <jwt_token>
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "count": 4,
 *   "data": [
 *     {
 *       "_id": "Electrónica",
 *       "count": 25,
 *       "totalStock": 450,
 *       "avgPrice": 799.99
 *     },
 *     {
 *       "_id": "Ropa",
 *       "count": 18,
 *       "totalStock": 320,
 *       "avgPrice": 49.99
 *     },
 *     {...},
 *     {...}
 *   ]
 * }
 * 
 * USE CASE: Analytics shows category breakdown
 */
router.get('/category-stats', protect, getProductsByCategory);

/**
 * ==========================================
 * MAIN PRODUCT ROUTES
 * ==========================================
 */

/**
 * ROUTE: GET /api/products
 * 
 * PURPOSE: Get all products with optional filtering
 * 
 * PROTECTED: No (public route)
 * AUTHENTICATION: Not required (but doesn't hurt to add protect)
 * 
 * QUERY PARAMETERS (all optional):
 * - search: Search by name or SKU
 * - category: Filter by category
 * - minStock: Show products with stock <= value
 * 
 * EXAMPLE REQUESTS:
 * GET /api/products
 * GET /api/products?search=Samsung
 * GET /api/products?category=Electrónica
 * GET /api/products?minStock=10
 * GET /api/products?search=TV&category=Electrónica
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "count": 15,
 *   "data": [
 *     {
 *       "_id": "65a1fd98f66d453210cde123",
 *       "sku": "PROD-001",
 *       "name": "Samsung 65-inch TV",
 *       "price": 799.99,
 *       "stock": 15,
 *       ...
 *     },
 *     {...},
 *     {...}
 *   ]
 * }
 * 
 * WHO CAN ACCESS: Anyone (public API)
 * FRONTEND USE: Product listings, search, filters
 */
router.get('/', getProducts);

/**
 * ROUTE: POST /api/products
 * 
 * PURPOSE: Create a new product
 * 
 * PROTECTED: Yes (JWT required)
 * REQUIRES ROLE: admin (only admins can create products)
 * 
 * MIDDLEWARE CHAIN:
 * 1. protect: Verify JWT token exists and is valid
 * 2. authorize('admin'): Check if user role is 'admin'
 * 3. createProduct: Execute controller function
 * 
 * REQUEST BODY (JSON):
 * {
 *   "sku": "PROD-100",
 *   "name": "New Product",
 *   "description": "Product details",
 *   "category": "Electrónica",
 *   "price": 999.99,
 *   "cost": 500.00,
 *   "stock": 50,
 *   "minStock": 10,
 *   "supplier": "Supplier Name"
 * }
 * 
 * REQUIRED FIELDS:
 * - sku: Unique product code
 * - name: Product name
 * - price: Selling price
 * - cost: Purchase cost
 * - stock: Initial quantity
 * 
 * RESPONSE (201 Created):
 * {
 *   "success": true,
 *   "message": "Product created successfully",
 *   "data": { ...product object... }
 * }
 * 
 * ERROR RESPONSES:
 * - 401: No JWT token provided
 * - 403: User is not admin
 * - 400: Missing required fields or validation error
 * - 400: SKU already exists
 * 
 * WHO CAN ACCESS: Admin users only
 * FRONTEND USE: Admin product creation form
 */
router.post('/', protect, authorize('admin'), createProduct);

/**
 * ROUTE: GET /api/products/:id
 * 
 * PURPOSE: Get detailed information about a specific product
 * 
 * PROTECTED: No (public route)
 * AUTHENTICATION: Not required
 * 
 * PARAM: id = MongoDB ObjectId
 * 
 * EXAMPLE REQUEST:
 * GET /api/products/65a1fd98f66d453210cde123
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "65a1fd98f66d453210cde123",
 *     "sku": "PROD-001",
 *     "name": "Samsung 65-inch TV",
 *     "description": "4K Smart TV...",
 *     "price": 799.99,
 *     "cost": 450.00,
 *     "stock": 15,
 *     "minStock": 5,
 *     "category": "Electrónica",
 *     "supplier": "Samsung",
 *     "aiGenerated": false,
 *     "createdAt": "2026-02-09T23:30:00.000Z",
 *     "updatedAt": "2026-02-09T23:30:00.000Z"
 *   }
 * }
 * 
 * ERROR RESPONSES:
 * - 404: Product with that ID not found
 * 
 * WHO CAN ACCESS: Anyone (public API)
 * FRONTEND USE: Product detail page
 */
router.get('/:id', getProductById);

/**
 * ROUTE: PUT /api/products/:id
 * 
 * PURPOSE: Update an existing product
 * 
 * PROTECTED: Yes (JWT required)
 * REQUIRES ROLE: admin
 * 
 * MIDDLEWARE CHAIN:
 * 1. protect: Verify JWT token
 * 2. authorize('admin'): Check admin role
 * 3. updateProduct: Execute controller
 * 
 * PARAM: id = MongoDB ObjectId
 * 
 * REQUEST BODY: Any fields to update (partial)
 * {
 *   "name": "Updated Product Name",
 *   "price": 899.99,
 *   "stock": 25,
 *   "description": "Updated description"
 * }
 * 
 * EXAMPLE REQUEST:
 * PUT /api/products/65a1fd98f66d453210cde123
 * Authorization: Bearer <admin_jwt_token>
 * Content-Type: application/json
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Product updated successfully",
 *   "data": { ...updated product... }
 * }
 * 
 * ERROR RESPONSES:
 * - 401: No JWT token
 * - 403: User is not admin
 * - 404: Product not found
 * - 400: Validation error
 * 
 * WHO CAN ACCESS: Admin users only
 * FRONTEND USE: Admin product edit form
 */
router.put('/:id', protect, authorize('admin'), updateProduct);

/**
 * ROUTE: DELETE /api/products/:id
 * 
 * PURPOSE: Delete a product from inventory
 * 
 * PROTECTED: Yes (JWT required)
 * REQUIRES ROLE: admin
 * 
 * MIDDLEWARE CHAIN:
 * 1. protect: Verify JWT
 * 2. authorize('admin'): Check admin role
 * 3. deleteProduct: Execute controller
 * 
 * PARAM: id = MongoDB ObjectId
 * 
 * EXAMPLE REQUEST:
 * DELETE /api/products/65a1fd98f66d453210cde123
 * Authorization: Bearer <admin_jwt_token>
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Product deleted successfully",
 *   "data": { ...deleted product... }
 * }
 * 
 * ERROR RESPONSES:
 * - 401: No JWT token
 * - 403: User is not admin
 * - 404: Product not found
 * 
 *  WARNING: Hard delete - permanent removal
 *  No recovery possible
 * 
 * WHO CAN ACCESS: Admin users only
 * FRONTEND USE: Admin delete product button
 */

router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;