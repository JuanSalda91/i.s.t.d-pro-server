const Product = require("../models/Product.js");

/**
 * ==========================================
 * CONTROLLER: Get All Products
 * ==========================================
 */
exports.getProducts = async (req, res) => {
  try {
    // Step 1: Extract query parameters from URL
    // Example: GET /api/products?search=Samsung&category=Electrónica
    const { search, category, minStock, sortBy } = req.query;
    // Step 2: Initialize empty filter object
    // This will be populated with search conditions
    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }
    /**
     * LOW STOCK FILTER
     */
    if (minStock) {
      filter.stock = { $lte: parseInt(minStock) };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("getProducts Error:", error);

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
 */
exports.getProductById = async (req, res) => {
  try {
    // Extract product ID from url parameter
    const { id } = req.params;

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

    if (price < 0 || cost < 0 || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Price, cost, and stock cannot be negative",
      });
    }
    /**
     * CREATE PRODUCT
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
    // sSave created product to database
    await product.save();
    // Return created product with 201 created status
    res.status(201).json({
      succes: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
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
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    // return updated product
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
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
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold, 10) || 5; // default 5

    const products = await Product.find({
      stock: { $lte: threshold },
    }).sort({ stock: 1 }); // lowest stock first

    res.status(200).json({
      threshold,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error in getLowStockProducts:', error);
    res.status(500).json({
      message: 'Error fetching low stock products',
      error: error.message,
    });
  }
};

/**
 * ==========================================
 * CONTROLLER: Delete Product
 * ==========================================
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    // check if product was found and deleted
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    // return success with deleted product information
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
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
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ["$stock", "$minStock"] },
    })

      .sort({ stock: 1 });

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
 */
exports.getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalproducts: { $sum: 1 },
          totalStock: { $sum: "$stock" },
          avgPrice: { $avg: "$price" },
          avgCost: { $avg: "$cost" },
          maxPrice: { $max: "$price" },
          minPrice: { $min: "$price" },
        },
      },
    ]);

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

/**
 * ==========================================
 * CONTROLLER: Get Products by Category
 * ==========================================
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalStock: { $sum: "$stock" },
          avgPrice: { $avg: "$price" },
        },
      },

      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
