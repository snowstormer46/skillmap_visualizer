import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

console.log('Testing connection to:', uri.replace(/:[^:@/]+@/, ':****@')); // Mask password

async function testConnection() {
  try {
    await mongoose.connect(uri);
    console.log('✅  Successfully connected to MongoDB with standard connection string!');
    
    // Check if we are in the correct database
    const dbName = mongoose.connection.db.databaseName;
    console.log('Connected to database:', dbName);
    
    // List collections to ensure credentials work
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections count:', collections.length);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌  Connection failed:', err);
    process.exit(1);
  }
}

testConnection();
