document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('nutrition-form');
    const cheatMealSelect = document.getElementById('cheatMealSelect');
    const customCheatCalories = document.getElementById('customCheatCalories');
    const generateBtn = document.getElementById('generate-btn');
    const resultsSection = document.getElementById('results-section');
    const loading = document.getElementById('loading');
    const backBtn = document.getElementById('back-to-form');
    const formCard = document.getElementById('form-card');

    // ── Toast System ──────────────────────────
    function showToast(message, type = 'error') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const icons = { error: '✕', success: '✓', warn: '⚠' };
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
    }

    // ── Cheat Meal UI ─────────────────────────
    function updateCheatMealUI() {
        if (!cheatMealSelect) return;
        const val = cheatMealSelect.value;
        customCheatCalories.classList.toggle('visible', val === 'custom');

        let cals = val === 'custom' ? (parseInt(customCheatCalories.value) || 0) : (parseInt(val) || 0);
        if (cals > 0) {
            generateBtn.querySelector('.btn-text').textContent = 'Generate Recovery Plan';
            generateBtn.style.background = 'linear-gradient(135deg, #E8722A, #F59E4C)';
        } else {
            generateBtn.querySelector('.btn-text').textContent = 'Generate Plan';
            generateBtn.style.background = '';
        }
    }
    if (cheatMealSelect) cheatMealSelect.addEventListener('change', updateCheatMealUI);
    if (customCheatCalories) customCheatCalories.addEventListener('input', updateCheatMealUI);

    // ── Back to Form ──────────────────────────
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            resultsSection.classList.add('hidden');
            formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // ── Form Validation ───────────────────────
    function validateForm() {
        let valid = true;
        const fields = [
            { id: 'weight', min: 20, max: 300, name: 'Weight' },
            { id: 'height', min: 80, max: 250, name: 'Height' },
            { id: 'age', min: 10, max: 120, name: 'Age' },
            { id: 'budget', min: 500, max: 100000, name: 'Budget' }
        ];
        // Clear previous errors
        form.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));

        for (const f of fields) {
            const el = document.getElementById(f.id);
            const v = parseFloat(el.value);
            if (!el.value || isNaN(v) || v < f.min || v > f.max) {
                el.classList.add('error');
                if (!el.value) showToast(`${f.name} is required.`, 'warn');
                else showToast(`${f.name} must be between ${f.min} and ${f.max}.`, 'warn');
                valid = false;
                break; // Show one at a time
            }
        }
        return valid;
    }

    // ── Form Submit ───────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const activityLevel = document.getElementById('activityLevel').value;
        const goal = document.getElementById('goal').value;
        const budget = parseFloat(document.getElementById('budget').value);
        const dietType = document.getElementById('dietType').value;
        const noCook = document.getElementById('noCook').checked;
        const measurementMode = document.getElementById('measurementMode').checked ? 'household' : 'grams';
        const excludedFoodsInput = document.getElementById('excludedFoods').value;
        const excludedFoods = excludedFoodsInput.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);

        let cheat_calories = 0;
        if (cheatMealSelect) {
            cheat_calories = cheatMealSelect.value === 'custom'
                ? (parseInt(customCheatCalories.value) || 0)
                : (parseInt(cheatMealSelect.value) || 0);
        }

        // Button loading state
        generateBtn.classList.add('is-loading');
        generateBtn.disabled = true;
        resultsSection.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            const response = await fetch('http://127.0.0.1:5000/api/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weight, height, age, gender, activityLevel, goal, budget, dietType, noCook, measurementMode, excludedFoods, cheat_calories })
            });

            if (!response.ok) throw new Error(`Server error ${response.status}`);
            const data = await response.json();

            renderResults(data);
            loading.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            showToast('Plan generated successfully!', 'success');

            // Smooth scroll to results
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (error) {
            console.error('Error:', error);
            loading.classList.add('hidden');
            showToast('Could not generate plan. Ensure the Flask backend is running.', 'error');
        } finally {
            generateBtn.classList.remove('is-loading');
            generateBtn.disabled = false;
        }
    });
});

