import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://smart-nutrition-planner.onrender.com';

export default function FoodLibrary({ showToast }) {
  // Search external database
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('openfoodfacts');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Custom food form
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [fiber, setFiber] = useState('');
  const [cost, setCost] = useState('10.0');
  const [tags, setTags] = useState('veg');
  const [unitName, setUnitName] = useState('portion');
  const [unitWeight, setUnitWeight] = useState('100');

  // Library listing
  const [library, setLibrary] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  const fetchLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/foods/library`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLibrary(data);
      }
    } catch (err) {
      console.error('Failed to fetch food library list:', err);
      showToast('Could not load local food library.', 'error');
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleApiSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('Please enter a search query.', 'warn');
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/foods/search-external?query=${encodeURIComponent(searchQuery)}&source=${searchSource}`);
      const data = await res.json();
      setSearchResults(data);
      if (data.length === 0) {
        showToast('No foods found matching query.', 'warn');
      } else {
        showToast(`Found ${data.length} items.`, 'success');
      }
    } catch (err) {
      console.error('Search failed:', err);
      showToast('Search query request failed.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item) => {
    setName(item.name);
    setProtein(item.protein.toString());
    setCarbs(item.carbs.toString());
    setFats(item.fats.toString());
    setFiber(item.fiber.toString());
    setCost('10.0'); // default local cost
    setTags('veg');
    setUnitName('portion');
    setUnitWeight('100');
    showToast(`Autofilled form with values for ${item.name}`, 'success');
  };

  const handleSaveFood = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Food name is required.', 'warn');
      return;
    }

    const payload = {
      name: name.trim(),
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fats: parseFloat(fats) || 0,
      fiber: parseFloat(fiber) || 0,
      cost: parseFloat(cost) || 0,
      tags: tags.trim(),
      unitName: unitName.trim(),
      unitWeight: parseFloat(unitWeight) || 100,
      conversionRatio: 1.0
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/foods/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || `Added ${name} to library!`, 'success');
        // Reset form
        setName('');
        setProtein('');
        setCarbs('');
        setFats('');
        setFiber('');
        setCost('10.0');
        setTags('veg');
        setUnitName('portion');
        setUnitWeight('100');
        // Refresh library list
        fetchLibrary();
      } else {
        showToast(data.error || 'Failed to save food.', 'error');
      }
    } catch (err) {
      console.error('Add custom food failed:', err);
      showToast('Failed to save food. Server connection issue.', 'error');
    }
  };

  const handleDeleteFood = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/foods/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Food item deleted.', 'success');
        fetchLibrary();
      } else {
        showToast(data.error || 'Failed to delete food.', 'error');
      }
    } catch (err) {
      console.error('Delete custom food failed:', err);
      showToast('Failed to delete food. Server connection issue.', 'error');
    }
  };

  return (
    <section className="card" id="library-card">
      <h2>Food Library & API Search</h2>
      <p className="section-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
        Search large global databases to automatically fetch precise macro nutritional values, specify your local cost, and save foods directly into your custom planner library.
      </p>

      {/* Search External API */}
      <fieldset className="field-group">
        <legend className="field-group-legend">
          <span className="legend-icon">🔍</span> Search Global Databases
        </legend>
        <form onSubmit={handleApiSearch}>
          <div className="field-row field-row--2" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'flex-end', gap: '12px', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="apiSearchInput">Search Food Item</label>
              <input
                type="text"
                id="apiSearchInput"
                placeholder="e.g., Peanut Butter, Oats, Greek Yogurt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="apiSourceSelect">Database Source</label>
              <select
                id="apiSourceSelect"
                value={searchSource}
                onChange={(e) => setSearchSource(e.target.value)}
              >
                <option value="openfoodfacts">Open Food Facts (No Key)</option>
                <option value="usda">USDA Database (Demo Key)</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            id="api-search-btn"
            className="btn-submit"
            style={{ marginTop: '10px', width: 'auto', minWidth: '160px', alignSelf: 'flex-start', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
            disabled={isSearching}
          >
            <span className="btn-text">{isSearching ? 'Searching...' : 'Search API'}</span>
            {isSearching && <span className="btn-spinner" aria-hidden="true"></span>}
          </button>
        </form>
      </fieldset>

      {/* API Search Results */}
      {searchResults.length > 0 && (
        <div id="api-results-container" className="api-results-container" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--card-border)', paddingItems: '0.5rem', paddingBottom: '0.5rem' }}>
            API Search Results
          </h3>
          <ul id="api-results-list" className="api-results-list">
            {searchResults.map((item, idx) => (
              <li className="api-result-item" key={idx}>
                <div className="result-info">
                  <span className="result-name">{item.name}</span>
                  <div className="result-macros">
                    <span className="macro-badge macro-badge--p">P: {item.protein}g</span>
                    <span className="macro-badge macro-badge--c">C: {item.carbs}g</span>
                    <span className="macro-badge macro-badge--f">F: {item.fats}g</span>
                    <span className="macro-badge macro-badge--fib">Fib: {item.fiber}g</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({item.source})</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-select-result"
                  onClick={() => handleSelectSearchResult(item)}
                >
                  Select
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add/Edit Food Form */}
      <fieldset className="field-group">
        <legend className="field-group-legend">
          <span className="legend-icon">➕</span> Add Food to Library
        </legend>
        <form onSubmit={handleSaveFood}>
          <div className="form-group">
            <label htmlFor="foodNameInput">Food Name</label>
            <input
              type="text"
              id="foodNameInput"
              placeholder="Enter food name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field-row field-row--2">
            <div className="form-group">
              <label htmlFor="foodProteinInput">Protein (per 100g)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  step="0.1"
                  id="foodProteinInput"
                  placeholder="0.0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  required
                  min="0"
                />
                <span className="input-unit">g</span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="foodCarbsInput">Carbs (per 100g)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  step="0.1"
                  id="foodCarbsInput"
                  placeholder="0.0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  required
                  min="0"
                />
                <span className="input-unit">g</span>
              </div>
            </div>
          </div>

          <div className="field-row field-row--2">
            <div className="form-group">
              <label htmlFor="foodFatsInput">Fats (per 100g)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  step="0.1"
                  id="foodFatsInput"
                  placeholder="0.0"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                  required
                  min="0"
                />
                <span className="input-unit">g</span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="foodFiberInput">Fiber (per 100g)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  step="0.1"
                  id="foodFiberInput"
                  placeholder="0.0"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  required
                  min="0"
                />
                <span className="input-unit">g</span>
              </div>
            </div>
          </div>

          <div className="field-row field-row--2">
            <div className="form-group">
              <label htmlFor="foodCostInput">Local Cost (Rupees)</label>
              <div className="input-with-unit input-with-unit--prefix">
                <span className="input-unit input-unit--prefix">₹</span>
                <input
                  type="number"
                  step="0.1"
                  id="foodCostInput"
                  placeholder="10.0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  required
                  min="0"
                />
              </div>
              <span className="input-hint">Price per 100g raw / 100ml</span>
            </div>
            <div className="form-group">
              <label htmlFor="foodTagsInput">Diet Tags</label>
              <input
                type="text"
                id="foodTagsInput"
                placeholder="e.g., veg, no-cook, dairy"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                required
              />
              <span className="input-hint">Comma separated (e.g. veg, no-cook)</span>
            </div>
          </div>

          <div className="field-row field-row--2">
            <div className="form-group">
              <label htmlFor="foodUnitNameInput">Household Unit Name</label>
              <input
                type="text"
                id="foodUnitNameInput"
                placeholder="e.g., cup, piece, spoon"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                required
              />
              <span className="input-hint">e.g. piece, cup, glass</span>
            </div>
            <div className="form-group">
              <label htmlFor="foodUnitWeightInput">Household Unit Weight</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  step="0.1"
                  id="foodUnitWeightInput"
                  placeholder="50.0"
                  value={unitWeight}
                  onChange={(e) => setUnitWeight(e.target.value)}
                  required
                  min="1"
                />
                <span className="input-unit">g</span>
              </div>
              <span className="input-hint">Grams per one unit</span>
            </div>
          </div>

          <button type="submit" className="btn-submit" style={{ marginTop: '15px' }}>
            <span className="btn-text">Save to Local Library</span>
          </button>
        </form>
      </fieldset>

      {/* Local Database Table */}
      <div className="local-library-section" style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📚 Active Local Library</span>
          <span id="library-count-badge" style={{ fontSize: '0.75rem', background: 'var(--saffron-light)', color: 'var(--saffron)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
            {library.length} Items
          </span>
        </h3>
        {isLoadingLibrary ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading food catalog...</p>
        ) : (
          <div className="library-table-wrapper" style={{ overflowX: 'auto', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-soft)' }}>
            <table className="library-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Food Item</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>P</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>C</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>F</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>Fib</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Cost (100g)</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {library.map((food) => (
                  <tr key={food.id}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{food.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Tags: {food.tags}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{food.protein}g</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{food.carbs}g</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{food.fats}g</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{food.fiber}g</td>
                    <td style={{ padding: '12px' }}>₹{food.cost}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-delete-food"
                        onClick={() => handleDeleteFood(food.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
