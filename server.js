// MongoDB Server for MealMatch
// Majok Aguer - mealmatch

import express from 'express';
import { connectToDatabase, getDatabase } from './src/database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// MongoDB connection
let db;

async function initializeServer() {
    try {
        db = await connectToDatabase();
        console.log('Server initialized with MongoDB connection');
        
        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    }
}

// API Routes

// Get all recipes
app.get('/api/recipes', async (req, res) => {
    try {
        const recipesCollection = db.collection('recipes');
        const recipes = await recipesCollection.find({}).toArray();
        res.json(recipes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// Save favorite recipe
app.post('/api/favorites', async (req, res) => {
    try {
        const favoritesCollection = db.collection('favorites');
        const result = await favoritesCollection.insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save favorite' });
    }
});

// Get user favorites
app.get('/api/favorites/:userId', async (req, res) => {
    try {
        const favoritesCollection = db.collection('favorites');
        const favorites = await favoritesCollection.find({ userId: req.params.userId }).toArray();
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

// Save meal plan
app.post('/api/mealplan', async (req, res) => {
    try {
        const mealPlanCollection = db.collection('mealplans');
        const result = await mealPlanCollection.insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save meal plan' });
    }
});

// Get user meal plans
app.get('/api/mealplan/:userId', async (req, res) => {
    try {
        const mealPlanCollection = db.collection('mealplans');
        const mealPlans = await mealPlanCollection.find({ userId: req.params.userId }).toArray();
        res.json(mealPlans);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch meal plans' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', database: db ? 'Connected' : 'Disconnected' });
});

// Initialize server
initializeServer();
