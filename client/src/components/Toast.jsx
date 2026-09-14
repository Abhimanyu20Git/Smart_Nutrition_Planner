import React from 'react';

export default function Toast({ toasts, onClose }) {
  return (
    <div id="toast-container" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          onClick={() => onClose(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          <span>
            {toast.type === 'error' && '❌ '}
            {toast.type === 'success' && '✅ '}
            {toast.type === 'warn' && '⚠️ '}
            {toast.message}
          </span>
        </div>
      ))}
    </div>
  );
}
