
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const Reserva = require("../models/Reserva").default;
const Barbearia = require("../models/Barbearia").default;
const Servico = require("../models/Servico").default;

const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const API_URL = "http://localhost:3000/api/pagamento/webhook";
const USER_ID = "691262261dbb25744b327bc8"; // Known user

console.log("🔧 Webhook Test Script starting...");
console.log("🔑 Secret:", STRIPE_SECRET);

const run = async () => {
    try {
        // 1. Connect DB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("✅ DB Connected");

        // 2. Create Dummy Reservation
        const barbearia = await Barbearia.findOne();
        const servico = await Servico.findOne();

        if (!barbearia || !servico) throw new Error("No barbearia/servico found");

        const reserva = await Reserva.create({
            usuario: USER_ID,
            barbearia: barbearia._id,
            servico: servico._id,
            dataHora: new Date(),
            valor: 50,
            status: "pendente",
            paymentStatus: "pendente"
        });

        console.log(`📝 Created dummy reserva: ${reserva._id} `);

        // 3. Construct Payload
        const payload = {
            id: "evt_test_webhook_" + Date.now(),
            object: "event",
            type: "checkout.session.completed",
            data: {
                object: {
                    id: "cs_test_" + Date.now(),
                    object: "checkout.session",
                    payment_intent: "pi_test_" + Date.now(),
                    metadata: {
                        reservaId: reserva._id.toString()
                    }
                }
            }
        };

        const payloadString = JSON.stringify(payload);

        // 4. Generate Signature
        const stripe = new Stripe("sk_test_dummy", { apiVersion: "2025-10-29.clover" });
        const header = stripe.webhooks.generateTestHeaderString({
            payload: payloadString,
            secret: STRIPE_SECRET,
        });

        console.log("📨 Sending webhook...");

        // 5. Send Request
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Stripe-Signature": header,
                    "Content-Type": "application/json"
                },
                body: payloadString
            });

            if (res.ok) {
                console.log("✅ Webhook sent successfully (200 OK)");
            } else {
                const txt = await res.text();
                console.error("❌ Webhook failed:", res.status, txt);
            }

        } catch (err) {
            console.error("❌ Network Error:", (err as Error).message);
        }

        // 6. Verify DB
        const updated = await Reserva.findById(reserva._id);
        console.log(`🔎 Final Status: ${updated?.status} (Expected: confirmado)`);

    } catch (err) {
        console.error("❌ Script Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
