// MongoDB Connection Test
// Majok Aguer - mealmatch

import { testConnection, connectToDatabase } from './database.js';

async function runDatabaseTests() {
    console.log('Testing MongoDB connection...');
    
    try {
        // Test basic connection
        const isConnected = await testConnection();
        
        if (isConnected) {
            console.log('✅ MongoDB connection successful!');
            
            // Test database operations
            const db = await connectToDatabase();
            
            // Create a test collection
            const testCollection = db.collection('test');
            
            // Insert a test document
            const testDoc = { 
                message: 'Hello MongoDB!', 
                timestamp: new Date(),
                application: 'MealMatch'
            };
            
            const insertResult = await testCollection.insertOne(testDoc);
            console.log('✅ Test document inserted:', insertResult.insertedId);
            
            // Find the test document
            const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
            console.log('✅ Test document found:', foundDoc.message);
            
            // Clean up test document
            await testCollection.deleteOne({ _id: insertResult.insertedId });
            console.log('✅ Test document cleaned up');
            
            console.log('🎉 All MongoDB tests passed!');
            
        } else {
            console.log('❌ MongoDB connection failed');
        }
        
    } catch (error) {
        console.error('❌ Database test error:', error);
    }
}

// Run the tests
runDatabaseTests();
