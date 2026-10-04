const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (!uri || uri === 'memory') {
      console.log('🔄 Initializing in-memory MongoDB instance for local demonstration...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'campus_compass',
        }
      });
      uri = memoryServer.getUri();
      console.log('⚡ Connected to in-memory MongoDB:', uri);
    } else {
      console.log(`🔄 Connecting to MongoDB at ${uri.replace(/:([^:@]{1,})@/, ':****@')}...`);
    }

    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
};

module.exports = { connectDB, disconnectDB };
