import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aura-commerce";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "aura-commerce";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Prevent multiple connections in development with hot reload
declare global {
  var mongooseCache: MongooseCache;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};
global.mongooseCache = cached;

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
