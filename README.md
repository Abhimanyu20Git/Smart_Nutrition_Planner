# Smart Budget Nutrition Planner

A constraint-based meal optimizer that builds the cheapest possible daily food plan while hitting your macro targets. Built for Indian foods and Indian budgets.

## How it works

You give it your body stats, a fitness goal, and a weekly budget in rupees. It figures out what to eat, how much, and keeps you under budget.

The whole thing runs in four steps:

### Step 1: Calculate what you need

Uses the **Mifflin-St Jeor equation** to estimate your daily calorie burn.

```
Male:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
```

BMR gets multiplied by an activity factor to get TDEE (total daily energy expenditure):

| Level | Multiplier | Meaning |
|-------|-----------|---------|
| Sedentary | 1.2 | Desk job, no exercise |
| Light | 1.375 | 1-2 days/week |
| Moderate | 1.55 | 3-5 days/week |
| Active | 1.725 | 6-7 days/week |

Then macros are set based on your goal:

| Goal | Calories | Protein | Fats |
|------|----------|---------|------|
| Bulking | TDEE + 300 | 2.0 g/kg | 0.8 g/kg |
| Cutting | TDEE - 500 | 2.2 g/kg | 0.7 g/kg |
| Maintenance | TDEE | 1.8 g/kg | 0.7 g/kg |

Remaining calories go to carbs. Fiber target is 14g per 1000 kcal (IOM recommendation).

### Step 2: Pick foods

The optimizer runs a greedy multi-pass algorithm. It's not linear programming — it's simpler and more predictable.

**Pass 0 — Fat floor.** Sorts foods by fat-per-rupee. Adds the cheapest fat sources until you hit at least 50% of your fat target (minimum 25g). This prevents fat from being zero, which would wreck your hormones.

**Pass 1 — Protein priority.** Sorts foods by protein-per-rupee. Greedily adds the cheapest protein sources in 50g increments until the protein target is met. Each food has a max portion cap (e.g., soya maxes at 100g, peanuts at 50g) to keep things realistic.

**Pass 1.5 — Fiber check.** If fiber is below 50% of target, adds the best fiber-per-rupee food (up to 100g).

**Pass 2 — Energy fill.** Sorts remaining budget by carbs-per-rupee. Fills the calorie gap with cheap carb sources (rice, roti, oats).

**Pass 3 — Round-robin top-up.** If there's still a calorie gap >5% and budget left, loops through all already-selected foods and adds 25g to each, evenly. This avoids dumping all remaining calories into one food.

Every addition checks three constraints before going through:
- Won't exceed budget
- Won't overshoot calories by more than 5%
- Won't overshoot fats by more than 10%
- Won't overshoot protein by more than 10% (for high-protein foods)

### Step 3: Portion caps

Every food has a hardcoded max daily portion to keep plans sane:

| Food | Max/day |
|------|---------|
| Soya chunks | 100g |
| Peanuts, walnuts, almonds | 50g |
| Rice, oats, roti, potatoes | 400g |
| Milk, curd | 500g |
| Paneer | 150g |
| Eggs | 200g |
| Whey | 60g |
| Everything else | 200g |

### Step 4: Cheat meal recovery

If you log a cheat meal (say, a 250 kcal samosa), the optimizer subtracts those calories from your target and rebuilds the plan around the remaining budget. In recovery mode, it also reserves 15% of budget for protein-dense foods and scores foods by protein-per-calorie instead of protein-per-rupee, prioritizing damage control.

## Food database

20 common Indian foods stored in SQLite. All values are **per 100g raw/uncooked** (or per 100ml for liquids). Sources: USDA FoodData Central, IFCT 2017.

Key values:

| Food | Protein | Carbs | Fats | Fiber | Cost (₹/100g) |
|------|---------|-------|------|-------|---------------|
| Rice | 7.0 | 80.0 | 0.3 | 1.0 | 6 |
| Dal | 24.0 | 60.0 | 1.5 | 11.0 | 12 |
| Eggs | 13.0 | 1.1 | 11.0 | 0.0 | 14 |
| Soya Chunks | 52.0 | 33.0 | 0.5 | 13.0 | 15 |
| Paneer | 18.0 | 3.6 | 25.0 | 0.0 | 35 |
| Chicken Breast | 31.0 | 0.0 | 3.6 | 0.0 | 30 |
| Oats | 16.9 | 66.3 | 6.9 | 10.6 | 15 |
| Rajma | 22.0 | 60.0 | 1.3 | 24.6 | 12 |

Calories are derived, not stored: `(protein × 4) + (carbs × 4) + (fats × 9)`.

## Comparison dashboard

After generating a plan, the API also builds a cost-per-gram-of-protein comparison against junk food (defaults to burger). This lets you see how much cheaper clean eating actually is per gram of protein.

```
optimized_cost_per_g = daily_cost / daily_protein
junk_cost_per_g = (junk_cost × equivalent_cals / junk_cals) / equivalent_protein
```

## Filters

- **Veg/Non-veg**: Filters by tag.
- **No-cook mode**: Only includes foods tagged `no-cook` (milk, peanuts, curd, bananas, etc).
- **Exclude foods**: Matches against food name and tags. Comma-separated.
- **Household mode**: Shows amounts in cups/spoons/pieces alongside grams.

## Running it

```
cd backend
pip install flask flask-cors
python app.py
```

Open `frontend/index.html` in a browser. Backend runs on `localhost:5000`.

## Limitations

- Mifflin-St Jeor is an estimate. It doesn't account for body composition. A muscular person and a sedentary person at the same weight/height/age get the same BMR.
- The optimizer is greedy, not globally optimal. It won't find the absolute cheapest plan — it finds a good-enough plan quickly.
- Food costs are hardcoded averages. Prices vary by city and season.
- No micronutrient tracking (vitamins, minerals, sodium).
- Single-day planning only. Doesn't rotate meals across a week.
