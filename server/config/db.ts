import mongoose from "mongoose";

export const connectToMongo = async (): Promise<void> => {
  try {
    const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/aparatu_db";
    await mongoose.connect(uri);
    console.log("✅ Connected to central MongoDB instance");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};