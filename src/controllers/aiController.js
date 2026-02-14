// const { GoogleGenAI } = require('@google/genai');
const Product = require('../models/Product.js');

const { generateProductDescription } = require('../services/aiService.js');

// const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, });

/**
 * POST /api/ai/generate-description
 * Body: { productId?: string, name?: string, category?: string }
 * 
 * If productId is provided, product is loaded from DB.
 * Otherwise name/category is used from the body.
 */

exports.generateProductDescription = async (req, res) => {
    try {
        const { productId, name, category } = req.body;

        let productName = name;
        let productCategory = category;

        //if productId is prodvided, load product from DB
        if (productId) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            productName = product.name;
            productCategory = product.category;
        }

        if (!productName) {
            return res.status(400).json({ message: 'productId or name is required' });
        }

        const prompt = `
        You are a helpful copywriter for an inventory & sales system.
        
        Write a professional, concise product description for the following product.
        Focus on benefits and key features.
        
        Product name: ${productName}
        Category: ${productCategory || 'General'}
        Tone: professional, clear, friendly.
        Length: 2-4 sentences.
        `;

        // Call Gemini via Google Gen AI SDK
        // const response = await client.models.generateContent({
        //   model: 'gemini-2.0-flash',
        //   contents: [
        //     {
        //       role: 'user',
        //       parts: [{ text: prompt }],
        //     },
        //   ],
        // });
        
        // const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';        

        // Call AI service (currently mocked)
        const text = await generateProductDescription(prompt);


        // if productId is provided, save description back to DB
        let updatedProduct = null;
        if (productId) {
            updatedProduct = await Product.findByIdAndUpdate(
                productId,
                { description: text },
                { new: true },
            );
        }

        res.status(200).json({
            message: 'Description generated successfully',
            description: text,
            product: updatedProduct,
        });
    } catch (error) {
        console.error('Error generating product description:', error);
        //handle common Gemini errors
        // if (error.response && error.response.status) {
        //     return res.status(error.response.status).json({
        //         message: 'Gemini API error',
        //         error: error.message,
        //     });
        // }
        res.status(500).json({
            message: 'Error generating product description',
            error: error.message,
        });
    }
};