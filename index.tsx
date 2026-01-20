
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("ZenStudy: Initializing bootstrap...");

const mountApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error("ZenStudy: Root element #root not found.");
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 40px; text-align: center; color: #ef4444; font-family: system-ui;';
    errorDiv.innerHTML = '<h1>Critical Error</h1><p>Application container missing.</p>';
    document.body.appendChild(errorDiv);
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("ZenStudy: React mounted successfully.");
  } catch (err: any) {
    console.error("ZenStudy: Mounting Error:", err);
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #ef4444; font-family: system-ui;">
        <h1 style="font-weight: 800;">Bootstrap Error</h1>
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">${err.message || 'Unknown error during startup'}</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 12px; font-size: 11px; text-align: left; overflow: auto; border: 1px solid #e2e8f0; color: #475569;">
          <code>${err.stack || 'No stack trace available'}</code>
        </div>
        <button onclick="window.location.reload()" style="margin-top: 20px; background: #6366f1; color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Retry Initialization
        </button>
      </div>
    `;
  }
};

// Ensure DOM is ready before mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
