import { searchRecipes } from './api.js';

// This file is deprecated - search functionality is now handled in main.js
// Keeping this file for backward compatibility, but it should be removed in future versions

export async function runSearch(query) {
  console.warn('search.js is deprecated. Use main.js search functionality instead.');
  return;
}