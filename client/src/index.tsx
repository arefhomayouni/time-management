import React from 'react';
import ReactDOM from 'react-dom/client';
// Only the two families the design system actually uses (see tailwind.config.js
// fontFamily and the --font-* variables): Outfit for UI text, JetBrains Mono
// for figures. Extra families here ship hundreds of KB nobody renders.
import '@fontsource-variable/outfit';
import '@fontsource-variable/jetbrains-mono';
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
