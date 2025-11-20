
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Reserva from "../models/Reserva";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const RESERVA_ID = "691f88c30f347ec82828df90";

console.log("🔧 Script starting...");
console.log("🔑 DATABASE_URL present:", !!process.env.DATABASE_URL);

const run = async () => {
    try {
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect(process.env.DATABASE_URL as string, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ Connected to MongoDB");

        const reserva = await Reserva.findById(RESERVA_ID);
        if (!reserva) {
            console.error("❌ Reserva not found");
            process.exit(1);
        }

        console.log(`🔎 Found reserva: ${reserva.id} status=${reserva.status}`);

        reserva.status = "confirmado";
        reserva.paymentStatus = "aprovado";
        reserva.confirmadoEm = new Date();

        await reserva.save();

        console.log("🎉 Reserva updated to CONFIRMADO manually.");
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        console.log("👋 Disconnecting...");
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
