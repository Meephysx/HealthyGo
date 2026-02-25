import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NutritionProvider } from './context/NutritionContext';
import './index.css';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <NutritionProvider>
        <App />
      </NutritionProvider>
    </AuthProvider>
  </React.StrictMode>,
);