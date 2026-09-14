# 🥗 Smart Budget Nutrition Planner

> **An intelligent, constraint-based dietary optimizer that crafts delicious, cost-effective Indian meal plans tailored to your exact caloric & macronutrient targets — with zero digestive overload.**

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%2F%20Fallback-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Overview

**Smart Budget Nutrition Planner** is designed for real people with real budgets. Traditional fitness apps either recommend expensive exotic ingredients or force excessive protein intake that leads to digestive distress. 

This platform solves both challenges by combining **nutritional science (ICMR & ISSN guidelines)** with a **multi-pass greedy optimization engine** that:
1. **Respects Indian Food Habits**: Built around staples like Dals, Sattu, Soya Chunks, Paneer, Rotis, Rice, Milk, Eggs, and Chicken.
2. **Enforces Human-Digestible Portions**: Strict upper limits prevent bloating (e.g., Soya Chunks ≤ 45g, Sattu ≤ 45g, Dals ≤ 75g).
3. **Optimizes Every Rupee**: Uses your budget to maximize nutritional completeness without financial waste.
4. **Delivers an Executive-Grade UI**: A sleek, dark glassmorphic dashboard with meal scheduling, responsive macronutrient grids, and intuitive views.

---

## ✨ Key Features

### 1. 🧠 Science-Backed Macro Engine
* **Bodyweight-Based Protein Target**: Calibrated to realistic fitness benchmarks:
  * **Maintenance**: `1.3g / kg` bodyweight (healthy maintenance without gut strain).
  * **Bulking / Muscle Gain**: `1.6g / kg` bodyweight.
  * **Cutting / Fat Loss**: `1.6g / kg` bodyweight (preserves lean mass during deficit).
* **Healthy Fats (20–25% of Energy)**: Essential for hormone production, joint lubrication, and fat-soluble vitamin absorption (A, D, E, K).
* **Gut-Friendly Fiber (14g / 1000 kcal)**: Capped at 25g–40g/day to prevent indigestion and gas.
* **Energy-Sustaining Complex Carbs**: Fills the remaining caloric balance cleanly.

### 2. 🛡️ Digestive Safety & Realistic Portion Caps
No more unrealistic recommendations! The optimizer strictly enforces human-digestible daily caps:
| Food Category | Max Daily Portion | Clinical Rationale |
| :--- | :--- | :--- |
| **Soya Chunks** | 35g – 45g | Prevents gas, bloating, and excessive phytoestrogen load |
| **Sattu** | 40g – 45g | Ideal for 1–2 refreshing glasses |
| **Dals & Pulses** | 60g – 75g (dry) | Equivalent to 1 – 1.5 cooked bowls |
| **Nuts & Seeds** | 20g – 30g | Healthy lipid density without stomach heaviness |
| **Wheat Bran** | 20g – 30g | Gentle dietary fiber booster without digestive distress |
| **Low Fat Paneer** | 100g – 120g | Clean dairy protein portion |
| **Paneer (Full Fat)**| 60g – 80g | Keeps saturated fats within healthy targets |
| **Eggs** | 3 pieces (150g) | High bioavailability, easy to digest |
| **Chicken / Fish** | 150g | Standard serving for muscle recovery |

### 3. 💰 Budget Deficit Fulfillment (5–10% Tolerance)
* If your daily budget has surplus funds remaining, the optimizer runs a **dedicated deficit-filling pass**.
* It selectively adds high-efficiency lean foods (Low Fat Paneer, Greek Yogurt, Whole Grains, Dals) to close any lingering protein or caloric deficit.
* A flexible 5%–10% tolerance is permitted on macro ceilings so you hit your key goals without artificial lockouts.

### 4. 🎨 Modern Executive-Grade UI
* **Daily Energy Hero Card**: Full-width glassmorphic dial with glowing saffron gradient progress bar.
* **Symmetrical Macro Breakdown**: 4 equal, color-coded columns for **Protein**, **Carbs**, **Fats**, and **Fiber** (`repeat(4, 1fr)` on desktop, `2 × 2` grid on mobile — no awkward orphan cards).
* **Dual-View Food Planner**:
  * 🍽️ **By Meals**: Chronological schedule (Breakfast, Lunch, Evening Snack, Dinner) with timing, item counts, micro-macro chips (`155 kcal • 23.4g protein • ₹6.8`), and crisp portion pills.
  * 📋 **All Items**: Consolidated grocery list with colored category badges (*Plant Protein*, *Complex Carbs*, *Dairy & Whey*, *Healthy Fats & Nuts*).

### 5. 🌐 Hybrid Data Provider with Zero-Config Fallback
* Connects to external food databases (OpenFoodFacts / USDA) when online.
* Automatically falls back to a curated local database of 40 staple Indian foods (`server/data/foods_fallback.json`) if offline or if MongoDB is not running locally.

---

