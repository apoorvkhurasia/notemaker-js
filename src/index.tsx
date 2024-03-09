import React from 'react';
import {App} from './view/App';
import {createRoot} from 'react-dom/client';

import './styles/fonts.css';
import './styles/layout.css';
import './styles/main.css';

const appElem = document.getElementById('app');
if (appElem !== null) {
  const root = createRoot(appElem);
  root.render(<App></App>);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
