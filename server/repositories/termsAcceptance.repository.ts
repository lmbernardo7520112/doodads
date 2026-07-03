import TermsAcceptance, { ITermsAcceptance } from "../models/TermsAcceptance";

export class TermsAcceptanceRepository {
  async create(data: Partial<ITermsAcceptance>): Promise<ITermsAcceptance> {
    return TermsAcceptance.create(data);
  }

  async findByReservaId(reservaId: string): Promise<ITermsAcceptance[]> {
    return TermsAcceptance.find({ reservaId }).sort({ acceptedAt: -1 });
  }

  async findByUserAndTermsVersion(
    userId: string,
    termsVersionId: string
  ): Promise<ITermsAcceptance | null> {
    return TermsAcceptance.findOne({ userId, termsVersionId }).sort({ acceptedAt: -1 });
  }

  async countByReservaId(reservaId: string): Promise<number> {
    return TermsAcceptance.countDocuments({ reservaId });
  }
}

export const termsAcceptanceRepository = new TermsAcceptanceRepository();
