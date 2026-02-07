const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * USER SCHEMA
 * This defines the structure of the User document in MongoDB
 * Every user in our system will have these fields
 */
const userSchema = new mongoose.Schema({
    /**
     * NAME FIELD:
     * WHAT: User's full name
     * REQUIRED: Yes- every user must have a name
     * TYPE: String
     */
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true, //Remove whitespace from beginning/end
    },
    /**
     * EMAIL FIELD:
     * WHAT: User's email address
     * REQUIRED: Yes
     * UNIQUE: Yes - no two users can have the same email
     * VALIDATION: Must be a valid email format
     * WHY LOWERCASE: Males email searches case-insensitive (e.g. "John@Email.com" and "john@email.com" are treated the same)
     * MATCH: Regular expression to validate email format
     */
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    /**
     * PASSWORD FIELD:
     * WHAT: User's password (will be hashed before saving)
     * REQUIRED: Yes
     * MINLENGTH: 6 characters for basic security
     * SELECT: false - important! This means password is NOT returned by default when we query users (for security reasons)
     * WHY SELECT FALSE: We never want to accidentally send passwords to the frontend, only when we specifically need it (for loign verification)
     */
    password: {
        type: String,
        required: [true, 'Please proovide a password'],
        minlength: 6,
        select: false, // Don't include password in query results by default
    },
    /**
     * ROLE FIELD:
     * WHAT: User's permission level
     * VALUES: 'admin' or 'employee'
     * DEFAULT: 'employee' (regular users are employees by default)
     * 
     * HOW IT'S USED:
     * - Admin can: Create/edit/delete products, see all reports, manage users
     * - Employee: can: Create sales, view their own sales, see basic reports
     */
    role: {
        type: String,
        enum: ['admin', 'employee'],
        default: 'employee',
    },
    /**
     * CREATED AT & UPDATED AT
     * Automatically managed by mongoose
     * Created At: Set when document is first created
     * Updated At: Updated whenever document is modified
     */
},
    { timestamps: true }
);

// ==========================================
// MIDDLEWARE: Hash Password Before Saving
// ==========================================

/**
 * THIS RUNS: Before any save operation on the User model
 * 
 * PURPOSE: Convert plain text password to hashed password
 * 
 * WHY THIS IS CRITICAL:
 * ❌ WRONG: Store "password123" in database
 *           If database is hacked, all passwords are compromised
 * 
 * ✅ RIGHT: Store hashed version like "$2a$10$..." 
 *           If database is hacked, passwords are useless
 *           (hashing is one-way: can't reverse it back)
 * 
 * HOW BCRYPT WORKS:
 * 1. Takes plain text password: "myPassword123"
 * 2. Creates a hash: "$2a$10$n9ibQQMUc33blF3skV..."
 * 3. When user logs in, we hash their input and compare with stored hash
 * 4. Even if hacker has the hash, they can't reverse it
 */
userSchema.pre('save', async function (next) { // next is a callback to move to the next middleware or save operation
    // Only hash password if it's being modified (not on every save)
    if (!this.isModified('password')) { // the "this" keyword refers to the user document being saved
        return next();
    }
    try {
        /**
         * bcrypt.genSalt(10)
         * Creates a "salt" with 10 rounds of hashingHigher number = more secure but slower
         * 10 is industry standard
         */
        const salt = await bcrypt.genSalt(10);
        
        /**
         * bcrypt.hash()
         * Hashes the password with the salt
         * Stores the hashed version in "this.password"
         */
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ==========================================
// METHOD: Compare Password for Login
// ==========================================

/**
 * FUNCTION: matchPassword
 * PURPOSE: Compare plain text password with hashed password
 * WHEN USED: During login verification
 * HOW:
 * 1. User enters: "myPassword123"
 * 2. We hash it with bcrypt
 * 3. Compare hashed version with what's stored in DB
 * 4. If they match, password is correct
 * RETURNS: true if password matches, false if not
 * SECURITY: bcrypt.compare() is safe against timing attackas
 * (it takes the same time wheter password is right or worng,
 * so hackers can't use timing to guess passwords)
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);