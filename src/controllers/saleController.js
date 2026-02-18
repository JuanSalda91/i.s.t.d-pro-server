const Sale = require('../models/Sale.js');
const Product = require('../models/Product.js');

//create a new Sale
exports.createSale = async (req, res) => {
    try {
      // Now expecting an ARRAY of items
      const { customerName, customerEmail, customerPhone, items, taxPercentage = 0 } = req.body;
  
      // Validate required fields
      if (!customerName || !customerEmail || !items || items.length === 0) {
        return res.status(400).json({ 
          message: "Customer name, email, and at least one item are required" 
        });
      }
  
      // Authenticate
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Please provide valid authentication token",
        });
      }
  
      // Validate and check stock for EACH item
      const validatedItems = [];
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          return res.status(400).json({ 
            message: "Each item must have productId, quantity, and unitPrice" 
          });
        }
  
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({ 
            message: `Product ${item.productId} not found` 
          });
        }
  
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Not enough stock for ${product.name}. Available: ${product.stock}` 
          });
        }
  
        // Add validated item
        validatedItems.push({
          productId: item.productId,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        });
  
        // IMPORTANT: Deduct stock immediately
        product.stock -= item.quantity;
        await product.save();
      }
  
      // Create sale with validated items
      const newSale = new Sale({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone ? customerPhone.trim() : "",
        items: validatedItems, // Array of items
        taxPercentage: parseFloat(taxPercentage),
        sellerId: req.user._id,
        status: "pending",
      });
  
      const savedSale = await newSale.save();
      await savedSale.populate("items.productId", "name price category");
      await savedSale.populate("sellerId", "email name");
  
      res.status(201).json({
        message: "Sale created successfully",
        sale: savedSale,
      });
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Error creating sale", error: error.message });
    }
  };

// GET ALL SALES WITH FILTERING
exports.getSales = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sellerId } = req.query;

        //build filter object (filter by status or seller if provided)
        const filter = {};
        if (status) filter.status = status;
        if (sellerId) filter.sellerId = sellerId;

        // get total count for pagination
        const total = await Sale.countDocuments(filter);

        // fetch sales with pagination and populate references
        const sales = await Sale.find(filter)
        .populate('items.productId', 'name price category') // get only specific product fields
        .populate('sellerId', 'email name') // get only specific seller fields
        .limit(limit * 1) //limit result for pagination
        .skip((page - 1) * limit) // skip for pagination
        .sort({ createdAt: -1}); // sort by newest first

        res.json({
            sales,
            pagination: {
                totalSales: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error: error.message });
    }
};

// GET SINGLE SALE BY ID
exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
        .populate('items.productId')
        .populate('sellerId', 'email name');

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        res.status(200).json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sale', error: error.message });
    }
};

//UPDATE SALE STATUS
exports.updateSaleStatus = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        // check if authorization: only seller who created the sale can update items
        if (sale.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this sale' });
        }
        // update allowed fields
        const { status, customerName, customerEmail } = req.body;
        if (status) sale.status = status;
        if (customerName) sale.customerName = customerName;
        if (customerEmail) sale.customerEmail = customerEmail;

        //save updated sale
        const updatedSale = await sale.save();
        /**awaitupdatedSale.populate('productId');*/
        await updatedSale.populate('sellerId', 'email name');
        res.status(200).json({
            message: 'Sale updated successfully',
            sale: updatedSale,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating sale', error: error.message });
    }
};

// DELETE A SALE
exports.deleteSale = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        // check if authorization: only seller who created the sale can delete items
        if (sale.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this sale' });
        }
        await Sale.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Sale deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting sale', error: error.message });
    }
};

// GET sales statistics (total sales amount, count, etc.)
exports.getSalesStats = async (req, res) => {
  try {
    // Get stats for completed sales only
    const stats = await Sale.aggregate([
      { $match: { status: 'completed' } }, // Only completed sales
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }, // Sum all amounts
          totalTransactions: { $sum: 1 }, // Count transactions
          averageAmount: { $avg: '$totalAmount' }, // Average per sale
          maxSale: { $max: '$totalAmount' }, // Highest sale
          minSale: { $min: '$totalAmount' } // Lowest sale
        }
      }
    ]);

    res.status(200).json({
      stats: stats.length > 0 ? stats[0] : { message: 'No completed sales yet' }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// GET TOP PRODUCTS BY QUANTITY SOLD

exports.getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    const results = await Sale.aggregate([
      // Only completed sales
      { $match: { status: 'completed' } },

      // Break items array into separate documents
      { $unwind: '$items' },

      // Group by productId, sum quantity and revenue
      {
        $group: {
          _id: '$items.productId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.itemTotal' },
        },
      },

      // Join with Product collection to get name, category, etc.
      {
        $lookup: {
          from: 'products',            // collection name in MongoDB
          localField: '_id',           // productId
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },

      // Shape the output
      {
        $project: {
          _id: 0,
          productId: '$product._id',
          name: '$product.name',
          category: '$product.category',
          totalQuantity: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
        },
      },

      // Sort by quantity desc, then revenue desc
      { $sort: { totalQuantity: -1, totalRevenue: -1 } },

      // Limit
      { $limit: limit },
    ]);

    res.status(200).json({
      limit,
      products: results,
    });
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    res.status(500).json({
      message: 'Error fetching top products',
      error: error.message,
    });
  }
};

// GET monthly revenue
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    const matchStage = { status: 'completed' };

    // If year is provided, filter to that calendar year
    if (year) {
      const y = parseInt(year, 10);
      if (isNaN(y)) {
        return res
          .status(400)
          .json({ message: 'Invalid year. Use a numeric value like 2026' });
      }

      const start = new Date(y, 0, 1); // Jan 1
      const end = new Date(y + 1, 0, 1); // Jan 1 of next year

      matchStage.createdAt = { $gte: start, $lt: end };
    }

    const results = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          totalRevenue: {
            $round: ['$totalRevenue', 2],
          },
          totalTransactions: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    res.status(200).json({
      filter: { year: year || 'all' },
      months: results,
    });
  } catch (error) {
    console.error('Error in getMonthlyRevenue:', error);
    res.status(500).json({
      message: 'Error fetching monthly revenue',
      error: error.message,
    });
  }
};

//GET sales report
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Basic validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'startDate and endDate query parameters are required (YYYY-MM-DD)',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Include the entire endDate day (set time to 23:59:59.999)
    end.setHours(23, 59, 59, 999);

    // Optional: validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Aggregation pipeline
    const report = await Sale.aggregate([
      {
        // Only completed sales in date range
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        // Group to calculate totals
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageSaleAmount: { $avg: '$totalAmount' },
        },
      },
    ]);

    // If no sales, fallback object
    const data =
      report.length > 0
        ? report[0]
        : {
            totalRevenue: 0,
            totalTransactions: 0,
            averageSaleAmount: 0,
          };

    res.status(200).json({
      range: {
        startDate,
        endDate,
      },
      stats: {
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        totalTransactions: data.totalTransactions,
        averageSaleAmount: Math.round(data.averageSaleAmount * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error in getSalesReport:', error);
    res.status(500).json({
      message: 'Error fetching sales report',
      error: error.message,
    });
  }
};