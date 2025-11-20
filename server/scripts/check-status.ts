import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Reserva from "../models/Reserva";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const RESERVA_ID = "6919eac0ca8c11abcd49cef1";

console.log("🔧 Check Script starting...");
console.log("🔑 DATABASE_URL:", process.env.DATABASE_URL);

const run = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL as string);
        console.log("✅ Connected to MongoDB");

        const reserva = await Reserva.findById(RESERVA_ID);
        if (!reserva) {
            console.log("❌ Reserva not found");
        } else {
            console.log(`🔎 Reserva: ${reserva.id}`);
            console.log(`   Status: ${reserva.status}`);
            console.log(`   PaymentStatus: ${reserva.paymentStatus}`);
            console.log(`   ConfirmadoEm: ${reserva.confirmadoEm}`);
        }
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
