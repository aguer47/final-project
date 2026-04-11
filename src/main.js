// Majok Aguer - mealmatch

import { searchRecipes, getRecipeById } from './api.js';

class MealMatchApp {
    constructor() {
        this.currentPage = this.detectPage();
        this.init();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    detectPage() {
        const path = window.location.pathname;
        
        if (path === '/' || path.includes('index.html')) {
            return 'index';
        } else if (path.includes('planner.html')) {
            return 'planner';
        } else if (path.includes('favorites.html')) {
            return 'favorites';
        } else if (path.includes('recipe.html')) {
            return 'recipe';
        }
        
        return 'index';
    }

    init() {
        switch (this.currentPage) {
            case 'index':
                this.initHomePage();
                break;
            case 'planner':
                this.initPlannerPage();
                break;
            case 'favorites':
                this.initFavoritesPage();
                break;
            case 'recipe':
                this.initRecipePage();
                break;
        }
    }

    initHomePage() {
        this.setupSearch();
        this.showWelcomeMessage();
        this.setupViewToggle();
    }

    initFavoritesPage() {
        this.setupFavoritesActions();
        this.displayFavorites();
    }

    setupFavoritesActions() {
        const clearBtn = document.getElementById('clearFavoritesBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all favorites?')) {
                    localStorage.removeItem('mealmatch_favorites');
                    this.displayFavorites();
                    this.showNotification('All favorites cleared');
                }
            });
        }
    }

    setupViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const recipesContainer = document.getElementById('recipesContainer');
        
        if (!viewButtons.length || !recipesContainer) return;

        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                viewButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Toggle view class on container
                const view = btn.dataset.view;
                if (view === 'list') {
                    recipesContainer.classList.remove('recipes-grid');
                    recipesContainer.classList.add('recipes-list');
                } else {
                    recipesContainer.classList.remove('recipes-list');
                    recipesContainer.classList.add('recipes-grid');
                }
            });
        });
    }

    displayFavorites() {
        const container = document.getElementById('favoritesContainer');
        if (!container) return;

        const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');
        const favoritesArray = Object.values(favorites);
        
        if (favoritesArray.length === 0) {
            container.innerHTML = '<div>No favorites yet</div>';
            return;
        }

        container.innerHTML = '';
        
        favoritesArray.forEach(fav => {
            const div = document.createElement('div');
            div.className = 'favorite-item';
            
            div.innerHTML = `
                <img src="${fav.image}" width="150"/>
                <h3>${fav.title}</h3>
                <button data-id="${fav.id}">Remove</button>
            `;

            div.querySelector('button').addEventListener('click', () => {
                delete favorites[fav.id];
                localStorage.setItem('mealmatch_favorites', JSON.stringify(favorites));
                this.displayFavorites();
            });

            container.appendChild(div);
        });
    }

    initPlannerPage() {
        console.log('Initializing planner page...');
        // Import and initialize PlannerManager
        import('./planner.js').then(({ PlannerManager }) => {
            window.plannerManager = new PlannerManager();
            console.log('PlannerManager created:', window.plannerManager);
            console.log('window.plannerManager available:', !!window.plannerManager);
        }).catch(error => {
            console.error('Failed to load PlannerManager:', error);
            // Show user-friendly error message
            const container = document.querySelector('.plan-table');
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <h3>Unable to load meal planner</h3>
                        <p>Please refresh the page to try again.</p>
                        <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
                    </div>
                `;
            }
            // Disable planner buttons
            const buttons = document.querySelectorAll('.planner-actions button');
            buttons.forEach(btn => btn.disabled = true);
        });
    }

    initRecipePage() {
        this.loadRecipeDetail();
    }

    setupSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', async () => {
                const query = searchInput.value.trim();
                if (query) {
                    await this.runSearch(query);
                } else {
                    this.showNotification('Please enter a search term');
                }
            });

            searchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        await this.runSearch(query);
                    } else {
                        this.showNotification('Please enter a search term');
                    }
                }
            });
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showWelcomeMessage() {
        const container = document.getElementById('recipesContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="welcome-section">
                <h3>Welcome to MealMatch! <span class="highlight">Quick Recipe Ideas:</span></h3>
                <div class="recipe-chips">
                    <button class="chip" data-query="Chicken">Chicken</button>
                    <button class="chip" data-query="Pasta">Pasta</button>
                    <button class="chip" data-query="Salad">Salad</button>
                    <button class="chip" data-query="Dessert">Dessert</button>
                    <button class="chip" data-query="Breakfast">Breakfast</button>
                    <button class="chip" data-query="Beef">Beef</button>
                    <button class="chip" data-query="Seafood">Seafood</button>
                    <button class="chip" data-query="Vegetarian">Vegetarian</button>
                </div>
                <p class="welcome-text">Click any chip above to search for recipes, or use the search bar for custom queries.</p>
            </div>
        `;

        // Setup chip click handlers
        container.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.dataset.query;
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = query;
                }
                this.runSearch(query);
        });
    });
}

