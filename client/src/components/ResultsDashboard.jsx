import React, { useState } from 'react';

// Category mapping helper
function getFoodCategory(name = '', tags = '') {
  const n = name.toLowerCase();
  const t = tags.toLowerCase();
  if (n.includes('chicken') || n.includes('fish') || n.includes('egg')) {
    return { label: 'Poultry & Meat', icon: '🍗', color: '#F87171' };
  }
  if (n.includes('paneer') || n.includes('curd') || n.includes('yogurt') || n.includes('milk') || n.includes('whey') || t.includes('dairy')) {
    return { label: 'Dairy & Whey', icon: '🥛', color: '#60A5FA' };
  }
  if (n.includes('soya') || n.includes('tofu') || n.includes('sattu')) {
    return { label: 'Plant Protein', icon: '🌿', color: '#34D399' };
  }
  if (n.includes('dal') || n.includes('chana') || n.includes('rajma') || n.includes('lentil') || n.includes('chickpea')) {
    return { label: 'Pulses & Lentils', icon: '🫘', color: '#FBBF24' };
  }
  if (n.includes('roti') || n.includes('rice') || n.includes('oats') || n.includes('potato') || n.includes('millet') || n.includes('bran')) {
    return { label: 'Complex Carbs', icon: '🌾', color: '#A78BFA' };
  }
  if (n.includes('peanut') || n.includes('almond') || n.includes('walnut') || n.includes('seed') || n.includes('chia') || n.includes('flax') || t.includes('nuts')) {
    return { label: 'Healthy Fats & Nuts', icon: '🥜', color: '#FB923C' };
  }
  return { label: 'Staple', icon: '🥗', color: '#34D399' };
}

// Clean amount display to maximum 2 digits after decimal point
function cleanAmount(amountStr) {
  if (!amountStr) return '';
  return String(amountStr).replace(/(\d+\.\d{3,})/g, (match) => {
    return parseFloat(parseFloat(match).toFixed(2));
  });
}

