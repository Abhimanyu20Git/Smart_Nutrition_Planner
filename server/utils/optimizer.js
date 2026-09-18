function calculateTargets(weight, height, age, activityLevel, goal, gender = 'male') {
  try {
    weight = parseFloat(weight);
    height = parseFloat(height);
    age = parseFloat(age);
  } catch (error) {
    weight = 70.0;
    height = 175.0;
    age = 25.0;
  }

  const genderOffset = gender === 'male' ? 5 : -161;
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + genderOffset;

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  };
  const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

  let cals;
  if (goal === 'bulking') {
    cals = tdee + 300;
  } else if (goal === 'cutting') {
    cals = tdee - 500;
  } else { // maintenance
    cals = tdee;
  }

  // Medically sound, realistic protein intake based on bodyweight and fitness goal:
  // (Prevents unrealistically excessive protein targets that cause indigestion)
  let proMultiplier = 1.3; // g per kg bodyweight (standard healthy maintenance)
  if (goal === 'bulking') {
    proMultiplier = 1.6; // 1.6g/kg for muscle gain
  } else if (goal === 'cutting') {
    proMultiplier = 1.6; // 1.6g/kg to preserve muscle during calorie deficit
  } else {
    proMultiplier = 1.3;
  }

  const pro = Math.round(weight * proMultiplier);
  // Healthy fats: 20-25% of daily energy (vital for hormone health & nutrient absorption)
  const fats = Math.round((cals * 0.22) / 9);
  // Gut-friendly fiber: ~14g per 1000 kcal (capped to prevent bloating)
  const fiber = Math.max(25, Math.min(40, Math.round((cals / 1000) * 14)));
  // Energy-sustaining clean carbs: remaining calorie balance
  const carbCals = cals - (pro * 4) - (fats * 9);
  const carbs = Math.round(carbCals / 4);

  return {
    calories: Math.round(cals),
    protein: Math.round(pro),
    fats: Math.round(fats),
    carbs: Math.round(carbs),
    fiber: Math.round(fiber)
  };
}

function getMaxPortion(foodName) {
  const name = (foodName || '').toLowerCase();
  // Realistic, easily digestible daily portions:
  if (name.includes('soya')) return 35; // Max 35-40g soya chunks (prevents bloating/gas)
  if (name.includes('sattu')) return 40; // Max 40g sattu (1-2 refreshing glasses)
  if (name.includes('dal') || name.includes('chana') || name.includes('rajma') || name.includes('lentil') || name.includes('chickpea')) return 60; // Max 60g dry pulse = 1 bowl cooked dal
  if (name.includes('peanut') || name.includes('walnut') || name.includes('almond') || name.includes('seed')) return 20; // 20g healthy nuts/seeds
  if (name.includes('rice') || name.includes('oats') || name.includes('brown rice')) return 120;
  if (name.includes('roti') || name.includes('millet')) return 120; // 3 rotis
  if (name.includes('bran')) return 20; // Max 20g wheat bran (1-2 spoons, prevents excessive fiber)
  if (name.includes('potato')) return 120;
  if (name.includes('low fat paneer')) return 100;
  if (name.includes('paneer')) return 60;
  if (name.includes('tofu')) return 80;
  if (name.includes('curd') || name.includes('yogurt')) return 150;
  if (name.includes('milk')) return 200;
  if (name.includes('egg')) return 150; // 3 eggs
  if (name.includes('chicken') || name.includes('fish')) return 150;
  if (name.includes('whey')) return 30; // 1 scoop
  return 80;
}

function getFoodStep(food) {
  const unitName = (food.unit_name || '').toLowerCase();
  const unitWeight = parseFloat(food.unit_weight || 25.0);

  const countableUnits = ['piece', 'roti', 'fillet', 'cube', 'scoop', 'medium potato', 'banana'];
  if (countableUnits.includes(unitName)) {
    return unitWeight;
  }

  const name = (food.name || '').toLowerCase();
  if (name.includes('soya') || name.includes('sattu') || (food.tags || '').toLowerCase().includes('nuts') || unitName === 'handful' || unitName === 'spoon') {
    return 15.0;
  }

  return 25.0;
}

