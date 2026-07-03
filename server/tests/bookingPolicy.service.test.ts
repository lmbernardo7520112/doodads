import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { bookingPolicyService } from "../services/bookingPolicy.service";
import BookingPolicy from "../models/BookingPolicy";

describe("BookingPolicyService", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await BookingPolicy.deleteMany({});
  });

  it("deve criar uma policy default quando a barbearia não tiver nenhuma ativa", async () => {
    const barbeariaId = new mongoose.Types.ObjectId().toHexString();

    const policy = await bookingPolicyService.getActiveOrDefaultPolicy(barbeariaId);

    expect(policy).toBeDefined();
    expect(policy.barbeariaId.toString()).toBe(barbeariaId);
    expect(policy.requirePrepayment).toBe(false); // default explicitly false
    expect(policy.paymentExpirationMinutes).toBe(15);
    expect(policy.arrivalToleranceMinutes).toBe(15);
    expect(policy.cancellationWindowHours).toBe(2);
    expect(policy.refundPolicy).toBe("no_refund_after_window");
    expect(policy.noShowPolicy).toBe("mark_no_show_after_tolerance");
    expect(policy.policyVersion).toBe("1.0");
    expect(policy.isActive).toBe(true);
    expect(policy.activeFrom).toBeDefined();

    // Verify it was actually saved
    const count = await BookingPolicy.countDocuments({ barbeariaId });
    expect(count).toBe(1);
  });

  it("deve retornar a policy ativa existente e não criar duplicata", async () => {
    const barbeariaId = new mongoose.Types.ObjectId().toHexString();

    // Crio a policy 1 vez
    const policy1 = await bookingPolicyService.getActiveOrDefaultPolicy(barbeariaId);
    
    // Crio novamente, deve retornar a mesma
    const policy2 = await bookingPolicyService.getActiveOrDefaultPolicy(barbeariaId);

    expect(policy1._id.toString()).toBe(policy2._id.toString());
    
    // Verifica count
    const count = await BookingPolicy.countDocuments({ barbeariaId });
    expect(count).toBe(1);
  });

  it("respeita limites do modelo quando criados hardcoded", async () => {
    const barbeariaId = new mongoose.Types.ObjectId().toHexString();
    
    const policy = await bookingPolicyService.getActiveOrDefaultPolicy(barbeariaId);
    expect(policy.paymentExpirationMinutes).toBeGreaterThanOrEqual(1);
    expect(policy.paymentExpirationMinutes).toBeLessThanOrEqual(120);
  });
});