## 🏗️ Project Architecture

```
Nutrition_planner/
├── client/                     # Frontend React application (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── PlanOptimizer.jsx     # Input form (age, weight, height, goal, budget, etc.)
│   │   │   ├── ResultsDashboard.jsx  # Hero dial, macro cards, dual-view food plan
│   │   │   ├── Toast.jsx             # Notification banners
│   │   │   └── ...
│   │   ├── App.jsx                   # Main React state & API integration
│   │   ├── index.css                 # Dark theme, glassmorphic design system
│   │   └── main.jsx                  # React DOM entry
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Express REST API (Node.js)
│   ├── config/
│   │   ├── db.js                     # MongoDB connection with error recovery
│   │   └── seeder.js                 # Automatic seed data loader
│   ├── data/
│   │   ├── foods_fallback.json       # 40 curated Indian staple foods
│   │   └── junk_fallback.json        # Reference foods
│   ├── models/
│   │   ├── Food.js                   # Mongoose Food schema
│   │   └── JunkFood.js               # Reference junk food schema
│   ├── utils/
│   │   ├── optimizer.js              # Mifflin-St Jeor + 5-pass greedy optimizer
│   │   └── foodProvider.js           # Hybrid remote API & local fallback provider
│   ├── server.js                     # Express routes & request lifecycle
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **yarn**
* *Optional*: Local **MongoDB** instance (if absent, local JSON fallback activates automatically).

---

### Step 1: Start the Backend Server

1. Open a terminal and navigate to `server/`:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* Configure your environment variables in `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/nutrition_planner
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *The backend API will start on `http://localhost:5000`.*

---

### Step 2: Start the Frontend Client

1. Open a new terminal and navigate to `client/`:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## ⚙️ Optimization Algorithm: How It Works

The engine runs a multi-stage constraint-satisfaction process:

```
[User Input: Weight, Height, Goal, Budget, Diet Type]
                        │
                        ▼
   [Step 1: Calculate Target Calories (Mifflin-St Jeor BMR * TDEE)]
                        │
                        ▼
   [Step 2: Realistic Macro Targets (Protein: 1.3-1.6g/kg, Fats: 22%, Fiber: 14g/1000kcal, Carbs: Balance)]
                        │
                        ▼
   [Pass 1: Protein Selection (Max protein-per-rupee, capped by digestive portion limits)]
                        │
                        ▼
   [Pass 2: Complex Carbs (Rice, Rotis, Oats, Potatoes to meet energy targets)]
                        │
                        ▼
   [Pass 3: Healthy Fats (Cold-pressed oils, Ghee, Peanuts, Seeds to reach fat floor)]
                        │
                        ▼
   [Pass 4: Digestive Fiber (Dals, Vegetables, Sprouted Moong)]
                        │
                        ▼
   [Pass 5: Budget Deficit Filler (Uses remaining budget with 5-10% tolerance to eliminate protein/calorie deficit)]
                        │
                        ▼
    [Output: Formatted Daily Meal Schedule + Macro Diagnostics]
```

---

## 📡 API Endpoints

### `POST /api/plan`
Generates an optimized daily nutrition plan.

**Request Body:**
```json
{
  "weight": 70,
  "height": 175,
  "age": 25,
  "gender": "male",
  "activityLevel": "moderate",
  "goal": "bulking",
  "budget": 1050,
  "dietType": "veg",
  "noCook": false,
  "measurementMode": "portions",
  "excludedFoods": []
}
```

**Response Preview:**
```json
{
  "summary": {
    "targetCalories": 2894,
    "achieved_calories": 2850,
    "targetProtein": 112,
    "total_protein": 118.5,
    "targetCarbs": 452,
    "total_carbs": 440.2,
    "targetFats": 71,
    "total_fats": 66.8,
    "targetFiber": 40,
    "total_fiber": 38.2,
    "daily_cost_estimate": 94.50,
    "daily_budget": 150.00
  },
  "meals": [
    {
      "name": "Optimized Daily Selection",
      "items": [
        {
          "name": "Soya Chunks",
          "amount": "45g",
          "calories": 155,
          "protein": 23.4,
          "carbs": 14.9,
          "fats": 0.2,
          "cost": 6.75
        }
      ]
    }
  ]
}
```

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | High-performance reactive client interface |
| **Styling** | Vanilla CSS3 (Custom Design System) | Glassmorphism, CSS Grid, custom properties, responsive breakpoints |
| **Backend** | Node.js, Express.js | High-throughput REST API |
| **Database** | MongoDB & Mongoose | Flexible NoSQL document database |
| **Fallback** | Native File-based JSON | Zero-configuration offline mode |
| **Algorithm** | Multi-Pass Greedy Optimizer | Real-time mathematical constraint satisfaction |

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add new Indian staple foods, enhance the optimization heuristics, or improve UI components:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ for affordable, healthy living across India.
</p>

