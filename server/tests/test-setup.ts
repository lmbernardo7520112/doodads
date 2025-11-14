import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer: MongoMemoryServer;

/**
 * Call startTestDB() in beforeAll, stopTestDB() in afterAll.
 */
export async function startTestDB() {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'jest' }
  });

  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    // useNewUrlParser: true, useUnifiedTopology: true are default in new mongoose
  } as any);
}

export async function stopTestDB() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