export default function ResultsDashboard({ result, onBack }) {
  const [viewMode, setViewMode] = useState('meals'); // 'meals' or 'all'

  if (!result) return null;

  const { summary, meals, message, comparison } = result;
  const rawItems = meals?.[0]?.items || [];

  // Group into realistic meals for everyday execution
  const mealSchedule = [
    {
      id: 'breakfast',
      name: 'Breakfast / Morning Fuel',
      icon: '🌅',
      time: '8:00 AM – 9:30 AM',
      items: rawItems.filter(item => {
        const n = item.name.toLowerCase();
        return n.includes('sattu') || n.includes('yogurt') || n.includes('curd') ||
               n.includes('milk') || n.includes('oats') || n.includes('banana') ||
               n.includes('almond') || n.includes('walnut') || n.includes('chia') ||
               n.includes('flax') || n.includes('egg') || n.includes('whey');
      })
    },
    {
      id: 'lunch',
      name: 'Lunch / Midday Feast',
      icon: '☀️',
      time: '1:00 PM – 2:30 PM',
      items: rawItems.filter(item => {
        const n = item.name.toLowerCase();
        return n.includes('moong dal') || n.includes('masoor dal') || (n.includes('dal') && !n.includes('sattu')) ||
               n.includes('whole wheat roti') || n.includes('rice') || n.includes('chicken') ||
               n.includes('potato') || n.includes('low fat paneer');
      })
    },
    {
      id: 'snack',
      name: 'Evening Snack / Pre-Workout',
      icon: '🌆',
      time: '5:00 PM – 6:30 PM',
      items: rawItems.filter(item => {
        const n = item.name.toLowerCase();
        return n.includes('soya') || n.includes('peanut') || n.includes('pumpkin') ||
               n.includes('bran') || n.includes('sprout');
      })
    },
    {
      id: 'dinner',
      name: 'Dinner / Recovery & Rest',
      icon: '🌙',
      time: '8:30 PM – 9:30 PM',
      items: rawItems.filter(item => {
        const n = item.name.toLowerCase();
        return n.includes('millet') || n.includes('rajma') || n.includes('chana') ||
               n.includes('fish') || (n.includes('paneer') && !n.includes('low fat')) ||
               n.includes('tofu') || n.includes('spinach');
      })
    }
  ];

  // Capture any item that didn't match the specific filters and assign to lunch/dinner
  const assignedNames = new Set(mealSchedule.flatMap(m => m.items.map(i => i.name)));
  const unassigned = rawItems.filter(item => !assignedNames.has(item.name));
  if (unassigned.length > 0) {
    mealSchedule[1].items.push(...unassigned);
  }

  // Filter out empty meals if any
  const activeMeals = mealSchedule.filter(m => m.items.length > 0);

  // Stats calculation
  const calPercent = Math.min(100, Math.round((summary.achieved_calories / summary.targetCalories) * 100));
  const proPercent = Math.min(100, Math.round((summary.total_protein / summary.targetProtein) * 100));
  const carbPercent = Math.min(100, Math.round((summary.total_carbs / summary.targetCarbs) * 100));
  const fatPercent = Math.min(100, Math.round((summary.total_fats / summary.targetFats) * 100));
  const fibPercent = Math.min(100, Math.round((summary.total_fiber / summary.targetFiber) * 100));

  const dailyCost = summary.daily_cost_estimate || (summary.total_cost_estimate ? (summary.total_cost_estimate / 7).toFixed(1) : null);
  const dailyBudget = summary.daily_budget || null;

  return (
    <section className="results-section card animate-fade-in" id="results-section" style={{ padding: '2rem 1.75rem' }}>
      
      {/* Top Header */}
      <div className="results-header" style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--saffron)', textTransform: 'uppercase' }}>
              Optimized Plan
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {summary.goal || 'Fitness'} Goal
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', margin: 0, padding: 0 }}>Daily Nutrition Blueprint</h2>
        </div>
        <button type="button" className="btn-back" onClick={onBack} title="Modify parameters" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>←</span> Adjust Plan
        </button>
      </div>

      {/* Hero Master Card: Daily Energy & Highlights */}
      <div className="hero-nutrition-card" style={{
        background: 'linear-gradient(135deg, rgba(28, 25, 33, 0.95), rgba(20, 17, 24, 0.98))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '1.6rem 1.75rem',
        marginBottom: '1.75rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(232, 114, 42, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Calorie Dial / Main Stat */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--saffron)', textTransform: 'uppercase' }}>
              ⚡ Daily Energy Intake
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(232, 114, 42, 0.15)',
              color: 'var(--saffron-warm)'
            }}>
              Target: {summary.targetCalories} kcal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: '800', fontFamily: 'DM Sans, sans-serif', color: '#FFFFFF', lineHeight: 1 }}>
              {summary.achieved_calories.toLocaleString()}
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
              / {summary.targetCalories.toLocaleString()} kcal
            </span>
          </div>

          {/* Glowing progress bar */}
          <div style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${calPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--saffron), #F59E4C)',
              borderRadius: '9999px',
              boxShadow: '0 0 10px rgba(232, 114, 42, 0.45)',
              transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)'
            }} />
          </div>
        </div>
      </div>

      {/* Macronutrient Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.8rem', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0, fontWeight: '700', textTransform: 'uppercase' }}>
            Macronutrient Breakdown
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Scientifically Balanced Daily Macros
          </span>
        </div>

        <div className="macro-grid">
          {/* Protein */}
          <div className="macro-card macro-card--protein">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '1rem' }}>🍗</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.07em', color: 'var(--saffron)' }}>
                  PROTEIN
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--saffron-warm)', background: 'rgba(232, 114, 42, 0.12)', padding: '2px 7px', borderRadius: '9999px' }}>
                {proPercent}%
              </span>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFF', lineHeight: 1 }}>
                  {summary.total_protein}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>g</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Target: {summary.targetProtein}g
              </div>
            </div>

            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${proPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #E8722A, #F59E4C)',
                borderRadius: '9999px',
                boxShadow: '0 0 8px rgba(232, 114, 42, 0.35)'
              }} />
            </div>
          </div>

          {/* Carbs */}
          <div className="macro-card macro-card--carbs">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '1rem' }}>🌾</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.07em', color: '#A78BFA' }}>
                  CARBS
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#C4B5FD', background: 'rgba(167, 139, 250, 0.12)', padding: '2px 7px', borderRadius: '9999px' }}>
                {carbPercent}%
              </span>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFF', lineHeight: 1 }}>
                  {summary.total_carbs}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>g</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Target: {summary.targetCarbs}g
              </div>
            </div>

            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${carbPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366F1, #A78BFA)',
                borderRadius: '9999px',
                boxShadow: '0 0 8px rgba(129, 140, 248, 0.35)'
              }} />
            </div>
          </div>

          {/* Fats */}
          <div className="macro-card macro-card--fats">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '1rem' }}>🥑</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.07em', color: '#FB7185' }}>
                  FATS
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#FDA4AF', background: 'rgba(251, 113, 133, 0.12)', padding: '2px 7px', borderRadius: '9999px' }}>
                {fatPercent}%
              </span>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFF', lineHeight: 1 }}>
                  {summary.total_fats}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>g</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Target: {summary.targetFats}g
              </div>
            </div>

            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${fatPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #EC4899, #FB7185)',
                borderRadius: '9999px',
                boxShadow: '0 0 8px rgba(251, 113, 133, 0.35)'
              }} />
            </div>
          </div>

          {/* Fiber */}
          <div className="macro-card macro-card--fiber">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '1rem' }}>🥗</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.07em', color: '#34D399' }}>
                  FIBER
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6EE7B7', background: 'rgba(52, 211, 153, 0.12)', padding: '2px 7px', borderRadius: '9999px' }}>
                {fibPercent}%
              </span>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFF', lineHeight: 1 }}>
                  {summary.total_fiber}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>g</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Target: {summary.targetFiber}g
              </div>
            </div>

            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${fibPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #059669, #34D399)',
                borderRadius: '9999px',
                boxShadow: '0 0 8px rgba(52, 211, 153, 0.35)'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Daily Selection Section */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
              Optimized Daily Diet
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Digestible portions calculated to fulfill your macro targets
            </p>
          </div>

          {/* Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            padding: '3px',
            borderRadius: '9999px',
            border: '1px solid rgba(255,255,255,0.07)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('meals')}
              style={{
                background: viewMode === 'meals' ? 'linear-gradient(135deg, var(--saffron), var(--saffron-warm))' : 'transparent',
                color: viewMode === 'meals' ? '#FFF' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🍽️ By Meals
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              style={{
                background: viewMode === 'all' ? 'linear-gradient(135deg, var(--saffron), var(--saffron-warm))' : 'transparent',
                color: viewMode === 'all' ? '#FFF' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📋 All Items ({rawItems.length})
            </button>
          </div>
        </div>

        {/* VIEW 1: BY MEALS */}
        {viewMode === 'meals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeMeals.map((meal) => (
              <div key={meal.id} style={{
                background: 'rgba(28, 25, 33, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '20px',
                padding: '1.25rem 1.4rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{meal.icon}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {meal.name}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        {meal.time}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255,255,255,0.04)',
                    padding: '3px 9px',
                    borderRadius: '9999px'
                  }}>
                    {meal.items.length} {meal.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {meal.items.map((item, idx) => {
                    const cat = getFoodCategory(item.name, item.tags);
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.03)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                          <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {item.name}
                            </span>
                            {item.calories ? (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                                {item.calories} kcal • {item.protein}g protein {item.cost ? `• ₹${item.cost}` : ''}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          color: '#FFFFFF',
                          background: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '5px 12px',
                          borderRadius: '9999px',
                          letterSpacing: '0.02em'
                        }}>
                          {cleanAmount(item.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: ALL ITEMS CONSOLIDATED */}
        {viewMode === 'all' && (
          <div style={{
            background: 'rgba(28, 25, 33, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            padding: '1.25rem 1.4rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rawItems.map((item, idx) => {
                const cat = getFoodCategory(item.name, item.tags);
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.05rem'
                      }}>
                        {cat.icon}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {item.name}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: cat.color
                          }}>
                            {cat.label}
                          </span>
                        </div>
                        {item.calories ? (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {item.calories} kcal • {item.protein}g protein {item.cost ? `• ₹${item.cost}` : ''}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: '#FFFFFF',
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '5px 12px',
                      borderRadius: '9999px'
                    }}>
                      {cleanAmount(item.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Optional Warning / Diagnostic Message */}
      {message && (
        <div style={{
          marginTop: '1.75rem',
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          background: 'rgba(232, 114, 42, 0.08)',
          border: '1px solid rgba(232, 114, 42, 0.2)',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }} dangerouslySetInnerHTML={{ __html: message }} />
      )}

    </section>
  );
}
