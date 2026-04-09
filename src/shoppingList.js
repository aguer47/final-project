export function generateShoppingList(plan) {
  let ingredients = [];

  Object.values(plan).forEach(recipe => {
    if (recipe.extendedIngredients) {
      recipe.extendedIngredients.forEach(item => {
        ingredients.push(item.name);
      });
    }
  });

  return ingredients;
}