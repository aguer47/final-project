// Majok Aguer - mealmatch

import { searchRecipes, getRecipeById } from './api.js';

class MealMatchApp {
    constructor() {
        this.currentPage = this.detectPage();
        this.init();
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
        const container = document.getElementById('recipesContainer');
        container.innerHTML = 'Loading...';

        try {
            const recipes = await searchRecipes(query);
            
            if (!recipes || recipes.length === 0) {
                container.innerHTML = '<div class="no-results">No recipes found</div>';
                return;
            }

            container.innerHTML = '';
            
            recipes.forEach(recipe => {
                const div = document.createElement('div');
                div.className = 'recipe-card';
                
                div.innerHTML = `
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-image" />
                    <div class="recipe-content">
                        <h3 class="recipe-title">${recipe.strMeal}</h3>
                        <div class="recipe-info">
                            <span>Ready in 30 mins</span>
                            <span>Servings: 4</span>
                        </div>
                        <div class="recipe-actions">
                            <button class="favorite-btn" data-recipe-id="${recipe.idMeal}">></button>
                            <button class="view-recipe-btn" data-recipe-id="${recipe.idMeal}">View Recipe</button>
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

                viewBtn.addEventListener('click', () => {
                    window.location.href = `recipe.html?id=${recipe.idMeal}`;
                });

                container.appendChild(div);
            });
        } catch (error) {
            container.innerHTML = '<div class="error">Error loading recipes</div>';
            console.error(error);
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
            this.showNotification('Removed from favorites');
        } else {
            favorites[recipeId] = {
                id: recipeId,
                title: document.querySelector(`[data-recipe-id="${recipeId}"]`).closest('.recipe-card').querySelector('.recipe-title').textContent,
                image: document.querySelector(`[data-recipe-id="${recipeId}"]`).closest('.recipe-card').querySelector('.recipe-image').src,
                addedAt: Date.now()
            };
            button.textContent = '>';
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

        const html = `
            <div class="recipe-detail">
                <div class="recipe-header">
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-detail-image" />
                    <div class="recipe-info">
                        <h1>${recipe.strMeal}</h1>
                        <div class="recipe-meta">
                            <span>Category: ${recipe.strCategory || 'N/A'}</span>
                            <span>Area: ${recipe.strArea || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="recipe-content">
                    <div class="ingredients-section">
                        <h3>Ingredients</h3>
                        <ul class="ingredients-list">
                            ${recipe.strIngredient1 ? `<li>${recipe.strIngredient1}</li>` : ''}
                            ${recipe.strIngredient2 ? `<li>${recipe.strIngredient2}</li>` : ''}
                            ${recipe.strIngredient3 ? `<li>${recipe.strIngredient3}</li>` : ''}
                            ${recipe.strIngredient4 ? `<li>${recipe.strIngredient4}</li>` : ''}
                            ${recipe.strIngredient5 ? `<li>${recipe.strIngredient5}</li>` : ''}
                        </ul>
                    </div>
                    
                    <div class="instructions-section">
                        <h3>Instructions</h3>
                        <div class="instructions-text">${recipe.strInstructions}</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
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
