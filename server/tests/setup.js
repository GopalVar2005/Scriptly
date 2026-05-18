/**
 * Server test setup — provides MongoDB in-memory server and test helpers.
 * 
 * Uses mongodb-memory-server to spin up an ephemeral MongoDB instance
 * so tests don't need a real database connection.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

/**
 * Connect to the in-memory database before tests run.
 */
export async function connect() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

/**
 * Drop database, close connection, and stop mongod process.
 */
export async function disconnect() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
}

/**
 * Clear all data from all collections.
 */
export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
