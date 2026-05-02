# MongoDB Setup Guide for MealMatch

## Connection Details
- **Username**: aguerokante_db_user
- **Password**: kante113
- **Cluster**: cluster0.adqi7bf.mongodb.net
- **Database**: mealmatch_db

## Current Status
✅ MongoDB driver installed
✅ Database configuration created
✅ Server setup completed
❌ Connection failing due to DNS resolution issues

## Troubleshooting Steps

### 1. Check Network Connection
```bash
# Test DNS resolution
nslookup cluster0.adqi7bf.mongodb.net

# Test connectivity
telnet cluster0.adqi7bf.mongodb.net 27017
```

### 2. Alternative Connection Methods

#### Option A: Use IP Address (if available)
```javascript
// Alternative connection string
const MONGODB_URI = 'mongodb+srv://aguerokante_db_user:kante113@cluster0.adqi7bf.mongodb.net/mealmatch_db?retryWrites=true&w=majority';
```

#### Option B: Use Local MongoDB
```bash
# Install local MongoDB
# For development, you can use a local MongoDB instance
const MONGODB_URI = 'mongodb://localhost:27017/mealmatch_db';
```

#### Option C: Use MongoDB Compass
1. Download MongoDB Compass
2. Connect with: `mongodb+srv://aguerokante_db_user:kante113@cluster0.adqi7bf.mongodb.net/`
3. Test connection and verify credentials

### 3. Common Issues & Solutions

#### DNS Resolution Error
- **Cause**: Network firewall or DNS blocking
- **Solution**: Try different network or use VPN

#### Authentication Error
- **Cause**: Incorrect credentials or IP whitelist
- **Solution**: Verify credentials in MongoDB Atlas dashboard

#### Connection Timeout
- **Cause**: Network latency or firewall
- **Solution**: Increase timeout in connection options

### 4. Environment Setup

#### For Development (.env file)
```env
MONGODB_URI=mongodb+srv://aguerokante_db_user:kante113@cluster0.adqi7bf.mongodb.net/mealmatch_db
DATABASE_NAME=mealmatch_db
NODE_ENV=development
```

#### For Production
```env
MONGODB_URI=mongodb+srv://aguerokante_db_user:kante113@cluster0.adqi7bf.mongodb.net/mealmatch_db?retryWrites=true&w=majority
DATABASE_NAME=mealmatch_db
NODE_ENV=production
```

## Next Steps

1. **Test Connection**: Run `node src/test-db.js`
2. **Start Server**: Run `npm start` (after fixing connection)
3. **Verify API**: Test endpoints at `http://localhost:3000/api/health`

## API Endpoints Available

- `GET /api/health` - Server health check
- `GET /api/recipes` - Get all recipes
- `POST /api/favorites` - Save favorite recipe
- `GET /api/favorites/:userId` - Get user favorites
- `POST /api/mealplan` - Save meal plan
- `GET /api/mealplan/:userId` - Get user meal plans

## Files Created

- `src/database.js` - MongoDB connection logic
- `server.js` - Express server with API endpoints
- `.env` - Environment variables
- `src/test-db.js` - Connection test script

## Integration with Frontend

To integrate with your existing frontend, update your API calls:

```javascript
// Example: Save favorite to MongoDB
async function saveFavoriteToMongoDB(recipe) {
    try {
        const response = await fetch('http://localhost:3000/api/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: 'user123',
                recipeId: recipe.idMeal,
                recipeTitle: recipe.strMeal,
                recipeImage: recipe.strMealThumb,
                addedAt: new Date()
            })
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Failed to save favorite:', error);
        return false;
    }
}
```

## Support

If connection issues persist:
1. Check MongoDB Atlas dashboard for cluster status
2. Verify IP whitelist includes your current IP
3. Ensure username and password are correct
4. Consider using a VPN if network restrictions apply
