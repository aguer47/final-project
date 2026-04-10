// Majok Aguer - mealmatch

import { searchRecipes } from './api.js';

class PlannerManager {
    constructor() {
        this.mealPlan = JSON.parse(localStorage.getItem('mealmatch_meal_plan') || '{}');
        this.daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        this.mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
        
        this.init();
    }

    init() {
        this.displayPlannerData();
        this.setupEventListeners();
        this.setupAddButtons();
    }

    displayPlannerData() {
        const container = document.querySelector('.weekly-plan .plan-table');
        if (!container) return;

        // Generate days of week rows
        const daysHTML = this.daysOfWeek.map(day => this.createDayRow(day)).join('');
        container.innerHTML = `
            <div class="table-header">
                <div class="day-cell">Day</div>
                ${this.mealTypes.map(meal => `<div class="meal-cell">${meal}</div>`).join('')}
            </div>
            ${daysHTML}
        `;

        // Populate existing meals
        this.populatePlannerData();
    }

    createDayRow(day) {
        return `
            <div class="plan-row">
                <div class="plan-cell day-name">${day}</div>
                ${this.mealTypes.map(meal => this.createMealSlot(day, meal)).join('')}
            </div>
        `;
    }

    createMealSlot(day, meal) {
        const mealId = `${day.toLowerCase()}_${meal.toLowerCase()}`;
        const existingMeal = this.mealPlan[mealId];
        const isFilled = existingMeal && existingMeal.title;

        return `
            <div class="plan-cell">
                <div class="meal-slot ${isFilled ? 'filled' : ''}" 
                     data-day="${day}" 
                     data-meal="${meal}" 
                     data-meal-id="${mealId}">
                    ${isFilled ? existingMeal.title : '+ Add Meal'}
                </div>
            </div>
        `;
    }

    populatePlannerData() {
        Object.keys(this.mealPlan).forEach(mealId => {
            const mealData = this.mealPlan[mealId];
            if (mealData && mealData.title) {
                const slot = document.querySelector(`[data-meal-id="${mealId}"]`);
                if (slot) {
                    slot.textContent = mealData.title;
                    slot.classList.add('filled');
                }
            }
        });
    }

    setupEventListeners() {
        // Clear plan button
        const clearBtn = document.getElementById('clearPlannerBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearPlan());
        }

        // Generate shopping list button
        const shoppingListBtn = document.getElementById('generateListBtn');
        if (shoppingListBtn) {
            shoppingListBtn.addEventListener('click', () => this.generateShoppingList());
        }

        // Export planner button
        const exportBtn = document.getElementById('exportPlannerBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPlanner());
        }
    }

    setupAddButtons() {
        // Setup click handlers for meal slots
        setTimeout(() => {
            document.querySelectorAll('.meal-slot').forEach(slot => {
                slot.addEventListener('click', (e) => {
                    const day = e.target.dataset.day;
                    const meal = e.target.dataset.meal;
                    console.log('Meal slot clicked:', day, meal);
                    this.openRecipeSelector(day, meal);
                });
            });
        }, 100);
    }

    openRecipeSelector(day, meal) {
        console.log('Opening recipe selector for:', day, meal);
        this.currentDay = day;
        this.currentMeal = meal;
        this.showRecipeModal();
    }

    showRecipeModal() {
        const modal = document.getElementById('recipeModal');
        if (!modal) {
            this.createRecipeModal();
        }

        const modalElement = document.getElementById('recipeModal');
        
        // Load recent favorites or popular recipes
        this.loadModalRecipes();
        
        modalElement.style.display = 'block';
    }

