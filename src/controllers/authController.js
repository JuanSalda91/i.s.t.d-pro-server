//CONTROLLERS: Controllers are functions responsible for processing incoming HTTP requests, executing tha appropiate business logic, interacting with data models, and sending a response back to the client.
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');

/**
 * HELPER FUNCTION: Generate JWT Token
 * 
 * PURPOSE: Create a JWT token for authenticaed users
 * 
 * WHAT IS JWT?
 * JWT = JSON Web Token
 * A compact, self-contained token that proves user is authenticated
 * 
 * HOW IT WORKS:
 * 1. Server creared a token: jwt.sign({ id: userID}, SECRET_KEY, { expiresIn: '3h' })
 * 2. Client receives and stores token (in browser memory or localstorage)
 * 3. Client sends token with every request in Authorization header
 * 4. Server verifies token is valid and hasn't expired
 * 5. If valid, server processes the request
 * 
 * TOKEN STRUCTURE:
* header.payload.signature
* 
* EXAMPLE TOKEN:
* eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
* eyJpZCI6IjY1YTFmZDk4ZjY2ZDQ1MzIxMGNkZTEyMyIsImlhdCI6MTcwNTA0NDU2MCwi
* ZXhwIjoxNzA1NjQ5MzYwfQ.
* 8vZU7X-qY9jK4mL2nO3pQ8rS5tU6vW7xY8z9A0b1C
*/
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d', // Toekn will expire in 7 days (adjust as needed)
    });
};

/**
 * HELPER FUNCTION: Generate Refresh Token
 * 
 * PURPOSE: Create a longer-lasting token to get a new access token
 * 
 * WHY REFRESH TOKENS?
 * - Access token expires after 7 days (for security)
 * - User doesn't want to re-login every 7 days
 * - Solution: Refresh token (30 days) generates new access token
 * 
 * FLOW:
 * 1. User logs in → gets access token (7d) + refresh token (30d)
 * 2. After 7 days, access token expires
 * 3. Instead of re-logging in, use refresh token to get new access token
 * 4. This way user stays logged in for 30 days without re-entering password
 */
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '30d', // Refresh token lasts 30 days
    });
};

// ==========================================
// CONTROLLER: Register New User
// ==========================================

/**
 * ROUTE: POST /api/auth/register
 * 
 * PURPOSE: Create a new user account
 * 
 * REQUEST BODY:
 * {
 *   "name": "Juan Salda",
 *   "email": "juan@example.com",
 *   "password": "securePassword123",
 *   "role": "admin" (optional, defaults to "employee")
 * }
 * 
 * WHAT HAPPENS:
 * 1. Validate input (all fields provided)
 * 2. Check if user with that email already exists
 * 3. Hash password using bcrypt
 * 4. Save new user to database
 * 5. Generate JWT and refresh tokens
 * 6. Return tokens and user data (without password)
 * 
 * RESPONSE (Success - 201):
 * {
 *   "success": true,
 *   "token": "eyJhbGc...",
 *   "refreshToken": "eyJhbGc...",
 *   "user": {
 *     "id": "65a1fd98f66d453210cde123",
 *     "name": "Juan Salda",
 *     "email": "juan@example.com",
 *     "role": "admin"
 *   }
 * }
 */
exports.register = async (req, res) => {
    try {
        // Extract data from request body
        const { name, email, password, role } = req.body;
        // ==========================================
        // VALIDATION: Check all required fields
        // ==========================================
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password',
            });
        }
        // ==========================================
        // CHECK: Does user already exist?
        // ==========================================
        /**
         * WHY CHECK THIS?
         * Email should be unique - only one account per email
         * If user tries to register with existing email, reject it
         */
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered',
            });
        }
        // ==========================================
        // CREATE: New user
        // ==========================================
        /**
         * User.create() does:
         * 1. Creates new User document
         * 2. Runs password hashing middleware (pre save hook)
         * 3. Validates all fields
         * 4. Saves to MongoDB
         * 5. Returns the saved document (without password due to select: false)
         */
        const user = await User.create({
            name,
            email,
            password, // Will be hashed by pre-save middleware in User model
            role: role || 'employee',
        });
        // ==========================================
        // GENERATE: Tokens
        // ==========================================
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        // ==========================================
        // RESPONSE: Success
        // ==========================================
        res.status(201).json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            sucess: false,
            message: error.message,
        });
    }
};

// ==========================================
// CONTROLLER: Login User
// ==========================================

/**
 * ROUTE: POST /api/auth/login
 * 
 * PURPOSE: Authenticate user and issue JWT token
 * 
 * REQUEST BODY:
 * {
 *   "email": "juan@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * WHAT HAPPENS:
 * 1. Validate email and password provided
 * 2. Find user in database by email
 * 3. Compare provided password with stored hashed password
 * 4. If match, generate JWT tokens
 * 5. Return tokens and user data
 * 
 * ERROR CASES:
 * - Missing email or password → 400 error
 * - User not found → 401 unauthorized
 * - Password doesn't match → 401 unauthorized
 * 
 * RESPONSE (on success - 200):
 * {
 *   "success": true,
 *   "token": "eyJhbGc...",
 *   "refreshToken": "eyJhbGc...",
 *   "user": { ... }
 * }
 */
exports.login = async (req, res) => {
    try {
        const {email, password } = req.body;
        // ==========================================
        // VALIDATION
        // ==========================================
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }
        // ==========================================
        // FIND USER
        // ==========================================
        /**
         * .select('+password')
         * 
         * Why needed?
         * Remember: userSchema has password with select: false
         * This means by default, password is NOT included in queries
         * (for security - we never want to accidentally expose passwords)
         * 
         * For login, we NEED the password to compare with what user entered
         * So we explicitly ask Mongoose to include it with select('+password')
         */
        const user = await User.findOne({ email }).select('+password');
        // Check if the user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }
        // ==========================================
        // VERIFY PASSWORD
        // ==========================================
        /**
         * user.matchPassword(password)
         * 
         * This calls the method we defined in the User model
         * It uses bcrypt.compare() to safely compare:
         * - Plain text password user entered
         * - Hashed password stored in database
         * 
         * Returns true if they match, false if not
         */
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'invalid credentials',
            });
        }
        // ==========================================
        // GENERATE: Tokens
        // ==========================================
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        // ==========================================
        // RESPONSE: Success
        // ==========================================
        res.status(200).json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==========================================
// CONTROLLER: Refresh Token
// ==========================================
