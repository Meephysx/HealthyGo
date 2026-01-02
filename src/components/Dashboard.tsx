import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Activity, 
  Award,
  ChevronRight,
  Apple,
  Dumbbell
} from 'lucide-react';
import { getBMICategory, calculateMacroTargets } from '../utils/calculations';
import type { User } from '../types';
import { useNutrition } from '../context/NutritionContext';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentDate] = useState(new Date());

  // 🔹 Ambil data nutrisi real-time dari Context (sinkron dengan Meals)
    const { nutrition: todayNutrition } = useNutrition();

  // 🔹 Ambil data user dari localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const bmiInfo = getBMICategory(user.bmi);
  const macroTargets = calculateMacroTargets(user.dailyCalories, user.goal);
    const caloriesRemaining = user.dailyCalories - todayNutrition.calories;

  const quickStats = [
    {
      label: 'Kalori Harian',
      value: user.dailyCalories,
      unit: 'kcal',
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'BMI',
      value: user.bmi,
      unit: bmiInfo.category,
      icon: TrendingUp,
      color: bmiInfo.color,
      bg: 'bg-green-50'
    },
    {
      label: 'Target Berat',
      value: user.idealWeight,
      unit: 'kg',
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Hari Aktif',
      value: 0,
      unit: 'days',
      icon: Activity,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];

  const todayProgress = [
    { label: 'Kalori', current: todayNutrition.calories, target: user.dailyCalories, unit: 'kcal', color: 'bg-blue-500' },
    { label: 'Protein', current: todayNutrition.protein, target: macroTargets.protein, unit: 'g', color: 'bg-green-500' },
    { label: 'Carbohidrat', current: todayNutrition.carbs, target: macroTargets.carbs, unit: 'g', color: 'bg-yellow-500' },
    { label: 'Lemak', current: todayNutrition.fat, target: macroTargets.fat, unit: 'g', color: 'bg-red-500' }
  ];

  const recentMeals = [
    { name: 'Greek Yogurt with Berries', calories: 180, time: '8:30 AM', type: 'Breakfast' },
    { name: 'Grilled Chicken Salad', calories: 420, time: '12:45 PM', type: 'Lunch' },
    { name: 'Apple with Almonds', calories: 190, time: '3:15 PM', type: 'Snack' }
  ];

  const upcomingWorkouts = [
    { name: 'Upper Body Strength', duration: '45 min', time: 'Today 6:00 PM', difficulty: 'Intermediate' },
    { name: 'Morning Cardio', duration: '30 min', time: 'Tomorrow 7:00 AM', difficulty: 'Beginner' },
    { name: 'Yoga Flow', duration: '60 min', time: 'Friday 7:30 PM', difficulty: 'Beginner' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Selamat Datang, {user.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <div className="flex items-baseline mt-2">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className={`ml-2 text-sm ${stat.color}`}>{stat.unit}</p>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Nutrition */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Nutrisi Harian</h2>
              <Link 
                to="/meals" 
                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
              >
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {todayProgress.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(item.current)}/{Math.round(item.target)} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${Math.min(100, (item.current / item.target) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>
                  {caloriesRemaining > 0
                    ? `${Math.round(caloriesRemaining)} calories remaining`
                    : `${Math.abs(Math.round(caloriesRemaining))} calories over target`}
                </strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                {caloriesRemaining > 0 
                  ? "You're on track! Consider adding a healthy snack." 
                  : "You've exceeded your daily target. No worries, tomorrow is a new day!"}
              </p>
            </div>
          </div>

          {/* Goal Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tujuanmu</h2>
            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-green-100 mb-4">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 capitalize mb-2">
                {user.goal.replace('-', ' ')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {user.goal === 'weight-loss' && 'Lose weight in a healthy, sustainable way'}
                {user.goal === 'weight-gain' && 'Gain healthy weight with proper nutrition'}
                {user.goal === 'muscle-gain' && 'Build lean muscle mass effectively'}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Berat Badan:</span>
                  <span className="font-medium">{user.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Berat Badan:</span>
                  <span className="font-medium">{user.idealWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kalori Harian:</span>
                  <span className="font-medium">{user.dailyCalories} kcal</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Meals & Upcoming Workouts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Apple className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Recent Meals</h2>
              </div>
              <Link 
                to="/meals" 
                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentMeals.map((meal, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{meal.name}</h3>
                    <p className="text-sm text-gray-600">{meal.type} • {meal.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{meal.calories}</p>
                    <p className="text-sm text-gray-500">kcal</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Dumbbell className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Workouts</h2>
              </div>
              <Link 
                to="/exercises" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {upcomingWorkouts.map((workout, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{workout.name}</h3>
                    <p className="text-sm text-gray-600">{workout.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{workout.duration}</p>
                    <p className="text-sm text-gray-500">{workout.difficulty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <Link 
            to="/meals" 
            className="flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Plan Meals
          </Link>
          <Link 
            to="/exercises" 
            className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Dumbbell className="h-5 w-5 mr-2" />
            Start Workout
          </Link>
          <Link 
            to="/food-search" 
            className="flex items-center justify-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Apple className="h-5 w-5 mr-2" />
            Track Food
          </Link>
          <Link 
            to="/progress" 
            className="flex items-center justify-center p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            View Progress
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;