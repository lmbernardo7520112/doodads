import BookingPayment, { IBookingPayment } from "../models/BookingPayment";

export class BookingPaymentRepository {
  async create(data: Partial<IBookingPayment>): Promise<IBookingPayment> {
    return BookingPayment.create(data);
  }

  async findById(id: string): Promise<IBookingPayment | null> {
    return BookingPayment.findById(id);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<IBookingPayment | null> {
    return BookingPayment.findOne({ idempotencyKey });
  }

  async findByReservaId(reservaId: string): Promise<IBookingPayment[]> {
    return BookingPayment.find({ reservaId }).sort({ createdAt: -1 });
  }

  async updateStatus(
    id: string,
    status: IBookingPayment["status"],
    extra: Partial<IBookingPayment> = {}
  ): Promise<IBookingPayment | null> {
    return BookingPayment.findByIdAndUpdate(
      id,
      { $set: { status, ...extra } },
      { new: true }
    );
  }
}

export const bookingPaymentRepository = new BookingPaymentRepository();
