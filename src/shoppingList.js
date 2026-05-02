import { getMealPlan } from './planner.js';

export function generateShoppingList() {
  const mealPlan = getMealPlan();
  let ingredients = [];

  Object.values(mealPlan).forEach(recipe => {
    if (recipe && recipe.title) {
      // For now, add basic ingredients based on meal title
      // In a real app, you'd use recipe.extendedIngredients from the API
      const basicIngredients = getBasicIngredients(recipe.title);
      ingredients.push(...basicIngredients);
    }
  });

  // Remove duplicates and save to localStorage
  const uniqueIngredients = [...new Set(ingredients)];
  localStorage.setItem('shoppingList', JSON.stringify(uniqueIngredients));
  
  return uniqueIngredients;
}

export function getShoppingList() {
  return JSON.parse(localStorage.getItem('shoppingList')) || [];
}

export function clearShoppingList() {
  localStorage.removeItem('shoppingList');
}

function getBasicIngredients(recipeTitle) {
  // Simple ingredient mapping based on common meal types
  const ingredientMap = {
    'pasta': ['pasta', 'tomato sauce', 'garlic', 'onion', 'olive oil'],
    'chicken': ['chicken', 'salt', 'pepper', 'oil'],
    'salad': ['lettuce', 'tomatoes', 'cucumber', 'dressing'],
    'soup': ['broth', 'vegetables', 'seasoning'],
    'rice': ['rice', 'water', 'salt'],
    'beef': ['beef', 'salt', 'pepper', 'oil'],
    'fish': ['fish', 'lemon', 'butter', 'herbs'],
    'vegetable': ['vegetables', 'olive oil', 'seasoning']
  };

  const ingredients = [];
  const title = recipeTitle.toLowerCase();
  
  Object.keys(ingredientMap).forEach(key => {
    if (title.includes(key)) {
      ingredients.push(...ingredientMap[key]);
    }
  });

  // If no specific ingredients found, add basic cooking staples
  if (ingredients.length === 0) {
    ingredients.push('salt', 'pepper', 'oil', 'basic ingredients');
  }

  return ingredients;
}