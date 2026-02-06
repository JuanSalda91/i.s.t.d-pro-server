const mongoose = require("mongoose");

/** FUNCTION: ConnectDB
 * Purpose: Establish connection to MongoDB database
 *
 * How it works:
 * 1. Uses mongoose.connect() to connect to MongoDB URI from environment variables
 * 2. If successful, logs success message
 * 3. If fails, logs error and stops the application
 */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopologu: true,
    });
    console.log(" ✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error(" ❌ MongoDB Connection Error:", error.message);
    process.exit(1); // Stop the application if DB connection fails
  }
};

module.exports = connectDB;