
// Handles weekly meal scheduling functionality

class PlannerManager {
    constructor() {
        this.storageKey = 'mealmatch_planner';
        this.plannerData = this.loadPlannerData();
        this.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        this.meals = ['breakfast', 'lunch', 'dinner'];
        this.currentEditingSlot = null;
        this.init();
    }

    init() {
        console.log('Initializing Planner Manager...');
        
        this.setupMealSlots();
        this.setupPlannerActions();
        this.setupRecipeSelection();
        this.setupDragAndDrop();
        this.setupStorageSync();
    }

    // Data Management
    loadPlannerData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : this.getDefaultPlannerData();
        } catch (error) {
            console.error('Error loading planner data:', error);
            return this.getDefaultPlannerData();
        }
    }

    getDefaultPlannerData() {
        const data = {};
        this.days.forEach(day => {
            data[day] = {};
            this.meals.forEach(meal => {
                data[day][meal] = null;
            });
        });
        return data;
    }

    savePlannerData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.plannerData));
            this.notifyStorageChange();
        } catch (error) {
            console.error('Error saving planner data:', error);
            this.showNotification('Failed to save planner data', 'error');
        }
    }

    // UI Setup
    setupMealSlots() {
        this.mealSlots = document.querySelectorAll('.meal-slot');
        
        this.mealSlots.forEach(slot => {
            slot.addEventListener('click', (e) => {
                const mealCell = slot.closest('.meal-cell');
                const day = mealCell.closest('.table-row').dataset.day;
                const meal = mealCell.dataset.meal;
                
                this.openRecipeSelection(day, meal);
            });
        });
    }

    setupPlannerActions() {
        // Generate shopping list button
        const generateListBtn = document.getElementById('generateListBtn');
        if (generateListBtn) {
            generateListBtn.addEventListener('click', () => {
                this.generateShoppingList();
            });
        }

        // Clear planner button
        const clearPlannerBtn = document.getElementById('clearPlannerBtn');
        if (clearPlannerBtn) {
            clearPlannerBtn.addEventListener('click', () => {
                if (confirm('Clear all meals from the planner? This cannot be undone.')) {
                    this.clearPlanner();
                }
            });
        }

        // Print list button
        const printListBtn = document.getElementById('printListBtn');
        if (printListBtn) {
            printListBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    setupRecipeSelection() {
        const modal = document.getElementById('recipeModal');
        const modalSearchInput = document.getElementById('modalSearchInput');
        const modalClose = modal?.querySelector('.modal-close');
        
        if (modal && modalSearchInput) {
            // Search in modal
            modalSearchInput.addEventListener('input', () => {
                this.searchModalRecipes(modalSearchInput.value);
            });

            // Close modal
            if (modalClose) {
                modalClose.addEventListener('click', () => {
                    this.closeRecipeSelection();
                });
            }

            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeRecipeSelection();
                }
            });
        }
    }

    setupDragAndDrop() {
        
        this.mealSlots.forEach(slot => {
            slot.draggable = true;
            
            slot.addEventListener('dragstart', (e) => {
                const mealCell = slot.closest('.meal-cell');
                const day = mealCell.closest('.table-row').dataset.day;
                const meal = mealCell.dataset.meal;
                
                e.dataTransfer.setData('text/plain', JSON.stringify({ day, meal }));
                e.dataTransfer.effectAllowed = 'move';
            });
            
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                slot.style.backgroundColor = 'rgba(46, 125, 50, 0.1)';
            });
            
            slot.addEventListener('dragleave', (e) => {
                slot.style.backgroundColor = '';
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.style.backgroundColor = '';
                
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const targetMealCell = slot.closest('.meal-cell');
                    const targetDay = targetMealCell.closest('.table-row').dataset.day;
                    const targetMeal = targetMealCell.dataset.meal;
                    
                    // Move recipe
                    const recipe = this.plannerData[data.day][data.meal];
                    this.assignRecipe(targetDay, targetMeal, recipe);
                    this.assignRecipe(data.day, data.meal, null);
                } catch (error) {
                    console.error('Drag and drop error:', error);
                }
            });
        });
    }

    // Recipe Selection Modal
    openRecipeSelection(day, meal) {
        this.currentEditingSlot = { day, meal };
        
        const modal = document.getElementById('recipeModal');
        const modalSearchInput = document.getElementById('modalSearchInput');
        const modalRecipesList = document.getElementById('modalRecipesList');
        
        if (modal && modalSearchInput && modalRecipesList) {
            // Clear previous search
            modalSearchInput.value = '';
            
            // Load initial recipes (favorites + some random ones)
            this.loadModalRecipes();
            
            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus search input
            setTimeout(() => modalSearchInput.focus(), 100);
        }
    }

    closeRecipeSelection() {
        const modal = document.getElementById('recipeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentEditingSlot = null;
        }
    }

    async loadModalRecipes() {
        const modalRecipesList = document.getElementById('modalRecipesList');
        if (!modalRecipesList) return;
        
        modalRecipesList.innerHTML = '<div class="loading-placeholder"><p>Loading recipes...</p></div>';
        
        try {
            let recipes = [];
            
            // Load favorites first
            if (typeof FavoritesManager !== 'undefined') {
                const favorites = new FavoritesManager();
                const favoriteRecipes = favorites.getFavoritesArray();
                recipes = recipes.concat(favoriteRecipes);
            }
            
            // Add some random recipes if API is available
            if (typeof APIManager !== 'undefined') {
                const api = new APIManager();
                const randomRecipes = await api.getRandomRecipes(8);
                recipes = recipes.concat(randomRecipes);
            } else {
                // Add mock recipes
                recipes = recipes.concat(this.getMockRecipes(8));
            }
            
            // Remove duplicates
            const uniqueRecipes = recipes.filter((recipe, index, self) => 
                index === self.findIndex(r => r.id === recipe.id)
            );
            
            this.displayModalRecipes(uniqueRecipes);
        } catch (error) {
            console.error('Error loading modal recipes:', error);
            modalRecipesList.innerHTML = '<p>Error loading recipes. Please try again.</p>';
        }
    }

    async searchModalRecipes(query) {
        const modalRecipesList = document.getElementById('modalRecipesList');
        if (!modalRecipesList) return;
        
        if (!query.trim()) {
            this.loadModalRecipes();
            return;
        }
        
        modalRecipesList.innerHTML = '<div class="loading-placeholder"><p>Searching...</p></div>';
        
        try {
            let recipes = [];
            
            // Search favorites
            if (typeof FavoritesManager !== 'undefined') {
                const favorites = new FavoritesManager();
                recipes = favorites.searchFavorites(query);
            }
            
            // Search API if available
            if (typeof APIManager !== 'undefined') {
                const api = new APIManager();
                const searchResults = await api.searchRecipes({
                    query: query,
                    number: 10
                });
                recipes = recipes.concat(searchResults.results || []);
            } else {
                // Add mock search results
                recipes = recipes.concat(this.getMockSearchResults(query));
            }
            
            // Remove duplicates
            const uniqueRecipes = recipes.filter((recipe, index, self) => 
                index === self.findIndex(r => r.id === recipe.id)
            );
            
            this.displayModalRecipes(uniqueRecipes);
        } catch (error) {
            console.error('Error searching modal recipes:', error);
            modalRecipesList.innerHTML = '<p>Error searching recipes. Please try again.</p>';
        }
    }

    displayModalRecipes(recipes) {
        const modalRecipesList = document.getElementById('modalRecipesList');
        if (!modalRecipesList) return;
        
        if (recipes.length === 0) {
            modalRecipesList.innerHTML = '<p>No recipes found. Try a different search term.</p>';
            return;
        }
        
        modalRecipesList.innerHTML = recipes.map(recipe => `
            <div class="modal-recipe-card" data-recipe-id="${recipe.id}">
                <h4>${recipe.title}</h4>
                <div class="modal-recipe-info">
                    <span>⏱️ ${this.formatTime(recipe.readyInMinutes || 30)}</span>
                    <span>👥 ${recipe.servings || 4}</span>
                </div>
            </div>
        `).join('');
        
        // Setup click handlers
        modalRecipesList.querySelectorAll('.modal-recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.recipeId;
                this.selectRecipeForSlot(recipeId);
            });
        });
    }

    selectRecipeForSlot(recipeId) {
        if (!this.currentEditingSlot) return;
        
        // Get recipe data
        let recipe = null;
        
        // Try to get from favorites first
        if (typeof FavoritesManager !== 'undefined') {
            const favorites = new FavoritesManager();
            recipe = favorites.getFavorite(recipeId);
        }
        
       
        if (!recipe) {
            if (typeof APIManager !== 'undefined') {
                const api = new APIManager();
                api.getRecipeById(recipeId).then(data => {
                    recipe = data;
                    this.assignRecipe(this.currentEditingSlot.day, this.currentEditingSlot.meal, recipe);
                    this.closeRecipeSelection();
                }).catch(error => {
                    console.error('Error getting recipe:', error);
                    recipe = this.getMockRecipe(recipeId);
                    this.assignRecipe(this.currentEditingSlot.day, this.currentEditingSlot.meal, recipe);
                    this.closeRecipeSelection();
                });
                return;
            } else {
                recipe = this.getMockRecipe(recipeId);
            }
        }
        
        this.assignRecipe(this.currentEditingSlot.day, this.currentEditingSlot.meal, recipe);
        this.closeRecipeSelection();
    }

    // Planner Operations
    assignRecipe(day, meal, recipe) {
        if (!this.plannerData[day]) {
            this.plannerData[day] = {};
        }
        
        this.plannerData[day][meal] = recipe;
        this.savePlannerData();
        this.updateMealSlot(day, meal, recipe);
    }

    updateMealSlot(day, meal, recipe) {
        const mealCell = document.querySelector(`[data-day="${day}"] [data-meal="${meal}"]`);
        if (!mealCell) return;
        
        const mealSlot = mealCell.querySelector('.meal-slot');
        if (!mealSlot) return;
        
        if (recipe) {
            mealSlot.innerHTML = `
                <div class="meal-assigned">
                    <div class="meal-title">${recipe.title}</div>
                    <div class="meal-info">
                        <span>⏱️ ${this.formatTime(recipe.readyInMinutes || 30)}</span>
                        <span>👥 ${recipe.servings || 4}</span>
                    </div>
                    <button class="remove-meal-btn" data-day="${day}" data-meal="${meal}">×</button>
                </div>
            `;
            
            // Setup remove button
            const removeBtn = mealSlot.querySelector('.remove-meal-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeMeal(day, meal);
                });
            }
        } else {
            mealSlot.innerHTML = '<span class="meal-empty">+ Add meal</span>';
        }
    }

    removeMeal(day, meal) {
        this.assignRecipe(day, meal, null);
    }

    loadPlanner() {
        this.days.forEach(day => {
            this.meals.forEach(meal => {
                const recipe = this.plannerData[day]?.[meal];
                this.updateMealSlot(day, meal, recipe);
            });
        });
    }

    clearPlanner() {
        this.days.forEach(day => {
            this.meals.forEach(meal => {
                this.assignRecipe(day, meal, null);
            });
        });
        this.showNotification('Planner cleared');
    }

    // Shopping List Generation
    generateShoppingList() {
        const shoppingList = this.createShoppingList();
        
        if (Object.keys(shoppingList).length === 0) {
            this.showNotification('No meals planned to generate shopping list', 'error');
            return;
        }
        
        this.displayShoppingList(shoppingList);
    }

    createShoppingList() {
        const shoppingList = {};
        
        this.days.forEach(day => {
            this.meals.forEach(meal => {
                const recipe = this.plannerData[day]?.[meal];
                if (recipe && recipe.ingredients) {
                    recipe.ingredients.forEach(ingredient => {
                        
                        const cleanIngredient = this.cleanIngredient(ingredient);
                        if (cleanIngredient) {
                            shoppingList[cleanIngredient] = (shoppingList[cleanIngredient] || 0) + 1;
                        }
                    });
                }
            });
        });
        
        return shoppingList;
    }

    cleanIngredient(ingredient) {
        // Simple cleaning - remove quantities and units
        return ingredient
            .replace(/^\d+[\s\/]?\d*\s*/, '') // Remove numbers at start
            .replace(/\b(cup|cups|tablespoon|tablespoons|tbsp|teaspoon|teaspoons|tsp|oz|ounce|pound|pounds|lb|lbs|gram|grams|g|kg|kilogram|kilograms)\b/gi, '') // Remove units
            .replace(/\([^)]*\)/g, '') // Remove parentheses
            .trim();
    }

    displayShoppingList(shoppingList) {
        const shoppingListSection = document.getElementById('shoppingListSection');
        const shoppingListDiv = document.getElementById('shoppingList');
        
        if (!shoppingListSection || !shoppingListDiv) return;
        
        const sortedItems = Object.entries(shoppingList)
            .sort(([a], [b]) => a.localeCompare(b));
        
        shoppingListDiv.innerHTML = `
            <div class="shopping-list-items">
                ${sortedItems.map(([item, count]) => `
                    <div class="shopping-list-item">
                        <input type="checkbox" class="item-checkbox" id="item-${item.replace(/\s+/g, '-')}">
                        <label for="item-${item.replace(/\s+/g, '-')}" class="item-name">${item}</label>
                        <span class="item-quantity">${count > 1 ? `(${count})` : ''}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        shoppingListSection.style.display = 'block';
        shoppingListSection.scrollIntoView({ behavior: 'smooth' });
        
        // Setup checkbox interactions
        this.setupShoppingListCheckboxes();
    }

    setupShoppingListCheckboxes() {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const item = e.target.closest('.shopping-list-item');
                if (e.target.checked) {
                    item.style.opacity = '0.5';
                    item.style.textDecoration = 'line-through';
                } else {
                    item.style.opacity = '1';
                    item.style.textDecoration = 'none';
                }
            });
        });
    }

   
    setupStorageSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    this.plannerData = JSON.parse(e.newValue);
                    this.loadPlanner();
                } catch (error) {
                    console.error('Error syncing planner data:', error);
                }
            }
        });
    }

    notifyStorageChange() {
        const event = new StorageEvent('storage', {
            key: this.storageKey,
            newValue: JSON.stringify(this.plannerData)
        });
        window.dispatchEvent(event);
    }

    // Utility Methods
    formatTime(minutes) {
        if (minutes < 60) {
            return `${minutes} mins`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

   
    getMockRecipes(count) {
        const mockRecipes = [
            {
                id: 100,
                title: 'Quick Stir-Fry',
                readyInMinutes: 20,
                servings: 2,
                ingredients: ['1 cup rice', '2 cups vegetables', '1 tbsp soy sauce']
            },
            {
                id: 101,
                title: 'Healthy Salad',
                readyInMinutes: 15,
                servings: 1,
                ingredients: ['2 cups greens', '1 tomato', '1 cucumber', 'feta cheese']
            },
            {
                id: 102,
                title: 'Pasta Primavera',
                readyInMinutes: 25,
                servings: 4,
                ingredients: ['8 oz pasta', '2 cups vegetables', '1 cup cheese', '2 cloves garlic']
            },
            {
                id: 103,
                title: 'Grilled Chicken',
                readyInMinutes: 30,
                servings: 2,
                ingredients: ['2 chicken breasts', '1 tsp spices', '1 tbsp oil']
            }
        ];
        
        return mockRecipes.slice(0, count);
    }

    getMockSearchResults(query) {
        return this.getMockRecipes(5).map(recipe => ({
            ...recipe,
            title: `${query} ${recipe.title}`
        }));
    }

    getMockRecipe(recipeId) {
        const mockRecipes = {
            100: {
                id: 100,
                title: 'Quick Stir-Fry',
                readyInMinutes: 20,
                servings: 2,
                ingredients: ['1 cup rice', '2 cups vegetables', '1 tbsp soy sauce']
            },
            101: {
                id: 101,
                title: 'Healthy Salad',
                readyInMinutes: 15,
                servings: 1,
                ingredients: ['2 cups greens', '1 tomato', '1 cucumber', 'feta cheese']
            }
        };
        
        return mockRecipes[recipeId] || this.getMockRecipes(1)[0];
    }

    
    getPlannerStats() {
        const stats = {
            totalMeals: 0,
            plannedMeals: 0,
            completionRate: 0,
            mealsByDay: {},
            mealsByType: { breakfast: 0, lunch: 0, dinner: 0 }
        };
        
        this.days.forEach(day => {
            stats.mealsByDay[day] = 0;
            this.meals.forEach(meal => {
                stats.totalMeals++;
                if (this.plannerData[day]?.[meal]) {
                    stats.plannedMeals++;
                    stats.mealsByDay[day]++;
                    stats.mealsByType[meal]++;
                }
            });
        });
        
        stats.completionRate = Math.round((stats.plannedMeals / stats.totalMeals) * 100);
        
        return stats;
    }

    // Export/Import
    exportPlanner() {
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            planner: this.plannerData
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mealmatch-planner-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Planner exported successfully!');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlannerManager;
}
