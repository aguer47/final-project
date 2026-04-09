import { APIManager } from './api.js';
import { NotificationManager, StorageManager } from './utils.js';

class SearchManager {
    constructor() {
        // Search state variables
        this.currentQuery = '';
        this.currentPage = 1;
        this.resultsPerPage = 12;
        this.searchHistory = [];
        this.apiManager = new APIManager();
        
        // Initialize the search functionality
        this.init();
    }

    init() {
        this.setupSearchForm();
        this.setupFilters();
        this.loadSearchHistory();
        this.loadInitialContent();
    }

    setupSearchForm() {
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const clearBtn = document.getElementById('clearSearchBtn');

        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch();
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSearch());
        }

        // Auto-suggestions
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.showSuggestions(e.target.value);
            });
        }
    }

    setupFilters() {
        const filterChips = document.querySelectorAll('.chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleFilter(chip);
            });
        });
    }

    toggleFilter(chip) {
        const isActive = chip.classList.contains('active');
        
        // Remove active from all chips
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        
        // Add active to clicked chip if it wasn't active
        if (!isActive) {
            chip.classList.add('active');
        }
        
        // Perform search with filter
        this.performSearch();
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput ? searchInput.value.trim() : '';
        
        console.log('Search query:', query);
        
        if (!query) {
            NotificationManager.show('Please enter a search term', 'error');
            return;
        }

        this.currentQuery = query;
        this.currentPage = 1;
        
        // Get active diet filter
        const activeChip = document.querySelector('.chip.active');
        const diet = activeChip ? activeChip.dataset.diet : '';

        try {
            this.showLoading();
            console.log('Starting search with params:', { query, diet });
            
            const results = await this.apiManager.searchRecipes({
                query: query,
                diet: diet,
                number: this.resultsPerPage,
                offset: (this.currentPage - 1) * this.resultsPerPage
            });
            
            console.log('Search results:', results);
            this.displayResults(results);
            this.addToSearchHistory(query);
        } catch (error) {
            console.error('Search error:', error);
            
            // Show user-friendly error messages
            if (error.message.includes('402')) {
                this.showError('API limit reached: The daily API limit has been reached. Please try again tomorrow.');
            } else if (error.message.includes('API key issue')) {
                this.showError('API key issue: Please check your Spoonacular API key.');
            } else if (error.message.includes('unauthorized')) {
                this.showError('API key unauthorized: Please check your Spoonacular API key.');
            } else {
                this.showError('Failed to fetch recipes. Please try again.');
            }
        }
    }

    displayResults(data) {
        const container = document.getElementById('recipesContainer');
        if (!container) {
            return;
        }

        if (!data.results || data.results.length === 0) {
            this.showNoResults();
            return;
        }

        const resultsHTML = data.results.map(recipe => this.createRecipeCard(recipe)).join('');
        
        container.innerHTML = resultsHTML;
        
        // Setup favorite buttons
        this.setupFavoriteButtons();
        
        // Setup recipe card clicks
        this.setupRecipeCardClicks();
    }

    createRecipeCard(recipe) {
        const isFavorite = this.isFavorite(recipe.id);
        const favoriteClass = isFavorite ? 'active' : '';
        const favoriteIcon = isFavorite ? '❤️' : '🤍';
        
        // Use API image directly
        const recipeImage = recipe.image || 'https://via.placeholder.com/300x200?text=Recipe';
        
        return `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                <img src="${recipeImage}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-info">
                        <span>Ready in ${recipe.readyInMinutes || 30} mins</span>
                        <span>Servings: ${recipe.servings || 4}</span>
                    </div>
                    <div class="recipe-actions">
                        <button class="favorite-btn ${favoriteClass}" data-recipe-id="${recipe.id}">
                            <span class="favorite-icon">${favoriteIcon}</span>
                        </button>
                        <button class="view-recipe-btn" data-recipe-id="${recipe.id}">View Recipe</button>
                    </div>
                </div>
            </div>
        `;
    }

    isFavorite(recipeId) {
        // Check if recipe is in favorites using StorageManager
        const favorites = StorageManager.load('mealmatch_favorites', {});
        return !!favorites[recipeId];
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

    toggleFavorite(recipeId, button) {
        const favorites = StorageManager.load('mealmatch_favorites', {});
        
        if (favorites[recipeId]) {
            delete favorites[recipeId];
            button.classList.remove('active');
            button.querySelector('.favorite-icon').textContent = '🤍';
            NotificationManager.show('Removed from favorites');
        } else {
            // Get recipe data from the API response
            const recipeCard = button.closest('.recipe-card');
            const title = recipeCard.querySelector('.recipe-title').textContent;
            favorites[recipeId] = {
                id: recipeId,
                title: title,
                addedAt: Date.now()
            };
            button.classList.add('active');
            button.querySelector('.favorite-icon').textContent = '❤️';
            NotificationManager.show('Added to favorites');
        }
        
        StorageManager.save('mealmatch_favorites', favorites);
    }

    setupRecipeCardClicks() {
        const recipeCards = document.querySelectorAll('.recipe-card');
        recipeCards.forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.recipeId;
                this.viewRecipe(recipeId);
            });
        });
    }

    viewRecipe(recipeId) {
        window.location.href = `recipe.html?id=${recipeId}`;
    }

    showLoading() {
        const container = document.getElementById('recipesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <div class="spinner"></div>
                    <p>Searching for delicious recipes...</p>
                </div>
            `;
        }
    }

    showNoResults() {
        const container = document.getElementById('recipesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <h3>No recipes found</h3>
                    <p>Try different keywords or adjust your filters.</p>
                    <button class="btn btn-primary" id="clearSearchBtn">Clear Search</button>
                </div>
            `;
            
            // Add event listener to the clear button
            const clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearSearch());
            }
        }
    }

    showError(message) {
        const container = document.getElementById('recipesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" id="retryBtn">Try Again</button>
                </div>
            `;
            
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.performSearch());
            }
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
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.value = query;
                    }
                    this.performSearch();
                });
            });
        }
    }

    loadInitialContent() {
        // Show welcome message on initial load
        this.showWelcomeMessage();
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        this.currentQuery = '';
        this.currentPage = 1;
        this.showWelcomeMessage();
    }

    addToSearchHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10);
            this.saveSearchHistory();
        }
    }

    saveSearchHistory() {
        StorageManager.save('mealmatch_search_history', this.searchHistory);
    }

    loadSearchHistory() {
        this.searchHistory = StorageManager.load('mealmatch_search_history', []);
    }

    showSuggestions(query) {
        // Implementation for search suggestions
        // This could show recent searches or popular terms
        if (query.length > 2) {
            // You can add API-based suggestions here
            console.log('Showing suggestions for:', query);
        }
    }
}

// Export for use in other files
export { SearchManager };