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
        const { saleId, taxPercentage = 0, notes = '' } = req.body;

        if (!saleId) {
            return res.status(400).json({ message: 'Sale ID is required' });
        }
        const sale = await Sale.findById(saleId)
        .populate('productId')
        .populate('sellerId', 'email name');

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found'});
        }

        if (sale.sellerId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to create invoice for this sale' });
        }

        const invoiceNumber = await generateInvoiceNumber();

        const newInvoice = new Invoice({
            invoiceNumber,
            saleId,
            customerName: sale.customerName,
            customerEmail: sale.customerEmail,
            customerPhone: sale.customerPhone,
            productName: sale.productId.name,
            quantiyt: sale.quantity,
            unitPrice: sale.unitPrice,
            subTotal: sale.subTotal,
            taxPercentage,
            notes,
            sellerId: sale.sellerId._id,
            status: 'draft',
        });

        const savedInvoice = await newInvoice.save();

        await savedInvoice.populate('saleId');
        await savedInvoice.populate('sellerId', 'email name');

        res.status(201).json({
            message: 'invoice created successfully',
            invoice: savedInvoice
        });
    } catch (error) {
        console.error('Error in creatinginvoice:', error);
        res.status(500).json({ message: 'Error creating invoice', error: error.message});
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