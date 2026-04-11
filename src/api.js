const BASE_URL = "https://www.themealdb.com/api/json/v1/1/1";



// 🔍 Search recipes

export async function searchRecipes(query) {

  try {

    const res = await fetch(`${BASE_URL}/search.php?s=${query}`);

    const data = await res.json();

    return data.meals || [];

  } catch (error) {

    console.error("Error fetching recipes:", error);

    return [];

  }

}



// 📖 Get recipe details

export async function getRecipeById(id) {

  try {

    const res = await fetch(`${BASE_URL}/lookup.php?i=${id}`);

    const data = await res.json();

    return data.meals[0];

  } catch (error) {

    console.error("Error fetching recipe details:", error);

  }

}