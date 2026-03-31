# MealMatch 

A modern web application designed to make healthy eating easier and more enjoyable. MealMatch helps users find recipes that fit specific dietary needs, health goals, and limited cooking time with powerful search filters, nutrition information, and meal planning features.

## 🌟 Features

### Core Functionality
- **Recipe Search**: Search by keyword, ingredients, or dietary preferences
- **Advanced Filtering**: Filter by diet type (vegan, keto, gluten-free, vegetarian)
- **Recipe Details**: View ingredients, instructions, cooking time, and nutrition facts
- **Nutrition Information**: Display calories, protein, fat, and carbohydrates
- **Favorites System**: Save recipes locally in your browser
- **Weekly Meal Planner**: Assign recipes to specific days and meals
- **Shopping List Generator**: Create consolidated grocery lists from planned meals
- **Responsive Design**: Fully optimized for mobile and desktop devices

### Technical Features
- **API Integration**: Spoonacular and Edamam API support
- **Local Storage**: Persistent favorites, meal plans, and shopping lists
- **Cross-tab Sync**: Real-time synchronization between browser tabs
- **Offline Support**: Mock data fallback when APIs are unavailable
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation

1. **Clone or Download** the project:
   ```bash
   # If using Git
   git clone <repository-url>
   cd final-project
   
   # Or download and extract the ZIP file
   ```

2. **Open the Application**:
   - Simply open `index.html` in your web browser
   - For development, use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server
     
     # Using Live Server extension in VS Code
     ```

3. **Configure API Keys** (Optional):
   - The app works with mock data out of the box
   - For real recipe data, configure API keys:
     - Visit [Spoonacular](https://spoonacular.com/food-api) and get your API key
     - Visit [Edamam](https://developer.edamam.com/) and get your App ID and App Key
     - Open the app in your browser and configure keys in the console:
     ```javascript
     // Set Spoonacular API key
     localStorage.setItem('mealmatch_spoonacular_key', 'YOUR_SPOONACULAR_API_KEY');
     
     // Set Edamam API keys
     localStorage.setItem('mealmatch_edamam_app_id', 'YOUR_EDAMAM_APP_ID');
     localStorage.setItem('mealmatch_edamam_app_key', 'YOUR_EDAMAM_APP_KEY');
     ```

## 📁 Project Structure

```
final-project/
├── index.html              # Main search page
├── recipe.html              # Recipe detail page
├── planner.html             # Meal planner page
├── styles.css               # Complete styling
├── main.js                  # Core application logic
├── search.js                # Recipe search functionality
├── api.js                   # API integration layer
├── favorites.js              # Favorites management
├── planner.js               # Meal planning logic
├── shoppingList.js          # Shopping list generation
└── README.md                # This file
```

## 🎨 Design System

### Color Palette
- **Primary Green**: `#2E7D32` - Fresh, healthy feel
- **Primary Orange**: `#F57C00` - Warm, energetic accent
- **Primary White**: `#FFFFFF` - Clean, modern base
- **Light Gray**: `#F5F5F5` - Subtle backgrounds
- **Dark Gray**: `#757575` - Text and borders

### Typography
- **Headings**: Poppins (600, 700 weight)
- **Body**: Open Sans (400, 600 weight)
- **Icons**: Emoji and Unicode symbols

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔧 Configuration

### API Configuration

The app supports two recipe APIs:

#### Spoonacular API
```javascript
// Set in browser console or localStorage
localStorage.setItem('mealmatch_spoonacular_key', 'your-api-key-here');
```

#### Edamam API
```javascript
// Set in browser console or localStorage
localStorage.setItem('mealmatch_edamam_app_id', 'your-app-id-here');
localStorage.setItem('mealmatch_edamam_app_key', 'your-app-key-here');
```

### Features Configuration

```javascript
// Enable/disable features (in main.js)
const config = {
    enableAPI: true,           // Use real APIs or mock data
    enableFavorites: true,     // Enable favorites system
    enablePlanner: true,       // Enable meal planning
    enableShoppingList: true,  // Enable shopping list generation
    maxFavorites: 100,         // Maximum favorites per user
    cacheTimeout: 300000       // Cache timeout in milliseconds (5 minutes)
};
```

## 📱 Usage Guide

### Searching Recipes
1. Enter keywords or ingredients in the search bar
2. Use filter chips to narrow by dietary preferences
3. Browse results in grid or list view
4. Click on recipes to view details
5. Save favorites with the heart button

### Meal Planning
1. Navigate to the Planner page
2. Click on any meal slot to add a recipe
3. Search and select recipes from the modal
4. Drag and drop meals to rearrange (optional)
5. Generate shopping list from planned meals

### Managing Favorites
1. Click the heart icon on any recipe to save it
2. View all favorites in the planner page
3. Export favorites for backup
4. Search within favorites

### Shopping Lists
1. Generate lists from meal planner
2. Items are automatically categorized
3. Check off items while shopping
4. Clear checked items or export list

## 🛠️ Development

### Code Architecture

The application follows a modular architecture with separate concerns:

- **main.js**: Application initialization and global utilities
- **search.js**: Recipe search and filtering logic
- **api.js**: External API integration with fallback support
- **favorites.js**: Local storage management for favorites
- **planner.js**: Weekly meal planning functionality
- **shoppingList.js**: Grocery list generation and management

### Adding New Features

1. **New Pages**: Create HTML file following the existing pattern
2. **New Modules**: Create JavaScript file with class-based architecture
3. **API Integration**: Extend the APIManager class
4. **Styling**: Follow the existing CSS variable system

### Testing

The application includes built-in error handling and fallback mechanisms:

- Mock data when APIs are unavailable
- Local storage error handling
- Network failure recovery
- Cross-browser compatibility

## 🔒 Privacy & Data

### Data Storage
- All data is stored locally in the browser
- No external data collection or tracking
- Favorites, meal plans, and shopping lists are private
- Data persists across browser sessions

### API Usage
- API keys are stored locally and never transmitted to third parties
- Rate limiting prevents API abuse
- Caching reduces unnecessary API calls

## 🐛 Troubleshooting

### Common Issues

**Recipes not loading:**
- Check internet connection
- Verify API keys are configured
- Try refreshing the page
- Check browser console for errors

**Favorites not saving:**
- Enable cookies/local storage in browser
- Check browser storage limits
- Try clearing browser cache

**Mobile display issues:**
- Ensure browser is updated
- Try refreshing the page
- Check device orientation

### Debug Mode

Enable debug logging in browser console:
```javascript
localStorage.setItem('mealmatch_debug', 'true');
```

## 🚀 Future Enhancements

### Planned Features
- [ ] User accounts and cloud sync
- [ ] Recipe sharing and social features
- [ ] Advanced nutrition tracking
- [ ] Meal prep batch cooking
- [ ] Grocery delivery integration
- [ ] Voice search capabilities
- [ ] Progressive Web App (PWA)
- [ ] Offline recipe caching

### API Expansions
- [ ] USDA Food Database integration
- [ ] Nutrition calculator enhancements
- [ ] Recipe rating and reviews
- [ ] Meal recommendation engine

## 📄 License

This project is created for educational purposes. Please ensure compliance with API terms of service for any production use.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions, issues, or feature requests:

1. Check the troubleshooting section above
2. Review the code comments
3. Test with different browsers
4. Report issues with detailed information

---

**Built with ❤️ for healthy eating enthusiasts**
