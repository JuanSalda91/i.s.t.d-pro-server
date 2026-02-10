const Product = require("../models/Product.js");

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
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
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
    const products = (await Product.find(filter)).toSorted({ createdAt: -1 });
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

/**
 * ==========================================
 * CONTROLLER: Get Product by ID
 * ==========================================
 *
 * ROUTE: GET /api/products/:id
 *
 * PURPOSE: Get detailed information about a single product
 *
 * PARAM: id = MongoDB ObjectId (from URL path)
 *
 * EXAMPLE REQUEST:
 * GET /api/products/65a1fd98f66d453210cde123
 *
 * HOW IT WORKS:
 * 1. Extract product ID from URL parameter
 * 2. Query database for product with that ID
 * 3. If found: return product data
 * 4. If not found: return 404 error
 *
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "65a1fd98f66d453210cde123",
 *     "sku": "PROD-001",
 *     "name": "Samsung 65-inch TV",
 *     "description": "4K Smart TV with Dolby Vision...",
 *     "price": 799.99,
 *     "cost": 450.00,
 *     "stock": 15,
 *     "minStock": 5,
 *     "category": "Electronics",
 *     "supplier": "Samsung Distributor",
 *     "aiGenerated": false,
 *     "createdAt": "2026-02-08T22:30:00.000Z",
 *     "updatedAt": "2026-02-08T22:30:00.000Z"
 *   }
 * }
 *
 * ERROR RESPONSES:
 * - 404: Product with that ID not found
 * - 500: Server/database error
 */
