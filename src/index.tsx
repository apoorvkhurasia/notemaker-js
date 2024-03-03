import React from 'react';
import {App} from './view/App';
import {createRoot} from 'react-dom/client';

require('./styles/fonts.css');
require('./styles/layout.css');
require('./styles/main.css');

const appElem = document.getElementById('app');
if (appElem !== null) {
  const root = createRoot(appElem);
  root.render(<App></App>);
}
