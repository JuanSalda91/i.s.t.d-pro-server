const express = require('express');
const cors = require('cors');
require('dotenv').config();

/**
 * INITIALIZE EXPRESS application
 * 
 * This file sets up the Express server configuration:
 * - Middleware for handling requests
 * - CORS for frontend-backend communication
 * - Basic routes 
 */
const app = express();

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

/**  * CORS MIDDLEWARE
 * 
 * WHAT: Cross-Origin Resource Sharing
 * WHY: Our frontend (port 3000) and backend (port 5000) are on different ports
 *      Without CORS, the browser blocks frontend requests to backend
 * HOW: cors() allows requests from any origin (we'll restrict this in production)
 */
app.use(cors());

/**
 * JSON BODY PARSER MIDDLEWARE
 * 
 * WHAT: Parses incoming JSON request bodies
 * WHY: When frontend sends JSON data, Express needs to parse it
 * HOW: express.json() automatically converts JSON strings to JavaScript objects
 * 
 * EXAMPLE:
 * Frontend sends: { "name": "John", "email": "john@email.com" }
 * express.json() converts to: req.body = { name: "John", email: "john@email.com" }
 */
app.use(express.json());

// ==========================================
// HEALTH CHECK ROUTE
// ==========================================

/**
 * ROUTE: GET /api/health
 * 
 * PURPOSE: Verify that the backend server is running
 * 
 * WHEN USED: 
 * - Frontend checks if backend is available on startup
 * - Used for monitoring/testing
 * 
 * RESPONSE: { status: 'OK', message: '...' }
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend server is running correctly',
        timeStamp: new Date().toISOString(),
    });
});

// ==========================================
// API ROUTES (Will add these later)
// ==========================================

/**
 * ROUTE MOUNTING
 * 
 * WHAT: app.use() tells Express to use these routes
 * 
 * EXAMPLE:
 * app.use('/api/auth', require('./routes/auth'));
 * 
 * This means:
 * - Any request to /api/auth/* will go to auth.js routes
 * - route.post('/register') becomes POST /api/auth/register
 * - route.post('/login') becomes POST /api/auth/login
 * - route.post('/refresh') becomes POST /api/auth/refresh
 */

// app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/auth.js'))

// app.use('/api/products', require('./routes/products'));
// app.use('/api/sales', require('./routes/sales'));
// app.use('/api/invoices', require('./routes/invoices'));
// app.use('/api/ai', require('./routes/ai'));

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

/**
 * 404 ERROR HANDLER
 * 
 * WHAT: Catches requests to endpoints that don't exist
 * WHY: Provides meaningful error message instead of silent failure
 * HOW: This middleware runs if no other route matches
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

/**
 * GLOBAL ERRIR HANDLER
 * 
 * WHAT: Catches ALL errors thrown in the application
 * WHY: Prevents app from crashing, provides consistent error format
 * HOW: Express runs error handlers when error is passed
 */
app.use((err, req, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

module.exports = app;