async runSearch(query) {
    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        this.showNotification('Please enter a valid search term');
        return;
    }
    
    // Sanitize query
    const sanitizedQuery = query.trim().replace(/[<>]/g, '').substring(0, 100);
    
    const container = document.getElementById('recipesContainer');
    if (!container) return;
    
    container.innerHTML = 'Loading...';

    try {
        const recipes = await searchRecipes(sanitizedQuery);
        
        if (!recipes || recipes.length === 0) {
            container.innerHTML = '<div class="no-results">No recipes found</div>';
            return;
        }

        const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');
        container.innerHTML = '';

        recipes.forEach(recipe => {
            // Validate recipe data
            if (!recipe || !recipe.idMeal || !recipe.strMeal) {
                console.warn('Invalid recipe data:', recipe);
                return;
            }
            
            const isFav = favorites[recipe.idMeal];
            const heart = isFav ? '❤️' : '🤍';

            const div = document.createElement('div');
            div.className = 'recipe-card';

            // Sanitize recipe data for HTML
            const safeTitle = this.escapeHtml(recipe.strMeal);
            const safeImage = this.escapeHtml(recipe.strMealThumb || '');
            const safeId = this.escapeHtml(recipe.idMeal);

            div.innerHTML = `
                <img src="${safeImage}" alt="${safeTitle}" class="recipe-image" />
                <div class="recipe-content">
                    <h3 class="recipe-title">${safeTitle}</h3>
                    <div class="recipe-info">
                        <span>Ready in 30 mins</span>
                        <span>Servings: 4</span>
                    </div>
                    <div class="recipe-actions">
                        <button class="favorite-btn" data-recipe-id="${safeId}">${heart}</button>
                        <button class="view-recipe-btn" data-recipe-id="${safeId}">View Recipe</button>
                    </div>
                </div>
            `;

            // Favorite button
            div.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(recipe, div.querySelector('.favorite-btn'));
            });

            // View recipe
            div.querySelector('.view-recipe-btn').addEventListener('click', () => {
                window.location.href = `recipe.html?id=${recipe.idMeal}`;
            });

            container.appendChild(div);
        });

    } catch (error) {
        container.innerHTML = '<div class="error">Error loading recipes</div>';
        console.error(error);
        this.showNotification('Failed to load recipes');
    }
    }

    toggleFavorite(recipe, button) {
        const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');

        if (favorites[recipe.idMeal]) {
            delete favorites[recipe.idMeal];
            button.textContent = '></button>';
        } else {
            favorites[recipe.idMeal] = {
                id: recipe.idMeal,
                title: recipe.strMeal,
                image: recipe.strMealThumb,
                addedAt: Date.now()
            };
            button.textContent = '></button>';
        }

        localStorage.setItem('mealmatch_favorites', JSON.stringify(favorites));
    }

    async loadRecipeDetail() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) return;

        try {
            const recipe = await getRecipeById(id);
            
            if (!recipe) {
                this.showRecipeError('Recipe not found');
                return;
            }

            const detailContainer = document.getElementById('recipeDetail');
            if (!detailContainer) return;

            // Sanitize recipe data
            const safeTitle = this.escapeHtml(recipe.strMeal || 'Unknown Recipe');
            const safeInstructions = this.escapeHtml(recipe.strInstructions || 'No instructions available');
            const safeImage = this.escapeHtml(recipe.strMealThumb || '');

            // Generate ingredients list dynamically
            const ingredients = this.generateIngredientsList(recipe);

            detailContainer.innerHTML = `
                <div class="recipe-detail">
                    <div class="recipe-header">
                        <img src="${safeImage}" alt="${safeTitle}" class="recipe-detail-image" />
                        <div class="recipe-info">
                            <h1>${safeTitle}</h1>
                            <div class="recipe-meta">
                                <span>Category: ${this.escapeHtml(recipe.strCategory || 'N/A')}</span>
                                <span>Area: ${this.escapeHtml(recipe.strArea || 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="recipe-content">
                        <div class="ingredients-section">
                            <h3>Ingredients</h3>
                            <ul class="ingredients-list">
                                ${ingredients}
                            </ul>
                        </div>
                        
                        <div class="instructions-section">
                            <h3>Instructions</h3>
                            <div class="instructions-text">${safeInstructions}</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading recipe:', error);
            this.showRecipeError('Failed to load recipe details');
        }
    }

    generateIngredientsList(recipe) {
        const ingredients = [];
        
        // TheMealDB API uses strIngredient1, strIngredient2, etc.
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim() !== '') {
                const safeIngredient = this.escapeHtml(ingredient.trim());
                const safeMeasure = measure ? this.escapeHtml(measure.trim()) : '';
                ingredients.push(`<li>${safeMeasure} ${safeIngredient}</li>`);
            }
        }
        
        return ingredients.length > 0 ? ingredients.join('') : '<li>No ingredients listed</li>';
    }

    showRecipeError(message) {
        const container = document.getElementById('recipeDetail');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">!</div>
                    <h3>Recipe Not Available</h3>
                    <p>${message}</p>
                    <div class="error-actions">
                        <a href="/" class="btn btn-primary">Back to Search</a>
                        <a href="/favorites.html" class="btn btn-outline">View Favorites</a>
                    </div>
                </div>
            `;
        }
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    new MealMatchApp();
});
