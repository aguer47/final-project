
// Handles grocery list generation and management

class ShoppingListManager {
    constructor() {
        this.storageKey = 'mealmatch_shopping_list';
        this.shoppingList = this.loadShoppingList();
        this.categories = [
            'Produce',
            'Meat & Seafood', 
            'Dairy & Eggs',
            'Bakery',
            'Pantry',
            'Frozen',
            'Beverages',
            'Snacks',
            'Household',
            'Other'
        ];
        
        this.init();
    }

    init() {
        console.log('Initializing Shopping List Manager...');
        
        // Setup shopping list display
        this.setupShoppingListDisplay();
        
        // Setup add item functionality
        this.setupAddItem();
        
        // Setup list actions
        this.setupListActions();
        
        // Setup category filtering
        this.setupCategoryFilter();
        
        // Setup search functionality
        this.setupSearch();
        
        // Load existing list
        this.displayShoppingList();
    }

    generateFromPlanner(plannerData) {
        const ingredientMap = new Map();
        
        Object.keys(plannerData).forEach(day => {
            Object.keys(plannerData[day]).forEach(meal => {
                const recipe = plannerData[day][meal];
                
                if (recipe && recipe.ingredients) {
                    recipe.ingredients.forEach(ingredient => {
                        const parsed = this.parseIngredient(ingredient);
                        const key = parsed.name.toLowerCase();
                        
                        const existing = ingredientMap.get(key) || {
                            name: parsed.name,
                            quantity: 0,
                            unit: parsed.unit,
                            recipes: []
                        };
                          
                        existing.quantity += parsed.quantity || 1;
                        existing.recipes.push({
                            day: day,
                            meal: meal,
                            recipe: recipe.title
                        });
                        
                        ingredientMap.set(key, existing);
                    });
                }
            });
        });
        
        const newList = Array.from(ingredientMap.values()).map(item => ({
            ...item,
            id: this.generateId(),
            category: this.categorizeItem(item.name),
            checked: false,
            addedAt: Date.now()
        }));
        
        // Merge with existing list
        this.mergeWithExistingList(newList);
        this.displayShoppingList();
        this.showNotification('Shopping list generated from meal plan!', 'success');
        
        return newList;
    }

    parseIngredient(ingredient) {
        const regex = /(\d+(?:\.\d+)?)?\s*(?:cup|tbsp|tsp|oz|lb|kg|g|ml|l)?\s*)?(.+)/i;
        const match = ingredient.match(regex);
        
        if (match) {
            return {
                quantity: parseFloat(match[1]) || 1,
                unit: match[2]?.trim() || '',
                name: match[3]?.trim() || ingredient
            };
        }
        
