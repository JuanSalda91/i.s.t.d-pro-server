const Invoice = require('../models/Invoice.js');
const Sale = require('../models/Sale.js');
const Product = require('../models/Product.js');

/**
 * Helper Function:
 * 
 * Format: INV-YYYY-XXXX
 * Example: INV-2026-0001, INV-2026-0002
 */

const generateInvoiceNumber = async () => {
    try {
        const currentYear = new Date().getFullYear();

        const lastInvoice = await Invoice.findOne({
            invoiceNumber: new RegExp(`INV-${currentYear}`)
        }).sort({ invoiceNumber: -1 });

        let count = 0;
        if (lastInvoice) {
            const matches = lastInvoice.invoiceNumber.match(/INV-\d+-(d+)/);
            if (matches) {
                count = parseInt(matches[1]);
            }
        }

        count++;
        const paddedCount = String(count).padStart(4, '0');
        return `INV-${currentYear}-${paddedCount}`;
    } catch (error) {
        throw new error('Error generating invoice number');
    }
};

// CREATE INVOICE FROM SALE
exports.createInvoice = async (req, res) => {
    try {
      const { saleId, taxPercentage = 0, notes = "" } = req.body;
  
      if (!saleId) {
        return res.status(400).json({ message: "Sale ID is required" });
      }
  
      const sale = await Sale.findById(saleId)
        .populate("items.productId", "name")
        .populate("sellerId", "email name");
  
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
  
      if (sale.sellerId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
  
      const invoiceNumber = await generateInvoiceNumber();
  
      // Create items array for invoice (snapshot from sale)
      const invoiceItems = sale.items.map(item => ({
        productName: item.productId.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemTotal: item.itemTotal,
      }));
  
      const newInvoice = new Invoice({
        invoiceNumber,
        saleId,
        customerName: sale.customerName,
        customerEmail: sale.customerEmail,
        customerPhone: sale.customerPhone,
        items: invoiceItems, // Array
        subtotal: sale.subtotal,
        taxPercentage: taxPercentage || sale.taxPercentage,
        notes,
        sellerId: sale.sellerId._id,
        status: "draft",
      });
  
      const savedInvoice = await newInvoice.save();
      await savedInvoice.populate("saleId");
      await savedInvoice.populate("sellerId", "email name");
  
      res.status(201).json({
        message: "Invoice created successfully",
        invoice: savedInvoice,
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Error creating invoice", error: error.message });
    }
  };

//GET ALL INVOICE
exports.getInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sellerId } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (sellerId) filter.sellerId = sellerId;

        if (req.user.role !== 'admin') {
            filter.sellerId = req.user._id;
        }

        const total = await Invoice.countDocuments(filter);

        const invoices = await Invoice.find(filter)
        .populate('saleId', 'customerName customerEmail quantity totalAmount')
        .populate('sellerId', 'name email')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ invoice: -1 });

        res.status(200).json({
            invoices,
            pagination: {
                totalinvoices: total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getInvoices', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
};

//GET SINGLE INVOICE BY ID
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
        .populate('saleId')
        .populate('sellerId', 'name email');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found'});
        }

        if (req.user.role !== 'admin' && invoice.sellerId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this invoice'});
        }

        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error in getInvoiceById');
        res.status(500).json({ message: 'Error fetching invoice', error: error.message});
    }
};

// UPDATE INVOICE STATUS
exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { status, paymentDate, paymentMethod, notes } = req.body;

        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found'});
        }

        if (invoice.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorizrd to update this invoice'});
        }

        if (status) {
            invoice.status = status;

            if (status === 'paid') {
                invoice.paymentDate = paymentDate || new Date();
                if (paymentMethod) {
                    invoice.paymentMethod = paymentMethod;
                }
            }
        }

        if (notes) {
            invoice.notes = notes;
        }

        const updatedInvoice = await invoice.save();

        await updatedInvoice.populate('saleId');
        await updatedInvoice.populate('sellerId', 'name email');

        res.status(200).json({ message: 'Invoice updated successfully'});
    } catch (error) {
        console.error('Error in updateInvoiceStatus:', error);
        res.status(500).json({ message: 'Error updating invoice', error: error.message});
    }
};

// DELETE INVOICE
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found'});
        }

        if (invoice.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this invoice' });
        }

        if (invoice.status !== 'draft') {
            return res.status(400).json({ message: 'Can only delete draft invoices. Cancel instead for sent/paid invoices'});
        }

        await Invoice.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Invoice deleted successfully'});
    } catch (error) {
        console.error('Error in deleteInvoice:', error);
        res.status(500).json({ message: 'Error deleting invoice', error: error.message});
    }
};

//GET INVOICE STATISTICS
exports.getInvoiceStats = async (req, res) => {
    try {
        const totalInvoices = await Invoice.countDocuments();

        const paidStats = await Invoice.aggregate([
            { $match: {status: 'paid '} },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: $totalAmount },
                    paidCount: { $sum: 1 }
                }
            }
        ]);

        const unpaidStats = await Invoice.aggregate([
            { $match: { status: { $in: ['draft', 'sent', 'overdue'] } } },
            {
                $group: {
                    _id: null,
                    pendingAmount: { $sum: '$totalAmount' },
                    unpaidCount: { $sum: 1 }
                }
            }
        ]);

        const avgStats = await Invoice.aggregate([
            {
                $group: {
                    _id: null,
                    averageAmount: { $avg: '$totalAmount' }
                }
            }
        ]);

        const paid = paidStats.length > 0 ? paidStats[0] : { totalRevenuw: 0, paidCount: 0 };
        const unpaid = unpaidStats.length > 0 ? unpaidStats[0] : { pendingAmount: 0, unpaidCount };
        const avg = avgStats.length > 0? avgStats[0].averageAmount: 0;

        res.status(200).json({
            stats: {
                totalInvoices,
                totalRevenue: Math.round(paid.totalRevenue * 100) / 100,
                paidInvoices: paid.paidCount,
                unpaidInvoices: unpaid.unpaidCount,
                pendingAmount: Math.round(unpaid.pendingAmount * 100) / 100,
                averageInvoiceAmount: Math.round(avg * 100) / 100
            }
        });
    } catch (error) {
        console.error('Error in getInvoicesStats', error)
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
};

/**GET INVOICES BY STATUS
 * What: Retrieve invoices filtered by specific status
 * Statuses: draft, sent, paid, overdue, cancelled
 */
exports.getInvoicesByStatus = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        //validate status
        const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: `invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        
        //build filter
        const filter = { status };

        // if not admin only show invoices
        if (req.user.role !== 'admin') {
            filter.sellerId = req.user._id;
        }

        //count Total
        const total = await Invoice.countDocuments(filter);

        //fetch invoices
        const invoices = await Invoice.find(filter)
        .populate('sellerId', 'customerName totalAmount')
        .populate('sellerId', 'name email')
        .limit(limit * 10)
        .skip((page - 1) * limit)
        .sort({ invoiceDate: -1 });

        res.status(200).json({
            invoices,
            pagination: {
                totalInvoices: total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                status
            }
        });
    } catch (error) {
        console.error('Error in getInvoicesByStatus:', error);
        res.status(500).json({ message: 'Error fetching invoices by status', error: error.message });
    }
};

// (if needed) Export all functions
//module.exports = exports;