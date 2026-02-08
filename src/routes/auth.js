const express = require('express');
const router = express.Router();

/**
 * IMPORT: Authentication Controller
 * 
 * This imports the functions we created in authController.js
 * - register: POST /api/auth/register
 * - login: POST /api/auth/login
 * - refreshToken: POST /api/auth/refresh
 */
const {
    register,
    login,
    refreshToken,
} = require('../controllers/authController.js');

/**
 * Import authentication middleware
 * 
 * protect: Verifies JWT token is valid
 * authorize: Checks user has required role
 */
const { protect, authorize } = require('../middleware/auth.js');

/**
 * ROUTE: POST /api/auth/register
 * 
 * PURPOSE: Create a new user account
 * 
 * FLOW IN APPLICATION:
 * 1. User clicks "Sign Up" on frontend
 * 2. Enters: name, email, password
 * 3. Frontend sends POST to /api/auth/register
 * 4. Backend validates and creates user
 * 5. Returns JWT token
 * 6. Frontend stores token and logs user in
 * 
 * EXAMPLE REQUEST (in Postman):
 * POST http://localhost:5000/api/auth/register
 * Content-Type: application/json
 * 
 * {
 *   "name": "Juan Salda",
 *   "email": "juan@istdpro.com",
 *   "password": "MySecurePassword123",
 *   "role": "admin"
 * }
 * 
 * EXAMPLE RESPONSE (201 Created):
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "65a1fd98f66d453210cde123",
 *     "name": "Juan Salda",
 *     "email": "juan@istdpro.com",
 *     "role": "admin"
 *   }
 * }
 */
router.post('/register', register);

/**
 * ROUTE: POST /api/auth/login
 * 
 * PURPOSE: Authenticate user with email and password
 * 
 * FLOW IN APPLICATION:
 * 1. User clicks "Login" on frontend
 * 2. Enters: email, password
 * 3. Frontend sends POST to /api/auth/login
 * 4. Backend verifies credentials
 * 5. Returns JWT token
 * 6. Frontend stores token and logs user in
 * 
 * EXAMPLE REQUEST (in Postman):
 * POST http://localhost:5000/api/auth/login
 * Content-Type: application/json
 * 
 * {
 *   "email": "juan@istdpro.com",
 *   "password": "MySecurePassword123"
 * }
 * 
 * EXAMPLE RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "65a1fd98f66d453210cde123",
 *     "name": "Juan Salda",
 *     "email": "juan@istdpro.com",
 *     "role": "admin"
 *   }
 * }
 * 
 * ERROR RESPONSES:
 * - 400: Missing email or password
 * - 401: Invalid email or password (user not found or wrong password)
 * - 500: Server error
 */
router.post('/login', login);

/**
 * ROUTE: POST /api/auth/refresh
 * 
 * PURPOSE: Get a new access token using refresh token
 * 
 * FLOW IN APPLICATION:
 * 1. User's access token expires after 7 days
 * 2. Frontend detects token is expired
 * 3. Frontend sends refresh token to /api/auth/refresh
 * 4. Backend verifies refresh token and issues new access token
 * 5. Frontend updates stored token
 * 6. User stays logged in without re-entering credentials
 * 
 * EXAMPLE REQUEST (in Postman):
 * POST http://localhost:5000/api/auth/refresh
 * Content-Type: application/json
 * 
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * EXAMPLE RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (new token)
 * }
 * 
 * ERROR RESPONSES:
 * - 400: Refresh token not provided
 * - 401: Invalid or expired refresh token
 * - 500: Server error
 */
router.post('/refresh', refreshToken);

/**
 * ROUTE: GET /api/auth/me
 * 
 * PURPOSE: Get current authenticated user's profile
 * 
 * PROTECTED: Requires valid JWT token
 * MIDDLEWARE: protect
 * 
 * USAGE IN FRONTEND:
 * Frontend sends: GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "user": {
 *     "id": "...",
 *     "name": "Juan Salda",
 *     "email": "juan@istdpro.com",
 *     "role": "admin"
 *   }
 * }
 * 
 * This is useful for frontend to get current user info after login
 */
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

/**
 * ROUTE: GET /api/auth/admin-only
 * 
 * PURPOSE: Example of role-restricted route
 * 
 * PROTECTED: Requires valid JWT AND admin role
 * MIDDLEWARE: protect (checks JWT), authorize('admin') (checks role)
 * 
 * FLOW:
 * 1. protect middleware checks JWT
 * 2. If invalid → returns 401
 * 3. If valid → continues to authorize middleware
 * 4. authorize checks if role is 'admin'
 * 5. If not admin → returns 403
 * 6. If admin → continues to controller
 */
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'This is admin-only content',
        user: req.user,
    });
});

/**
 * ==========================================
 * ROUTE ORGANIZATION IN FULL APP
 * ==========================================
 * 
 * These routes will be mounted in app.js like this:
 * app.use('/api/auth', require('./routes/auth'));
 * 
 * So actual endpoints become:
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/refresh
 * 
 * Later we'll add more routes:
 * POST /api/products (create product)
 * GET /api/products (list products)
 * etc.
 */

module.exports = router;