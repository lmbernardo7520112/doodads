import BookingPolicy, { IBookingPolicy } from "../models/BookingPolicy";

export class BookingPolicyRepository {
  async findActiveByBarbeariaId(barbeariaId: string): Promise<IBookingPolicy | null> {
    return BookingPolicy.findOne({
      barbeariaId,
      isActive: true,
    }).sort({ createdAt: -1 }); // Em caso de corrida, pega a última.
  }

  async create(data: Partial<IBookingPolicy>): Promise<IBookingPolicy> {
    return BookingPolicy.create(data);
  }

  async deactivateAllForBarbearia(barbeariaId: string): Promise<void> {
    await BookingPolicy.updateMany(
      { barbeariaId, isActive: true },
      { isActive: false, activeUntil: new Date() }
    );
  }
}

export const bookingPolicyRepository = new BookingPolicyRepository();
