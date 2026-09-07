import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global unhandled error:', event.error || event.message);
  // Optionally send this to an error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Global unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);