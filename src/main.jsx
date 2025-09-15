// src/main.tsx (or wherever this lives)
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import 'regenerator-runtime/runtime';
import './index.less';

// Use HashRouter only when packaged (file://). In dev (http://) keep BrowserRouter.
const isFileProtocol = window.location.protocol === 'file:';
const Router = isFileProtocol ? HashRouter : BrowserRouter;

const container = document.getElementById('hyper');
if (container) {
  const root = createRoot(container);
  root.render(
    <Router>
      <App />
    </Router>
  );
}
