import TermsVersion, { ITermsVersion } from "../models/TermsVersion";

export class TermsVersionRepository {
  async findActiveByType(type: string): Promise<ITermsVersion | null> {
    return TermsVersion.findOne({ type, isActive: true }).sort({ createdAt: -1 });
  }

  async findByContentHash(contentHash: string): Promise<ITermsVersion | null> {
    return TermsVersion.findOne({ contentHash });
  }

  async findByTypeAndVersion(type: string, version: string): Promise<ITermsVersion | null> {
    return TermsVersion.findOne({ type, version });
  }

  async create(data: Partial<ITermsVersion>): Promise<ITermsVersion> {
    return TermsVersion.create(data);
  }

  async deactivateAllByType(type: string): Promise<void> {
    await TermsVersion.updateMany(
      { type, isActive: true },
      { isActive: false }
    );
  }

  async countByType(type: string): Promise<number> {
    return TermsVersion.countDocuments({ type });
  }

  async countActiveByType(type: string): Promise<number> {
    return TermsVersion.countDocuments({ type, isActive: true });
  }
}

export const termsVersionRepository = new TermsVersionRepository();