// ── Render Results ────────────────────────────
function renderResults(data) {
    const summaryContainer = document.getElementById('plan-summary');
    const mealsContainer = document.getElementById('meals-container');
    summaryContainer.innerHTML = '';
    mealsContainer.innerHTML = '';

    // Alert banner
    if (data.message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'toast toast--warn';
        alertDiv.style.cssText = 'position:static;animation:none;max-width:100%;margin-bottom:1rem;border-radius:12px;';
        alertDiv.innerHTML = `<span>⚠</span><span>${data.message}</span>`;
        summaryContainer.appendChild(alertDiv);
    }

    const s = data.summary;
    const items = [
        { label: 'Target Cal', value: `${Math.round(s.targetCalories)} kcal`, type: 'target' },
        { label: 'Achieved Cal', value: `${Math.round(s.achieved_calories)} kcal`, type: 'achieved' },
        { label: 'Target Protein', value: `${Math.round(s.targetProtein)} g`, type: 'target' },
        { label: 'Achieved Protein', value: `${Math.round(s.total_protein)} g`, type: 'achieved' },
        { label: 'Target Carbs', value: `${Math.round(s.targetCarbs)} g`, type: 'target' },
        { label: 'Achieved Carbs', value: `${Math.round(s.total_carbs)} g`, type: 'achieved' },
        { label: 'Target Fats', value: `${Math.round(s.targetFats)} g`, type: 'target' },
        { label: 'Achieved Fats', value: `${Math.round(s.total_fats)} g`, type: 'achieved' },
        { label: 'Target Fiber', value: `${Math.round(s.targetFiber)} g`, type: 'target' },
        { label: 'Achieved Fiber', value: `${Math.round(s.total_fiber)} g`, type: 'achieved' },
        { label: 'Est. Cost/Week', value: `₹${s.total_cost_estimate}`, type: 'achieved' },
        { label: 'Goal', value: s.goal.charAt(0).toUpperCase() + s.goal.slice(1), type: 'target' }
    ];

    items.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = `summary-item is-${item.type}`;
        div.style.animationDelay = `${i * 0.04}s`;
        div.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong>`;
        summaryContainer.appendChild(div);
    });

    // Measurement mode note
    const note = document.createElement('div');
    note.style.cssText = 'font-style:italic;margin-top:12px;color:#5E5A63;font-size:0.82em;padding:8px 12px;background:#23202A;border-radius:10px;border-left:3px solid #E8722A;grid-column:1/-1;';
    note.innerText = s.measurementMode === 'household'
        ? '* Weights shown for cooked food (household mode).'
        : '* Weights shown for raw food.';
    summaryContainer.appendChild(note);

    // Meals
    data.meals.forEach((meal, i) => {
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.style.animationDelay = `${i * 0.08}s`;

        let rows = '';
        if (meal.items && meal.items.length > 0) {
            meal.items.forEach(item => {
                rows += `<li><span>${item.name}</span><strong>${item.amount}</strong></li>`;
            });
        } else {
            rows = '<li><span style="color:#8E8E8E;font-style:italic;">No foods matched your constraints.</span></li>';
        }
        card.innerHTML = `<h3>${meal.name}</h3><ul class="meal-items">${rows}</ul>`;
        mealsContainer.appendChild(card);
    });

    // Comparison
    const comp = document.getElementById('comparison-dashboard');
    if (data.comparison && comp) {
        comp.classList.remove('hidden');
        let cleanCpg = data.comparison.optimized_cost_per_g || 0;
        let junkCpg = data.comparison.junk_cost_per_g || 0;
        let savingsPerG = data.comparison.savings_per_g || (junkCpg - cleanCpg).toFixed(2);
        if (cleanCpg === 0 && s.total_protein > 0) cleanCpg = (s.total_cost_estimate / 7 / s.total_protein).toFixed(2);
        let multiplier = cleanCpg > 0 ? (junkCpg / cleanCpg).toFixed(1) : 1;

        document.getElementById('clean-cpg').innerText = cleanCpg;
        document.getElementById('junk-cpg').innerText = junkCpg;
        const msg = document.getElementById('savings-msg');
        msg.innerText = savingsPerG > 0
            ? `You save ₹${savingsPerG}/g protein! (Clean eating is ${multiplier}x cheaper)`
            : 'Your optimized plan is highly efficient!';
    } else if (comp) {
        comp.classList.add('hidden');
    }
}