const Product = require('../models/Product.js');

/**
 * ==========================================
 * CONTROLLER: Get All Products
 * ==========================================
 * 
 * ROUTE: GET /api/products
 * 
 * PURPOSE: Retrieve all products from database with optional filtering and searching
 * 
 * QUERY PARAMETERS (all optional):
 * - search: Search by product name or SKU (case-insensitive)
 * - category: Filter by product category
 * - minStock: Show products with stock at or below this level
 * 
 * EXAMPLE REQUESTS:
 * GET /api/products
 * GET /api/products?search=Samsung
 * GET /api/products?category=Electrónica
 * GET /api/products?minStock=5
 * GET /api/products?search=laptop&category=Electrónica&minStock=10
 * 
 * HOW IT WORKS:
 * 1. Extract search parameters from request.query
 * 2. Build MongoDB filter object dynamically based on parameters
 * 3. Execute database query with filters
 * 4. Sort results by creation date (newest first)
 * 5. Return array of matching products with total count
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
 * ERROR RESPONSES:
 * - 500: Server/database error
 */
exports.getProducts = async (req, res) => {
    try {
        // Step 1: Extract query parameters from URL
        // Example: GET /api/products?search=Samsung&category=Electrónica
        const { search, category, minStock } = req.query;
        // Step 2: Initialize empty filter object
        // This will be populated with search conditions
        let filter = {};
        /**
         * SEARCH FILTER
         * 
         * If user provided a search term, add it to filter
         * Use $or operator: product matches if name OR sku matches search term
         * Use $regex: pattern matching (not exact)
         * Use $options: 'i' = case-insensitive (find "Samsung", "samsung", "SAMSUNG")
         * 
         * Example: search="samsung" finds:
         * - "Samsung 65-inch TV"
         * - "SAMSUNG Monitor"
         * - "samsung phone"
         * - "SKU-SAMSUNG-001"
         */
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i'} },
                { sku: {$regex: search, $options: 'i'} },
            ];
        }
        /**
         * CATEGORY FILTER
         * 
         * If user provided category, add to filter
         * This is exact match (not pattern matching)
         * 
         * Example: category="Electrónica" only returns electronics
         * Does NOT return "Electronic" or partial matches
         */
        if (category) {
            filter.category = category;
        }
        /**
         * LOW STOCK FILTER
         * 
         * If minStock parameter provided, add to filter
         * $lte = "less than or equal to" operator
         * 
         * Example: minStock=5 shows all products with:
         * - stock = 5
         * - stock = 4
         * - stock = 3
         * - stock = 0
         * But NOT stock = 6 or higher
         * 
         * parseInt() converts string "5" from URL to number 5
         */
        if (minStock) {
            filter.stock = { $lte: parseInt(minStock) };
        }
        /**
         * EXECUTE QUERY
         * 
         * Find all products matching the filter
         * .sort({ createdAt: -1 }): Sort by creation date, newest first
         * (-1 = descending order, 1 = ascending)
         */
        const products = (await Product.find(filter)).toSorted({ createdAt: -1});
        /**
         * SEND RESPONSE
         * 
         * 200 OK: Request successful
         * success: true = operation completed without error
         * count: number of products found
         * data: array of product objects
         */
        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        /**
         * ERROR HANDLING
         * 
         * If any error occurs (database connection, syntax error, etc.)
         * Send 500 Internal Server Error with error message
         */
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

