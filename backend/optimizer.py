def calculate_targets(weight, height, age, activity_level, goal, gender='male'):
    """Calculate daily macro targets using the Mifflin-St Jeor equation.
    
    BMR (Male)   = (10 × weight_kg) + (6.25 × height_cm) - (5 × age_yr) + 5
    BMR (Female) = (10 × weight_kg) + (6.25 × height_cm) - (5 × age_yr) - 161
    TDEE = BMR × activity_multiplier
    """
    try:
        weight = float(weight)
        height = float(height)
        age = float(age)
    except (TypeError, ValueError):
        weight = 70.0
        height = 175.0
        age = 25.0

    # Mifflin-St Jeor: gender-specific constant
    gender_offset = 5 if gender == 'male' else -161
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + gender_offset

    activity_multipliers = {
        'sedentary': 1.2,   # Little/no exercise
        'light': 1.375,     # Light exercise 1-3 days/week
        'moderate': 1.55,   # Moderate exercise 3-5 days/week
        'active': 1.725     # Hard exercise 6-7 days/week
    }
    tdee = bmr * activity_multipliers.get(activity_level, 1.2)

    if goal == 'bulking':
        cals = tdee + 300
        pro = weight * 2.0
        fats = weight * 0.8
    elif goal == 'cutting':
        cals = tdee - 500
        pro = weight * 2.2
        fats = weight * 0.7  # Min 0.7g/kg for hormonal health
    else:  # maintenance
        cals = tdee
        pro = weight * 1.8
        fats = weight * 0.7

    # Remaining calories from carbs (4 kcal/g protein, 4 kcal/g carb, 9 kcal/g fat)
    carbs = (cals - (pro * 4) - (fats * 9)) / 4
    if carbs < 0:
        carbs = 0

    # IOM recommendation: 14g fiber per 1000 kcal
    fiber = (cals / 1000.0) * 14.0

    return {
        "calories": round(cals),
        "protein": round(pro),
        "fats": round(fats),
        "carbs": round(carbs),
        "fiber": round(fiber)
    }

def get_max_portion(food_name):
    name = food_name.lower()
    if 'soya' in name: return 100
    if 'peanut' in name or 'walnut' in name or 'almond' in name: return 50
    if 'rice' in name or 'oats' in name or 'roti' in name or 'potato' in name: return 400
    if 'milk' in name or 'curd' in name: return 500
    if 'paneer' in name: return 150
    if 'egg' in name: return 200
    if 'whey' in name: return 60
    return 200

