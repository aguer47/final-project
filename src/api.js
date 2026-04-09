// Majok Aguer - mealmatch

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
        
        if (key && key !== 'YOUR_SPOONACULAR_API_KEY' && key !== 'YOUR_EDAMAM_APP_ID' && key !== 'YOUR_EDAMAM_APP_KEY') {
            return key;
        }
        
        const defaultKeys = {
            'spoonacular': '7d11928423cf461f8b4c31ce143eb692',
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
        console.log('API Key:', this.spoonacularApiKey);
        
        if (!this.spoonacularApiKey) {
            throw new Error('Spoonacular API key not configured');
        }

        // Build query parameters manually to avoid issues
        const queryParams = new URLSearchParams();
        queryParams.append('apiKey', this.spoonacularApiKey);
        queryParams.append('number', params.number || 12);
        queryParams.append('offset', params.offset || 0);
        queryParams.append('addRecipeInformation', 'true');
        queryParams.append('addRecipeInstructions', 'true');
        queryParams.append('addRecipeNutrition', 'true');
        
        // Add additional parameters
        if (params.query) {
            queryParams.append('query', params.query);
        }
        if (params.diet) {
            queryParams.append('diet', params.diet);
        }
        if (params.cuisine) {
            queryParams.append('cuisine', params.cuisine);
        }
        if (params.type) {
            queryParams.append('type', params.type);
        }

        const url = `${this.spoonacularBaseUrl}/complexSearch?${queryParams.toString()}`;
        console.log('API URL:', url);
        
        try {
            const data = await this.makeRequest(url);
            console.log('API Response:', data);
            return this.transformSpoonacularResults(data);
        } catch (error) {
            console.error('Spoonacular search failed:', error);
            
            // Handle specific API errors
            if (error.message.includes('402')) {
                throw new Error('API key issue: The API key may be invalid or has reached its daily limit. Please try again tomorrow or check your API key.');
            } else if (error.message.includes('401')) {
                throw new Error('API key unauthorized: Please check your Spoonacular API key.');
            }
            
            throw error;
        }
    }

    async getRecipeById(recipeId) {
        console.log('API Key:', this.spoonacularApiKey);
        
        if (!this.spoonacularApiKey) {
            throw new Error('Spoonacular API key not configured');
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
            throw error;
        }
    }

    transformSpoonacularResults(data) {
        return {
            results: data.results || [],
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
            summary: recipe.summary,
            instructions: recipe.instructions?.map(step => step.step) || [],
            ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
            nutrition: recipe.nutrition,
            diets: recipe.diets || [],
            dishTypes: recipe.dishTypes || []
        };
    }
}

// Export for use in other files
export { APIManager };