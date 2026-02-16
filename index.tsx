
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("%c NEXA GLOBAL %c SYSTEM INITIATED ", "color: black; background: white; font-weight: bold;", "color: white; background: #333;");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("FATAL: Root element missing. Black screen imminent.");
  throw new Error("Target root tidak ditemukan.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
