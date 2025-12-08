import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NutritionProvider } from './context/NutritionContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import MealPlanning from './components/MealPlanning';
import Profile from './components/Profile';
import Onboarding from './components/Onboarding';

function App() {
  return (
    <Router>
      <NutritionProvider>
        <div className="App">
          <Navigation />
          <div className="pt-16"> {/* Padding untuk navigation */}
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/meals" element={<MealPlanning />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </div>
      </NutritionProvider>
    </Router>
  );
}

export default App;