def optimize_meals(foods, budget, targets, recovery_mode=False):
    try:
        budget = float(budget)
    except (TypeError, ValueError):
        budget = 100.0

    target_pro = targets['protein']
    target_fats = targets['fats']
    target_cals = targets['calories']
    target_carbs = targets['carbs']

    selected_foods = {}
    current_pro = 0.0
    current_fats = 0.0
    current_cals = 0.0
    current_carbs = 0.0
    current_fiber = 0.0
    current_cost = 0.0
    current_budget_limit = budget
    STEP_GRAMS = 50

    # Helper function to add a food
    def add_food(food, grams, force=False):
        nonlocal current_pro, current_fats, current_cals, current_carbs, current_fiber, current_cost
        food_name = food['name']
        f_pro = float(food['protein']) / 100.0
        f_fats = float(food['fats']) / 100.0
        f_carbs = float(food['carbs']) / 100.0
        f_fib = float(food['fiber']) / 100.0
        f_cost = float(food['cost']) / 100.0
        f_cals = (f_pro * 4) + (f_carbs * 4) + (f_fats * 9)

        if not force:
            if current_cost + (f_cost * grams) > current_budget_limit:
                return False
            if current_cals + (f_cals * grams) > target_cals * 1.05:
                return False
            if current_fats + (f_fats * grams) > target_fats * 1.10:
                return False
            if f_pro > 0.15 and current_pro + (f_pro * grams) > target_pro * 1.10:
                return False

        current_pro += f_pro * grams
        current_fats += f_fats * grams
        current_carbs += f_carbs * grams
        current_fiber += f_fib * grams
        current_cost += f_cost * grams
        current_cals += f_cals * grams

        if food_name not in selected_foods:
            selected_foods[food_name] = {"food": food, "grams": 0}
        selected_foods[food_name]['grams'] += grams
        return True

    # --- PASS 0: Baseline Fats ---
    if recovery_mode:
        current_budget_limit = budget * 0.85
        
    fat_floor = max(target_fats * 0.5, 25.0)
    if fat_floor > target_fats:
        fat_floor = target_fats

    for food in foods:
        f_g = float(food['fats']) / 100.0
        c_cost = float(food['cost']) / 100.0
        food['pass0_score'] = f_g / c_cost if c_cost > 0 else 0
        
    foods_pass0 = sorted(foods, key=lambda x: x['pass0_score'], reverse=True)
    
    for food in foods_pass0:
        if current_fats >= fat_floor:
            break
        max_g = get_max_portion(food['name'])
        existing = selected_foods.get(food['name'], {}).get('grams', 0)
        
        while existing < max_g:
            if not add_food(food, STEP_GRAMS):
                break
            existing += STEP_GRAMS
            if current_fats >= fat_floor:
                break

    # --- PASS 1: Select foods to hit Protein Target ---
    for food in foods:
        p_g = float(food['protein']) / 100.0
        cost = float(food['cost']) / 100.0
        
        if recovery_mode:
            cals = (float(food['protein']) * 4 + float(food['carbs']) * 4 + float(food['fats']) * 9) / 100.0
            name_lower = food['name'].lower()
            recovery_boost = 1.0
            if any(x in name_lower for x in ['soya', 'chicken', 'egg', 'whey', 'fish']):
                recovery_boost = 5.0
            food['pass1_score'] = (p_g / cals if cals > 0 else 0) * recovery_boost
        else:
            food['pass1_score'] = p_g / cost if cost > 0 else 0

    foods_pass1 = sorted(foods, key=lambda x: x['pass1_score'], reverse=True)

    for food in foods_pass1:
        if current_pro >= target_pro:
            break

        max_g = get_max_portion(food['name'])
        existing = selected_foods.get(food['name'], {}).get('grams', 0)
        
        while existing < max_g:
            if not add_food(food, STEP_GRAMS):
                break
            existing += STEP_GRAMS
            if current_pro >= target_pro:
                break

    # --- PASS 1.5: Fiber Check ---
    if current_fiber < targets['fiber'] * 0.5:
        for food in foods:
            fib_g = float(food['fiber']) / 100.0
            c_cost = float(food['cost']) / 100.0
            food['fiber_score'] = fib_g / c_cost if c_cost > 0 else 0
            
        fiber_foods = sorted(foods, key=lambda x: x['fiber_score'], reverse=True)
        for food in fiber_foods:
            if float(food['fiber']) > 5.0 and float(food['carbs']) > 10.0:
                max_g = get_max_portion(food['name'])
                existing = selected_foods.get(food['name'], {}).get('grams', 0)
                added = 0
                while existing < max_g and added < 100:
                    if not add_food(food, STEP_GRAMS):
                        break
                    existing += STEP_GRAMS
                    added += STEP_GRAMS
                break

    # --- PASS 2: Energy Fill (Carbs/Calories) ---
    current_budget_limit = budget # Unlock reserved 15% budget
    calorie_gap = target_cals - current_cals
    remaining_budget = budget - current_cost

    if calorie_gap > 0 and remaining_budget > 0:
        for food in foods:
            c_g = float(food['carbs']) / 100.0
            c_cost = float(food['cost']) / 100.0
            food['pass2_score'] = c_g / c_cost if c_cost > 0 else 0
            
        foods_pass2 = sorted(foods, key=lambda x: x['pass2_score'], reverse=True)
        
        for food in foods_pass2:
            if calorie_gap <= 0 or remaining_budget <= 0:
                break
                
            max_g = get_max_portion(food['name'])
            existing = selected_foods.get(food['name'], {}).get('grams', 0)
            
            while existing < max_g:
                if not add_food(food, STEP_GRAMS):
                    break
                existing += STEP_GRAMS
                cals_added = (((float(food['protein']) * 4) + (float(food['carbs']) * 4) + (float(food['fats']) * 9)) / 100.0) * STEP_GRAMS
                calorie_gap -= cals_added
                remaining_budget -= (float(food['cost']) / 100.0) * STEP_GRAMS
                if calorie_gap <= 0:
                    break

    # --- PASS 3: Round-Robin Adjustment Loop ---
    # If calories/carbs are still missing, loop through selected foods evenly
    calorie_gap = target_cals - current_cals
    remaining_budget = budget - current_cost

    if calorie_gap > (target_cals * 0.05) and remaining_budget > 0 and len(selected_foods) > 0:
        added_in_loop = True
        SMALL_STEP = 25
        
        while added_in_loop and calorie_gap > (target_cals * 0.02) and remaining_budget > 0:
            added_in_loop = False
            # Iterate through all currently selected foods to increment them evenly
            for food_name, item in list(selected_foods.items()):
                food = item['food']
                existing = item['grams']
                max_g = get_max_portion(food_name)
                
                if existing < max_g:
                    if add_food(food, SMALL_STEP):
                        added_in_loop = True
                        calorie_gap = target_cals - current_cals
                        remaining_budget = budget - current_cost
                        if calorie_gap <= (target_cals * 0.02):
                            break

    final_selected = []
    for food_name, item in selected_foods.items():
        if item["grams"] > 0:
            food = item["food"]
            g = item["grams"]
            final_selected.append({
                "name": food['name'],
                "protein": (float(food['protein']) / 100.0) * g,
                "cost": (float(food['cost']) / 100.0) * g,
                "quantity": g / 100.0,
                "amount_in_grams": g,
                "conversion_ratio": food.get('conversion_ratio', 1.0),
                "unit_name": food.get('unit_name', 'portion'),
                "unit_weight": float(food.get('unit_weight', 100.0))
            })

    return {
        "selected_foods": final_selected,
        "total_calories": round(current_cals, 0),
        "total_protein": round(current_pro, 1),
        "total_fats": round(current_fats, 1),
        "total_carbs": round(current_carbs, 1),
        "total_fiber": round(current_fiber, 1),
        "total_cost_estimate": round(current_cost, 2)
    }
