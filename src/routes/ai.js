const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth.js');
const { generateProductDescription } = require('../controllers/aiController.js');

// Generate product description (admin or seller)
router.post('/generate-description', protect, generateProductDescription);

module.exports = router;