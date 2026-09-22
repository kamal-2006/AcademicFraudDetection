const mongoose = require("mongoose");
const seedDemoAccounts = require("../utils/seedDemoAccounts");

const LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/academic_fraud";

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || LOCAL_MONGO_URI;
  try {
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 4000 });
    console.log("MongoDB connected successfully to primary URI");
    await seedDemoAccounts();
  } catch (err) {
    
    console.warn(`Primary MongoDB connection failed: ${err.message}`);
    console.log("Attempting connection to local MongoDB fallback...");
    try {
      await mongoose.connect(LOCAL_MONGO_URI, { serverSelectionTimeoutMS: 4000 });
      console.log("MongoDB connected successfully to local MongoDB");
      await seedDemoAccounts();
    } catch (fallbackErr) {
      console.error("Fatal: Local MongoDB fallback also failed:", fallbackErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;


