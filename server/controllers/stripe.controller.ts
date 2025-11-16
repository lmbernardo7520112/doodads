// =============================================================
// 💳 server/controllers/stripe.controller.ts
// -------------------------------------------------------------
// Webhook Stripe → confirma reserva real
// =============================================================

import { Request, Response } from "express";
import Stripe from "stripe";
import Reserva from "../models/Reserva";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

// =============================================================
// POST /webhooks/stripe
// =============================================================
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Assinatura Stripe inválida:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object as any;

  switch (event.type) {
    case "payment_intent.succeeded": {
      const reservaId = data.metadata?.reservaId;
      if (!reservaId) break;

      const reserva = await Reserva.findById(reservaId);
      if (reserva) {
        reserva.paymentStatus = "aprovado";
        reserva.status = "confirmado";
        reserva.confirmadoEm = new Date();
        reserva.paymentId = data.id;
        await reserva.save();
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const reservaId = data.metadata?.reservaId;
      if (!reservaId) break;

      const reserva = await Reserva.findById(reservaId);
      if (reserva) {
        reserva.paymentStatus = "falhou";
        await reserva.save();
      }
      break;
    }
  }

  return res.json({ received: true });
};
