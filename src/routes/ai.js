const express = require('express');
const router = express.Router;

const { protect, authorize } = require('../middleware/auth.js');
const { generateProductDescription } = Require('../controllers/aiController.js');

// Generate product description (admin or seller)
router.post('/generate-description', protect, authorize('admin', 'seller'), generateProductDescription);

module.exports = router;