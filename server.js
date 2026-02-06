const app = require('./src/app.js');
const connectDB = require ('./src/config/database.js');

/**
 * APPLICATION STARTUP SEQUENCE
 * 
 * This file is the entry point of the entire backend.
 * It:
 * 1. Connects to MongoDB
 * 2. Starts the Express server
 * 3. Listens for incoming request
 */

const PORT = process.env.PORT || 5000;

/**
 * Step 1: Connect to database
 * This MUST happen before starting the server
 * because our routes need access to the database
 */
connectDB();

/**
 * STEP 2: Start the Server
 * 
 * app.listen() starts the Express server on the specified PORT
 * Once started, it continuously listens for incoming HTTP requests
 */
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ SERVER STARTED SUCCESSFULLY`);
    console.log(`🚀 Backend running on: http://localhost:${PORT}`);
    console.log(`✅ API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`${'='.repeat(50)}\n`)
});
