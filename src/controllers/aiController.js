// const { GoogleGenAI } = require('@google/genai');
const Product = require('../models/Product.js');
const Sale = require('../models/Sale.js');

const { generateProductDescription } = require('../services/aiService.js');

// const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, });

/**
 * POST /api/ai/generate-description
 * Body: { productId?: string, name?: string, category?: string }
 * 
 * If productId is provided, product is loaded from DB.
 * Otherwise name/category is used from the body.
 */

exports.generateProductDescription = async (req, res) => {
    try {
        const { productId, name, category } = req.body;

        let productName = name;
        let productCategory = category;

        //if productId is prodvided, load product from DB
        if (productId) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            productName = product.name;
            productCategory = product.category;
        }

        if (!productName) {
            return res.status(400).json({ message: 'productId or name is required' });
        }

        const prompt = `
        You are a helpful copywriter for an inventory & sales system.
        
        Write a professional, concise product description for the following product.
        Focus on benefits and key features.
        
        Product name: ${productName}
        Category: ${productCategory || 'General'}
        Tone: professional, clear, friendly.
        Length: 2-4 sentences.
        `;

        // Call Gemini via Google Gen AI SDK
        // const response = await client.models.generateContent({
        //   model: 'gemini-2.0-flash',
        //   contents: [
        //     {
        //       role: 'user',
        //       parts: [{ text: prompt }],
        //     },
        //   ],
        // });
        
        // const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';        

        // Call AI service (currently mocked)
        const text = await generateProductDescription(prompt);


        // if productId is provided, save description back to DB
        let updatedProduct = null;
        if (productId) {
            updatedProduct = await Product.findByIdAndUpdate(
                productId,
                { description: text },
                { new: true },
            );
        }

        res.status(200).json({
            message: 'Description generated successfully',
            description: text,
            product: updatedProduct,
        });
    } catch (error) {
        console.error('Error generating product description:', error);
        //handle common Gemini errors
        // if (error.response && error.response.status) {
        //     return res.status(error.response.status).json({
        //         message: 'Gemini API error',
        //         error: error.message,
        //     });
        // }
        res.status(500).json({
            message: 'Error generating product description',
            error: error.message,
        });
    }
};

/**
 * DISCOUNT SUGGESTION ENDPOINT:
 * POST /api/ai/discount-suggestion
 * Body: { productId }
 * Returns: { suggestedDiscount, reason }
 */
exports.getDiscountSuggestion = async (req, res) => {
    try {
      const { productId } = req.body;
  
      if (!productId) {
        return res.status(400).json({ message: 'productId is required' });
      }
  
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const stock = product.stock ?? 0;
      let suggestedDiscount = 0;
      let reason = '';
  
      // Simple rule-based logic (you can tune numbers later)
      if (stock <= 5) {
        suggestedDiscount = 0;
        reason =
          'Stock is low. No discount recommended to avoid running out of inventory.';
      } else if (stock <= 20) {
        suggestedDiscount = 5;
        reason =
          'Stock is moderate. A small discount can encourage sales without hurting margins.';
      } else if (stock <= 50) {
        suggestedDiscount = 15;
        reason =
          'Stock is high. A medium discount can help move inventory steadily.';
      } else if (stock <= 100) {
        suggestedDiscount = 25;
        reason =
          'Stock is very high. A larger discount can accelerate sell-through.';
      } else {
        suggestedDiscount = 40;
        reason =
          'Stock is extremely high. Consider aggressive discounting to clear space.';
      }
  
      res.status(200).json({
        productId,
        productName: product.name,
        stock,
        suggestedDiscount,
        reason,
      });
    } catch (error) {
      console.error('Error in getDiscountSuggestion:', error);
      res.status(500).json({
        message: 'Error generating discount suggestion',
        error: error.message,
      });
    }
  };

/**
 *SALES TREND ANALYSIS:
 *GET /api/ai/sales-trends?days=30
 *Returns daily totals for completed sales over last N days
 */
 exports.getSalesTrends = async (req, res) => {
    try {
      const days = parseInt(req.query.days, 10) || 30;
  
      const now = new Date();
      const start = new Date();
      start.setDate(now.getDate() - days + 1); // include today as last day
  
      const trends = await Sale.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: start, $lte: now },
          },
        },
        {
          // Group by date (YYYY-MM-DD)
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            totalRevenue: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
            },
            totalRevenue: { $round: ['$totalRevenue', 2] },
            totalTransactions: 1,
          },
        },
        { $sort: { date: 1 } },
      ]);
  
      res.status(200).json({
        range: {
          from: start,
          to: now,
          days,
        },
        daysData: trends,
      });
    } catch (error) {
      console.error('Error in getSalesTrends:', error);
      res.status(500).json({
        message: 'Error fetching sales trends',
        error: error.message,
      });
    }
  };

/**
 * INVENTORY INSIGHTS:
 * GET /api/ai/inventory-insights?lowThreshold=5&highThreshold=50
 * Returns low stock, overstock, and basic summary
 */
exports.getInventoryInsights = async (req, res) => {
    try {
      const lowThreshold = parseInt(req.query.lowThreshold, 10) || 5;
      const highThreshold = parseInt(req.query.highThreshold, 10) || 50;
  
      // Low stock
      const lowStock = await Product.find({
        stock: { $gt: 0, $lte: lowThreshold },
      }).sort({ stock: 1 });
  
      // Out of stock
      const outOfStock = await Product.find({ stock: { $lte: 0 } });
  
      // Overstock
      const overStock = await Product.find({
        stock: { $gt: highThreshold },
      }).sort({ stock: -1 });
  
      // Basic summary counts
      const totalProducts = await Product.countDocuments();
      const totalLow = lowStock.length;
      const totalOut = outOfStock.length;
      const totalOver = overStock.length;
  
      res.status(200).json({
        thresholds: {
          lowThreshold,
          highThreshold,
        },
        summary: {
          totalProducts,
          lowStockCount: totalLow,
          outOfStockCount: totalOut,
          overStockCount: totalOver,
        },
        lowStock,
        outOfStock,
        overStock,
      });
    } catch (error) {
      console.error('Error in getInventoryInsights:', error);
      res.status(500).json({
        message: 'Error fetching inventory insights',
        error: error.message,
      });
    }
  };