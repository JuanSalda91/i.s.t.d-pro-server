const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth.js');
const { generateProductDescription, getDiscountSuggestion, getSalesTrends, getInventoryInsights } = require('../controllers/aiController.js');

// Generate product description (admin or seller)
router.post('/generate-description', protect, generateProductDescription);

// Generate discount suggestion
router.post('/discount-suggestion', protect, getDiscountSuggestion);

// sales trend analysis
router.get('/sales-trends', protect, getSalesTrends);

//inventory insights
router.get('/inventory-insights', protect, getInventoryInsights);

module.exports = router;