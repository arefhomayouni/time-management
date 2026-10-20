import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/outfit';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/geist';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { registerServiceWorker } from './pwa';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Progressive web app: offline shell + installable metadata (production only).
registerServiceWorker();

reportWebVitals();
