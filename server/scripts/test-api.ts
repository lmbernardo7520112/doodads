
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const RESERVA_ID = "6919eac0ca8c11abcd49cef1";
const USER_ID = "691262261dbb25744b327bc8"; // From logs

console.log("🔧 API Test Script starting...");

const run = async () => {
    try {
        // 1. Generate Token
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET missing");

        const token = jwt.sign({ id: USER_ID, tipo: "cliente" }, secret, { expiresIn: "1h" });
        console.log("🔑 Token generated");

        // 2. Call API
        const url = `http://localhost:3000/api/reservas/minhas`;
        console.log(`🌍 GET ${url}`);

        try {
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("📦 API Response Status:", res.status);

            if (res.ok) {
                const data = await res.json() as any[];
                const target = data.find((r: any) => r._id === RESERVA_ID);

                if (target) {
                    console.log("📦 Found Target in List:", {
                        id: target._id,
                        status: target.status,
                        paymentStatus: target.paymentStatus
                    });
                } else {
                    console.log("❌ Target NOT found in list");
                }
            } else {
                const txt = await res.text();
                console.error("❌ API Error:", txt);
            }

        } catch (apiErr: any) {
            console.error("❌ Network Error:", apiErr.message);
        }

    } catch (err) {
        console.error("❌ Script Error:", err);
    } finally {
        process.exit(0);
    }
};

run();