exports.getProductById = async (req, res) => {
  try {
    // Extract product ID from url parameter
    const { id } = req.params;
    /**
     * FIND PRODUCT BY ID
     *
     * findById: MongoDB method to find document by ObjectId
     * Returns null if ID doesn't exist
     */
    const product = await Product.findById(id);
    // Check if product exists
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    // Return product details
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ==========================================
 * CONTROLLER: Create Product
 * ==========================================
 *
 * ROUTE: POST /api/products
 *
 * PURPOSE: Add a new product to inventory
 *
 * REQUIRES: Admin role (checked in routes with authorize middleware)
 *
 * REQUEST BODY:
 * {
 *   "sku": "PROD-001",
 *   "name": "Samsung 65-inch TV",
 *   "description": "4K Smart TV with Dolby Vision",
 *   "category": "Electronics",
 *   "price": 799.99,
 *   "cost": 450.00,
 *   "stock": 20,
 *   "minStock": 5,
 *   "supplier": "Samsung Distributor"
 * }
 *
 * REQUIRED FIELDS:
 * - sku: Unique product code
 * - name: Product name
 * - price: Selling price
 * - cost: Purchase cost
 * - stock: Initial quantity
 *
 * OPTIONAL FIELDS:
 * - description: Product details
 * - category: Product category (default: Otros)
 * - minStock: Reorder level (default: 10)
 * - supplier: Supplier name
 *
 * RESPONSE (201 Created):
 * {
 *   "success": true,
 *   "message": "Product created successfully",
 *   "data": { ...product object... }
 * }
 *
 * ERROR RESPONSES:
 * - 400: Missing required fields
 * - 400: SKU already exists
 * - 500: Server error
 */
exports.createProduct = async (req, res) => {
  try {
    // destructure request body to get product details
    const {
      sku,
      name,
      description,
      category,
      price,
      cost,
      stock,
      minStock,
      supplier,
    } = req.body;
    /**
     * VALIDATION: Check required fields
     *
     * These fields MUST be provided:
     * - sku: Unique identifier
     * - name: Product display name
     * - price: Selling price (must be a number, could be 0)
     * - cost: Purchase price (must be a number, could be 0)
     * - stock: Initial quantity (must be a number, could be 0)
     *
     * Note: price === undefined checks for existence
     * because price could be 0, which is falsy in JavaScript
     */
    if (
      !sku ||
      !name ||
      price === undefined ||
      cost === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "please provide all required fields: sku, name, price, cost, stock",
      });
    }
    /**
     * VALIDATION: Check for negative values
     *
     * Price, cost, and stock should not be negative
     * (though we have schema validation too, this is explicit)
     */
    if (price < 0 || cost < 0 || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Price, cost, and stock cannot be negative",
      });
    }
    /**
     * CREATE PRODUCT
     *
     * Product.create() does:
     * 1. Creates new Product document with provided data
     * 2. Runs all schema validations
     * 3. Saves to MongoDB
     * 4. Returns saved document
     *
     * Note: If SKU already exists, MongoDB throws error (code 11000)
     * which is caught in the catch block
     */
    const product = new Product({
      sku: sku.toUpperCase(), // ensure SKU is uppercase for consistency
      name: name.trim(),
      description: description || "",
      category: category || "Others",
      price: parseFloat(price), //parseFloat converts string to number (e.g. "799.99" to 799.99)
      cost: parseFloat(cost),
      stock: parseInt(stock), //parseInt converts string to integer (e.g. "20" to 20)
      minStock: minStock || 10,
      supplier: supplier || "",
    });
    // Return created product with 201 created status
    res.status(201).json({
      succes: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    /**
     * ERROR HANDLING
     *
     * MongoDB duplicate key error code: 11000
     * Occurs when trying to create product with existing unique field (SKU)
     * error.keyValue contains the duplicate field and value
     */
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `SKU '${error.keyValue.sku}' already exists. Please use a different SKU.`,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ==========================================
 * CONTROLLER: Update Product
 * ==========================================
 * 
 * ROUTE: PUT /api/products/:id
 * 
 * PURPOSE: Update existing product information
 * 
 * REQUIRES: Admin role
 * 
 * PARAM: id - MongoDB ObjectId
 * 
 * REQUEST BODY: Any fields to update (partial update allowed)
 * {
 *   "name": "Updated Product Name",
 *   "price": 899.99,
 *   "stock": 25,
 *   "description": "Updated description"
 * }
 * 
 * IMPORTANT:
 * - Only provided fields are updated
 * - Other fields remain unchanged
 * - All schema validations apply
 * - Product must exist
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Product updated successfully",
 *   "data": { ...updated product... }
 * }
 * 
 * ERROR RESPONSES:
 * - 404: Product not found
 * - 500: Server error (validation failure, etc.)
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        /**
         * CHECK IF PRODUCT EXISTS
         * 
         * First verify product exists before attempting update
         * This gives us better error messaging
         */
        let product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        /**
         * UPDATE PRODUCT
         * 
         * findByIdAndUpdate() does:
         * 1. Finds product by ID
         * 2. Updates with fields from req.body (only provided fields)
         * 3. Runs schema validation on updated document
         * 4. Saves to database
         * 5. Returns updated document
         * 
         * OPTIONS:
         * - new: true → returns updated document instead of original
         * - runValidators: true → runs schema validations
         */
        product = await Product.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        // return updated product
        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * ==========================================
 * CONTROLLER: Delete Product
 * ==========================================
 * 
 * ROUTE: DELETE /api/products/:id
 * 
 * PURPOSE: Remove a product from inventory
 * 
 * REQUIRES: Admin role
 * 
 * PARAM: id - MongoDB ObjectId
 * 
 * IMPORTANT NOTES:
 * - This is a hard delete (permanently removes product)
 * - In production, consider soft deletes (add isDeleted flag)
 * - Before deleting, check if product has sales history
 * - Cannot recover deleted products
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "message": "Product deleted successfully",
 *   "data": { ...deleted product... }
 * }
 * 
 * ERROR RESPONSES:
 * - 404: Product not found
 * - 500: Server error
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        /**
         * DELETE PRODUCT
         * 
         * findByIdAndDelete() does:
         * 1. Finds product by ID
         * 2. Deletes from database
         * 3. Returns deleted document
         * 4. Returns null if not found
         */
        const product = await Product.findByIdAndDelete(id);
        // check if product was found and deleted
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        // return success with deleted product information
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * ==========================================
 * CONTROLLER: Get Low Stock Products
 * ==========================================
 * 
 * ROUTE: GET /api/products/low-stock
 * 
 * PURPOSE: Get all products with stock at or below minStock level
 * 
 * USEFUL FOR:
 * - Inventory reordering alerts
 * - Creating low-stock reports
 * - Day 7-8 AI: Suggesting discounts for low-stock items
 * - Dashboard: Show products needing urgent attention
 * 
 * HOW IT WORKS:
 * 1. Find all products where stock <= minStock
 * 2. Sort by lowest stock first (most urgent at top)
 * 3. Return array of low-stock products with count
 * 
 * EXAMPLE PRODUCTS:
 * Product A: minStock=10, stock=8 → INCLUDED (8 <= 10) ✅
 * Product B: minStock=10, stock=10 → INCLUDED (10 <= 10) ✅
 * Product C: minStock=10, stock=11 → NOT INCLUDED (11 > 10) ❌
 * 
 * QUERY EXPLANATION:
 * $expr: Compare fields to each other (not constants)
 * $lte: Less than or equal to
 * '$stock': Field reference (the $ prefix)
 * '$minStock': Field reference
 * 
 * Result: Finds docs where stock field value <= minStock field value
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "count": 3,
 *   "data": [
 *     {
 *       "_id": "65a1fd98f66d453210cde123",
 *       "sku": "PROD-001",
 *       "name": "Samsung TV",
 *       "stock": 2,
 *       "minStock": 10,
 *       ...
 *     },
 *     {
 *       "_id": "65a1fd98f66d453210cde124",
 *       "sku": "PROD-002",
 *       "name": "Nike Shoes",
 *       "stock": 5,
 *       "minStock": 15,
 *       ...
 *     },
 *     {...}
 *   ]
 * }
 * 
 * ERROR RESPONSES:
 * - 500: Server/database error
 */
