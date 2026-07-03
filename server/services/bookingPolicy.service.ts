import { bookingPolicyRepository } from "../repositories/bookingPolicy.repository";
import { IBookingPolicy } from "../models/BookingPolicy";

export class BookingPolicyService {
  async getActiveOrDefaultPolicy(barbeariaId: string): Promise<IBookingPolicy> {
    // Tenta achar uma ativa
    const existingActive = await bookingPolicyRepository.findActiveByBarbeariaId(barbeariaId);
    
    if (existingActive) {
      return existingActive;
    }

    // Se não existir, tenta criar garantindo ausência de duplicação por concorrência (ainda que de forma simples)
    // No Mongoose o ideal seria upsert ou checagem atômica, mas dada a restrição de simplificação e MVCC:
    const newDefaultPolicyData: Partial<IBookingPolicy> = {
      barbeariaId: barbeariaId as any,
      requirePrepayment: false,
      paymentExpirationMinutes: 15,
      arrivalToleranceMinutes: 15,
      cancellationWindowHours: 2,
      refundPolicy: "manual_review",
      noShowPolicy: "manual_review",
      policyVersion: "1.0",
      activeFrom: new Date(),
      isActive: true,
    };

    // Vamos só checar de novo logo antes de inserir
    const checkAgain = await bookingPolicyRepository.findActiveByBarbeariaId(barbeariaId);
    if (checkAgain) return checkAgain;

    return bookingPolicyRepository.create(newDefaultPolicyData);
  }
}

export const bookingPolicyService = new BookingPolicyService();
