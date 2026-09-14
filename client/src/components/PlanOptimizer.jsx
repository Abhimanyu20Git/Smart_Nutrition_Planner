import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function PlanOptimizer({ onGenerate, isLoading }) {
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [actLevel, setActLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintenance');
  const [budget, setBudget] = useState('');
  const [dietType, setDietType] = useState('veg');
  const [noCook, setNoCook] = useState(false);
  
  // Excluded foods
  const [foodNames, setFoodNames] = useState([]);
  const [excludeInput, setExcludeInput] = useState('');
  const [excludedFoods, setExcludedFoods] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Cheat meal
  const [cheatMealSelect, setCheatMealSelect] = useState('0');
  const [customCheatCalories, setCustomCheatCalories] = useState('');

  // Fetch food names for autocomplete list
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/foods`)
      .then(res => res.json())
      .then(data => setFoodNames(data))
      .catch(err => console.error('Failed to fetch autocomplete list:', err));
  }, []);

  const handleAddExcluded = (food) => {
    const trimmed = food.trim();
    if (trimmed && !excludedFoods.includes(trimmed)) {
      setExcludedFoods([...excludedFoods, trimmed]);
    }
    setExcludeInput('');
    setShowAutocomplete(false);
  };

  const handleRemoveExcluded = (food) => {
    setExcludedFoods(excludedFoods.filter(item => item !== food));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let cheat_calories = 0;
    if (cheatMealSelect === 'custom') {
      cheat_calories = parseInt(customCheatCalories, 10) || 0;
    } else {
      cheat_calories = parseInt(cheatMealSelect, 10) || 0;
    }

    const payload = {
      gender,
      age: parseFloat(age) || 25,
      weight: parseFloat(weight) || 70,
      height: parseFloat(height) || 175,
      activityLevel: actLevel,
      goal,
      budget: parseFloat(budget) || 1500,
      dietType,
      noCook,
      excludedFoods,
      cheat_calories
    };

    onGenerate(payload);
  };

  const filteredAutocomplete = foodNames.filter(name =>
    name.toLowerCase().includes(excludeInput.toLowerCase()) &&
    !excludedFoods.includes(name)
  );

  return (
    <section className="card" id="form-card">
      <h2>Configure Your Plan</h2>
      <form onSubmit={handleSubmit} noValidate>

        {/* Body Metrics Group */}
        <fieldset className="field-group">
          <legend className="field-group-legend">
            <span className="legend-icon">📐</span> Body Metrics
          </legend>
          <div className="field-row field-row--2">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  id="age"
                  placeholder="e.g. 25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  min="10"
                  max="120"
                />
                <span className="input-unit">yrs</span>
              </div>
            </div>
          </div>
          <div className="field-row field-row--2">
            <div className="form-group">
              <label htmlFor="weight">Weight</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  id="weight"
                  placeholder="e.g. 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                  min="20"
                  max="300"
                />
                <span className="input-unit">kg</span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="height">Height</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  id="height"
                  placeholder="e.g. 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                  min="80"
                  max="250"
                />
                <span className="input-unit">cm</span>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Goals Group */}
        <fieldset className="field-group">
          <legend className="field-group-legend">
            <span className="legend-icon">🎯</span> Goal & Activity
          </legend>
          <div className="field-row field-row--2">
            <div className="form-group">
              <label htmlFor="activityLevel">Activity Level</label>
              <select id="activityLevel" value={actLevel} onChange={(e) => setActLevel(e.target.value)} required>
                <option value="sedentary">Sedentary (No exercise)</option>
                <option value="light">Light (1-2 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Very Active (6-7 days/week)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="goal">Fitness Goal</label>
              <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} required>
                <option value="maintenance">Maintenance</option>
                <option value="bulking">Bulking</option>
                <option value="cutting">Cutting</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Diet & Budget Group */}
        <fieldset className="field-group">
          <legend className="field-group-legend">
            <span className="legend-icon">🍽️</span> Diet & Budget
          </legend>
          <div className="field-row field-row--2">
            <div className="form-group">
              <label htmlFor="budget">Weekly Budget</label>
              <div className="input-with-unit input-with-unit--prefix">
                <span className="input-unit input-unit--prefix">₹</span>
                <input
                  type="number"
                  id="budget"
                  placeholder="e.g. 1500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  min="500"
                />
              </div>
              <span className="input-hint">Minimum ₹500/week recommended</span>
            </div>
            <div className="form-group">
              <label htmlFor="dietType">Diet Type</label>
              <select id="dietType" value={dietType} onChange={(e) => setDietType(e.target.value)} required>
                <option value="veg">🥬 Vegetarian</option>
                <option value="non-veg">🍗 Non-Vegetarian</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="excludedFoods">Exclude specific foods</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {excludedFoods.map(food => (
                <span
                  key={food}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--bg-soft)',
                    border: '1px solid var(--card-border)',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleRemoveExcluded(food)}
                  title="Click to remove"
                >
                  {food} <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>&times;</span>
                </span>
              ))}
            </div>
            <input
              type="text"
              id="excludedFoods"
              placeholder="Type foods to avoid..."
              value={excludeInput}
              onChange={(e) => {
                setExcludeInput(e.target.value);
                setShowAutocomplete(true);
              }}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (excludeInput.trim()) {
                    handleAddExcluded(excludeInput);
                  }
                }
              }}
              autoComplete="off"
            />
            {showAutocomplete && excludeInput && filteredAutocomplete.length > 0 && (
              <div className="autocomplete-items">
                {filteredAutocomplete.map(name => (
                  <div
                    key={name}
                    onMouseDown={() => handleAddExcluded(name)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
            <span className="input-hint">Type name and press Enter or select from dropdown list. Exclusions apply to tags (e.g. nuts, dairy).</span>
          </div>
        </fieldset>

        {/* Preferences Group */}
        <fieldset className="field-group">
          <legend className="field-group-legend">
            <span className="legend-icon">⚙️</span> Preferences
          </legend>
          <div className="toggles">
            <label className="toggle-switch">
              <input
                type="checkbox"
                id="noCook"
                checked={noCook}
                onChange={(e) => setNoCook(e.target.checked)}
              />
              <span className="slider round"></span>
              <div className="toggle-text">
                <span className="toggle-label">No-cook Mode</span>
                <span className="toggle-desc">Only include foods that don't need cooking</span>
              </div>
            </label>
          </div>

          <div className="cheat-meal-section">
            <label htmlFor="cheatMealSelect">Cheat Meal / Off-Plan Items</label>
            <select
              id="cheatMealSelect"
              value={cheatMealSelect}
              onChange={(e) => setCheatMealSelect(e.target.value)}
            >
              <option value="0">None — staying clean 💪</option>
              <option value="150">1 Samosa (~150 kcal)</option>
              <option value="250">1 Burger (~250 kcal)</option>
              <option value="150">1 Gulab Jamun (~150 kcal)</option>
              <option value="custom">Custom calories...</option>
            </select>
            <input
              type="number"
              id="customCheatCalories"
              placeholder="e.g. 250"
              value={customCheatCalories}
              onChange={(e) => setCustomCheatCalories(e.target.value)}
              className={`custom-cheat-input ${cheatMealSelect === 'custom' ? 'visible' : ''}`}
            />
          </div>
        </fieldset>

        <button type="submit" id="generate-btn" className="btn-submit" disabled={isLoading}>
          <span className="btn-text">{isLoading ? 'Generating Plan...' : 'Generate Plan'}</span>
          {isLoading && <span className="btn-spinner" aria-hidden="true"></span>}
        </button>
      </form>
    </section>
  );
}
