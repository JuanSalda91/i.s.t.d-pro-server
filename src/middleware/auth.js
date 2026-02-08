const jwt= require('jsonwebtoken');
const User = require('../models/User.js');


/**
 * Two middleware functions:
 * 1. protect() - Verifies JWT token is valid and user exists
 * 2. authorize() - Checks if user has required role (admin, employee, etc.)  
 */

/**
 * ==========================================
 * MIDDLEWARE: Protect Routes (Verify JWT)
 * ==========================================
 * 
 * PURPOSE: Verify user has a valid JWT token before accessing protected routes
 * 
 * HOW IT WORKS:
 * 1. Extracts JWT from Authorization header (format: "Bearer <token>")
 * 2. Verifies token hasn't expired and signature is valid
 * 3. Extracts user ID from token
 * 4. Fetches user from database
 * 5. Stores user in req.user for use in controllers
 * 6. Allows request to proceed (next())
 * 
 * FLOW:
 * Frontend sends request with header:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       ↓
 * Middleware extracts token from "Bearer <token>"
 *       ↓
 * Verifies token with JWT_SECRET
 *       ↓
 * If valid: finds user in database, stores in req.user, calls next()
 * If invalid/expired: returns 401 error
 * 
 * USAGE IN ROUTES:
 * router.post('/protected-route', protect, controllerFunction);
 * 
 * The 'protect' middleware runs BEFORE controllerFunction
 * If user not authenticated, request stops and returns 401
 * If authenticated, controllerFunction executes with req.user available
 */
exports.protect = async (req, res, next) => {
    try {
        let token;
        /**
         * STEP 1: Extract token from Authorization header
         * 
         * Standard format: Authorization: Bearer <token>
         * Example: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
         * 
         * We split by space and take the second part (the token)
         */
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        /**
         * STEP 2: Check if token exists
         * 
         * If no token provided, user is not authenticated
         * Return 401 Unauthorized
         */
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorizaed to access this routes',
            });
        }
        /**
         * STEP 3: Verify token
         * 
         * jwt.verify() checks:
         * - Token hasn't been tampered with (signature valid)
         * - Token hasn't expired
         * 
         * If valid: returns the payload (user ID)
         * If invalid/expired: throws error (caught in catch block)
         */
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            /**
             * STEP 4: Fetch user from database
             * 
             * decoded.id contains the user ID
             * We fetch the user to verify they still exist
             * and attach to req.user for use in controllers
             */
            req.user = await User.findById(decoded.id);
            /**
             * STEP 5: Check if user exists
             * 
             * User might have been deleted, so verify they still exist
             */
            if (!req.user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            /**
             * STEP 6: Allow request to proceed
             * 
             * next() passes control to the next middleware/controller
             * Controller now has access to req.user with user's data
             */
            next();
        } catch (error) {
            /**
             * Token verification failed
             * Could be: expired, tampered with, wrong secret, etc.
             */
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};