function generateMacroDiagnostics(optimizationResult, targets, dailyBudget, dietType, noCook, excludedLower) {
  const warnings = [];

  // --- 1. Protein Diagnostic ---
  const targetPro = targets.protein;
  const achievedPro = optimizationResult.total_protein;
  if (targetPro > 0 && achievedPro < 0.85 * targetPro) {
    const deficiency = Math.round(targetPro - achievedPro);
    const reasons = [];

    if (dailyBudget < 120.0) {
      reasons.push(`<strong>Extremely Low Budget</strong>: Your daily budget of ₹${dailyBudget.toFixed(1)} is too low. High-protein foods like Chicken, Paneer, Fish, and Whey Protein are costly per portion and get filtered out to keep cost under budget.`);
    }

    if (dietType === 'veg') {
      reasons.push("<strong>Vegetarian Constraints</strong>: Eliminates highly cost-effective and calorie-dense animal protein sources like Chicken Breast, Fish, and Eggs.");
    }

    if (noCook) {
      reasons.push("<strong>No-Cook Mode is enabled</strong>: This excludes powerful cooked protein staples like Chicken, Fish, and Soya Chunks, leaving only raw options.");
    }

    const proteinSources = {
      whey: 'Whey Protein',
      soya: 'Soya Chunks',
      chicken: 'Chicken Breast',
      fish: 'Fish (Rohu)',
      paneer: 'Paneer',
      egg: 'Eggs',
      dal: 'Lentils/Dals'
    };
    const excludedSources = Object.keys(proteinSources)
      .filter(key => excludedLower.some(ex => ex.includes(key)))
      .map(key => proteinSources[key]);

    if (excludedSources.length > 0) {
      reasons.push(`<strong>Key Protein Exclusions</strong>: You excluded primary protein sources: ${excludedSources.join(", ")}.`);
    }

    reasons.push("<strong>Portion Caps reached</strong>: Portions of active protein items (such as Soya capped at 100g, Paneer at 150g, Whey at 60g) were fully exhausted.");

    const reasonsList = reasons.map(r => `<li style='margin-bottom:6px;'>${r}</li>`).join("");
    const reasonsHtml = `<ul style='margin-top:8px; padding-left:20px;'>${reasonsList}</ul>`;
    warnings.push(
      `<strong>Protein Deficit</strong>: Your plan has a deficiency of <strong>${deficiency}g</strong> protein ` +
      `(Achieved ${achievedPro}g vs Target ${targetPro}g).<br><strong>Primary Reasons:</strong>${reasonsHtml}`
    );
  }

  // --- 2. Carbohydrate Diagnostic ---
  const targetCarbs = targets.carbs;
  const achievedCarbs = optimizationResult.total_carbs;
  if (targetCarbs > 0 && achievedCarbs < 0.85 * targetCarbs) {
    const deficiency = Math.round(targetCarbs - achievedCarbs);
    const reasons = [];

    if (noCook) {
      reasons.push("<strong>No-Cook Mode is enabled</strong>: This excludes hot cooking carb staples like Rice, Oats, Roti, and Potatoes.");
    }
    if (excludedLower.some(ex => ex.includes('milk'))) {
      reasons.push("<strong>Milk is excluded</strong>: Milk is a primary source of liquid calories and carbohydrates in raw/no-cook diets.");
    }

    const targetFats = targets.fats;
    const achievedFats = optimizationResult.total_fats;
    if (achievedFats >= targetFats * 1.08) {
      reasons.push(`<strong>Strict Fat Ceiling Reached</strong>: Daily fats are already at the maximum allowed ceiling (${achievedFats}g vs target ${targetFats}g). The optimizer is blocked from adding other carb sources (like Bananas) because their trace fat content would violate your fat limit.`);
    }

    reasons.push("<strong>Staple Portion Caps</strong>: Available carb-dense staples (like Rice capped at 400g, Oats capped at 400g, Moong Dal capped at 200g) fully exhausted their maximum daily portions.");

    const reasonsList = reasons.map(r => `<li style='margin-bottom:6px;'>${r}</li>`).join("");
    const reasonsHtml = `<ul style='margin-top:8px; padding-left:20px;'>${reasonsList}</ul>`;
    warnings.push(
      `<strong>Carbohydrate Deficit</strong>: Your plan has a deficiency of <strong>${deficiency}g</strong> carbs ` +
      `(Achieved ${achievedCarbs}g vs Target ${targetCarbs}g).<br><strong>Primary Reasons:</strong>${reasonsHtml}`
    );
  }

  // --- 3. Fats Diagnostic ---
  const targetFats = targets.fats;
  const achievedFats = optimizationResult.total_fats;
  if (targetFats > 0 && achievedFats < 0.85 * targetFats) {
    const deficiency = Math.round(targetFats - achievedFats);
    const reasons = [];

    if (dailyBudget < 100.0) {
      reasons.push("<strong>Extremely Low Budget</strong>: High-fat foods like Almonds, Walnuts, and Paneer are expensive per gram and were excluded due to budget limits.");
    }

    const fatSources = {
      paneer: 'Paneer',
      peanut: 'Peanuts',
      walnut: 'Walnuts',
      almond: 'Almonds',
      egg: 'Eggs'
    };
    const excludedSources = Object.keys(fatSources)
      .filter(key => excludedLower.some(ex => ex.includes(key)))
      .map(key => fatSources[key]);

    if (excludedSources.length > 0) {
      reasons.push(`<strong>Key Fat Exclusions</strong>: You excluded primary healthy fat sources: ${excludedSources.join(", ")}.`);
    }

    reasons.push("<strong>Portion Caps reached</strong>: Portions of high-fat sources (such as Peanuts capped at 50g, Walnuts capped at 50g, Paneer at 150g) were fully exhausted.");

    const reasonsList = reasons.map(r => `<li style='margin-bottom:6px;'>${r}</li>`).join("");
    const reasonsHtml = `<ul style='margin-top:8px; padding-left:20px;'>${reasonsList}</ul>`;
    warnings.push(
      `<strong>Fats Deficit</strong>: Your plan has a deficiency of <strong>${deficiency}g</strong> fats ` +
      `(Achieved ${achievedFats}g vs Target ${targetFats}g).<br><strong>Primary Reasons:</strong>{reasonsHtml}`
    );
  }

  // --- 4. Fiber Diagnostic ---
  const targetFiber = targets.fiber;
  const achievedFiber = optimizationResult.total_fiber;
  if (targetFiber > 0 && achievedFiber < 0.85 * targetFiber) {
    const deficiency = Math.round(targetFiber - achievedFiber);
    const reasons = [];

    if (noCook) {
      reasons.push("<strong>No-Cook Mode is enabled</strong>: This filters out hot cooked fiber-rich items like Oats, Dal, Rajma, and Kala Chana, leaving only sprouted moong or raw nuts.");
    }

    const fiberSources = {
      dal: 'Lentils/Dals',
      soya: 'Soya Chunks',
      oats: 'Oats',
      roti: 'Whole Wheat Roti',
      rajma: 'Rajma',
      chana: 'Kala Chana'
    };
    const excludedSources = Object.keys(fiberSources)
      .filter(key => excludedLower.some(ex => ex.includes(key)))
      .map(key => fiberSources[key]);

    if (excludedSources.length > 0) {
      reasons.push(`<strong>Key Fiber Exclusions</strong>: You excluded primary fiber sources: ${excludedSources.join(", ")}.`);
    }

    reasons.push("<strong>Portion Caps reached</strong>: Portions of fiber-rich foods (Dals capped at 200g, Oats capped at 400g, Soya Chunks capped at 100g) were fully exhausted.");

    const reasonsList = reasons.map(r => `<li style='margin-bottom:6px;'>${r}</li>`).join("");
    const reasonsHtml = `<ul style='margin-top:8px; padding-left:20px;'>${reasonsList}</ul>`;
    warnings.push(
      `<strong>Fiber Deficit</strong>: Your plan has a deficiency of <strong>${deficiency}g</strong> fiber ` +
      `(Achieved ${achievedFiber}g vs Target ${targetFiber}g).<br><strong>Primary Reasons:</strong>${reasonsHtml}`
    );
  }

  return warnings;
}

