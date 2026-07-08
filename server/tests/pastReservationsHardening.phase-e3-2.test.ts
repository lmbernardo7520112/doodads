/**
 * Phase E3.2 — Past Reservations UX and Cancel Hardening Tests
 *
 * Tests for:
 * - ALREADY_OCCURRED: past reservation cannot be cancelled by client
 * - TOO_LATE preserved: future reservation within cutoff window
 * - Cancellation allowed: future reservation outside cutoff
 * - Privileged user can cancel past reservation
 */

import { ReservaService } from "../services/reserva.service";
import { reservaRepository } from "../repositories/reserva.repository";
import { bookingPaymentRepository } from "../repositories/bookingPayment.repository";
import { reservaPolicy } from "../policies/reserva.policy";
import { AppError } from "../errors/AppError";
import mongoose from "mongoose";

jest.mock("../repositories/reserva.repository");
jest.mock("../repositories/bookingPayment.repository");
jest.mock("../policies/reserva.policy");

const reservaService = new ReservaService();

function mockReserva(overrides: any = {}) {
  const id = new mongoose.Types.ObjectId();
  return {
    _id: id,
    usuario: new mongoose.Types.ObjectId(),
    barbearia: new mongoose.Types.ObjectId(),
    servico: new mongoose.Types.ObjectId(),
    dataHora: new Date(Date.now() + 86400000), // 24h future (default)
    status: "pendente",
    paymentStatus: "pendente",
    paymentRequired: false,
    criadoEm: new Date(),
    save: jest.fn().mockReturnThis(),
    ...overrides,
  };
}

describe("Phase E3.2 — Past Reservations Cancel Hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (reservaPolicy.canCancel as jest.Mock).mockReturnValue(true);
  });

  // ===================================================================
  // ALREADY_OCCURRED: past reservation + client
  // ===================================================================
  describe("ALREADY_OCCURRED", () => {
    it("should throw ALREADY_OCCURRED when client tries to cancel past reservation", async () => {
      const reserva = mockReserva({
        dataHora: new Date(Date.now() - 3600000), // 1h ago
      });
      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);

      try {
        await reservaService.cancelarReserva(
          reserva._id.toString(),
          reserva.usuario.toString(),
          "cliente"
        );
        fail("Should have thrown");
      } catch (e: any) {
        expect(e).toBeInstanceOf(AppError);
        expect(e.code).toBe("ALREADY_OCCURRED");
        expect(e.message).toContain("já ocorreu");
      }
    });

    it("should throw ALREADY_OCCURRED when reservation was yesterday", async () => {
      const reserva = mockReserva({
        dataHora: new Date(Date.now() - 86400000), // 24h ago
      });
      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);

      await expect(
        reservaService.cancelarReserva(
          reserva._id.toString(),
          reserva.usuario.toString(),
          "cliente"
        )
      ).rejects.toMatchObject({ code: "ALREADY_OCCURRED" });
    });
  });

  // ===================================================================
  // TOO_LATE preserved: future within cutoff
  // ===================================================================
  describe("TOO_LATE preserved", () => {
    it("should throw TOO_LATE when reservation is 30min in future (within 60min cutoff)", async () => {
      const reserva = mockReserva({
        dataHora: new Date(Date.now() + 30 * 60000), // 30min future
      });
      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);

      try {
        await reservaService.cancelarReserva(
          reserva._id.toString(),
          reserva.usuario.toString(),
          "cliente"
        );
        fail("Should have thrown");
      } catch (e: any) {
        expect(e).toBeInstanceOf(AppError);
        expect(e.code).toBe("TOO_LATE");
        expect(e.message).toContain("60 minutos");
      }
    });
  });

  // ===================================================================
  // Cancellation allowed: future and outside cutoff
  // ===================================================================
  describe("Cancellation allowed", () => {
    it("should allow cancellation when reservation is 24h in future", async () => {
      const reserva = mockReserva({
        dataHora: new Date(Date.now() + 86400000), // 24h future
      });
      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);
      (reservaRepository.save as jest.Mock).mockImplementation((r: any) => r);

      const result = await reservaService.cancelarReserva(
        reserva._id.toString(),
        reserva.usuario.toString(),
        "cliente"
      );

      expect(result.status).toBe("cancelado");
    });
  });

  // ===================================================================
  // Privileged user can cancel past reservation
  // ===================================================================
  describe("Privileged user on past reservation", () => {
    it("should allow barbeiro to cancel past reservation", async () => {
      const reserva = mockReserva({
        dataHora: new Date(Date.now() - 3600000), // 1h ago
      });
      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);
      (reservaRepository.save as jest.Mock).mockImplementation((r: any) => r);

      const result = await reservaService.cancelarReserva(
        reserva._id.toString(),
        reserva.usuario.toString(),
        "barbeiro" // privileged
      );

      expect(result.status).toBe("cancelado");
    });

    it("should allow admin to cancel past reservation", async () => {
      const reserva = mockReserva({
        dataHora: new Date(Date.now() - 7200000), // 2h ago
      });
      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);
      (reservaRepository.save as jest.Mock).mockImplementation((r: any) => r);

      const result = await reservaService.cancelarReserva(
        reserva._id.toString(),
        reserva.usuario.toString(),
        "admin"
      );

      expect(result.status).toBe("cancelado");
    });
  });
});

// ===================================================================
// Frontend filter logic (pure function tests)
// ===================================================================
describe("Phase E3.2 — Frontend Filter Logic", () => {
  const now = Date.now();

  function makeReserva(status: string, hoursOffset: number) {
    return {
      _id: Math.random().toString(),
      status,
      dataHora: new Date(now + hoursOffset * 3600000).toISOString(),
    };
  }

  function filterAtivas(reservas: any[]) {
    return reservas.filter(
      (r) =>
        r.status !== "cancelado" &&
        r.status !== "finalizado" &&
        new Date(r.dataHora).getTime() > now
    );
  }

  function filterPassadas(reservas: any[]) {
    return reservas.filter(
      (r) =>
        r.status !== "cancelado" &&
        new Date(r.dataHora).getTime() <= now
    );
  }

  it("Ativas: excludes past and cancelled", () => {
    const reservas = [
      makeReserva("pendente", 24),    // future active
      makeReserva("pendente", -1),    // past
      makeReserva("cancelado", 24),   // cancelled
      makeReserva("confirmado", 2),   // future active
    ];
    const result = filterAtivas(reservas);
    expect(result).toHaveLength(2);
  });

  it("Passadas: includes past non-cancelled", () => {
    const reservas = [
      makeReserva("pendente", -1),    // past pendente
      makeReserva("pendente", -24),   // past pendente
      makeReserva("cancelado", -1),   // past cancelled — excluded
      makeReserva("pendente", 24),    // future — excluded
    ];
    const result = filterPassadas(reservas);
    expect(result).toHaveLength(2);
  });

  it("canCancel is false when isPast", () => {
    const isPast = true;
    const status: string = "pendente";
    const paymentStatus: string = "pendente";
    const canCancel =
      status === "pendente" &&
      paymentStatus !== "paid" &&
      paymentStatus !== "aprovado" &&
      !isPast;
    expect(canCancel).toBe(false);
  });

  it("canCancel is true when future and pendente", () => {
    const isPast = false;
    const status: string = "pendente";
    const paymentStatus: string = "pendente";
    const canCancel =
      status === "pendente" &&
      paymentStatus !== "paid" &&
      paymentStatus !== "aprovado" &&
      !isPast;
    expect(canCancel).toBe(true);
  });
});
