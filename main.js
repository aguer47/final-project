
// Final Project - majok Aguer

// This file contains the main application logic

class MealMatchApp {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    init() {
        console.log('MealMatch App Initializing...');
        
        // Initialize page-specific functionality
        switch(this.currentPage) {
            case 'index':
                this.initHomePage();
                break;
            case 'recipe':
                this.initRecipePage();
                break;
            case 'planner':
                this.initPlannerPage();
                break;
        }

        // Initialize global functionality
        this.initGlobalFeatures();
        console.log('MealMatch App Initialized');
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1);
        
        if (filename === 'index.html' || filename === '') {
            return 'index';
        } else if (filename === 'recipe.html') {
            return 'recipe';
        } else if (filename === 'planner.html') {
            return 'planner';
        }
        
        return 'index';
    }

    initHomePage() {
        console.log('Initializing Home Page...');
        
        if (typeof SearchManager !== 'undefined') {
            window.searchManager = new SearchManager();
        }

        if (typeof FavoritesManager !== 'undefined') {
            window.favoritesManager = new FavoritesManager();
        }

        this.setupViewToggle();
    }

    initRecipePage() {
        console.log('Initializing Recipe Page...');
        
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
        console.log('Initializing Planner Page...');
        
        // Initialize planner if planner.js is available
        if (typeof PlannerManager !== 'undefined') {
            window.plannerManager = new PlannerManager();
        }

        // Initialize shopping list if shoppingList.js is available
        if (typeof ShoppingListManager !== 'undefined') {
            window.shoppingListManager = new ShoppingListManager();
        }

        // Initialize favorites if available
        if (typeof FavoritesManager !== 'undefined') {
            window.favoritesManager = new FavoritesManager();
        }

        // Setup modal functionality
        this.setupModal();
    }

    initGlobalFeatures() {
        // Setup navigation
        this.setupNavigation();
        
        // Setup local storage monitoring
        this.setupStorageMonitoring();
        
        // Setup error handling
        this.setupErrorHandling();
    }

    setupViewToggle() {
        const viewBtns = document.querySelectorAll('.view-btn');
        const recipesContainer = document.getElementById('recipesContainer');
        
        if (viewBtns.length > 0 && recipesContainer) {
            viewBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const view = e.target.dataset.view;
                    
                    // Update active button
                    viewBtns.forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-pressed', 'false');
                    });
                    e.target.classList.add('active');
                    e.target.setAttribute('aria-pressed', 'true');
                    
                    // Update container class
                    recipesContainer.classList.remove('recipes-grid', 'recipes-list');
                    recipesContainer.classList.add(view === 'grid' ? 'recipes-grid' : 'recipes-list');
                    
                    // Save preference
                    localStorage.setItem('preferredView', view);
                });
            });

            // Load saved preference
            const savedView = localStorage.getItem('preferredView') || 'grid';
            const activeBtn = document.querySelector(`[data-view="${savedView}"]`);
            if (activeBtn) {
                activeBtn.click();
            }
        }
    }

    setupModal() {
        const modal = document.getElementById('recipeModal');
        const modalClose = modal?.querySelector('.modal-close');
        
        if (modal && modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.closeModal();
                }
            });
        }
    }

    openModal() {
        const modal = document.getElementById('recipeModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('recipeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    setupNavigation() {
        // Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupStorageMonitoring() {
        // Monitor storage changes across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'mealmatch_favorites' || e.key === 'mealmatch_planner') {
                console.log('Storage updated in another tab');
                // Refresh relevant UI components
                this.refreshUI();
            }
        });
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showGlobalError('An unexpected error occurred. Please refresh the page.');
        });

        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showGlobalError('A network error occurred. Please check your connection.');
        });
    }

    async loadRecipeDetail(recipeId) {
        try {
            const recipeDetail = document.getElementById('recipeDetail');
            
            if (recipeDetail) {
                recipeDetail.innerHTML = '<div class="loading-placeholder"><p>Loading recipe details...</p></div>';
            }

            // Check if API manager is available
            if (typeof APIManager !== 'undefined') {
                const api = new APIManager();
                const recipe = await api.getRecipeById(recipeId);
                
                if (recipe) {
                    this.renderRecipeDetail(recipe);
                } else {
                    this.showRecipeError('Recipe not found');
                }
            } else {
                
                this.renderMockRecipeDetail(recipeId);
            }
        } catch (error) {
            console.error('Error loading recipe detail:', error);
            this.showRecipeError('Failed to load recipe details');
        }
    }

    renderRecipeDetail(recipe) {
        const recipeDetail = document.getElementById('recipeDetail');
        
        if (!recipeDetail) return;

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
        
        // Select image based on recipe title
        let recipeImage = recipe.image;
        if (!recipeImage || recipeImage.includes('placeholder')) {
            const title = recipe.title.toLowerCase();
            for (const [key, imagePath] of Object.entries(imageMap)) {
                if (title.includes(key)) {
                    recipeImage = imagePath;
                    break;
                }
            }
            
            if (!recipeImage || recipeImage.includes('placeholder')) {
                recipeImage = 'images/recipes/best-served.webp';
            }
        }

        const nutritionHTML = recipe.nutrition ? `
            <div class="nutrition-box">
                <h3 class="nutrition-title">Nutrition Information</h3>
                <div class="nutrition-grid">
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutrition.calories || 'N/A'}</div>
                        <div class="nutrition-label">Calories</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutrition.protein || 'N/A'}g</div>
                        <div class="nutrition-label">Protein</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutrition.fat || 'N/A'}g</div>
                        <div class="nutrition-label">Fat</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutrition.carbs || 'N/A'}g</div>
                        <div class="nutrition-label">Carbs</div>
                    </div>
                </div>
            </div>
        ` : '';

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

        recipeDetail.innerHTML = `
            <div class="recipe-detail-left">
                <img src="${recipeImage}" alt="${recipe.title}" class="recipe-detail-image">
                ${nutritionHTML}
            </div>
            <div class="recipe-detail-right">
                <h1 class="recipe-title">${recipe.title}</h1>
                <div class="recipe-info">
                    <span>⏱️ ${recipe.readyInMinutes || 'N/A'} mins</span>
                    <span>👥 ${recipe.servings || 'N/A'} servings</span>
                    <span>🔥 ${recipe.difficulty || 'Medium'}</span>
                </div>
                ${ingredientsHTML}
                ${instructionsHTML}
            </div>
        `;
    }

    renderMockRecipeDetail(recipeId) {
       
        const mockRecipe = {
            id: recipeId,
            title: 'Delicious Mock Recipe',
            image: 'https://via.placeholder.com/400x300',
            readyInMinutes: 30,
            servings: 4,
            difficulty: 'Easy',
            nutrition: {
                calories: 350,
                protein: 25,
                fat: 12,
                carbs: 35
            },
            ingredients: [
                '2 cups flour',
                '1 cup sugar',
                '3 eggs',
                '1/2 cup butter',
                '1 tsp vanilla extract'
            ],
            instructions: [
                'Preheat oven to 350°F (175°C)',
                'Mix dry ingredients in a large bowl',
                'Beat eggs and add to dry ingredients',
                'Bake for 25-30 minutes until golden brown',
                'Let cool before serving'
            ]
        };

        this.renderRecipeDetail(mockRecipe);
    }

    showRecipeError(message) {
        const recipeDetail = document.getElementById('recipeDetail');
        if (recipeDetail) {
            recipeDetail.innerHTML = `
                <div class="loading-placeholder">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <a href="index.html" class="btn btn-primary">Back to Search</a>
                </div>
            `;
        }
    }

    showGlobalError(message) {
        // Create or update error notification
        let errorDiv = document.getElementById('globalError');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'globalError';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                z-index: 10000;
                max-width: 300px;
            `;
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    refreshUI() {
        // Refresh UI components based on current page
        switch(this.currentPage) {
            case 'index':
                if (window.searchManager) {
                    window.searchManager.refreshResults();
                }
                break;
            case 'planner':
                if (window.plannerManager) {
                    window.plannerManager.loadPlanner();
                }
                break;
        }
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

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mealMatchApp = new MealMatchApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MealMatchApp;
}
