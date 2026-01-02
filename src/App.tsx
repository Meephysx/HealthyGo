import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./components/firebase"; 
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


// Layout wrapper to show navigation only on selected pages
const LayoutWithNav = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navigation />
      <div className="pt-16">{children}</div>
    </>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = auth.currentUser;
  
  // Catatan: Idealnya gunakan onAuthStateChanged / loading state dari context 
  // untuk mencegah redirect saat firebase sedang loading, 
  // tapi untuk logika dasar ini sudah cukup memblokir akses.
  if (!user) {
    return <Navigate to="/onboarding" replace />; // Redirect ke halaman login (onboarding)
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <NutritionProvider>
        <Routes>
          {/* Landing Page (NO NAVIGATION BAR) */}
          <Route path="/" element={<LandingPage />} />

          {/* PERBAIKAN DISINI:
            Hapus <LayoutWithNav> agar menu tidak muncul saat Login/Register 
          */}
          <Route
            path="/onboarding"
            element={<Onboarding />} 
          />

          {/* Protected Routes (Halaman yang butuh Login) */}
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