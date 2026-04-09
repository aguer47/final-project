// Majok Aguer - mealmatch

import { StorageManager, NotificationManager } from './utils.js';

class FavoritesManager {
    constructor() {
        this.favorites = StorageManager.load('mealmatch_favorites', {});
        this.init();
    }

    init() {
        this.setupFavoritesActions();
        this.loadFavorites();
        this.displayFavorites();
    }

    setupFavoritesActions() {
        // Export favorites button
        const exportBtn = document.getElementById('exportFavoritesBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportFavorites());
        }

        // Clear all favorites button
        const clearBtn = document.getElementById('clearFavoritesBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFavorites());
        }
    }

    loadFavorites() {
        this.favorites = StorageManager.load('mealmatch_favorites', {});
    }

    saveFavorites() {
        StorageManager.save('mealmatch_favorites', this.favorites);
    }

    displayFavorites() {
        const container = document.getElementById('favoritesContainer');
        if (!container) return;

        const favoritesArray = Object.values(this.favorites);
        
        if (favoritesArray.length === 0) {
            container.innerHTML = `
                <div class="empty-favorites">
                    <h3>No favorites yet</h3>
                    <p>Start searching for recipes and add them to your favorites!</p>
                </div>
            `;
            return;
        }

        const favoritesHTML = favoritesArray.map(favorite => this.createFavoriteCard(favorite)).join('');
        container.innerHTML = favoritesHTML;
    }

    createFavoriteCard(favorite) {
        return `
            <div class="favorite-item" data-favorite-id="${favorite.id}">
                <img src="${favorite.image || 'https://via.placeholder.com/300x200?text=Recipe'}" alt="${favorite.title}">
                <div class="favorite-content">
                    <h4>${favorite.title}</h4>
                    <p>Added ${new Date(favorite.addedAt).toLocaleDateString()}</p>
                    <div class="favorite-actions">
                        <button class="btn btn-primary" onclick="window.favoritesManager.viewRecipe(${favorite.id})">View Recipe</button>
                        <button class="btn btn-outline remove-favorite-btn" onclick="window.favoritesManager.removeFavorite(${favorite.id})">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }

    removeFavorite(recipeId) {
        if (confirm('Are you sure you want to remove this favorite?')) {
            delete this.favorites[recipeId];
            this.saveFavorites();
            this.displayFavorites();
            NotificationManager.show('Recipe removed from favorites');
        }
    }

    clearAllFavorites() {
        if (confirm('Are you sure you want to clear all favorites?')) {
            this.favorites = {};
            this.saveFavorites();
            this.displayFavorites();
            NotificationManager.show('All favorites cleared');
        }
    }

    exportFavorites() {
        const exportData = {
            favorites: this.favorites,
            exportDate: new Date().toISOString(),
            totalFavorites: Object.keys(this.favorites).length
        };

        // Create download link
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `favorites-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        NotificationManager.show('Favorites exported successfully!');
    }

    viewRecipe(recipeId) {
        window.location.href = `recipe.html?id=${recipeId}`;
    }

    // Public methods for external access
    addFavorite(recipe) {
        this.favorites[recipe.id] = {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            addedAt: Date.now()
        };
        this.saveFavorites();
        this.displayFavorites();
        NotificationManager.show('Recipe added to favorites');
    }

    isFavorite(recipeId) {
        return !!this.favorites[recipeId];
    }

    getFavorites() {
        return this.favorites;
    }
}

// Export for use in other files
export { FavoritesManager };