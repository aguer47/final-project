class APIManager {
    constructor() {
        this.spoonacularApiKey = this.getApiKey('spoonacular');
        this.edamamAppId = this.getApiKey('edamam_app_id');
        this.edamamAppKey = this.getApiKey('edamam_app_key');
        
        this.spoonacularBaseUrl = 'https://api.spoonacular.com/recipes';
        this.edamamBaseUrl = 'https://api.edamam.com/api/recipes/v2';
        
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000;
        
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
    }

    getApiKey(service) {
        const key = localStorage.getItem(`mealmatch_${service}_key`);
        if (key) return key;
        
        const defaultKeys = {
            'spoonacular': 'YOUR_SPOONACULAR_API_KEY',
            'edamam_app_id': 'YOUR_EDAMAM_APP_ID',
            'edamam_app_key': 'YOUR_EDAMAM_APP_KEY'
        };
        
        return defaultKeys[service] || null;
    }

    setApiKey(service, key) {
        localStorage.setItem(`mealmatch_${service}_key`, key);
        if (service === 'spoonacular') {
            this.spoonacularApiKey = key;
        } else if (service === 'edamam_app_id') {
            this.edamamAppId = key;
        } else if (service === 'edamam_app_key') {
            this.edamamAppKey = key;
        }
    }

    async makeRequest(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        await this.waitForRateLimit();

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        
        this.lastRequestTime = Date.now();
    }

    
    async searchRecipes(params) {
        if (!this.spoonacularApiKey || this.spoonacularApiKey === 'YOUR_SPOONACULAR_API_KEY') {
            console.warn('Spoonacular API key not configured, using mock data');
            return this.getMockSearchResults(params);
        }

        const queryParams = new URLSearchParams({
            apiKey: this.spoonacularApiKey,
            number: params.number || 12,
            offset: params.offset || 0,
            addRecipeInformation: true,
            addRecipeInstructions: true,
            addRecipeNutrition: true,
            ...params
        });

        // Remove null/undefined parameters
        for (const [key, value] of queryParams.entries()) {
            if (value === null || value === undefined || value === '') {
                queryParams.delete(key);
            }
        }

        const url = `${this.spoonacularBaseUrl}/complexSearch?${queryParams}`;
        
        try {
            const data = await this.makeRequest(url);
            return this.transformSpoonacularResults(data);
        } catch (error) {
            console.error('Spoonacular search failed:', error);
            return this.getMockSearchResults(params);
        }
    }

    async getRecipeById(recipeId) {
        if (!this.spoonacularApiKey || this.spoonacularApiKey === 'YOUR_SPOONACULAR_API_KEY') {
            console.warn('Spoonacular API key not configured, using mock data');
            return this.getMockRecipe(recipeId);
        }

        const queryParams = new URLSearchParams({
            apiKey: this.spoonacularApiKey,
            includeNutrition: true
        });

        const url = `${this.spoonacularBaseUrl}/${recipeId}/information?${queryParams}`;
        
        try {
            const data = await this.makeRequest(url);
            return this.transformSpoonacularRecipe(data);
        } catch (error) {
            console.error('Spoonacular recipe fetch failed:', error);
            return this.getMockRecipe(recipeId);
        }
    }

    async getRandomRecipes(number = 10) {
        if (!this.spoonacularApiKey || this.spoonacularApiKey === 'YOUR_SPOONACULAR_API_KEY') {
            console.warn('Spoonacular API key not configured, using mock data');
            return this.getMockRandomRecipes(number);
        }

        const queryParams = new URLSearchParams({
            apiKey: this.spoonacularApiKey,
            number: number,
            limitLicense: true
        });

        const url = `${this.spoonacularBaseUrl}/random?${queryParams}`;
        
        try {
            const data = await this.makeRequest(url);
            return data.recipes?.map(recipe => this.transformSpoonacularRecipe(recipe)) || [];
        } catch (error) {
            console.error('Spoonacular random recipes failed:', error);
            return this.getMockRandomRecipes(number);
        }
    }

    // Edamam API Methods
    async searchEdamamRecipes(params) {
        if (!this.edamamAppId || this.edamamAppId === 'YOUR_EDAMAM_APP_ID') {
            console.warn('Edamam API keys not configured');
            return [];
        }

        const queryParams = new URLSearchParams({
            app_id: this.edamamAppId,
            app_key: this.edamamAppKey,
            type: 'public',
            q: params.query || '',
            diet: params.diet || '',
            health: params.health || '',
            calories: params.calories || '',
            from: params.from || 0,
            to: params.to || 10
        });

        // Remove empty parameters
        for (const [key, value] of queryParams.entries()) {
            if (!value) {
                queryParams.delete(key);
            }
        }

        const url = `${this.edamamBaseUrl}?${queryParams}`;
        
        try {
            const data = await this.makeRequest(url);
            return this.transformEdamamResults(data);
        } catch (error) {
            console.error('Edamam search failed:', error);
            return [];
        }
    }

    // Data Transformation Methods
    transformSpoonacularResults(data) {
        return {
            results: data.results?.map(recipe => this.transformSpoonacularRecipe(recipe)) || [],
            totalResults: data.totalResults || 0,
            offset: data.offset || 0,
            number: data.number || 0
        };
    }

    transformSpoonacularRecipe(recipe) {
        return {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            sourceUrl: recipe.sourceUrl,
            sourceName: recipe.sourceName,
            summary: recipe.summary,
            instructions: recipe.instructions || recipe.analyzedInstructions?.[0]?.steps?.map(step => step.step) || [],
            ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
            nutrition: recipe.nutrition ? {
                calories: Math.round(recipe.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0),
                protein: Math.round(recipe.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0),
                fat: Math.round(recipe.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0),
                carbs: Math.round(recipe.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0)
            } : null,
            dietLabels: recipe.diets || [],
            healthLabels: recipe.healthLabels || [],
            cuisines: recipe.cuisines || [],
            dishTypes: recipe.dishTypes || [],
            pricePerServing: recipe.pricePerServing,
            cheap: recipe.cheap,
            veryHealthy: recipe.veryHealthy,
            sustainable: recipe.sustainable,
            weightWatcherSmartPoints: recipe.weightWatcherSmartPoints,
            gaps: recipe.gaps,
            lowFodmap: recipe.lowFodmap,
            ketogenic: recipe.ketogenic,
            whole30: recipe.whole30,
            dairyFree: recipe.dairyFree,
            glutenFree: recipe.glutenFree,
            vegan: recipe.vegan,
            vegetarian: recipe.vegetarian
        };
    }

    transformEdamamResults(data) {
        return data.hits?.map(hit => ({
            id: hit.recipe.uri.split('#')[1],
            title: hit.recipe.label,
            image: hit.recipe.image,
            readyInMinutes: hit.recipe.totalTime || 30,
            servings: hit.recipe.yield || 4,
            sourceUrl: hit.recipe.url,
            sourceName: hit.recipe.source,
            summary: hit.recipe.ingredientLines?.join(', ') || '',
            instructions: hit.recipe.ingredientLines || [],
            ingredients: hit.recipe.ingredientLines || [],
            nutrition: {
                calories: Math.round(hit.recipe.calories),
                protein: Math.round(hit.recipe.totalNutrients?.PROCNT?.quantity || 0),
                fat: Math.round(hit.recipe.totalNutrients?.FAT?.quantity || 0),
                carbs: Math.round(hit.recipe.totalNutrients?.CHOCDF?.quantity || 0)
            },
            dietLabels: hit.recipe.dietLabels || [],
            healthLabels: hit.recipe.healthLabels || [],
            cuisines: hit.recipe.cuisineType || [],
            dishTypes: hit.recipe.dishType || []
        })) || [];
    }

   
    getMockSearchResults(params) {
        const mockRecipes = [
            {
                id: 1,
                title: `Delicious ${params.query || 'Chicken'} Recipe`,
                image: 'https://via.placeholder.com/300x200',
                readyInMinutes: 30,
                servings: 4,
                summary: 'A delicious and healthy recipe perfect for any meal.',
                instructions: [
                    'Preheat oven to 375°F (190°C)',
                    'Prepare ingredients',
                    'Cook for 25-30 minutes',
                    'Serve hot'
                ],
                ingredients: [
                    '2 cups flour',
                    '1 cup sugar',
                    '3 eggs',
                    '1/2 cup butter',
                    '1 tsp vanilla extract'
                ],
                nutrition: {
                    calories: 350,
                    protein: 25,
                    fat: 12,
                    carbs: 35
                },
                dietLabels: params.diet ? [params.diet] : ['Healthy'],
                healthLabels: ['Low Sugar'],
                cuisines: ['American'],
                dishTypes: ['Main Course']
            },
            {
                id: 2,
                title: `Quick ${params.query || 'Pasta'} Dinner`,
                image: 'https://via.placeholder.com/300x200',
                readyInMinutes: 20,
                servings: 2,
                summary: 'A quick and easy pasta dish perfect for busy weeknights.',
                instructions: [
                    'Boil water for pasta',
                    'Cook pasta according to package directions',
                    'Prepare sauce',
                    'Combine and serve'
                ],
                ingredients: [
                    '1 lb pasta',
                    '2 cups tomato sauce',
                    '1 cup cheese',
                    '2 cloves garlic',
                    '1 tbsp olive oil'
                ],
                nutrition: {
                    calories: 420,
                    protein: 18,
                    fat: 15,
                    carbs: 55
                },
                dietLabels: ['Vegetarian'],
                healthLabels: ['Low Sodium'],
                cuisines: ['Italian'],
                dishTypes: ['Main Course']
            },
            {
                id: 3,
                title: `Healthy ${params.query || 'Salad'} Bowl`,
                image: 'https://via.placeholder.com/300x200',
                readyInMinutes: 25,
                servings: 3,
                summary: 'A nutritious and colorful salad packed with fresh ingredients.',
                instructions: [
                    'Wash and chop vegetables',
                    'Prepare dressing',
                    'Toss all ingredients together',
                    'Serve immediately'
                ],
                ingredients: [
                    '4 cups mixed greens',
                    '1 cup cherry tomatoes',
                    '1 cucumber',
                    '1/2 cup feta cheese',
                    '2 tbsp olive oil'
                ],
                nutrition: {
                    calories: 180,
                    protein: 8,
                    fat: 12,
                    carbs: 15
                },
                dietLabels: ['Vegetarian', 'Gluten-Free'],
                healthLabels: ['Low Calorie'],
                cuisines: ['Mediterranean'],
                dishTypes: ['Salad']
            },
            {
                id: 4,
                title: `Spicy ${params.query || 'Tofu'} Stir-Fry`,
                image: 'https://via.placeholder.com/300x200',
                readyInMinutes: 35,
                servings: 4,
                summary: 'A flavorful and spicy stir-fry with vegetables and tofu.',
                instructions: [
                    'Press and cube tofu',
                    'Heat wok or large pan',
                    'Stir-fry vegetables',
                    'Add tofu and sauce',
                    'Serve over rice'
                ],
                ingredients: [
                    '1 block tofu',
                    '2 cups mixed vegetables',
                    '2 tbsp soy sauce',
                    '1 tbsp sesame oil',
                    '2 cloves garlic'
                ],
                nutrition: {
                    calories: 280,
                    protein: 20,
                    fat: 14,
                    carbs: 22
                },
                dietLabels: ['Vegan', 'Gluten-Free'],
                healthLabels: ['High Protein'],
                cuisines: ['Asian'],
                dishTypes: ['Main Course']
            }
        ];

        // Filter by diet if specified
        let filteredRecipes = mockRecipes;
        if (params.diet && params.diet !== 'all') {
            filteredRecipes = mockRecipes.filter(recipe => 
                recipe.dietLabels.some(label => 
                    label.toLowerCase() === params.diet.toLowerCase()
                )
            );
        }

        
        const offset = params.offset || 0;
        const number = params.number || 12;
        const paginatedRecipes = filteredRecipes.slice(offset, offset + number);

        return {
            results: paginatedRecipes,
            totalResults: filteredRecipes.length,
            offset: offset,
            number: paginatedRecipes.length
        };
    }

    getMockRecipe(recipeId) {
        const mockRecipes = {
            1: {
                id: 1,
                title: 'Delicious Chicken Recipe',
                image: 'https://via.placeholder.com/400x300',
                readyInMinutes: 30,
                servings: 4,
                summary: 'A delicious and healthy chicken recipe perfect for any meal.',
                instructions: [
                    'Preheat oven to 375°F (190°C)',
                    'Season chicken with salt, pepper, and herbs',
                    'Heat olive oil in a large oven-safe skillet',
                    'Sear chicken on both sides until golden brown',
                    'Transfer skillet to oven and bake for 20-25 minutes',
                    'Let rest for 5 minutes before serving',
                    'Serve with your favorite sides'
                ],
                ingredients: [
                    '4 boneless chicken breasts',
                    '2 tbsp olive oil',
                    '1 tsp salt',
                    '1/2 tsp black pepper',
                    '1 tsp dried herbs (thyme, rosemary, oregano)',
                    '3 cloves garlic, minced',
                    '1 lemon, juiced'
                ],
                nutrition: {
                    calories: 350,
                    protein: 45,
                    fat: 12,
                    carbs: 8
                },
                dietLabels: ['Gluten-Free', 'Dairy-Free'],
                healthLabels: ['High Protein', 'Low Carb'],
                cuisines: ['American'],
                dishTypes: ['Main Course']
            },
            2: {
                id: 2,
                title: 'Quick Pasta Dinner',
                image: 'https://via.placeholder.com/400x300',
                readyInMinutes: 20,
                servings: 2,
                summary: 'A quick and easy pasta dish perfect for busy weeknights.',
                instructions: [
                    'Bring a large pot of salted water to boil',
                    'Add pasta and cook according to package directions',
                    'Meanwhile, heat olive oil in a large skillet',
                    'Add garlic and sauté for 1 minute',
                    'Add tomato sauce and simmer for 5 minutes',
                    'Drain pasta and add to sauce',
                    'Toss with cheese and serve immediately'
                ],
                ingredients: [
                    '8 oz pasta',
                    '2 cups tomato sauce',
                    '1 cup grated Parmesan cheese',
                    '2 cloves garlic, minced',
                    '2 tbsp olive oil',
                    '1 tsp dried basil',
                    'Salt and pepper to taste'
                ],
                nutrition: {
                    calories: 420,
                    protein: 18,
                    fat: 15,
                    carbs: 55
                },
                dietLabels: ['Vegetarian'],
                healthLabels: ['Low Sodium'],
                cuisines: ['Italian'],
                dishTypes: ['Main Course']
            }
        };

        return mockRecipes[recipeId] || this.getMockRecipe(1);
    }

    getMockRandomRecipes(number) {
        const recipes = [];
        for (let i = 0; i < number; i++) {
            recipes.push(this.getMockRecipe(i + 1));
        }
        return recipes;
    }

    // Utility Methods
    clearCache() {
        this.cache.clear();
    }

    getCacheSize() {
        return this.cache.size;
    }

    isConfigured() {
        return (this.spoonacularApiKey && this.spoonacularApiKey !== 'YOUR_SPOONACULAR_API_KEY') ||
               (this.edamamAppId && this.edamamAppId !== 'YOUR_EDAMAM_APP_ID');
    }

    getConfigurationStatus() {
        return {
            spoonacular: !!this.spoonacularApiKey && this.spoonacularApiKey !== 'YOUR_SPOONACULAR_API_KEY',
            edamam: !!(this.edamamAppId && this.edamamAppKey) && 
                   this.edamamAppId !== 'YOUR_EDAMAM_APP_ID' && 
                   this.edamamAppKey !== 'YOUR_EDAMAM_APP_KEY'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIManager;
}
