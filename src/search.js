import { searchRecipes } from './api.js';

export async function runSearch(query) {
  const container = document.getElementById('recipesContainer');

  container.innerHTML = "Loading...";

  try {
    const recipes = await searchRecipes(query);

    if (!recipes || recipes.length === 0) {
      container.innerHTML = "No results found";
      return;
    }

    container.innerHTML = "";

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
            <button class="favorite-btn" data-recipe-id="${recipe.idMeal}">🤍</button>
            <button class="view-recipe-btn" data-recipe-id="${recipe.idMeal}">View Recipe</button>
          </div>
        </div>
      `;

      // Add event listeners
      const favoriteBtn = div.querySelector('.favorite-btn');
      const viewBtn = div.querySelector('.view-recipe-btn');

      favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(recipe.idMeal, favoriteBtn);
      });

      viewBtn.addEventListener('click', () => {
        window.location.href = `recipe.html?id=${recipe.idMeal}`;
      });

      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = "An error occurred while searching for recipes.";
    console.error(error);
  }
}

// Favorites functionality
function toggleFavorite(recipeId, button) {
  const favorites = JSON.parse(localStorage.getItem('mealmatch_favorites') || '{}');
  
  if (favorites[recipeId]) {
    delete favorites[recipeId];
    button.textContent = '🤍';
    showNotification('Removed from favorites');
  } else {
    favorites[recipeId] = {
      id: recipeId,
      title: document.querySelector(`[data-recipe-id="${recipeId}"]`).closest('.recipe-card').querySelector('.recipe-title').textContent,
      image: document.querySelector(`[data-recipe-id="${recipeId}"]`).closest('.recipe-card').querySelector('.recipe-image').src,
      addedAt: Date.now()
    };
    button.textContent = '❤️';
    showNotification('Added to favorites');
  }
  
  localStorage.setItem('mealmatch_favorites', JSON.stringify(favorites));
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}