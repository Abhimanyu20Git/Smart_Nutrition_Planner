require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const seedData = require('./config/seeder');
const Food = require('./models/Food');
const JunkFood = require('./models/JunkFood');
const { calculateTargets, optimizeMeals, generateMacroDiagnostics } = require('./utils/optimizer');
const { getFoodsWithFallback } = require('./utils/foodProvider');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect Database & Seed Data
connectDB().then(() => {
  seedData();
});

// Helper for formatting portion amounts
function formatAmount(item, mode) {
  const grams = item.amount_in_grams || 100;
  const unitWeight = parseFloat(item.unit_weight || 100.0);
  const unitName = (item.unit_name || 'portion').trim();
  
  let units = grams / unitWeight;
  if (Number.isInteger(units)) {
    units = parseInt(units, 10);
  } else {
    units = parseFloat(units.toFixed(1));
  }

  const countableUnits = ['piece', 'roti', 'fillet', 'cube', 'scoop', 'medium potato', 'banana', 'egg'];
  
  if (countableUnits.includes(unitName.toLowerCase())) {
    if (units === 1) {
      return `${units} ${unitName} (${grams}g)`;
    } else {
      let displayUnit = unitName + 's';
      if (unitName.toLowerCase() === 'medium potato') {
        displayUnit = 'medium potatoes';
      } else if (unitName.toLowerCase() === 'roti') {
        displayUnit = 'rotis';
      }
      return `${units} ${displayUnit} (${grams}g)`;
    }
  }

  return `${grams}g`;
}

// Routes

// Root Healthcheck & Welcome
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Smart Nutrition Planner API',
    version: '1.0.0',
    documentation: 'https://github.com/Abhimanyu20Git/Smart_Nutrition_Planner'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 1. Generate plan