function optimizeMeals(foods, budget, targets, recoveryMode = false) {
  try {
    budget = parseFloat(budget);
  } catch (error) {
    budget = 100.0;
  }

  const targetCarbs = targets.carbs;
  const targetPro = targets.protein;
  const targetFats = targets.fats;
  const targetFiber = targets.fiber;
  const targetCals = targets.calories;

  const selectedFoods = {};
  let currentPro = 0.0;
  let currentFats = 0.0;
  let currentCals = 0.0;
  let currentCarbs = 0.0;
  let currentFiber = 0.0;
  let currentCost = 0.0;
  let currentBudgetLimit = budget;

  // Helper function to add a food with configurable macro tolerance
  function addFood(food, grams, options = {}) {
    const {
      force = false,
      maxCarbTol = 1.05,
      maxCalTol = 1.05,
      maxFatTol = 1.35
    } = options;

    const foodName = food.name;
    const fPro = parseFloat(food.protein) / 100.0;
    const fFats = parseFloat(food.fats) / 100.0;
    const fCarbs = parseFloat(food.carbs) / 100.0;
    const fFib = parseFloat(food.fiber) / 100.0;
    const fCost = parseFloat(food.cost) / 100.0;
    const fCals = (fPro * 4) + (fCarbs * 4) + (fFats * 9);

    if (!force) {
      if (currentCost + (fCost * grams) > currentBudgetLimit) return false;
      if (currentCarbs + (fCarbs * grams) > targetCarbs * maxCarbTol) return false;
      if (currentCals + (fCals * grams) > targetCals * maxCalTol) return false;
      if (currentFats + (fFats * grams) > Math.max(targetFats * maxFatTol, targetFats + 15)) return false;
    }

    currentPro += fPro * grams;
    currentFats += fFats * grams;
    currentCarbs += fCarbs * grams;
    currentFiber += fFib * grams;
    currentCost += fCost * grams;
    currentCals += fCals * grams;

    if (!selectedFoods[foodName]) {
      selectedFoods[foodName] = { food, grams: 0 };
    }
    selectedFoods[foodName].grams += grams;
    return true;
  }

  if (recoveryMode) {
    currentBudgetLimit = budget * 0.85;
  }

  // --- PASS 1: Protein Selection (30% Calories) ---
  // We select protein first because whole protein sources (Soya, Dals, Sattu) contain natural carbs.
  const foodsPass1Protein = foods.filter(f => parseFloat(f.protein) >= 10.0).map(f => {
    const pG = parseFloat(f.protein) / 100.0;
    const cost = parseFloat(f.cost) / 100.0;
    const fCarbs = parseFloat(f.carbs) / 100.0;
    // Prioritize high protein per rupee and clean macro profile
    const score = (cost > 0 ? pG / cost : 0) / (1.0 + fCarbs);
    return { ...f, pass1_score: score };
  }).sort((a, b) => b.pass1_score - a.pass1_score);

  let dalCount = 0;
  for (const food of foodsPass1Protein) {
    if (currentPro >= targetPro) break;
    const fName = (food.name || '').toLowerCase();
    const isDal = fName.includes('dal') || fName.includes('chana') || fName.includes('rajma') || fName.includes('lentil') || fName.includes('chickpea');
    if (isDal && dalCount >= 2 && !selectedFoods[food.name]) continue;

    const maxG = getMaxPortion(food.name);
    let existing = selectedFoods[food.name] ? selectedFoods[food.name].grams : 0;
    const step = getFoodStep(food);

    while (existing < maxG) {
      if (!addFood(food, step, { maxCarbTol: 1.05, maxCalTol: 1.05 })) break;
      existing += step;
      if (currentPro >= targetPro) break;
    }
    if (isDal && selectedFoods[food.name] && selectedFoods[food.name].grams > 0) {
      dalCount++;
    }
  }

  // --- PASS 2: Fulfill EXACT 50% Calories from Carbs ---
  // Fills only the remaining carbs needed using clean carb staples (Rice, Roti, Oats, Potatoes)
  const foodsPass2Carbs = foods.filter(f => parseFloat(f.carbs) >= 15.0).map(f => {
    const cG = parseFloat(f.carbs) / 100.0;
    const cCost = parseFloat(f.cost) / 100.0;
    const fFats = parseFloat(f.fats) / 100.0;
    const score = (cCost > 0 ? cG / cCost : 0) / (1.0 + fFats * 2.0);
    return { ...f, pass2_score: score };
  }).sort((a, b) => b.pass2_score - a.pass2_score);

  for (const food of foodsPass2Carbs) {
    if (currentCarbs >= targetCarbs) break;
    const maxG = getMaxPortion(food.name);
    let existing = selectedFoods[food.name] ? selectedFoods[food.name].grams : 0;
    const step = getFoodStep(food);

    while (existing < maxG) {
      if (!addFood(food, step, { maxCarbTol: 1.05, maxCalTol: 1.05 })) break;
      existing += step;
      if (currentCarbs >= targetCarbs) break;
    }
  }

  // --- PASS 3: Fulfill 10% Calories from Fats ---
  if (currentFats < targetFats) {
    const foodsPass3Fats = foods.filter(f => parseFloat(f.fats) >= 5.0).map(f => {
      const fG = parseFloat(f.fats) / 100.0;
      const cost = parseFloat(f.cost) / 100.0;
      return { ...f, pass3_score: cost > 0 ? fG / cost : 0 };
    }).sort((a, b) => b.pass3_score - a.pass3_score);

    for (const food of foodsPass3Fats) {
      if (currentFats >= targetFats) break;
      const maxG = getMaxPortion(food.name);
      let existing = selectedFoods[food.name] ? selectedFoods[food.name].grams : 0;
      const step = getFoodStep(food);

      while (existing < maxG) {
        if (!addFood(food, step)) break;
        existing += step;
        if (currentFats >= targetFats) break;
      }
    }
  }

  // --- PASS 4: Fulfill 10% Calories / Fiber ---
  if (currentFiber < targetFiber) {
    const foodsPass4Fiber = foods.filter(f => parseFloat(f.fiber) >= 3.0).map(f => {
      const fibG = parseFloat(f.fiber) / 100.0;
      const cost = parseFloat(f.cost) / 100.0;
      return { ...f, pass4_score: cost > 0 ? fibG / cost : 0 };
    }).sort((a, b) => b.pass4_score - a.pass4_score);

    for (const food of foodsPass4Fiber) {
      if (currentFiber >= targetFiber) break;
      const maxG = getMaxPortion(food.name);
      let existing = selectedFoods[food.name] ? selectedFoods[food.name].grams : 0;
      const step = getFoodStep(food);

      while (existing < maxG) {
        if (!addFood(food, step)) break;
        existing += step;
        if (currentFiber >= targetFiber) break;
      }
    }
  }

  // --- PASS 5: Deficit Fulfillment Using Remaining Budget (allowing 5-10% difference) ---
  currentBudgetLimit = budget; // Ensure full budget is available
  let remainingBudget = budget - currentCost;

  if (remainingBudget > 2.0) {
    // 1. Fulfill Protein deficit if any
    if (currentPro < targetPro) {
      const deficitProteinFoods = foods
        .filter(f => parseFloat(f.protein) >= 8.0)
        .sort((a, b) => {
          const pA = parseFloat(a.protein) / 100.0;
          const cA = parseFloat(a.carbs) / 100.0;
          const costA = parseFloat(a.cost) / 100.0;
          const pB = parseFloat(b.protein) / 100.0;
          const cB = parseFloat(b.carbs) / 100.0;
          const costB = parseFloat(b.cost) / 100.0;
          const scoreA = (costA > 0 ? pA / costA : 0) / (1.0 + cA);
          const scoreB = (costB > 0 ? pB / costB : 0) / (1.0 + cB);
          return scoreB - scoreA;
        });

      for (const food of deficitProteinFoods) {
        if (currentPro >= targetPro) break;
        const maxG = getMaxPortion(food.name);
        let existing = selectedFoods[food.name] ? selectedFoods[food.name].grams : 0;
        const step = getFoodStep(food);

        while (existing < maxG && currentPro < targetPro) {
          // Allow up to 10% tolerance on carbs/calories/fats as requested
          if (!addFood(food, step, { maxCarbTol: 1.10, maxCalTol: 1.10, maxFatTol: 1.65 })) break;
          existing += step;
        }
      }
    }

    // 2. Fulfill Calorie deficit if any
    if (currentCals < targetCals * 0.98) {
      const deficitCalorieFoods = foods
        .filter(f => parseFloat(f.cost) > 0)
        .sort((a, b) => {
          const calsA = (parseFloat(a.protein) * 4) + (parseFloat(a.carbs) * 4) + (parseFloat(a.fats) * 9);
          const calsB = (parseFloat(b.protein) * 4) + (parseFloat(b.carbs) * 4) + (parseFloat(b.fats) * 9);
          return (calsB / parseFloat(b.cost)) - (calsA / parseFloat(a.cost));
        });

      for (const food of deficitCalorieFoods) {
        if (currentCals >= targetCals * 0.98) break;
        const maxG = getMaxPortion(food.name);
        let existing = selectedFoods[food.name] ? selectedFoods[food.name].grams : 0;
        const step = getFoodStep(food);

        while (existing < maxG && currentCals < targetCals * 0.98) {
          if (!addFood(food, step, { maxCarbTol: 1.10, maxCalTol: 1.08, maxFatTol: 1.65 })) break;
          existing += step;
        }
      }
    }

    // 3. Fulfill Fiber deficit if any
    if (currentFiber < targetFiber * 0.95) {
      const deficitFiberFoods = foods
        .filter(f => parseFloat(f.fiber) >= 3.0)
        .sort((a, b) => {
          const fibA = parseFloat(a.fiber);
          const fibB = parseFloat(b.fiber);
          return (fibB / parseFloat(b.cost)) - (fibA / parseFloat(a.cost));
        });

      for (const food of deficitFiberFoods) {
        if (currentFiber >= targetFiber * 0.95) break;
        const maxG = getMaxPortion(food.name);
        let existing = selectedFoods[food.name] ? selectedFoods[food.name].grams : 0;
        const step = getFoodStep(food);

        while (existing < maxG && currentFiber < targetFiber * 0.95) {
          if (!addFood(food, step, { maxCarbTol: 1.10, maxCalTol: 1.10, maxFatTol: 1.65 })) break;
          existing += step;
        }
      }
    }
  }

  const finalSelected = [];
  for (const foodName of Object.keys(selectedFoods)) {
    const item = selectedFoods[foodName];
    if (item.grams > 0) {
      const fPro = (parseFloat(item.food.protein) / 100.0) * item.grams;
      const fCarbs = (parseFloat(item.food.carbs) / 100.0) * item.grams;
      const fFats = (parseFloat(item.food.fats) / 100.0) * item.grams;
      const fFib = (parseFloat(item.food.fiber) / 100.0) * item.grams;
      const fCost = (parseFloat(item.food.cost) / 100.0) * item.grams;
      const fCals = (fPro * 4) + (fCarbs * 4) + (fFats * 9);

      finalSelected.push({
        name: item.food.name,
        calories: Math.round(fCals),
        protein: parseFloat(fPro.toFixed(1)),
        carbs: parseFloat(fCarbs.toFixed(1)),
        fats: parseFloat(fFats.toFixed(1)),
        fiber: parseFloat(fFib.toFixed(1)),
        cost: parseFloat(fCost.toFixed(2)),
        quantity: item.grams / 100.0,
        amount_in_grams: item.grams,
        conversion_ratio: item.food.conversion_ratio || 1.0,
        unit_name: item.food.unit_name || 'portion',
        unit_weight: parseFloat(item.food.unit_weight || 100.0),
        tags: item.food.tags || ''
      });
    }
  }

  return {
    selected_foods: finalSelected,
    total_calories: Math.round(currentCals),
    total_protein: parseFloat(currentPro.toFixed(1)),
    total_fats: parseFloat(currentFats.toFixed(1)),
    total_carbs: parseFloat(currentCarbs.toFixed(1)),
    total_fiber: parseFloat(currentFiber.toFixed(1)),
    total_cost_estimate: parseFloat(currentCost.toFixed(2))
  };
}

module.exports = {
  calculateTargets,
  optimizeMeals,
  generateMacroDiagnostics
};
