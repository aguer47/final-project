
// Final Project- majok Aguer
// This file handles the recipe search functionality

class SearchManager {
    constructor() {
        // Search state variables
        this.currentQuery = '';
        this.currentPage = 1;
        this.resultsPerPage = 12;
        this.searchHistory = [];
        
        // Initialize the search functionality
        this.init();
    }

    init() {
        console.log('Initializing Search Manager...');
        
        this.setupSearchForm();
        this.setupFilters();
        this.setupAutocomplete(document.getElementById('searchInput'));
        this.setupInfiniteScroll();
        
        this.loadInitialContent();
    }

    setupSearchForm() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput && searchBtn) {
            // Search on button click
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });

            // Search on Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });

           
            const debouncedSearch = window.mealMatchApp?.debounce(() => {
                if (searchInput.value.trim()) {
                    this.performSearch();
                }
            }, 500);

            searchInput.addEventListener('input', debouncedSearch);

            this.setupAutocomplete(searchInput);
        }
    }

    setupFilters() {
        const chips = document.querySelectorAll('.chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Remove active class from all chips
                chips.forEach(c => {
                    c.classList.remove('active');
                    c.setAttribute('aria-pressed', 'false');
                });
                
                // Add active class to clicked chip
                chip.classList.add('active');
                chip.setAttribute('aria-pressed', 'true');
                
                // Perform search with filter
                const diet = chip.dataset.diet;
                this.performSearch('', diet);
            });
        });
    }

    setupAutocomplete(searchInput) {
        // Basic autocomplete implementation
        const popularSearches = [
            'chicken', 'pasta', 'salad', 'soup', 'vegetarian',
            'quick', 'healthy', 'dessert', 'breakfast', 'dinner'
        ];

        
        searchInput.addEventListener('focus', () => {
            // Show popular searches when input is empty
            if (!searchInput.value.trim()) {
                this.showPopularSearches(popularSearches);
            }
        });
    }

    setupInfiniteScroll() {
        const recipesContainer = document.getElementById('recipesContainer');
        
        if (recipesContainer) {
            let isLoading = false;
            
            window.addEventListener('scroll', () => {
                if (isLoading) return;
                
                const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
                
                if (scrollTop + clientHeight >= scrollHeight - 100) {
                    if (this.hasMoreResults()) {
                        this.loadMoreResults();
                    }
                }
            });
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        
        if (!searchInput) return;
        
        this.currentQuery = searchInput.value.trim();
        
        if (!this.currentQuery) {
            this.showWelcomeMessage();
            return;
        }

        // Add to search history
        this.addToSearchHistory(this.currentQuery);
        
        this.currentPage = 1;
        
        // Show loading state
        this.showLoadingState();
        
        try {
            // Check if API manager is available
            if (typeof APIManager !== 'undefined') {
                const api = new APIManager();
                const results = await api.searchRecipes({
                    query: this.currentQuery,
                    diet: this.currentDiet !== 'all' ? this.currentDiet : null,
                    number: this.resultsPerPage,
                    offset: (this.currentPage - 1) * this.resultsPerPage
                });
                
                this.displayResults(results.results || []);
                this.totalResults = results.totalResults || 0;
            } else {
                
                const mockResults = this.generateMockResults(this.currentQuery);
                this.displayResults(mockResults);
                this.totalResults = mockResults.length;
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Failed to search recipes. Please try again.');
        }
    }

    async loadMoreResults() {
        if (!this.hasMoreResults()) return;
        
        this.currentPage++;
        
        try {
            if (typeof APIManager !== 'undefined') {
                const api = new APIManager();
                const results = await api.searchRecipes({
                    query: this.currentQuery,
                    diet: this.currentDiet !== 'all' ? this.currentDiet : null,
                    number: this.resultsPerPage,
                    offset: (this.currentPage - 1) * this.resultsPerPage
                });
                
                this.appendResults(results.results || []);
            } else {
                
                const additionalResults = this.generateMockResults(this.currentQuery, this.currentPage);
                this.appendResults(additionalResults);
            }
        } catch (error) {
            console.error('Load more error:', error);
            this.currentPage--; // Reset page number on error
        }
    }

    displayResults(recipes) {
        const container = document.getElementById('recipesContainer');
        
        if (!container) return;
        
        if (recipes.length === 0) {
            this.showNoResults();
            return;
        }

        container.innerHTML = recipes.map(recipe => this.createRecipeCard(recipe)).join('');
        
        // Setup favorite buttons
        this.setupFavoriteButtons();
        
        // Setup recipe card clicks
        this.setupRecipeCardClicks();
    }

    appendResults(recipes) {
        const container = document.getElementById('recipesContainer');
        
        if (!container) return;
        
        const recipeCards = recipes.map(recipe => this.createRecipeCard(recipe)).join('');
        container.insertAdjacentHTML('beforeend', recipeCards);
        
        // Setup favorite buttons for new cards
        this.setupFavoriteButtons();
        
        // Setup recipe card clicks for new cards
        this.setupRecipeCardClicks();
    }

    createRecipeCard(recipe) {
        const isFavorite = this.isFavorite(recipe.id);
        const favoriteClass = isFavorite ? 'active' : '';
        const favoriteIcon = isFavorite ? '❤️' : '🤍';
        
        // Map recipe types to your images
        const imageMap = {
            'chicken': 'images/recipes/grill-meat.webp',
            'pasta': 'images/recipes/rice.webp',
            'salad': 'images/recipes/greens.webp',
            'soup': 'images/recipes/soup.webp',
            'fish': 'images/recipes/grilled-fish.webp',
            'vegetarian': 'images/recipes/vegeterian.webp',
            'breakfast': 'images/recipes/morning-vibes.webp',
            'dessert': 'images/recipes/dessert.webp',
            'healthy': 'images/recipes/healthy-com.webp',
            'meat': 'images/recipes/grilled-meat.webp',
            'egg': 'images/recipes/eggs.webp',
            'fruit': 'images/recipes/fruits.webp',
            'njera': 'images/recipes/njera.webp'
        };
        
        // Select image based on recipe title or use default
        let recipeImage = recipe.image;
        if (!recipeImage || recipeImage.includes('placeholder')) {
            const title = recipe.title.toLowerCase();
            for (const [key, imagePath] of Object.entries(imageMap)) {
                if (title.includes(key)) {
                    recipeImage = imagePath;
                    break;
                }
            }
            // Fallback to a random image from your collection
            if (!recipeImage || recipeImage.includes('placeholder')) {
                const fallbackImages = [
                    'images/recipes/best-served.webp',
                    'images/recipes/fresh-dessert.webp',
                    'images/recipes/fruits.webp',
                    'images/recipes/eggs.webp',
                    'images/recipes/grill-meat.webp',
                    'images/recipes/greens.webp'
                ];
                recipeImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
            }
        }
        
        return `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                <img src="${recipeImage}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-info">
                        <span>⏱️ ${this.formatTime(recipe.readyInMinutes || 30)}</span>
                        <span>👥 ${recipe.servings || 4}</span>
                    </div>
                    <div class="recipe-actions">
                        <button class="favorite-btn ${favoriteClass}" data-recipe-id="${recipe.id}">
                            ${favoriteIcon}
                        </button>
                        <span class="recipe-diet">${recipe.dietLabels?.join(', ') || ''}</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupFavoriteButtons() {
        const favoriteBtns = document.querySelectorAll('.favorite-btn');
        
        favoriteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = btn.dataset.recipeId;
                this.toggleFavorite(recipeId, btn);
            });
        });
    }

    setupRecipeCardClicks() {
        const recipeCards = document.querySelectorAll('.recipe-card');
        
        recipeCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't navigate if favorite button was clicked
                if (e.target.classList.contains('favorite-btn')) return;
                
                const recipeId = card.dataset.recipeId;
                this.navigateToRecipe(recipeId);
            });
        });
    }

    toggleFavorite(recipeId, button) {
        if (typeof FavoritesManager !== 'undefined') {
            const favorites = new FavoritesManager();
            
            if (favorites.isFavorite(recipeId)) {
                favorites.removeFavorite(recipeId);
                button.classList.remove('active');
                button.textContent = '🤍';
            } else {
                favorites.addFavorite(recipeId);
                button.classList.add('active');
                button.textContent = '❤️';
            }
        }
    }

    isFavorite(recipeId) {
        if (typeof FavoritesManager !== 'undefined') {
            const favorites = new FavoritesManager();
            return favorites.isFavorite(recipeId);
        }
        return false;
    }

    navigateToRecipe(recipeId) {
        window.location.href = `recipe.html?id=${recipeId}`;
    }

    showLoadingState() {
        const container = document.getElementById('recipesContainer');
        if (container) {
            container.innerHTML = '<div class="loading-placeholder"><p>Searching for delicious recipes...</p></div>';
        }
    }

    showNoResults() {
        const container = document.getElementById('recipesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <h3>No recipes found</h3>
                    <p>Try different keywords or adjust your filters.</p>
                    <button class="btn btn-primary">Clear Search</button>
                </div>
            `;
        }
    }

    showWelcomeMessage() {
        const container = document.getElementById('recipesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <h3>Welcome to MealMatch! 🍽️</h3>
                    <p>Search for healthy recipes that fit your dietary needs and cooking time.</p>
                    <div class="search-suggestions">
                        <h4>Popular searches:</h4>
                        <div class="suggestion-chips">
                            <button class="chip">Chicken</button>
                            <button class="chip">Pasta</button>
                            <button class="chip">Salad</button>
                            <button class="chip">Vegetarian</button>
                            <button class="chip">Quick Meals</button>
                            <button class="chip">Breakfast</button>
                            <button class="chip">Dessert</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Setup suggestion chips
            container.querySelectorAll('.suggestion-chips .chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const query = chip.textContent;
                    document.getElementById('searchInput').value = query;
                    this.performSearch();
                });
            });
        }
    }

    showError(message) {
        const container = document.getElementById('recipesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary">Try Again</button>
                </div>
            `;
        }
    }

    loadInitialContent() {
        // Show welcome message on initial load
        this.showWelcomeMessage();
    }

    hasMoreResults() {
        const loadedResults = this.currentPage * this.resultsPerPage;
        return loadedResults < this.totalResults && this.totalResults > 0;
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.currentQuery = '';
            this.showWelcomeMessage();
        }
    }

    searchFor(query) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = query;
            this.performSearch();
        }
    }

    showPopularSearches(searches) {
        
        console.log('Popular searches:', searches);
    }

    // Search History Management
    loadSearchHistory() {
        const history = localStorage.getItem('mealmatch_search_history');
        return history ? JSON.parse(history) : [];
    }

    saveSearchHistory() {
        localStorage.setItem('mealmatch_search_history', JSON.stringify(this.searchHistory));
    }

    addToSearchHistory(query) {
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        
        // Add to beginning
        this.searchHistory.unshift(query);
        
        // Keep only last 10 searches
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        this.saveSearchHistory();
    }

    // Mock data generation for development
    generateMockResults(query, page = 1) {
        const allMockRecipes = [
            {
                id: 1,
                title: `Delicious ${query || 'Chicken'} Recipe`,
                image: 'images/recipes/grill-meat.webp',
                readyInMinutes: 30,
                servings: 4,
                summary: 'A delicious and healthy recipe perfect for any meal.',
                instructions: [
                    'Preheat oven to 375°F (190°C)',
                    'Prepare ingredients',
                    'Cook for 25-30 minutes',
                    'Serve hot'
                ],
                ingredients: [
                    '2 cups flour',
                    '1 cup sugar',
                    '3 eggs',
                    '1/2 cup butter',
                    '1 tsp vanilla extract'
                ],
                nutrition: {
                    calories: 350,
                    protein: 25,
                    fat: 12,
                    carbs: 35
                },
                dietLabels: ['Healthy'],
                healthLabels: ['Low Sugar'],
                cuisines: ['American'],
                dishTypes: ['Main Course']
            },
            {
                id: 2,
                title: `Quick ${query || 'Pasta'} Dinner`,
                image: 'images/recipes/rice.webp',
                readyInMinutes: 20,
                servings: 2,
                summary: 'A quick and easy pasta dish perfect for busy weeknights.',
                instructions: [
                    'Boil water for pasta',
                    'Cook pasta according to package directions',
                    'Prepare sauce',
                    'Combine and serve'
                ],
                ingredients: [
                    '1 lb pasta',
                    '2 cups tomato sauce',
                    '1 cup cheese',
                    '2 cloves garlic',
                    '1 tbsp olive oil'
                ],
                nutrition: {
                    calories: 420,
                    protein: 18,
                    fat: 15,
                    carbs: 55
                },
                dietLabels: ['Vegetarian'],
                healthLabels: ['Low Sodium'],
                cuisines: ['Italian'],
                dishTypes: ['Main Course']
            },
            {
                id: 3,
                title: `Healthy ${query || 'Salad'} Bowl`,
                image: 'images/recipes/greens.webp',
                readyInMinutes: 25,
                servings: 3,
                summary: 'A nutritious and colorful salad packed with fresh ingredients.',
                instructions: [
                    'Wash and chop vegetables',
                    'Prepare dressing',
                    'Toss all ingredients together',
                    'Serve immediately'
                ],
                ingredients: [
                    '4 cups mixed greens',
                    '1 cup cherry tomatoes',
                    '1 cucumber',
                    '1/2 cup feta cheese',
                    '2 tbsp olive oil'
                ],
                nutrition: {
                    calories: 180,
                    protein: 8,
                    fat: 12,
                    carbs: 15
                },
                dietLabels: ['Vegetarian', 'Gluten-Free'],
                healthLabels: ['Low Calorie'],
                cuisines: ['Mediterranean'],
                dishTypes: ['Salad']
            },
            {
                id: 4,
                title: `Spicy ${query || 'Tofu'} Stir-Fry`,
                image: 'images/recipes/vegeterian.webp',
                readyInMinutes: 35,
                servings: 4,
                summary: 'A flavorful and spicy stir-fry with vegetables and tofu.',
                instructions: [
                    'Press and cube tofu',
                    'Heat wok or large pan',
                    'Stir-fry vegetables',
                    'Add tofu and sauce',
                    'Serve over rice'
                ],
                ingredients: [
                    '1 block tofu',
                    '2 cups mixed vegetables',
                    '2 tbsp soy sauce',
                    '1 tbsp sesame oil',
                    '2 cloves garlic'
                ],
                nutrition: {
                    calories: 280,
                    protein: 20,
                    fat: 14,
                    carbs: 22
                },
                dietLabels: ['Vegan', 'Gluten-Free'],
                healthLabels: ['High Protein'],
                cuisines: ['Asian'],
                dishTypes: ['Main Course']
            },
            {
                id: 5,
                title: `Fresh ${query || 'Fish'} Dinner`,
                image: 'images/recipes/grilled-fish.webp',
                readyInMinutes: 28,
                servings: 2,
                summary: 'A light and flavorful fish dish with herbs and lemon.',
                instructions: [
                    'Season fish with herbs',
                    'Heat pan with oil',
                    'Cook fish 4-5 minutes per side',
                    'Add lemon and serve'
                ],
                ingredients: [
                    '2 fish fillets',
                    '2 tbsp olive oil',
                    '1 lemon',
                    'Fresh herbs',
                    'Salt and pepper'
                ],
                nutrition: {
                    calories: 220,
                    protein: 32,
                    fat: 8,
                    carbs: 2
                },
                dietLabels: ['Gluten-Free', 'Dairy-Free'],
                healthLabels: ['High Protein', 'Low Carb'],
                cuisines: ['Mediterranean'],
                dishTypes: ['Main Course']
            },
            {
                id: 6,
                title: `Hearty ${query || 'Soup'} Bowl`,
                image: 'images/recipes/soup.webp',
                readyInMinutes: 40,
                servings: 4,
                summary: 'A warm and comforting soup perfect for cold days.',
                instructions: [
                    'Sauté vegetables',
                    'Add broth and seasonings',
                    'Simmer for 30 minutes',
                    'Serve hot with bread'
                ],
                ingredients: [
                    '2 cups vegetables',
                    '4 cups broth',
                    '1 cup beans',
                    'Herbs and spices',
                    'Olive oil'
                ],
                nutrition: {
                    calories: 190,
                    protein: 12,
                    fat: 6,
                    carbs: 28
                },
                dietLabels: ['Vegetarian', 'Gluten-Free'],
                healthLabels: ['Low Calorie'],
                cuisines: ['American'],
                dishTypes: ['Soup']
            },
            {
                id: 7,
                title: `Morning ${query || 'Breakfast'} Special`,
                image: 'images/recipes/morning-vibes.webp',
                readyInMinutes: 15,
                servings: 2,
                summary: 'A nutritious and energizing breakfast to start your day.',
                instructions: [
                    'Beat eggs with milk',
                    'Heat pan with butter',
                    'Cook eggs scrambled',
                    'Serve with toast'
                ],
                ingredients: [
                    '4 eggs',
                    '1/4 cup milk',
                    '2 tbsp butter',
                    '2 slices bread',
                    'Salt and pepper'
                ],
                nutrition: {
                    calories: 280,
                    protein: 18,
                    fat: 14,
                    carbs: 22
                },
                dietLabels: ['Gluten-Free Option'],
                healthLabels: ['High Protein'],
                cuisines: ['American'],
                dishTypes: ['Breakfast']
            },
            {
                id: 8,
                title: `Sweet ${query || 'Dessert'} Treat`,
                image: 'images/recipes/dessert.webp',
                readyInMinutes: 45,
                servings: 6,
                summary: 'A delicious dessert perfect for special occasions.',
                instructions: [
                    'Mix dry ingredients',
                    'Cream butter and sugar',
                    'Combine and bake',
                    'Cool and serve'
                ],
                ingredients: [
                    '2 cups flour',
                    '1 cup sugar',
                    '1/2 cup butter',
                    '2 eggs',
                    'Vanilla extract'
                ],
                nutrition: {
                    calories: 320,
                    protein: 4,
                    fat: 14,
                    carbs: 48
                },
                dietLabels: ['Vegetarian'],
                healthLabels: ['Moderate Calories'],
                cuisines: ['American'],
                dishTypes: ['Dessert']
            }
        ];

        // Filter by diet if specified
        let filteredRecipes = allMockRecipes;
        if (params.diet && params.diet !== 'all') {
            filteredRecipes = allMockRecipes.filter(recipe => 
                recipe.dietLabels.some(label => 
                    label.toLowerCase() === params.diet.toLowerCase()
                )
            );
        }

        
        const offset = params.offset || 0;
        const number = params.number || 12;
        const paginatedRecipes = filteredRecipes.slice(offset, offset + number);

        return {
            results: paginatedRecipes,
            totalResults: filteredRecipes.length,
            offset: offset,
            number: paginatedRecipes.length
        };
    }

    // Utility methods
    formatTime(minutes) {
        if (minutes < 60) {
            return `${minutes} mins`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    }

    // Public method for refreshing results
    refreshResults() {
        if (this.currentQuery) {
            this.performSearch();
        } else {
            this.showWelcomeMessage();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
}
