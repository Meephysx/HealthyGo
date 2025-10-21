import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import MealPlanning from './components/MealPlanning';
import ExercisePlanning from './components/ExercisePlanning';
import FoodSearch from './components/FoodSearch';
import Progress from './components/Progress';
import Profile from './components/Profile';
import { MealProvider } from './context/MealContext'; // ⬅️ Tambahkan ini

// Check if user is onboarded
const isUserOnboarded = () => {
  return localStorage.getItem('user') !== null;
};

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isUserOnboarded() ? <>{children}</> : <Navigate to="/onboarding" replace />;
};

function App() {
  return (
    <Router>
      {/* ⬇️ Bungkus seluruh route dengan MealProvider */}
      <MealProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <Layout showNavigation={false}>
                <LandingPage />
              </Layout>
            }
          />
          <Route
            path="/onboarding"
            element={
              <Layout showNavigation={false}>
                <Onboarding />
              </Layout>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/meals"
            element={
              <ProtectedRoute>
                <Layout>
                  <MealPlanning />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exercises"
            element={
              <ProtectedRoute>
                <Layout>
                  <ExercisePlanning />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/food-search"
            element={
              <ProtectedRoute>
                <Layout>
                  <FoodSearch />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Layout>
                  <Progress />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MealProvider>
    </Router>
  );
}

export default App;
