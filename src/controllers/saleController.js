const Sale = require('../models/Sale.js');
const Product = require('../models/Product.js');

//create a new Sale
exports.createSale = async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, productId, quantity, unitPrice } = req.body;
        //validate required fields
        if (!customerName || !customerEmail || !productId || !quantity || !unitPrice) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        //check if product exists and has enough stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ message: 'Product not found' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: `Not enough stock. Available: ${product.stock}` });
        }
        //create sale object
        const newSale = new Sale ({
            customerName,
            customerEmail,
            customerPhone,
            productId,
            quantity,
            unitPrice,
            sellerId: req.user._id, //get seller from authenticated user
            status: 'pending',
        });
        // save to database (totalAmount calculated by pre-save hook)
        const savedSale = await newSale.save();
        // populate product and seller details before returning
        await savedSale.populate('productId');
        await savedSale.populate('sellerId', 'enamil name'); // only get seller's email and name
        res.status(201).json({
            message: 'Sale created successfully',
            sale: savedSale,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating sale', error: error.message });
    }
};

