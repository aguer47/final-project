// Final Project - Majok Aguer
// This file handles local storage management for favorite recipes

class FavoritesManager {
    constructor() {
        this.storageKey = 'mealmatch_favorites';
        this.favorites = this.loadFavorites();
        this.maxFavorites = 100;
        this.init();
    }

    init() {
        console.log('Initializing Favorites Manager...');
        
        // Safe initialization - only setup what exists
        this.setupFavoritesActions();
        this.setupStorageSync();
    }

    loadFavorites() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading favorites:', error);
            return {};
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
            this.notifyStorageChange();
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    addFavorite(recipe) {
        if (!recipe || !recipe.id) return false;
        
        if (Object.keys(this.favorites).length >= this.maxFavorites) {
            console.warn('Maximum favorites limit reached');
            return false;
        }
        
        this.favorites[recipe.id] = {
            ...recipe,
            addedAt: Date.now()
        };
        
        this.saveFavorites();
        return true;
    }

    removeFavorite(recipeId) {
        if (this.favorites[recipeId]) {
            delete this.favorites[recipeId];
            this.saveFavorites();
            return true;
        }
        return false;
    }

    isFavorite(recipeId) {
        return !!this.favorites[recipeId];
    }

    getFavorite(recipeId) {
        return this.favorites[recipeId] || null;
    }

    getFavoritesArray() {
        return Object.values(this.favorites);
    }

    setupFavoritesActions(container = document) {
        try {
            // Wait for DOM to be ready
            if (typeof document === 'undefined') return;
            if (!container || !container.querySelector) return;
            
            const exportBtn = container.querySelector('#exportFavoritesBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportFavorites());
            }

            const clearBtn = container.querySelector('#clearFavoritesBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (this.clearAllFavorites()) {
                        this.showNotification('All favorites cleared', 'success');
                    }
                });
            }
        } catch (error) {
            console.log('Favorites actions setup skipped - no favorites elements found');
        }
    }

    setupStorageSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    this.favorites = JSON.parse(e.newValue);
                    this.displayFavorites();
                } catch (error) {
                    console.error('Error syncing favorites:', error);
                }
            }
        });
    }

    notifyStorageChange() {
        const event = new StorageEvent('storage', {
            key: this.storageKey,
            newValue: JSON.stringify(this.favorites)
        });
        window.dispatchEvent(event);
    }

    viewRecipe(recipeId) {
        window.location.href = `recipe.html?id=${recipeId}`;
    }

    showNotification(message, type = 'success') {
        console.log(`${type}: ${message}`);
    }

    clearAllFavorites() {
        this.favorites = {};
        this.saveFavorites();
        return true;
    }

    exportFavorites() {
        const dataStr = JSON.stringify(this.favorites, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mealmatch-favorites.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Favorites exported successfully', 'success');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FavoritesManager;
}
