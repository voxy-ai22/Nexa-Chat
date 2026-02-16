
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Target root tidak ditemukan.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
