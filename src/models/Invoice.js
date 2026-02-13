const mongoose = require("mongoose");

const InvoiceItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  itemTotal: {
    type: Number,
    required: true,
  },
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
  },

  // Reference to sale
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sale",
    required: true,
  },

  // Customer info
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    default: "",
  },

  // Multiple items (snapshot from sale)
  items: {
    type: [InvoiceItemSchema],
    required: true,
  },

  // Amount calculations
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

  // Timeline
  invoiceDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    },
  },

  // Status
  status: {
    type: String,
    enum: ["draft", "sent", "paid", "overdue", "cancelled"],
    default: "draft",
  },

  // Seller
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Notes & payment
  notes: {
    type: String,
    default: "",
  },
  paymentDate: {
    type: Date,
    default: null,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "credit_card", "bank_transfer", "check", "other"],
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook
InvoiceSchema.pre("save", function() {
  if (this.items && this.items.length > 0) {
    this.taxAmount = (this.subtotal * this.taxPercentage) / 100;
    this.totalAmount = this.subtotal + this.taxAmount;
  }
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
