import mongoose from "mongoose";
import BookingPayment from "../models/BookingPayment";
import BookingPolicy from "../models/BookingPolicy";
import TermsVersion from "../models/TermsVersion";
import TermsAcceptance from "../models/TermsAcceptance";
import BarbeariaPaymentConfig from "../models/BarbeariaPaymentConfig";

describe("Pix Booking Domain Models (Mongoose)", () => {
  const dummyObjectId1 = new mongoose.Types.ObjectId();
  const dummyObjectId2 = new mongoose.Types.ObjectId();
  const dummyObjectId3 = new mongoose.Types.ObjectId();

  describe("BookingPayment", () => {
    it("aceita payload mínimo válido", () => {
      const payment = new BookingPayment({
        reservaId: dummyObjectId1,
        barbeariaId: dummyObjectId2,
        provider: "manual",
        amountCents: 5000,
      });
      const err = payment.validateSync();
      expect(err).toBeUndefined();
      expect(payment.currency).toBe("BRL");
      expect(payment.status).toBe("pending");
    });

    it("rejeita status fora do enum", () => {
      const payment = new BookingPayment({
        reservaId: dummyObjectId1,
        barbeariaId: dummyObjectId2,
        provider: "manual",
        amountCents: 5000,
        status: "invalid_status",
      });
      const err = payment.validateSync();
      expect(err?.errors["status"]).toBeDefined();
    });

    it("rejeita amountCents negativo ou zero", () => {
      const payment = new BookingPayment({
        reservaId: dummyObjectId1,
        barbeariaId: dummyObjectId2,
        provider: "manual",
        amountCents: 0,
      });
      const err = payment.validateSync();
      expect(err?.errors["amountCents"]).toBeDefined();
    });

    it("exige currency BRL no MVP", () => {
      const payment = new BookingPayment({
        reservaId: dummyObjectId1,
        barbeariaId: dummyObjectId2,
        provider: "manual",
        amountCents: 1000,
        currency: "USD",
      });
      const err = payment.validateSync();
      expect(err?.errors["currency"]).toBeDefined();
    });

    it("não expõe chaves secretas", () => {
      const payment = new BookingPayment();
      expect(payment.schema.path("secret_key")).toBeUndefined();
    });
  });

  describe("BookingPolicy", () => {
    it("aceita policy válida", () => {
      const policy = new BookingPolicy({
        barbeariaId: dummyObjectId1,
        policyVersion: "1.0",
        activeFrom: new Date(),
      });
      const err = policy.validateSync();
      expect(err).toBeUndefined();
      expect(policy.refundPolicy).toBe("no_refund_after_window");
      expect(policy.noShowPolicy).toBe("mark_no_show_after_tolerance");
    });

    it("rejeita refundPolicy fora do enum", () => {
      const policy = new BookingPolicy({
        barbeariaId: dummyObjectId1,
        policyVersion: "1.0",
        activeFrom: new Date(),
        refundPolicy: "invalid",
      });
      const err = policy.validateSync();
      expect(err?.errors["refundPolicy"]).toBeDefined();
    });

    it("rejeita arrivalToleranceMinutes negativo", () => {
      const policy = new BookingPolicy({
        barbeariaId: dummyObjectId1,
        policyVersion: "1.0",
        activeFrom: new Date(),
        arrivalToleranceMinutes: -5,
      });
      const err = policy.validateSync();
      expect(err?.errors["arrivalToleranceMinutes"]).toBeDefined();
    });
  });

  describe("TermsVersion", () => {
    it("aceita versão válida", () => {
      const version = new TermsVersion({
        type: "booking_payment_terms",
        version: "1.0",
        title: "Termos",
        content: "Texto",
        contentHash: "hash",
        effectiveFrom: new Date(),
      });
      const err = version.validateSync();
      expect(err).toBeUndefined();
    });

    it("rejeita type inválido", () => {
      const version = new TermsVersion({
        type: "invalid_type",
        version: "1.0",
        title: "Termos",
        content: "Texto",
        contentHash: "hash",
        effectiveFrom: new Date(),
      });
      const err = version.validateSync();
      expect(err?.errors["type"]).toBeDefined();
    });
  });

  describe("TermsAcceptance", () => {
    it("aceita snapshot válido", () => {
      const acceptance = new TermsAcceptance({
        reservaId: dummyObjectId1,
        barbeariaId: dummyObjectId2,
        termsVersionId: dummyObjectId3,
        acceptedAt: new Date(),
        checkboxLabelSnapshot: "Li e aceito",
        acceptanceTextSnapshot: "Termos aceitos pelo cliente",
        serviceSnapshot: {
          servicoNome: "Corte",
          priceCents: 5000,
          scheduledAt: new Date(),
        },
        source: "web",
      });
      const err = acceptance.validateSync();
      expect(err).toBeUndefined();
    });

    it("exige termsVersionId", () => {
      const acceptance = new TermsAcceptance({
        reservaId: dummyObjectId1,
        barbeariaId: dummyObjectId2,
        acceptedAt: new Date(),
        checkboxLabelSnapshot: "Li e aceito",
        acceptanceTextSnapshot: "Termos aceitos pelo cliente",
        serviceSnapshot: {
          servicoNome: "Corte",
          priceCents: 5000,
          scheduledAt: new Date(),
        },
        source: "web",
      });
      const err = acceptance.validateSync();
      expect(err?.errors["termsVersionId"]).toBeDefined();
    });
  });

  describe("BarbeariaPaymentConfig", () => {
    it("aceita manual_pix", () => {
      const config = new BarbeariaPaymentConfig({
        barbeariaId: dummyObjectId1,
        paymentMode: "manual_pix",
        provider: "manual",
      });
      const err = config.validateSync();
      expect(err).toBeUndefined();
    });

    it("aceita pix_provider", () => {
      const config = new BarbeariaPaymentConfig({
        barbeariaId: dummyObjectId1,
        paymentMode: "pix_provider",
        provider: "asaas",
      });
      const err = config.validateSync();
      expect(err).toBeUndefined();
    });

    it("rejeita provider inválido", () => {
      const config = new BarbeariaPaymentConfig({
        barbeariaId: dummyObjectId1,
        paymentMode: "pix_provider",
        provider: "invalid_psp",
      });
      const err = config.validateSync();
      expect(err?.errors["provider"]).toBeDefined();
    });
    
    it("não expõe texto claro de chaves sensíveis em campos óbvios", () => {
      const config = new BarbeariaPaymentConfig();
      expect(config.schema.path("secretKey")).toBeUndefined();
      expect(config.schema.path("pixKeyCompleta")).toBeUndefined();
    });
  });
});
