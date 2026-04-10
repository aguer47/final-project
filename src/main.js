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
        console.log('Initializing home page...');
        this.setupSearch();
        this.showWelcomeMessage();
        this.setupViewToggle();
    }

    initFavoritesPage() {
        console.log('Initializing favorites page...');
        this.displayFavorites();
        this.setupFavoritesActions();
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

    displayFavorites() {
        const container = document.getElementById('favoritesContainer');
        if (!container) return;

        const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');
        const favoritesArray = Object.values(favorites);
        
        if (favoritesArray.length === 0) {
            container.innerHTML = '<div class="no-favorites">No favorites yet</div>';
            return;
        }

        container.innerHTML = '';
        
        favoritesArray.forEach(favorite => {
            const div = document.createElement('div');
            div.className = 'favorite-item';
            
            div.innerHTML = `
                <img src="${favorite.image}" alt="${favorite.title}" class="favorite-image" />
                <div class="favorite-content">
                    <h3>${favorite.title}</h3>
                    <p>Added ${new Date(favorite.addedAt).toLocaleDateString()}</p>
                    <button class="remove-favorite-btn" data-favorite-id="${favorite.id}">Remove</button>
                </div>
            `;

            const removeBtn = div.querySelector('.remove-favorite-btn');
            removeBtn.addEventListener('click', () => {
                this.removeFavorite(favorite.id, div);
            });

            container.appendChild(div);
        });
    }

    removeFavorite(favoriteId, element) {
        const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');
        delete favorites[favoriteId];
        localStorage.setItem('mealmatch_favorites', JSON.stringify(favorites));
        element.remove();
        this.showNotification('Removed from favorites');
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
        console.log('Initializing recipe page...');
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
                    alert('Please enter a search term');
                }
            });

            searchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        await this.runSearch(query);
                    }
                }
            });
        }
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
            chip.addEventListener('click', async () => {
                const query = chip.dataset.query;
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = query;
                }
                await this.runSearch(query);
            });
        });
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

            container.innerHTML = '';
            
            recipes.forEach(recipe => {
                // Validate recipe data
                if (!recipe || !recipe.idMeal || !recipe.strMeal) {
                    console.warn('Invalid recipe data:', recipe);
                    return;
                }
                
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
                            <button class="favorite-btn" data-recipe-id="${safeId}">></button>
                            <button class="view-recipe-btn" data-recipe-id="${safeId}">View Recipe</button>
                        </div>
                    </div>
                `;

                // Add event listeners
                const favoriteBtn = div.querySelector('.favorite-btn');
                const viewBtn = div.querySelector('.view-recipe-btn');

                favoriteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFavorite(recipe.idMeal, favoriteBtn);
                });
                
                // Set initial button state
                const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');
                if (favorites[recipe.idMeal]) {
                    favoriteBtn.classList.add('favorited');
                }

                viewBtn.addEventListener('click', () => {
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

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    toggleFavorite(recipeId, button) {
        const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');
        
        if (favorites[recipeId]) {
            delete favorites[recipeId];
            button.textContent = '>';
            button.classList.remove('favorited');
            this.showNotification('Removed from favorites');
        } else {
            // Safely get recipe data from DOM
            const recipeElement = document.querySelector(`[data-recipe-id="${recipeId}"]`);
            if (!recipeElement) {
                console.error('Recipe element not found:', recipeId);
                this.showNotification('Error adding to favorites');
                return;
            }
            
            const recipeCard = recipeElement.closest('.recipe-card');
            if (!recipeCard) {
                console.error('Recipe card not found for:', recipeId);
                this.showNotification('Error adding to favorites');
                return;
            }
            
            const titleElement = recipeCard.querySelector('.recipe-title');
            const imageElement = recipeCard.querySelector('.recipe-image');
            
            if (!titleElement || !imageElement) {
                console.error('Recipe elements not found for:', recipeId);
                this.showNotification('Error adding to favorites');
                return;
            }
            
            favorites[recipeId] = {
                id: recipeId,
                title: titleElement.textContent.trim(),
                image: imageElement.src,
                addedAt: Date.now()
            };
            button.textContent = '>';
            button.classList.add('favorited');
            this.showNotification('Added to favorites');
        }
        
        localStorage.setItem('mealmatch_favorites', JSON.stringify(favorites));
    }

    async loadRecipeDetail() {
        const params = new URLSearchParams(window.location.search);
        const recipeId = params.get('id');
        
        if (!recipeId) {
            this.showRecipeError('No recipe ID provided');
            return;
        }

        try {
            const recipe = await getRecipeById(recipeId);
            this.renderRecipeDetail(recipe);
        } catch (error) {
            console.error('Error loading recipe:', error);
            this.showRecipeError('Failed to load recipe details');
        }
    }

    renderRecipeDetail(recipe) {
        const container = document.getElementById('recipeDetail');
        if (!container) return;

        // Sanitize recipe data
        const safeTitle = this.escapeHtml(recipe.strMeal || 'Unknown Recipe');
        const safeCategory = this.escapeHtml(recipe.strCategory || 'N/A');
        const safeArea = this.escapeHtml(recipe.strArea || 'N/A');
        const safeInstructions = this.escapeHtml(recipe.strInstructions || 'No instructions available');
        const safeImage = this.escapeHtml(recipe.strMealThumb || '');

        // Generate ingredients list dynamically
        const ingredients = this.generateIngredientsList(recipe);

        const html = `
            <div class="recipe-detail">
                <div class="recipe-header">
                    <img src="${safeImage}" alt="${safeTitle}" class="recipe-detail-image" />
                    <div class="recipe-info">
                        <h1>${safeTitle}</h1>
                        <div class="recipe-meta">
                            <span>Category: ${safeCategory}</span>
                            <span>Area: ${safeArea}</span>
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

        container.innerHTML = html;
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
            container.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing MealMatch app...');
    window.mealMatchApp = new MealMatchApp();
    console.log('MealMatch app initialized:', window.mealMatchApp);
});
