// =============================================================
// 🎯 Pagamento Controller — Fluxo Real com Stripe
// -------------------------------------------------------------
// checkout → cria sessão de pagamento
// webhook  → Stripe confirma pagamento e sistema confirma reserva
// =============================================================

import { Request, Response } from "express";
import Stripe from "stripe";
import Reserva from "../models/Reserva";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-10-29.clover",
});

// =============================================================
// POST /pagamento/checkout
// =============================================================
export const criarCheckout = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || "no-reqid";

  try {
    const { reservaId } = req.body;
    const usuarioId = (req as any).user?.id;

    console.log(
      `💳 [criarCheckout] id=${requestId} reserva=${reservaId} usuario=${usuarioId}`
    );

    if (!reservaId)
      return res.status(400).json({ message: "reservaId é obrigatório." });

    const reserva = await Reserva.findById(reservaId)
      .populate("servico", "nome preco")
      .populate("barbearia", "nome");

    if (!reserva)
      return res
        .status(404)
        .json({ message: "Reserva não encontrada." });

    if (String(reserva.usuario) !== usuarioId)
      return res
        .status(403)
        .json({ message: "Esta reserva não é sua." });

    if (reserva.paymentStatus === "aprovado")
      return res
        .status(400)
        .json({ message: "Pagamento já efetuado." });

    console.log(
      `➡️ [criarCheckout] id=${requestId} criando sessão Stripe...`
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${process.env.FRONTEND_URL}/pagamento-sucesso?reserva=${reserva.id}`,
      cancel_url: `${process.env.FRONTEND_URL}/pagamento-cancelado?reserva=${reserva.id}`,
      metadata: {
        reservaId: reserva.id,
        requestId, // correlacionar com webhook
      },
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: reserva.servico["nome"] },
            unit_amount: Math.round(Number(reserva.servico["preco"]) * 100),
          },
          quantity: 1,
        },
      ],
    });

    console.log(
      `⬅️ [criarCheckout] id=${requestId} sessão criada sessionId=${session.id}`
    );

    return res.json({ url: session.url });
  } catch (error: any) {
    console.error(
      `❌ [criarCheckout] id=${requestId} erro:`,
      error.message || error
    );
    return res
      .status(500)
      .json({ message: "Erro ao criar sessão de pagamento." });
  }
};

// =============================================================
// POST /pagamento/webhook
// =============================================================
export const receberWebhook = async (req: Request, res: Response) => {
  console.log("🔥 WEBHOOK RECEBIDO — RAW BODY OK");
  const signature = req.headers["stripe-signature"] as string;
  const requestId = (req as any).requestId || `webhook-${Date.now()}`;

  let evento: Stripe.Event;

  console.log(
    `🔔 [webhook] id=${requestId} recebido signature=${!!signature} bodyLen=${req.body?.length || 0
    }`
  );

  try {
    evento = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error(
      `❌ [webhook] id=${requestId} inválido:`,
      err.message
    );
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  console.log(
    `🔔 [webhook] id=${requestId} event=${evento.type}`
  );

  // =============================================================
  // 🎉 Pagamento concluído
  // =============================================================
  if (evento.type === "checkout.session.completed") {
    const session = evento.data.object as any;
    const reservaId = session.metadata?.reservaId;

    console.log(
      `🔔 [webhook] id=${requestId} checkout.session.completed reserva=${reservaId}`
    );

    const reserva = await Reserva.findById(reservaId);

    if (!reserva) {
      console.warn(
        `⚠️ [webhook] id=${requestId} reserva não encontrada`
      );
      return res.status(200).send("ok");
    }

    console.log(
      `💾 [webhook] id=${requestId} atualizando reserva status=${reserva.status} paymentStatus=${reserva.paymentStatus}`
    );

    reserva.status = "confirmado";
    reserva.paymentStatus = "aprovado";
    reserva.confirmadoEm = new Date();
    reserva.paymentId = session.payment_intent;

    await reserva.save();

    console.log(
      `🎉 [webhook] id=${requestId} reserva atualizada OK`
    );
  }

  return res.status(200).send("ok");
};
