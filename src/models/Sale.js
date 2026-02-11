const mongoose = require('mongoose');

// Sales Schema - Tracks all sales transactions
const SaleSchema = new mongoose.Schema({
    //customer info
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
        trim: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address'],
    },
    customerPhone: {
        type: String,
        trim: true,
    },
    //product reference
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required'],
    },
    //sales quantity
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1,'Quantity must be at least 1'],
    },
    //pricing info
    unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: [0, 'Price cannot be negative'],
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    // seller reference
    sellerid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Seller is required'],
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending',
    },
    //timestamp tracking (auto generated)
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Pre-save hook: Calculate total amount = unitprice * quantity
SaleSchema.pre('save', function(next) {
    // only calculate if quantity or price changed
    if (this.isModified('quantity') || this.isModified('unitPrice')) {
        this.totalAmount = this.quantity * this.unitPrice;
    }
    next();
});

module.exports = mongoose.model('Sale', SaleSchema);