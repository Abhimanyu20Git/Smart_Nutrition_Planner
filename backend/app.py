from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_all_foods, get_all_junk_foods, get_all_food_names
from optimizer import calculate_targets, optimize_meals

app = Flask(__name__)
CORS(app)

@app.route('/api/plan', methods=['POST'])
def generate_plan():
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    weight = data.get('weight')
    height = data.get('height')
    age = data.get('age')
    activity_level = data.get('activityLevel')
    goal = data.get('goal')
    budget = data.get('budget')
    diet_type = data.get('dietType')
    gender = data.get('gender', 'male')
    no_cook = data.get('noCook', False)
    measurement_mode = data.get('measurementMode', 'grams')
    excluded_foods = data.get('excludedFoods', [])
    excluded_lower = [f.lower().strip() for f in excluded_foods]
    
    cheat_calories = data.get('cheat_calories', 0)
    try:
        cheat_calories = int(cheat_calories)
    except ValueError:
        cheat_calories = 0
    recovery_mode = cheat_calories > 0
    
    targets = calculate_targets(weight, height, age, activity_level, goal, gender)
    original_target_calories = targets['calories']
    
    if cheat_calories > 0:
        targets['calories'] = max(0, targets['calories'] - cheat_calories)
    
    all_foods = get_all_foods()
    
    # Apply filters based on constraints
    if diet_type == 'veg':
        all_foods = [f for f in all_foods if 'veg' in [t.strip().lower() for t in f['tags'].split(',')]]
    
    if no_cook:
        all_foods = [f for f in all_foods if 'no-cook' in [t.strip().lower() for t in f['tags'].split(',')]]
        
    if excluded_foods:
        def is_excluded(food):
            name_lower = food['name'].lower()
            tags = [t.strip().lower() for t in food['tags'].split(',')]
            for ex in excluded_lower:
                if ex in name_lower or ex in tags:
                    return True
            return False
            
        all_foods = [f for f in all_foods if not is_excluded(f)]
        
    try:
        weekly_budget = float(budget)
    except (TypeError, ValueError):
        weekly_budget = 700.0
    daily_budget = weekly_budget / 7.0
        
    optimization_result = optimize_meals(all_foods, daily_budget, targets, recovery_mode=recovery_mode)
    
    def format_amount(food, mode):
        grams = food.get('amount_in_grams', 100)
        if mode == 'grams':
            return f"{grams}g"
        else:
            unit_weight = food.get('unit_weight', 100.0)
            unit_name = food.get('unit_name', 'portion')
            
            units = grams / unit_weight
            
            if isinstance(units, float) and units.is_integer():
                units = int(units)
            elif isinstance(units, float):
                units = round(units, 1)
                
            return f"{grams}g (Approx {units} {unit_name}(s))"

    message = None
    if not optimization_result['selected_foods'] or optimization_result['total_protein'] < 0.8 * targets['protein']:
        message = 'Budget too low to meet protein requirements. Try increasing your budget or changing your goal.'

    response = {
        "message": message,
        "summary": {
            "targetCalories": original_target_calories,
            "achieved_calories": optimization_result['total_calories'] + cheat_calories,
            "targetProtein": targets['protein'],
            "total_protein": optimization_result['total_protein'],
            "targetCarbs": targets['carbs'],
            "total_carbs": optimization_result['total_carbs'],
            "targetFats": targets['fats'],
            "total_fats": optimization_result['total_fats'],
            "targetFiber": targets['fiber'],
            "total_fiber": optimization_result['total_fiber'],
            "total_cost_estimate": round(optimization_result['total_cost_estimate'] * 7, 2),
            "goal": goal,
            "dietType": diet_type,
            "noCook": no_cook,
            "measurementMode": measurement_mode
        },
        "meals": [
            {
                "name": "Optimized Daily Selection",
                "items": [
                    {
                        "name": f["name"], 
                        "amount": format_amount(f, measurement_mode)
                    } 
                    for f in optimization_result['selected_foods']
                ]
            }
        ]
    }
    
    # Build comparison data
    junk_foods = get_all_junk_foods()
    junk_food = next((j for j in junk_foods if 'Burger' in j['name']), junk_foods[0] if junk_foods else None)
    
    if junk_food:
        optimized_cost = optimization_result['total_cost_estimate']
        optimized_protein = optimization_result['total_protein']
        optimized_cals = optimization_result['total_calories']
        
        optimized_cost_per_g = optimized_cost / optimized_protein if optimized_protein > 0 else 0
        
        junk_cals_per_unit = float(junk_food['calories'])
        junk_units = optimized_cals / junk_cals_per_unit if junk_cals_per_unit > 0 else 0
        
        junk_cost = junk_units * float(junk_food['cost'])
        junk_protein = junk_units * float(junk_food['protein'])
        junk_cost_per_g = junk_cost / junk_protein if junk_protein > 0 else 0
        
        response["comparison"] = {
            "optimized_cost": round(optimized_cost, 2),
            "optimized_protein": round(optimized_protein, 1),
            "optimized_cost_per_g": round(optimized_cost_per_g, 2),
            "junk_name": "Typical Junk Diet (" + junk_food['name'] + ")",
            "junk_cost": round(junk_cost, 2),
            "junk_protein": round(junk_protein, 1),
            "junk_cost_per_g": round(junk_cost_per_g, 2),
            "savings_per_g": round(junk_cost_per_g - optimized_cost_per_g, 2)
        }
    
    return jsonify(response)

@app.route('/api/foods', methods=['GET'])
def get_foods():
    try:
        food_names = get_all_food_names()
        return jsonify(food_names), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
