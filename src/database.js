// MongoDB Connection Configuration
// Majok Aguer - mealmatch

import { MongoClient } from 'mongodb';

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://aguerokante_db_user:kante113@cluster0.adqi7bf.mongodb.net/';
const DATABASE_NAME = 'mealmatch_db';

// Create a new MongoClient
const client = new MongoClient(MONGODB_URI);

let dbConnection;

// Connect to MongoDB
export async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        
        dbConnection = client.db(DATABASE_NAME);
        return dbConnection;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

// Get database connection
export function getDatabase() {
    if (!dbConnection) {
        throw new Error('Database not connected. Call connectToDatabase() first.');
    }
    return dbConnection;
}

// Close database connection
export async function closeDatabaseConnection() {
    try {
        await client.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        throw error;
    }
}

// Test connection
export async function testConnection() {
    try {
        const db = await connectToDatabase();
        await db.admin().ping();
        console.log('MongoDB connection test successful');
        return true;
    } catch (error) {
        console.error('MongoDB connection test failed:', error);
        return false;
    }
}

export {
    MONGODB_URI,
    DATABASE_NAME
};
