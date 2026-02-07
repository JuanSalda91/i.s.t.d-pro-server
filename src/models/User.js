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
     * WHY SELECT FALSE: We can never want to accidentally send passwords to the frontend. Only when we specifically need it (for log in verification)
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
