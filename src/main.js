// Majok Aguer - mealmatch

import './utils.js';
import './api.js';
import './search.js';
import './favorites.js';
import './planner.js';

import { SearchManager } from './search.js';
import { PlannerManager } from './planner.js';
import { APIManager } from './api.js';
import { NotificationManager, StorageManager, ExportManager } from './utils.js';

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
        window.searchManager = new SearchManager();
        console.log('SearchManager created:', window.searchManager);

        if (typeof FavoritesManager !== 'undefined') {
            window.favoritesManager = new FavoritesManager();
        }

        this.setupViewToggle();
    }

    initFavoritesPage() {
        if (typeof FavoritesManager !== 'undefined') {
            window.favoritesManager = new FavoritesManager();
        }
    }

    initRecipePage() {
        // Get recipe ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');
        
        if (recipeId) {
            this.loadRecipeDetail(recipeId);
        } else {
            this.showRecipeError('No recipe ID provided');
        }

        // Initialize favorites if available
        if (typeof FavoritesManager !== 'undefined') {
            window.favoritesManager = new FavoritesManager();
        }
    }

    initPlannerPage() {
        console.log('Initializing planner page...');
        window.plannerManager = new PlannerManager();
        console.log('PlannerManager created:', window.plannerManager);

        // Initialize shopping list if shoppingList.js is available
        if (typeof ShoppingListManager !== 'undefined') {
            window.shoppingListManager = new ShoppingListManager();
        }

        // Initialize favorites if available
        if (typeof FavoritesManager !== 'undefined') {
            window.favoritesManager = new FavoritesManager();
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

    async loadRecipeDetail(recipeId) {
        try {
            if (typeof APIManager !== 'undefined') {
                window.apiManager = new APIManager();
            }
            
            const recipe = await window.apiManager.getRecipeById(recipeId);
            this.renderRecipeDetail(recipe);
        } catch (error) {
            console.error('Error loading recipe:', error);
            this.showRecipeError('Failed to load recipe details');
        }
    }

    renderRecipeDetail(recipe) {
        const container = document.getElementById('recipeDetail');
        if (!container) return;

        // Use API image directly
        const recipeImage = recipe.image || 'https://via.placeholder.com/400x300?text=Recipe';
        
        const ingredientsHTML = recipe.ingredients ? `
            <div class="ingredients-section">
                <h3 class="section-title">Ingredients</h3>
                <ul class="ingredients-list">
                    ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        const instructionsHTML = recipe.instructions ? `
            <div class="instructions-section">
                <h3 class="section-title">Instructions</h3>
                <ol class="instructions-list">
                    ${recipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
                </ol>
            </div>
        ` : '';
        
        const html = `
            <div class="recipe-detail">
                <div class="recipe-header">
                    <img src="${recipeImage}" alt="${recipe.title}" class="recipe-detail-image">
                    <div class="recipe-info">
                        <h1>${recipe.title}</h1>
                        <div class="recipe-meta">
                            <span>Ready in ${recipe.readyInMinutes || 30} minutes</span>
                            <span>Servings: ${recipe.servings || 4}</span>
                        </div>
                    </div>
                </div>
                
                <div class="recipe-content">
                    ${ingredientsHTML}
                    ${instructionsHTML}
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

    refreshUI() {
        // Refresh favorites
        if (typeof FavoritesManager !== 'undefined') {
            window.favoritesManager.displayFavorites();
        }
        
        // Refresh planner
        if (typeof PlannerManager !== 'undefined') {
            window.plannerManager.displayPlannerData();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing MealMatch app...');
    window.mealMatchApp = new MealMatchApp();
    console.log('MealMatch app initialized:', window.mealMatchApp);
});