#  MealMatch

##  Overview

MealMatch is a web application designed to make healthy eating easier and more enjoyable. It helps users discover recipes based on their dietary needs, preferences and available ingredients. The app simplifies meal planning by combining recipe search, nutrition insights and organization tools in one place.

---

##  Purpose

Many recipe platforms lack strong filtering options or clear nutritional information, making healthy eating difficult. MealMatch solves this problem by providing:

* Smart recipe search
* Dietary filters (vegan, keto, gluten-free)
* Nutrition details
* Meal planning tools
* Shopping list generation

---

##  Target Audience

MealMatch is designed for:

* Health-conscious individuals tracking nutrition
* People with dietary restrictions (vegetarian, vegan, keto, gluten-free)
* Busy students and professionals
* Home cooks planning weekly meals

---

##  Features

###  Recipe Search

Search recipes by keyword or ingredients using the Spoonacular API.

###  Filters

Refine results by dietary preferences such as:

* Vegan
* Vegetarian
* Keto
* Gluten-free

###  Recipe Details

View:

* Ingredients
* Cooking instructions
* Preparation time
* Servings

### ❤️ Favorites

Save recipes locally using browser storage.

### 📅 Meal Planner

Organize recipes into a weekly meal plan.

### 🛒 Shopping List

Automatically generate a grocery list based on selected meals.

###  Responsive Design

Fully responsive across mobile and desktop devices.

---

## 🛠️ Technologies Used

* HTML5
* CSS
* JavaScript 
* Vite (development environment)
* Spoonacular API
* Local Storage (for saving data)

---

##  Project Structure

```
mealmatch/
├── index.html
├── style.css
├── src/
│   ├── main.js
│   ├── api.js
│   ├── search.js
│   ├── favorites.js
│   ├── planner.js
│   ├── shoppingList.js
│   └── utils.js
├── public/
└── package.json
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```
git clone https://github.com/aguer47/final-project.git
```

### 2. Navigate into the project

```
cd mealmatch
```

### 3. Install dependencies

```
npm install
```

### 4. Run the development server

```
npm run dev
```

### 5. Open in browser

```
http://localhost:5173/
```

---

##  API Configuration

This project uses the Spoonacular API.

To configure your API key:

### Option 1: Use `.env`

```
VITE_SPOONACULAR_KEY=your_api_key_here
```

### Option 2: Set in localStorage

```
localStorage.setItem('mealmatch_spoonacular_key', 'your_api_key_here');
```

---

## Challenges

* Managing API rate limits and authentication
* Handling dynamic data with vanilla JavaScript
* Maintaining clean modular code structure
* Ensuring responsive design across devices

---

## 📈 Future Improvements

* Add user authentication
* Improve UI animations and transitions
* Add more advanced filtering options
* Enhance accessibility (WCAG compliance)

---

##  Author

**Aguer Majok**

---

##  License

This project is for educational purposes. personal project
