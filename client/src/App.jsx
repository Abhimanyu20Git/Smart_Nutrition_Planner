import React, { useState } from 'react';
import PlanOptimizer from './components/PlanOptimizer';
import ResultsDashboard from './components/ResultsDashboard';
import Toast from './components/Toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function App() {
  const [toasts, setToasts] = useState([]);
  const [planResult, setPlanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  // Generate Plan POST Request handler
  const handleGeneratePlan = async (payload) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setPlanResult(data);
        showToast('Plan optimized successfully!', 'success');
        if (data.message) {
          showToast('Warnings generated for target deficit check details.', 'warn');
        }
      } else {
        showToast(data.error || 'Optimization calculations failed.', 'error');
      }
    } catch (err) {
      console.error('Plan generation failed:', err);
      showToast('Could not reach the backend optimization server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Toast Alert Overlays */}
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Main Title Header */}
      <header>
        <h1>Smart Budget <span className="accent">Nutrition</span> Planner</h1>
        <p>Your personalised, affordable path to health.</p>
      </header>

      {/* Main Content */}
      <div className="tab-content">
        {planResult ? (
          <ResultsDashboard
            result={planResult}
            onBack={() => setPlanResult(null)}
          />
        ) : (
          <PlanOptimizer
            onGenerate={handleGeneratePlan}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Footer Tagline */}
      <footer className="footer-tagline">
        Made with <span className="heart">♥</span> for India
      </footer>
    </div>
  );
}
