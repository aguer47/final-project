// Majok Aguer - mealmatch

import { searchRecipes } from './api.js';
import { NotificationManager } from './utils.js';

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
        // Bind event listener to instance
    this.handleModalClick = (e) => {
        // Remove option handler
        if (e.target.classList.contains('remove-option')) {
            e.stopPropagation();
            const id = e.target.dataset.id;
            e.target.closest('.recipe-option')?.remove();
            return;
        }

        // Select recipe
        if (e.target.closest('.recipe-option')) {
            const el = e.target.closest('.recipe-option');
            this.selectRecipe(
                el.dataset.id,
                el.dataset.title,
                el.dataset.image
            );
        }
    };
    
    document.addEventListener('click', this.handleModalClick);
    }

    displayPlannerData() {
        const container = document.querySelector('.weekly-plan .plan-table');
        if (!container) return;

        const daysHTML = this.daysOfWeek.map(day => this.createDayRow(day)).join('');

        container.innerHTML = `
            <div class="table-header">
                <div class="day-cell">Day</div>
                ${this.mealTypes.map(meal => `<div class="meal-cell">${meal}</div>`).join('')}
            </div>
            ${daysHTML}
        `;

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
            const slot = document.querySelector(`[data-meal-id="${mealId}"]`);

            if (slot && mealData?.title) {
                slot.textContent = mealData.title;
                slot.classList.add('filled');
            }
        });
    }

    setupEventListeners() {
        const clearBtn = document.getElementById('clearPlannerBtn');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearPlan());

        const shoppingListBtn = document.getElementById('generateListBtn');
        if (shoppingListBtn) shoppingListBtn.addEventListener('click', () => this.generateShoppingList());

        const exportBtn = document.getElementById('exportPlannerBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportPlanner());
    }

    setupAddButtons() {
        setTimeout(() => {
            document.querySelectorAll('.meal-slot').forEach(slot => {
                slot.addEventListener('click', (e) => {
                    const day = e.currentTarget.dataset.day;
                    const meal = e.currentTarget.dataset.meal;

                    this.openRecipeSelector(day, meal);
                });
            });
        }, 200);
    }

    openRecipeSelector(day, meal) {
        this.currentDay = day;
        this.currentMeal = meal;
        this.showRecipeModal();
    }

    showRecipeModal() {
    let modal = document.getElementById('recipeModal');

    if (!modal) {
        this.createRecipeModal();
    }

    document.getElementById('recipeModal').style.display = 'block';
    this.loadModalRecipes();
    // Ensure event listeners are attached to remove buttons
    this.attachRemoveButtonListeners();
}

attachRemoveButtonListeners() {
    const removeButtons = document.querySelectorAll('.remove-option');
    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const recipeOption = e.target.closest('.recipe-option');
            if (recipeOption) {
                recipeOption.remove();
            }
        });
    });
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
                            <button class="btn btn-primary" onclick="window.plannerManager.searchModalRecipes()">
                                Search
                            </button>
                        </div>

                        <div class="modal-recipes" id="modalRecipes">
                            <p>Loading recipes...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async loadModalRecipes() {
        const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');
        const favArray = Object.values(favorites);

        if (favArray.length > 0) {
            this.displayModalRecipes(favArray);
        } else {
            await this.loadPopularRecipes();
        }
    }

    async loadPopularRecipes() {
    try {
        const results = await searchRecipes('chicken');
        const meals = this.normalizeRecipes(results);

        this.displayModalRecipes(meals.slice(0, 6));
    } catch (error) {
        console.error(error);
        this.displayModalRecipes([]);
    }
}

normalizeRecipes(recipes) {
    if (!Array.isArray(recipes)) return [];
    
    return recipes.filter(recipe => 
        recipe && 
        typeof recipe === 'object' && 
        recipe.idMeal && 
        recipe.strMeal
    ).map(recipe => ({
        ...recipe,
        idMeal: recipe.idMeal,
        strMeal: recipe.strMeal,
        strMealThumb: recipe.strMealThumb || ''
    }));
}

async searchModalRecipes() {
    const input = document.getElementById('modalSearchInput');
    const query = input?.value?.trim();

    if (!query) {
        NotificationManager.show('Enter a search term');
        return;
    }

    try {
        const results = await searchRecipes(query);
        const meals = this.normalizeRecipes(results);

        this.displayModalRecipes(meals.slice(0, 6));
    } catch (error) {
        console.error(error);
        NotificationManager.show('Search failed');
    }
}

    displayModalRecipes(recipes) {
    const container = document.getElementById('modalRecipes');
    if (!container) return;

    const safe = this.normalizeRecipes(recipes);

    if (safe.length === 0) {
        container.innerHTML = `<p>No recipes found</p>`;
        return;
    }

    container.innerHTML = safe.map(recipe => {
        if (!recipe.idMeal || !recipe.strMeal) return '';

        return `
            <div class="recipe-option"
                data-id="${recipe.idMeal}"
                data-title="${recipe.strMeal}"
                data-image="${recipe.strMealThumb || ''}">
                
                <img src="${recipe.strMealThumb || ''}" width="80">
                <div>
                    <h4>${recipe.strMeal}</h4>
                </div>
                <button class="remove-option" data-id="${recipe.idMeal}" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Remove</button>
            </div>
        `;
    }).join('');
    
    // Attach remove button listeners after rendering
    this.attachRemoveButtonListeners();
}
    selectRecipe(id, title, image) {
        const mealId = `${this.currentDay.toLowerCase()}_${this.currentMeal.toLowerCase()}`;

        this.mealPlan[mealId] = {
            id,
            title,
            image,
            addedAt: Date.now()
        };

        localStorage.setItem('mealmatch_meal_plan', JSON.stringify(this.mealPlan));

        const slot = document.querySelector(`[data-meal-id="${mealId}"]`);
        if (slot) {
            slot.textContent = title;
            slot.classList.add('filled');
        }

        this.closeRecipeModal();

        NotificationManager.show(`Added ${title}`);
    }

    closeRecipeModal() {
        const modal = document.getElementById('recipeModal');
        if (modal) modal.style.display = 'none';
    }

    clearPlan() {
        if (!confirm('Clear meal plan?')) return;

        this.mealPlan = {};
        localStorage.removeItem('mealmatch_meal_plan');
        this.displayPlannerData();

        NotificationManager.show('Meal plan cleared');
    }

    generateShoppingList() {
        const shoppingList = [];
        const allIngredients = new Set();

        Object.values(this.mealPlan).forEach(meal => {
            if (meal && meal.title) {
                shoppingList.push({
                    recipe: meal.title,
                    ingredients: ['Ingredient 1', 'Ingredient 2', 'Ingredient 3'] // Placeholder ingredients
                });
            }
        });

        localStorage.setItem('mealmatch_shopping_list', JSON.stringify(shoppingList));
        
        NotificationManager.show('Shopping list generated!');
        
        // Show shopping list section if it exists
        const shoppingSection = document.getElementById('shoppingListSection');
        if (shoppingSection) {
            shoppingSection.style.display = 'block';
            this.displayShoppingList(shoppingList);
        }
    }

    displayShoppingList(shoppingList) {
        const container = document.getElementById('shoppingListContainer');
        if (!container) return;

        const listHTML = shoppingList.map((item, index) => `
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
        const data = {
            plan: this.mealPlan,
            date: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = 'meal-plan.json';
        a.click();

        URL.revokeObjectURL(url);

        NotificationManager.show('Exported!');
    }
}

export { PlannerManager };