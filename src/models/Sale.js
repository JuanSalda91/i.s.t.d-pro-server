const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
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
    min: 0,
  },
  itemTotal: {
    type: Number,
    default: 0,
  },
});

const SaleSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    match: [/.+\@.+\..+/, "Please enter a valid email"],
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  //array of items
  items: {
    type: [SaleItemSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: "A sale must have at least one item"
    },
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  taxPercentage: {
    type: Number,
    default: 0,
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

  // Seller reference
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Status
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook: Calculate all totals
SaleSchema.pre("save", function() {
  // Step 1: Calculate itemTotal for each item
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      item.itemTotal = item.quantity * item.unitPrice;
    });

    // Step 2: Calculate subtotal (sum of all itemTotals)
    this.subtotal = this.items.reduce((sum, item) => sum + item.itemTotal, 0);

    // Step 3: Calculate tax
    this.taxAmount = (this.subtotal * this.taxPercentage) / 100;

    // Step 4: Calculate total
    this.totalAmount = this.subtotal + this.taxAmount;
  }
});

module.exports = mongoose.model("Sale", SaleSchema);
