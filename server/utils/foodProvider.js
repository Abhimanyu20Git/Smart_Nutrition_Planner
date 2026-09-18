const Food = require('../models/Food');

// In-memory cache
let cachedFoods = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

/**
 * Parses and extracts macros from USDA FoodData Central nutrients array
 */
function extractNutrients(foodNutrients = []) {
  let protein = 0.0;
  let carbs = 0.0;
  let fats = 0.0;
  let fiber = 0.0;

  for (const n of foodNutrients) {
    const name = (n.nutrientName || '').toLowerCase();
    const val = parseFloat(n.value || 0.0);
    if (name.includes('protein')) {
      protein = val;
    } else if (name.includes('carbohydrate') && !name.includes('fiber')) {
      carbs = val;
    } else if (name.includes('total lipid') || name === 'fat') {
      fats = val;
    } else if (name.includes('fiber')) {
      fiber = val;
    }
  }

  return {
    protein: parseFloat(protein.toFixed(1)),
    carbs: parseFloat(carbs.toFixed(1)),
    fats: parseFloat(fats.toFixed(1)),
    fiber: parseFloat(fiber.toFixed(1))
  };
}

/**
 * Fetches foods from external free server.
 * If external server fails, times out, or has an error,
 * it automatically and seamlessly falls back to the local database.
 */
async function getFoodsWithFallback() {
  const now = Date.now();

  // Return cached result if fresh
  if (cachedFoods && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedFoods;
  }

  // Always load local foods first as the baseline foundation
  const localFoods = await Food.find({});

  try {
    console.log('[FoodProvider] Requesting food items from external free server...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const queries = ['paneer rice chicken lentils', 'vegetables fruit nuts dal'];
    const selectedQuery = queries[Math.floor(Math.random() * queries.length)];
    const externalUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(selectedQuery)}&pageSize=25&api_key=DEMO_KEY`;

    const response = await fetch(externalUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`External server returned status ${response.status}`);
    }

    const data = await response.json();
    const externalItems = (data && data.foods) ? data.foods : [];

    if (externalItems.length === 0) {
      throw new Error('External server returned zero items');
    }

    // Map external items to our food schema
    const mappedExternal = [];
    for (const item of externalItems) {
      const { protein, carbs, fats, fiber } = extractNutrients(item.foodNutrients);
      
      // Clean up description
      let name = (item.description || '').split(',')[0].trim();
      if (!name || name.length < 3) continue;
      name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

      // Determine basic tag
      const lower = name.toLowerCase();
      let tags = 'veg';
      if (lower.includes('chicken') || lower.includes('meat') || lower.includes('fish') || lower.includes('egg')) {
        tags = 'non-veg';
      }
      if (lower.includes('salad') || lower.includes('fruit') || lower.includes('nut') || lower.includes('milk') || lower.includes('yogurt') || lower.includes('paneer')) {
        tags += ', no-cook';
      }

      mappedExternal.push({
        name,
        protein,
        carbs,
        fats,
        fiber,
        cost: tags.includes('non-veg') ? 25.0 : 12.0, // Reasonable estimated cost per 100g
        conversion_ratio: 1.0,
        tags,
        unit_name: 'portion',
        unit_weight: 100.0,
        source: 'external_server'
      });
    }

    // Combine local foods + unique external foods
    const combined = [...localFoods];
    const existingNames = new Set(localFoods.map(f => (f.name || '').toLowerCase()).filter(Boolean));

    for (const ext of mappedExternal) {
      const extNameLower = (ext.name || '').toLowerCase();
      if (extNameLower && !existingNames.has(extNameLower)) {
        combined.push(ext);
        existingNames.add(extNameLower);
      }
    }

    console.log(`[FoodProvider] Successfully fetched from external server! Combined items: ${combined.length}`);
    cachedFoods = combined;
    lastCacheTime = now;
    return combined;

  } catch (error) {
    console.warn(`[FoodProvider] External server issue: ${error.message}.`);
    console.log(`[FoodProvider] Falling back to local database (${localFoods.length} items).`);
    return localFoods;
  }
}

module.exports = {
  getFoodsWithFallback
};