app.post('/api/plan', async (req, res) => {
  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: "No data provided" });
    }

    const {
      weight,
      height,
      age,
      activityLevel,
      goal,
      budget,
      dietType,
      gender = 'male',
      noCook = false,
      measurementMode = 'grams',
      excludedFoods = []
    } = data;

    const excludedLower = (excludedFoods || []).map(f => f.toLowerCase().trim());
    
    let cheatCalories = parseInt(data.cheat_calories || 0, 10);
    if (isNaN(cheatCalories)) {
      cheatCalories = 0;
    }
    const recoveryMode = cheatCalories > 0;

    const targets = calculateTargets(weight, height, age, activityLevel, goal, gender);
    const originalTargetCalories = targets.calories;

    if (recoveryMode) {
      targets.calories = Math.max(0, targets.calories - cheatCalories);
    }

    // Get foods from external server with local fallback
    let allFoods = await getFoodsWithFallback();

    // Filter based on dietary style
    if (dietType === 'veg') {
      allFoods = allFoods.filter(f => 
        (f.tags || '').split(',').map(t => t.trim().toLowerCase()).includes('veg')
      );
    }

    // Filter based on no cook
    if (noCook) {
      allFoods = allFoods.filter(f => 
        (f.tags || '').split(',').map(t => t.trim().toLowerCase()).includes('no-cook')
      );
    }

    // Filter based on exclusions
    if (excludedLower.length > 0) {
      allFoods = allFoods.filter(f => {
        const nameLower = f.name.toLowerCase();
        const tagsList = (f.tags || '').split(',').map(t => t.trim().toLowerCase());
        
        return !excludedLower.some(ex => 
          nameLower.includes(ex) || tagsList.includes(ex)
        );
      });
    }

    let weeklyBudget = parseFloat(budget);
    if (isNaN(weeklyBudget)) {
      weeklyBudget = 700.0;
    }
    const dailyBudget = weeklyBudget / 7.0;

    const optimizationResult = optimizeMeals(allFoods, dailyBudget, targets, recoveryMode);

    const warnings = generateMacroDiagnostics(optimizationResult, targets, dailyBudget, dietType, noCook, excludedLower);
    const message = warnings.length > 0 ? warnings.join("<br><br>") : null;

    const response = {
      message,
      summary: {
        targetCalories: originalTargetCalories,
        achieved_calories: optimizationResult.total_calories + cheatCalories,
        targetProtein: targets.protein,
        total_protein: optimizationResult.total_protein,
        targetCarbs: targets.carbs,
        total_carbs: optimizationResult.total_carbs,
        targetFats: targets.fats,
        total_fats: optimizationResult.total_fats,
        targetFiber: targets.fiber,
        total_fiber: optimizationResult.total_fiber,
        daily_cost_estimate: parseFloat(optimizationResult.total_cost_estimate.toFixed(2)),
        daily_budget: parseFloat(dailyBudget.toFixed(2)),
        total_cost_estimate: parseFloat((optimizationResult.total_cost_estimate * 7).toFixed(2)),
        goal,
        dietType,
        noCook,
        measurementMode
      },
      meals: [
        {
          name: "Optimized Daily Selection",
          items: optimizationResult.selected_foods.map(f => ({
            name: f.name,
            amount: formatAmount(f, measurementMode),
            amount_in_grams: f.amount_in_grams,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fats: f.fats,
            fiber: f.fiber,
            cost: f.cost,
            tags: f.tags
          }))
        }
      ]
    };

    // Calculate junk food comparison savings
    const junkFoods = await JunkFood.find({});
    const junkFood = junkFoods.find(j => j.name.includes('Burger')) || junkFoods[0];

    if (junkFood) {
      const optimizedCost = optimizationResult.total_cost_estimate;
      const optimizedProtein = optimizationResult.total_protein;
      const optimizedCals = optimizationResult.total_calories;

      const optimizedCostPerG = optimizedProtein > 0 ? (optimizedCost / optimizedProtein) : 0;
      
      const junkCalsPerUnit = parseFloat(junkFood.calories);
      const junkUnits = junkCalsPerUnit > 0 ? (optimizedCals / junkCalsPerUnit) : 0;

      const junkCost = junkUnits * parseFloat(junkFood.cost);
      const junkProtein = junkUnits * parseFloat(junkFood.protein);
      const junkCostPerG = junkProtein > 0 ? (junkCost / junkProtein) : 0;

      response.comparison = {
        optimized_cost: parseFloat(optimizedCost.toFixed(2)),
        optimized_protein: parseFloat(optimizedProtein.toFixed(1)),
        optimized_cost_per_g: parseFloat(optimizedCostPerG.toFixed(2)),
        junk_name: `Typical Junk Diet (${junkFood.name})`,
        junk_cost: parseFloat(junkCost.toFixed(2)),
        junk_protein: parseFloat(junkProtein.toFixed(1)),
        junk_cost_per_g: parseFloat(junkCostPerG.toFixed(2)),
        savings_per_g: parseFloat((junkCostPerG - optimizedCostPerG).toFixed(2))
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Plan generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Get autocomplete list of food names
app.get('/api/foods', async (req, res) => {
  try {
    const foods = await getFoodsWithFallback();
    const foodNames = foods.map(f => f.name);
    res.json(foodNames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Search external databases
app.get('/api/foods/search-external', async (req, res) => {
  const query = req.query.query ? req.query.query.trim() : '';
  const source = req.query.source ? req.query.source.trim().toLowerCase() : 'openfoodfacts';

  if (!query) {
    return res.json([]);
  }

  try {
    if (source === 'usda') {
      const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=20&api_key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      const foods = data.foods || [];

      const results = foods.map(f => {
        const name = f.description || '';
        const brand = f.brandOwner || '';
        const fullName = brand ? `${name} (${brand})` : name;

        const nutrients = f.foodNutrients || [];
        let protein = 0.0;
        let carbs = 0.0;
        let fats = 0.0;
        let fiber = 0.0;

        for (const n of nutrients) {
          const nName = (n.nutrientName || '').toLowerCase();
          const val = parseFloat(n.value || 0.0);

          if (nName.includes('protein')) {
            protein = val;
          } else if (nName.includes('carbohydrate')) {
            carbs = val;
          } else if (nName.includes('total lipid') || nName.includes('fat')) {
            fats = val;
          } else if (nName.includes('fiber')) {
            fiber = val;
          }
        }

        return {
          name: fullName,
          protein: parseFloat(protein.toFixed(1)),
          carbs: parseFloat(carbs.toFixed(1)),
          fats: parseFloat(fats.toFixed(1)),
          fiber: parseFloat(fiber.toFixed(1)),
          source: 'USDA FDC'
        };
      });

      res.json(results);
    } else {
      // Open Food Facts
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SmartBudgetNutritionPlanner/1.0 (contact: support@example.com)'
        }
      });
      const data = await response.json();
      const products = data.products || [];

      const results = products
        .filter(p => p.product_name || p.product_name_en)
        .map(p => {
          const name = p.product_name || p.product_name_en;
          const brand = p.brands || '';
          const fullName = brand ? `${name} (${brand})` : name;

          const nutriments = p.nutriments || {};
          const protein = parseFloat(nutriments.proteins_100g || 0.0);
          const carbs = parseFloat(nutriments.carbohydrates_100g || 0.0);
          const fats = parseFloat(nutriments.fat_100g || 0.0);
          const fiber = parseFloat(nutriments.fiber_100g || 0.0);

          return {
            name: fullName,
            protein: parseFloat(protein.toFixed(1)),
            carbs: parseFloat(carbs.toFixed(1)),
            fats: parseFloat(fats.toFixed(1)),
            fiber: parseFloat(fiber.toFixed(1)),
            source: 'Open Food Facts'
          };
        });

      res.json(results);
    }
  } catch (error) {
    console.error('External API search error:', error);
    res.json([]);
  }
});

// 4. Get full food library list
app.get('/api/foods/library', async (req, res) => {
  try {
    const foods = await Food.find({});
    // Map _id to id for API consistency with original frontend
    const library = foods.map(f => ({
      id: f._id.toString(),
      name: f.name,
      protein: f.protein,
      carbs: f.carbs,
      fats: f.fats,
      fiber: f.fiber,
      cost: f.cost,
      conversion_ratio: f.conversion_ratio,
      tags: f.tags,
      unit_name: f.unit_name,
      unit_weight: f.unit_weight
    }));
    res.json(library);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Add custom food
app.post('/api/foods/add', async (req, res) => {
  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: "No data provided" });
    }

    const name = (data.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: "Food name is required" });
    }

    const protein = parseFloat(data.protein || 0.0);
    const carbs = parseFloat(data.carbs || 0.0);
    const fats = parseFloat(data.fats || 0.0);
    const fiber = parseFloat(data.fiber || 0.0);
    const cost = parseFloat(data.cost || 0.0);
    const tags = (data.tags || '').trim();
    const unit_name = (data.unitName || 'portion').trim();
    const unit_weight = parseFloat(data.unitWeight || 100.0);
    const conversion_ratio = parseFloat(data.conversionRatio || 1.0);

    if (isNaN(protein) || isNaN(carbs) || isNaN(fats) || isNaN(fiber) || isNaN(cost) || isNaN(unit_weight) || isNaN(conversion_ratio)) {
      return res.status(400).json({ error: "Invalid numeric values provided" });
    }

    await Food.save({
      name,
      protein,
      carbs,
      fats,
      fiber,
      cost,
      tags,
      unit_name: unit_name,
      unit_weight: unit_weight,
      conversion_ratio: conversion_ratio
    });
    res.status(201).json({ success: true, message: `Successfully added '${name}' to library.` });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Food with this name already exists in the library." });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// 6. Delete custom food
app.delete('/api/foods/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Food.findByIdAndDelete(id);
    res.json({ success: true, message: "Successfully deleted food item." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Startup Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