            return {
            quantity: 1,
            unit: '',
            name: ingredient.trim()
        };
    }

    categorizeItem(itemName) {
        const name = itemName.toLowerCase();
        
        // Produce keywords
        const produceKeywords = ['apple', 'banana', 'carrot', 'lettuce', 'tomato', 'onion', 'potato', 'garlic', 'lemon', 'lime', 'pepper', 'broccoli', 'spinach', 'mushroom', 'cucumber', 'celery', 'avocado', 'berries', 'fruit', 'vegetable'];
        
        // Meat & Seafood keywords
        const meatKeywords = ['chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'meat', 'sausage', 'bacon'];
        
        // Dairy keywords
        const dairyKeywords = ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'sour cream'];
        
        // Bakery keywords
        const bakeryKeywords = ['bread', 'roll', 'bagel', 'croissant', 'muffin', 'cake', 'pastry'];
        
        // Pantry keywords
        const pantryKeywords = ['rice', 'pasta', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'sauce', 'spice', 'herb', 'cereal', 'oat'];
        
        // Frozen keywords
        const frozenKeywords = ['frozen', 'ice cream', 'frozen pizza', 'frozen vegetables'];
        
        // Beverage keywords
        const beverageKeywords = ['juice', 'soda', 'water', 'coffee', 'tea', 'milk'];
        
        // Snack keywords
        const snackKeywords = ['chips', 'crackers', 'nuts', 'cookies', 'candy', 'popcorn'];
        
        // Check categories
        if (produceKeywords.some(keyword => name.includes(keyword))) return 'Produce';
        if (meatKeywords.some(keyword => name.includes(keyword))) return 'Meat & Seafood';
        if (dairyKeywords.some(keyword => name.includes(keyword))) return 'Dairy & Eggs';
        if (bakeryKeywords.some(keyword => name.includes(keyword))) return 'Bakery';
        if (pantryKeywords.some(keyword => name.includes(keyword))) return 'Pantry';
        if (frozenKeywords.some(keyword => name.includes(keyword))) return 'Frozen';
        if (beverageKeywords.some(keyword => name.includes(keyword))) return 'Beverages';
        if (snackKeywords.some(keyword => name.includes(keyword))) return 'Snacks';
        
        return 'Other';
    }

    mergeWithExistingList(newItems) {
       
        newItems.forEach(newItem => {
            const existingIndex = this.shoppingList.findIndex(item => 
                item.name.toLowerCase() === newItem.name.toLowerCase()
            );
            
            if (existingIndex >= 0) {
                // Update existing item
                const existing = this.shoppingList[existingIndex];
                existing.quantity += newItem.quantity;
                existing.recipes = [...existing.recipes, ...newItem.recipes];
            } else {
                // Add new item
                this.shoppingList.push(newItem);
            }
        });
    }

    // UI Management
    setupShoppingListDisplay() {
        const shoppingListDiv = document.getElementById('shoppingList');
        if (shoppingListDiv) {
            this.shoppingListDiv = shoppingListDiv;
        }
    }

    displayShoppingList() {
        if (!this.shoppingListDiv) return;
        
        if (this.shoppingList.length === 0) {
            this.shoppingListDiv.innerHTML = `
                <div class="empty-shopping-list">
                    <h3>No items in shopping list</h3>
                    <p>Generate a shopping list from your meal planner or add items manually.</p>
                    <button class="btn btn-primary">Generate from Planner</button>
                </div>
            `;
            return;
        }
        
       
        const categorizedItems = this.groupByCategory();
        
        this.shoppingListDiv.innerHTML = `
            <div class="shopping-list-header">
                <div class="list-stats">
                    <span>${this.shoppingList.length} items</span>
                    <span>${this.getCheckedCount()} checked</span>
                </div>
                <div class="list-actions">
                    <button id="clearCheckedBtn" class="btn btn-outline">Clear Checked</button>
                    <button id="clearAllBtn" class="btn btn-outline">Clear All</button>
                </div>
            </div>
            <div class="shopping-list-categories">
                ${this.categories.map(category => `
                    <div class="category-section" data-category="${category}">
                        <h4 class="category-title">${category} (${categorizedItems[category]?.length || 0})</h4>
                        <div class="category-items">
                            ${categorizedItems[category]?.map(item => this.createItemHTML(item)).join('') || '<p class="no-items">No items in this category</p>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
       
        this.setupItemInteractions();
        
        // Setup list actions
        this.setupListActions();
    }

    groupByCategory() {
        const grouped = {};
        
        this.categories.forEach(category => {
            grouped[category] = [];
        });
        
        this.shoppingList.forEach(item => {
            const category = item.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        });
        
        // Sort items within each category by name
        Object.keys(grouped).forEach(category => {
            grouped[category].sort((a, b) => a.name.localeCompare(b.name));
        });
        
        return grouped;
    }

    createItemHTML(item) {
        const quantityText = item.quantity > 1 ? `(${item.quantity})` : '';
        const unitText = item.unit ? `${item.unit}` : '';
        const checkedClass = item.checked ? 'checked' : '';
        
        return `
            <div class="shopping-list-item ${checkedClass}" data-item-id="${item.id}">
                <div class="item-checkbox-wrapper">
                    <input type="checkbox" class="item-checkbox" id="item-${item.id}" ${item.checked ? 'checked' : ''}>
                    <label for="item-${item.id}" class="item-name">${item.name}</label>
                </div>
                <div class="item-details">
                    <span class="item-quantity">${quantityText} ${unitText}</span>
                    ${item.recipes && item.recipes.length > 0 ? `
                        <div class="item-recipes">
                            <span class="recipe-count">For ${item.recipes.length} recipe${item.recipes.length > 1 ? 's' : ''}</span>
                            <div class="recipe-tooltip">
                                ${item.recipes.map(r => `${r.day} ${r.meal}: ${r.recipe}`).join('<br>')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="item-actions">
                    <button class="edit-item-btn" data-item-id="${item.id}">✏️</button>
                    <button class="delete-item-btn" data-item-id="${item.id}">🗑️</button>
                </div>
            </div>
        `;
    }

    setupItemInteractions() {
        
        this.shoppingListDiv.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = e.target.dataset.itemId || e.target.id.replace('item-', '');
                this.toggleItemChecked(itemId);
            });
        });
        
        // Edit buttons
        this.shoppingListDiv.querySelectorAll('.edit-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.itemId;
                this.editItem(itemId);
            });
        });
        
        // Delete buttons
        this.shoppingListDiv.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.itemId;
                this.deleteItem(itemId);
            });
        });
    }

    setupListActions() {
        // Clear checked items
        const clearCheckedBtn = document.getElementById('clearCheckedBtn');
        if (clearCheckedBtn) {
            clearCheckedBtn.addEventListener('click', () => {
                this.clearCheckedItems();
            });
        }
        
        // Clear all items
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Clear all items from shopping list? This cannot be undone.')) {
                    this.clearAllItems();
                }
            });
        }
    }

    setupAddItem() {
        const addItemForm = document.getElementById('addItemForm');
        if (addItemForm) {
            addItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewItem();
            });
        }
    }

    setupCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('shoppingListSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.searchItems(searchInput.value);
            });
        }
    }

    // Item Management
    toggleItemChecked(itemId) {
        const item = this.shoppingList.find(item => item.id === itemId);
        if (item) {
            item.checked = !item.checked;
            this.saveShoppingList();
            this.updateItemDisplay(itemId);
            this.updateStats();
        }
    }

    updateItemDisplay(itemId) {
        const itemElement = this.shoppingListDiv.querySelector(`[data-item-id="${itemId}"]`);
        const checkbox = this.shoppingListDiv.querySelector(`#item-${itemId}`);
        const item = this.shoppingList.find(item => item.id === itemId);
        
        if (itemElement && item) {
            if (item.checked) {
                itemElement.classList.add('checked');
            } else {
                itemElement.classList.remove('checked');
            }
        }
    }

    editItem(itemId) {
        const item = this.shoppingList.find(item => item.id === itemId);
        if (!item) return;
        
        const newName = prompt('Edit item name:', item.name);
        if (newName && newName.trim()) {
            const newQuantity = prompt('Edit quantity:', item.quantity);
            const newUnit = prompt('Edit unit:', item.unit);
            
            item.name = newName.trim();
            item.quantity = parseFloat(newQuantity) || 1;
            item.unit = newUnit || '';
            item.category = this.categorizeItem(item.name);
            
            this.saveShoppingList();
            this.displayShoppingList();
        }
    }

    deleteItem(itemId) {
        const index = this.shoppingList.findIndex(item => item.id === itemId);
        if (index >= 0) {
            this.shoppingList.splice(index, 1);
            this.saveShoppingList();
            this.displayShoppingList();
        }
    }

    addNewItem() {
        const nameInput = document.getElementById('newItemName');
        const quantityInput = document.getElementById('newItemQuantity');
        const unitInput = document.getElementById('newItemUnit');
        const categorySelect = document.getElementById('newItemCategory');
        
        if (!nameInput || !nameInput.value.trim()) return;
        
        const newItem = {
            id: this.generateId(),
            name: nameInput.value.trim(),
            quantity: parseFloat(quantityInput.value) || 1,
            unit: unitInput.value || '',
            category: categorySelect.value || this.categorizeItem(nameInput.value),
            checked: false,
            addedAt: Date.now(),
            recipes: []
        };
        
        this.shoppingList.push(newItem);
        this.saveShoppingList();
        this.displayShoppingList();
        
        // Clear form
        if (nameInput) nameInput.value = '';
        if (quantityInput) quantityInput.value = '';
        if (unitInput) unitInput.value = '';
        if (categorySelect) categorySelect.value = '';
        
        this.showNotification('Item added to shopping list');
    }

    clearCheckedItems() {
        this.shoppingList = this.shoppingList.filter(item => !item.checked);
        this.saveShoppingList();
        this.displayShoppingList();
        this.showNotification('Checked items cleared');
    }

    clearAllItems() {
        this.shoppingList = [];
        this.saveShoppingList();
        this.displayShoppingList();
        this.showNotification('Shopping list cleared');
    }

    // Filtering and Searching
    filterByCategory(category) {
        const categorySections = this.shoppingListDiv.querySelectorAll('.category-section');
        
        categorySections.forEach(section => {
            if (category === 'all' || section.dataset.category === category) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }

    searchItems(query) {
        if (!query) {
            this.displayShoppingList();
            return;
        }
        
        const lowerQuery = query.toLowerCase();
        const filteredItems = this.shoppingList.filter(item => 
            item.name.toLowerCase().includes(lowerQuery) ||
            item.category.toLowerCase().includes(lowerQuery)
        );
        
        // Display only filtered items
        if (filteredItems.length === 0) {
            this.shoppingListDiv.innerHTML = `
                <div class="empty-shopping-list">
                    <h3>No items found</h3>
                    <p>No items match your search for "${query}"</p>
                </div>
            `;
            return;
        }
        
        const categorizedItems = this.groupByCategory(filteredItems);
        
        this.shoppingListDiv.innerHTML = `
            <div class="shopping-list-header">
                <div class="list-stats">
                    <span>${filteredItems.length} items found</span>
                    <button class="btn btn-outline">Clear Search</button>
                </div>
            </div>
            <div class="shopping-list-categories">
                ${this.categories.map(category => `
                    <div class="category-section" data-category="${category}" style="${categorizedItems[category]?.length === 0 ? 'display: none;' : ''}">
                        <h4 class="category-title">${category} (${categorizedItems[category]?.length || 0})</h4>
                        <div class="category-items">
                            ${categorizedItems[category]?.map(item => this.createItemHTML(item)).join('') || ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        this.setupItemInteractions();
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getCheckedCount() {
        return this.shoppingList.filter(item => item.checked).length;
    }

    updateStats() {
        const statsElement = this.shoppingListDiv.querySelector('.list-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <span>${this.shoppingList.length} items</span>
                <span>${this.getCheckedCount()} checked</span>
            `;
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

    // Storage Sync
    setupStorageSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    this.shoppingList = JSON.parse(e.newValue);
                    this.displayShoppingList();
                } catch (error) {
                    console.error('Error syncing shopping list:', error);
                }
            }
        });
    }

    notifyStorageChange() {
        const event = new StorageEvent('storage', {
            key: this.storageKey,
            newValue: JSON.stringify(this.shoppingList)
        });
        window.dispatchEvent(event);
    }

    // Export/Import
    exportShoppingList() {
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            shoppingList: this.shoppingList
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mealmatch-shopping-list-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Shopping list exported successfully!');
    }

    // Print functionality
    printShoppingList() {
        
        const printContent = this.createPrintContent();
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>MealMatch Shopping List</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2E7D32; }
                    .category { margin-bottom: 20px; }
                    .category-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
                    .item { margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
                    .item.checked { text-decoration: line-through; opacity: 0.6; }
                    .item-quantity { color: #666; font-size: 0.9em; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    createPrintContent() {
        const categorizedItems = this.groupByCategory();
        
        let content = `
            <h1>MealMatch Shopping List</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        `;
        
        this.categories.forEach(category => {
            const items = categorizedItems[category];
            if (items && items.length > 0) {
                content += `
                    <div class="category">
                        <div class="category-title">${category}</div>
                        ${items.map(item => `
                            <div class="item ${item.checked ? 'checked' : ''}">
                                ${item.name}
                                <span class="item-quantity">${item.quantity > 1 ? `(${item.quantity})` : ''} ${item.unit}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        });
        
        return content;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingListManager;
}
