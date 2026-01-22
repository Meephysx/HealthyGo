import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase"; 
import { NutritionProvider } from "./context/NutritionContext";

import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import MealPlanning from "./components/MealPlanning";
import Profile from "./components/Profile";
import Onboarding from "./components/Onboarding";
import Workouts from "./components/ExercisePlanning";
import FoodSearch from "./components/FoodSearch";
import Progress from "./components/Progress";


// --- MODIFIKASI DISINI ---
// Layout wrapper: 
// 1. pt-16: Memberi ruang untuk Header Atas
// 2. pb-20 md:pb-0: Memberi ruang untuk Bottom Nav (hanya di mobile/tablet)
const LayoutWithNav = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navigation />
      <div className="pt-16 pb-20 md:pb-8 min-h-screen bg-gray-50">
        {children}
      </div>
    </>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = auth.currentUser;
  
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <NutritionProvider>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Onboarding */}
          <Route
            path="/onboarding"
            element={<Onboarding />} 
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <LayoutWithNav>
                  <Dashboard />
                </LayoutWithNav>
              </ProtectedRoute>
            }
          />

          {/* Note: User bisa akses exercises lewat dashboard atau link lain, 
              karena menu 'Plan' saat ini mengarah ke Meals */}
          <Route
            path="/exercises"
            element={
              <ProtectedRoute>
                <LayoutWithNav>
                  <Workouts />
                </LayoutWithNav>
              </ProtectedRoute>
            }
          />

          <Route
            path="/food-search"
            element={
              <ProtectedRoute>
                <LayoutWithNav>
                  <FoodSearch />
                </LayoutWithNav>
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <LayoutWithNav>
                  <Progress />
                </LayoutWithNav>
              </ProtectedRoute>
            }
          />

          <Route
            path="/meals"
            element={
              <ProtectedRoute>
                <LayoutWithNav>
                  <MealPlanning />
                </LayoutWithNav>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <LayoutWithNav>
                  <Profile />
                </LayoutWithNav>
              </ProtectedRoute>
            }
          />
        </Routes>
      </NutritionProvider>
    </Router>
  );
}

export default App;