exports.getLowStockProducts = async (req, res) => {
    try {
        /**
         * STEP 1: Query products where stock <= minStock
         * 
         * $expr: Allows comparison between two fields
         * $lte: "less than or equal to" comparison operator
         * 
         * English: Find all products where the stock field
         * is less than or equal to the minStock field
         */
        const products = await Product.find({
            $expr: { $lte: ['$stock', '$minStock'] },
        })
        /**
         * STEP 2: Sort results
         * 
         * .sort({ stock: 1 }): Sort by stock in ascending order
         * This puts the lowest stock products first (most urgent)
         * 
         * Ascending (1): 0, 1, 2, 3, 4, 5... (lowest first)
         * Descending (-1): 5, 4, 3, 2, 1, 0... (highest first)
         */
        .sort({ stock: 1 });
        /**
         * STEP 3: Send response
         * 
         * Return count and array of low-stock products
         */
        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * ==========================================
 * CONTROLLER: Get Product Statistics
 * ==========================================
 * 
 * ROUTE: GET /api/products/stats
 * 
 * PURPOSE: Get aggregate statistics about all products
 * 
 * USEFUL FOR:
 * - Dashboard summaries
 * - Inventory overview
 * - Financial analysis
 * - Reporting
 * 
 * STATISTICS PROVIDED:
 * - totalProducts: Count of all products
 * - totalStock: Sum of all stock quantities
 * - avgPrice: Average selling price
 * - avgCost: Average purchase cost
 * - maxPrice: Highest product price
 * - minPrice: Lowest product price
 * 
 * HOW IT WORKS (MongoDB Aggregation Pipeline):
 * 
 * Aggregation is like a multi-stage process:
 * Stage 1 ($group): Group all documents together
 *   _id: null = combine all documents into one group
 *   Calculate totals, averages, min, max within that group
 * 
 * Result: Single document with statistics
 * 
 * EXAMPLE RESPONSE (200 OK):
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
 * WHAT THESE MEAN:
 * - totalProducts: 45 = We have 45 products
 * - totalStock: 1250 = Total items in inventory (all products combined)
 * - avgPrice: 599.99 = Average selling price per product
 * - avgCost: 350.00 = Average cost per product
 * - maxPrice: 2499.99 = Most expensive product
 * - minPrice: 9.99 = Cheapest product
 * 
 * ERROR RESPONSES:
 * - 500: Server/database error
 */
exports.getProductStats = async (req, res) => {
    try {
        /**
         * STEP 1: Aggregate data from all products
         * 
         * Product.aggregate([...]) = MongoDB aggregation pipeline
         * Pipeline is array of stages that transform data
         * 
         * STAGE 1: $group
         * Groups all documents together and calculates:
         * - _id: null = combine into single group
         * - $sum: 1 = count documents (each product = 1)
         * - $sum: '$stock' = add up all stock values
         * - $avg: '$price' = calculate average price
         * - $max: '$price' = find maximum price
         * - $min: '$price' = find minimum price
         */
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalproducts: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    avgPrice: { $avg: '$price' },
                    avgCost: { $avg: '$cost' },
                    maxPrice: { $max: '$price' },
                    minPrice: { $min: '$price' },
                },
            },
        ]);
        /**
         * STEP 2: Send response
         * 
         * stats[0] = first (and only) document from aggregation
         * || {...default values} = if no stats, return defaults
         * (Happens when no products in database)
         */
        res.status(200).json({
            success: true,
            data: stats[0] || {
                totalProducts: 0,
                totalStock: 0,
                avgPrice: 0,
                avgCost: 0,
                maxPrice: 0,
                minPrice: 0,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};