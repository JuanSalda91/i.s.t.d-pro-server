const mongoose = require('mongoose');

/** Invoice Model
 * 
 * What: Represents a formal invoice generated from a sale
 * Why: Tracks billing, payment status, and procide invoice history
 * 
 * Auto-generates invoice numbers in format: INV-YYY-XXX
 * Example: INV-2026-0001, INV-2026-0002, etc.
 */

const InvoiceSchema = new mongoose.Schema({
    // invoice number (auto-generated, unique)
    invoiceNumber: {
        type: String,
        unique: true,
        required: true,
        // format: INV-2026-0001
    },
    // Reference to sale document
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: [true, 'Sale reference is required'],
    },
    //Customer information
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
    },
    customerPhone: {
        type: String,
        default: '',
    },
    //Product details (snapshot at invoice time)
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    // Amount calculations
    subTotal: {
        type: Number,
        required: true,
        min: 0,
    },
    taxPercentage: {
        type: Number,
        default: 0, //Default 0% tax (can be 5%, 10%, etc.)
        min: 0,
        max: 100,
    },
    taxAmount: {
        type: Number,
        default: 0,
    },
    totalAmount: {
        type: Number,
        default: 0,
    },
    // invoice timeline
    invoiceDate: {
        type: Date,
        default: Date.now,
    },
    dueDate: {
        type: Date,
        default: () => {
            //default: 30 days from invoice Date
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date;
        }
    },
    // invoice status
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft',
    },
    // seller/company information
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Seller is required'],
    },
    // additional notes
    notes: {
        type: String,
        default: '',
    },
    //payment tracking
    paymentDate: {
        type: Date,
        default: null,
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'other'],
        default: null,
    },
    //timestamp
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