    createRecipeModal() {
        const modalHTML = `
            <div id="recipeModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Select Recipe for ${this.currentDay} ${this.currentMeal}</h3>
                        <button class="modal-close" onclick="window.plannerManager.closeRecipeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="search-section">
                            <input type="text" id="modalSearchInput" placeholder="Search recipes..." class="search-input">
                            <button class="btn btn-primary" onclick="window.plannerManager.searchModalRecipes()">Search</button>
                        </div>
                        <div class="modal-recipes" id="modalRecipes">
                            <div class="loading-placeholder">
                                <div class="spinner"></div>
                                <p>Loading recipes...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async loadModalRecipes() {
        try {
            // Load favorites first
            const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');
            const favoriteRecipes = Object.values(favorites);
            
            if (favoriteRecipes.length > 0) {
                this.displayModalRecipes(favoriteRecipes);
            } else {
                // Load some popular recipes if no favorites
                await this.loadPopularRecipes();
            }
        } catch (error) {
            console.error('Error loading modal recipes:', error);
            await this.loadPopularRecipes();
        }
    }

    async loadPopularRecipes() {
        try {
            console.log('Loading popular recipes with search term: chicken');
            const results = await searchRecipes('chicken');
            console.log('Popular recipes results:', results);
            this.displayModalRecipes(results.slice(0, 6));
        } catch (error) {
            console.error('Error loading popular recipes:', error);
            this.displayModalRecipes([]);
        }
    }

    async searchModalRecipes() {
        const searchInput = document.getElementById('modalSearchInput');
        const query = searchInput ? searchInput.value.trim() : '';
        
        console.log('Planner search query:', query);
        
        if (!query) {
            alert('Please enter a search term');
            return;
        }

        try {
            console.log('Calling searchRecipes with query:', query);
            const results = await searchRecipes(query);
            console.log('Search results:', results);
            
            if (!results || results.length === 0) {
                this.displayModalRecipes([]);
                return;
            }
            
            this.displayModalRecipes(results.slice(0, 6));
        } catch (error) {
            console.error('Error searching recipes:', error);
            alert('Failed to search recipes: ' + error.message);
        }
    }

    displayModalRecipes(recipes) {
        const container = document.getElementById('modalRecipes');
        console.log('displayModalRecipes called with:', recipes);
        console.log('Container found:', !!container);
        
        if (!container) return;

        if (!recipes || recipes.length === 0) {
            console.log('No recipes to display');
            container.innerHTML = `
                <div class="loading-placeholder">
                    <p>No recipes found. Try searching for something else.</p>
                </div>
            `;
            return;
        }

        console.log('Processing', recipes.length, 'recipes');
        const recipesHTML = recipes.map(recipe => {
            console.log('Processing recipe:', recipe);
            return `
                <div class="recipe-option" data-recipe-id="${recipe.idMeal}" data-recipe-title="${recipe.strMeal.replace(/'/g, "\\'")}" data-recipe-image="${recipe.strMealThumb || ''}">
                    <img src="${recipe.strMealThumb || 'https://via.placeholder.com/100x100?text=Recipe'}" alt="${recipe.strMeal}">
                    <div class="recipe-info">
                        <h4>${recipe.strMeal}</h4>
                        <p>Ready in 30 mins</p>
                    </div>
                </div>
            `;
        }).join('');

        console.log('Setting container HTML with', recipes.length, 'recipes');
        container.innerHTML = recipesHTML;

        // Add click event listeners to recipe options
        container.querySelectorAll('.recipe-option').forEach(option => {
            option.addEventListener('click', () => {
                const recipeId = option.dataset.recipeId;
                const recipeTitle = option.dataset.recipeTitle;
                const recipeImage = option.dataset.recipeImage;
                this.selectRecipe(recipeId, recipeTitle, recipeImage);
            });
        });
    }

    selectRecipe(recipeId, recipeTitle, recipeImage) {
        const mealId = `${this.currentDay.toLowerCase()}_${this.currentMeal.toLowerCase()}`;
        
        // Save to meal plan
        this.mealPlan[mealId] = {
            id: recipeId,
            title: recipeTitle,
            image: recipeImage,
            day: this.currentDay,
            meal: this.currentMeal,
            addedAt: Date.now()
        };

        // Save to storage
        localStorage.setItem('mealmatch_meal_plan', JSON.stringify(this.mealPlan));

        // Update UI
        const slot = document.querySelector(`[data-meal-id="${mealId}"]`);
        if (slot) {
            slot.textContent = recipeTitle;
            slot.classList.add('filled');
        }

        // Close modal
        this.closeRecipeModal();

        NotificationManager.show(`Added ${recipeTitle} to ${this.currentDay} ${this.currentMeal}`);
    }

    closeRecipeModal() {
        const modal = document.getElementById('recipeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    clearPlan() {
        if (confirm('Are you sure you want to clear the entire meal plan?')) {
            this.mealPlan = {};
            localStorage.setItem('mealmatch_meal_plan', JSON.stringify(this.mealPlan));
            this.displayPlannerData();
            alert('Meal plan cleared');
        }
    }

    generateShoppingList() {
        const allIngredients = new Set();
        const ingredientList = [];

        Object.values(this.mealPlan).forEach(meal => {
            if (meal && meal.id) {
                // Add recipe ingredients to shopping list
                ingredientList.push({
                    recipe: meal.title,
                    ingredients: ['Ingredient 1', 'Ingredient 2', 'Ingredient 3'] // Placeholder - would come from API
                });
            }
        });

        // Save shopping list
        localStorage.setItem('mealmatch_shopping_list', JSON.stringify(ingredientList));
        
        alert('Shopping list generated!');
        
        // Show shopping list section
        const shoppingSection = document.getElementById('shoppingListSection');
        if (shoppingSection) {
            shoppingSection.style.display = 'block';
            this.displayShoppingList(ingredientList);
        }
    }

    displayShoppingList(ingredientList) {
        const container = document.getElementById('shoppingListContainer');
        if (!container) return;

        const listHTML = ingredientList.map((item, index) => `
            <div class="shopping-list-item">
                <div class="item-checkbox">
                    <input type="checkbox" id="item-${index}">
                </div>
                <div class="item-name">${item.recipe}</div>
                <div class="item-category">Recipe</div>
            </div>
        `).join('');

        container.innerHTML = listHTML;
    }

    exportPlanner() {
        const plannerData = {
            weekPlan: this.mealPlan,
            exportDate: new Date().toISOString(),
            totalMeals: Object.keys(this.mealPlan).length
        };

        try {
            // Create download link
            const dataStr = JSON.stringify(plannerData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `meal-planner-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up URL object after a short delay to ensure download starts
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
            
            alert('Meal plan exported successfully!');
        } catch (error) {
            console.error('Error exporting planner:', error);
            alert('Failed to export meal plan');
        }
    }

    // Public methods for external access
    saveMeal(day, recipe) {
        const mealId = `${day.toLowerCase()}_meal`;
        this.mealPlan[mealId] = recipe;
        localStorage.setItem('mealmatch_meal_plan', JSON.stringify(this.mealPlan));
        this.displayPlannerData();
    }

    getMealPlan() {
        return this.mealPlan;
    }
}

// Export for use in other files
export { PlannerManager };
