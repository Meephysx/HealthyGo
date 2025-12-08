import React, { useState, useEffect } from 'react';
import { Plus, Clock, ChevronLeft, ChevronRight, Check, Sparkles, Info, Loader, RefreshCw, X } from 'lucide-react';
import { useNutrition } from '../context/NutritionContext';
import AISearch from './FoodSearch';

// Types
interface User {
  weight: number;
  height: number;
  age: number;
  gender: string;
  goal: string;
  activityLevel: string;
  dailyCalories: number;
}

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface AIMeal {
  menu: string;
  calories: number;
  time: string;
  reasoning: string;
  portions: string;
}

interface AIMealPlan {
  Sarapan: AIMeal;
  MakanSiang: AIMeal;
  MakanMalam: AIMeal;
  snacks?: AIMeal;
  totalCalories: number;
  nutritionTips?: string;
  hydrationGoal?: string;
}

type MealType = 'Sarapan' | 'MakanSiang' | 'MakanMalam' | 'snacks';

const MealPlanning: React.FC = () => {
  // User state
  const [user] = useState<User>({
    weight: 70,
    height: 170,
    age: 25,
    gender: 'male',
    goal: 'maintain-weight',
    activityLevel: 'moderate',
    dailyCalories: 2200
  });

  // Core states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState<MealType>('Sarapan');
  const [aiMealPlan, setAiMealPlan] = useState<AIMealPlan | null>(null);
  const [consumedFoods, setConsumedFoods] = useState<string[]>([]);
  const [customMealPlan, setCustomMealPlan] = useState({
    Sarapan: [] as Food[],
    MakanSiang: [] as Food[],
    MakanMalam: [] as Food[],
    snacks: [] as Food[]
  });
  
  // UI states
  const [showFoodSelector, setShowFoodSelector] = useState(false);
  const [showAiRecommendations, setShowAiRecommendations] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Nutrition Context
  const { updateNutrition, nutrition: todayNutrition } = useNutrition();

  // Sample foods data
  const SAMPLE_FOODS: Food[] = [
    {
      id: '1',
      name: 'Nasi Merah dengan Ayam Bakar',
      calories: 450,
      protein: 35,
      carbs: 45,
      fat: 12,
      servingSize: '1 porsi'
    },
    {
      id: '2',
      name: 'Salad Sayuran dengan Tahu',
      calories: 280,
      protein: 15,
      carbs: 25,
      fat: 8,
      servingSize: '1 mangkuk'
    },
    {
      id: '3',
      name: 'Smoothie Pisang Protein',
      calories: 320,
      protein: 25,
      carbs: 35,
      fat: 8,
      servingSize: '1 gelas'
    },
    {
      id: '4',
      name: 'Ikan Salmon Panggang',
      calories: 380,
      protein: 40,
      carbs: 5,
      fat: 18,
      servingSize: '150g'
    },
    {
      id: '5',
      name: 'Oatmeal dengan Buah',
      calories: 300,
      protein: 12,
      carbs: 45,
      fat: 8,
      servingSize: '1 mangkuk'
    }
  ];

  // Utility Functions
  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getCurrentDateKey = (): string => {
    return formatDateKey(currentDate);
  };

  // Load consumed foods on component mount or date change
  useEffect(() => {
    const dateKey = getCurrentDateKey();
    const savedConsumed = JSON.parse(localStorage.getItem(`consumed-${dateKey}`) || '[]');
    setConsumedFoods(savedConsumed);
  }, [currentDate]);

  // Update NutritionContext whenever consumption changes
  useEffect(() => {
    const consumedNutrition = getConsumedNutrition();
    updateNutrition({
      calories: consumedNutrition.calories,
      protein: consumedNutrition.protein,
      carbs: consumedNutrition.carbs,
      fat: consumedNutrition.fat,
      date: getCurrentDateKey()
    });
  }, [consumedFoods, currentDate, aiMealPlan, customMealPlan, showAiRecommendations]);

  // AI Meal Plan Generation
  const generateAIMealPlan = async (): Promise<void> => {
    setIsLoadingAI(true);
    setAiError(null);
    
    const apiKey = "AIzaSyB0qggp5SxQhUIW5r9WuwoU21IwJbdnY78"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Sebagai ahli nutrisi AI, buatkan rencana makan sehat dan lengkap untuk 1 hari penuh dengan profil pengguna berikut:

PROFIL PENGGUNA:
- Berat badan: ${user.weight} kg
- Tinggi badan: ${user.height} cm  
- Usia: ${user.age} tahun
- Jenis kelamin: ${user.gender}
- Tujuan fitness: ${user.goal}
- Tingkat aktivitas: ${user.activityLevel}
- Target kalori harian: ${user.dailyCalories} kcal

INSTRUKSI:
1. Buat menu menggunakan makanan Indonesia yang mudah didapat dimana saja
2. Pastikan distribusi kalori seimbang (sarapan 25%, makansiang 35%, makan malam 30%, sisanya snack)
3. Sesuaikan dengan tujuan fitness pengguna
4. Berikan penjelasan mengapa menu tersebut cocok untuk profil pengguna
5. Sertakan estimasi porsi yang realistis

FORMAT OUTPUT (JSON saja tanpa teks tambahan):
{
  "Sarapan": {
    "menu": "Menu sarapan lengkap",
    "calories": 550,
    "time": "07:00 - 08:00",
    "reasoning": "Penjelasan kenapa menu ini cocok",
    "portions": "Ukuran porsi detail"
  },
  "MakanSiang": {
    "menu": "Menu makansiang lengkap",
    "calories": 770,
    "time": "12:00 - 13:00", 
    "reasoning": "Penjelasan kenapa menu ini cocok",
    "portions": "Ukuran porsi detail"
  },
  "MakanMalam": {
    "menu": "Menu makan malam lengkap",
    "calories": 660,
    "time": "18:00 - 19:00",
    "reasoning": "Penjelasan kenapa menu ini cocok", 
    "portions": "Ukuran porsi detail"
  },
  "snacks": {
    "menu": "Snack sehat",
    "calories": 220,
    "time": "15:00 - 16:00",
    "reasoning": "Penjelasan kenapa snack ini cocok",
    "portions": "Ukuran porsi snack"
  },
  "totalCalories": ${user.dailyCalories},
  "nutritionTips": "Tips nutrisi khusus",
  "hydrationGoal": "Target minum air per hari"
}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (!text) {
        throw new Error("Tidak ada respon dari AI");
      }
      
      // Clean and parse JSON
      let cleanedText = text.trim();
      
      // Remove markdown code blocks
      cleanedText = cleanedText.replace(/```json\s*\n?/, '').replace(/\n?\s*```/, '');
      cleanedText = cleanedText.replace(/```\s*\n?/, '').replace(/\n?\s*```/, '');
      
      // Find JSON object
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }
      
      const mealPlan: AIMealPlan = JSON.parse(cleanedText);
      
      // Validate required fields
      if (!mealPlan.Sarapan || !mealPlan.MakanSiang || !mealPlan.MakanMalam) {
        throw new Error("Struktur rencana makan tidak valid");
      }
      
      setAiMealPlan(mealPlan);
      
    } catch (error) {
      console.error('Error generating AI meal plan:', error);
      
      // Fallback meal plan
      const fallbackPlan: AIMealPlan = {
        Sarapan: {
          menu: "Oatmeal dengan buah pisang dan madu",
          calories: Math.round(user.dailyCalories * 0.25),
          time: "07:00 - 08:00",
          reasoning: "Memberikan energi tahan lama untuk memulai hari dengan serat dan karbohidrat kompleks",
          portions: "1 mangkuk oatmeal + 1 buah pisang sedang + 1 sdm madu"
        },
        MakanSiang: {
          menu: "Nasi merah dengan ayam bakar dan sayur bayam",
          calories: Math.round(user.dailyCalories * 0.35),
          time: "12:00 - 13:00",
          reasoning: "Kombinasi protein tinggi dan karbohidrat kompleks untuk energi siang hari",
          portions: "1 piring nasi merah + 100g dada ayam + 1 mangkuk sayur bayam"
        },
        MakanMalam: {
          menu: "Ikan salmon panggang dengan kentang rebus dan brokoli",
          calories: Math.round(user.dailyCalories * 0.30),
          time: "18:00 - 19:00",
          reasoning: "Protein berkualitas tinggi dan omega-3 untuk pemulihan otot malam hari",
          portions: "150g ikan salmon + 200g kentang rebus + 1 mangkuk brokoli"
        },
        snacks: {
          menu: "Greek yogurt dengan kacang almond",
          calories: Math.round(user.dailyCalories * 0.10),
          time: "15:00 - 16:00",
          reasoning: "Protein dan lemak sehat untuk mengatasi lapar sore",
          portions: "1 cup Greek yogurt + 10 butir kacang almond"
        },
        totalCalories: user.dailyCalories,
        nutritionTips: "Pastikan minum air putih 8-10 gelas per hari",
        hydrationGoal: "2.5 liter air per hari"
      };
      
      setAiMealPlan(fallbackPlan);
      setAiError("Tidak terhubung ke jaringan. Cek koneksi anda kembali!");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Load AI meal plan on mount
  useEffect(() => {
    if (showAiRecommendations) {
      generateAIMealPlan();
    }
  }, [currentDate, showAiRecommendations]);

  // Food Consumption Logic
  const getFoodUniqueId = (foodId: string, mealType: string): string => {
    if (showAiRecommendations) {
      return `ai-meal-${mealType}-${getCurrentDateKey()}`;
    }
    return `${foodId}-${mealType}-${getCurrentDateKey()}`;
  };

  const isFoodConsumed = (foodId: string, mealType: string): boolean => {
    const uniqueId = getFoodUniqueId(foodId, mealType);
    return consumedFoods.includes(uniqueId);
  };

  const toggleFoodConsumed = (foodId: string, mealType: string): void => {
    const uniqueId = getFoodUniqueId(foodId, mealType);
    
    const newConsumed = consumedFoods.includes(uniqueId)
      ? consumedFoods.filter(id => id !== uniqueId)
      : [...consumedFoods, uniqueId];

    setConsumedFoods(newConsumed);
    
    // Save to localStorage
    localStorage.setItem(`consumed-${getCurrentDateKey()}`, JSON.stringify(newConsumed));
  };

  // Custom Meal Plan Functions
  const addFoodToMeal = (food: Food): void => {
    setCustomMealPlan(prev => ({
      ...prev,
      [selectedMeal]: [...prev[selectedMeal], food]
    }));
  };

  const removeFoodFromMeal = (foodId: string, mealType: MealType): void => {
    setCustomMealPlan(prev => ({
      ...prev,
      [mealType]: prev[mealType].filter(food => food.id !== foodId)
    }));
  };

  // Nutrition Calculation Functions
  const getTotalNutrition = () => {
    if (showAiRecommendations && aiMealPlan) {
      const totalCalories = aiMealPlan.totalCalories;
      return {
        calories: totalCalories,
        protein: Math.round(totalCalories * 0.25 / 4), // 25% protein
        carbs: Math.round(totalCalories * 0.45 / 4),   // 45% carbs
        fat: Math.round(totalCalories * 0.30 / 9)      // 30% fat
      };
    }
    
    // Calculate from custom meal plan
    const allFoods = [
      ...customMealPlan.Sarapan,
      ...customMealPlan.MakanSiang,
      ...customMealPlan.MakanMalam,
      ...customMealPlan.snacks
    ];
    
    return allFoods.reduce((total, food) => ({
      calories: total.calories + food.calories,
      protein: total.protein + food.protein,
      carbs: total.carbs + food.carbs,
      fat: total.fat + food.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const getConsumedNutrition = () => {
    let totalNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    if (showAiRecommendations && aiMealPlan) {
      // Calculate from AI meals
      const aiMeals: { type: MealType; meal: AIMeal }[] = [
        { type: 'Sarapan', meal: aiMealPlan.Sarapan },
        { type: 'MakanSiang', meal: aiMealPlan.MakanSiang },
        { type: 'MakanMalam', meal: aiMealPlan.MakanMalam }
      ];
      
      if (aiMealPlan.snacks) {
        aiMeals.push({ type: 'snacks', meal: aiMealPlan.snacks });
      }
      
      aiMeals.forEach(({ type, meal }) => {
        if (isFoodConsumed(type, type)) {
          totalNutrition.calories += meal.calories;
          totalNutrition.protein += Math.round(meal.calories * 0.25 / 4);
          totalNutrition.carbs += Math.round(meal.calories * 0.45 / 4);
          totalNutrition.fat += Math.round(meal.calories * 0.30 / 9);
        }
      });
    } else {
      // Calculate from custom meals
      Object.entries(customMealPlan).forEach(([mealType, foods]) => {
        foods.forEach(food => {
          if (isFoodConsumed(food.id, mealType)) {
            totalNutrition.calories += food.calories;
            totalNutrition.protein += food.protein;
            totalNutrition.carbs += food.carbs;
            totalNutrition.fat += food.fat;
          }
        });
      });
    }
    
    return totalNutrition;
  };

  // Date Navigation
  const previousDay = (): void => {
    setCurrentDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const nextDay = (): void => {
    setCurrentDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  // Meal Times and Icons
  const mealTimes = {
    Sarapan: '07:00 - 08:00',
    MakanSiang: '12:00 - 13:00',
    MakanMalam: '18:00 - 19:00',
    snacks: 'Kapan saja'
  };

  const mealIcons = {
    Sarapan: '🌅',
    MakanSiang: '☀️',
    MakanMalam: '🌙',
    snacks: '🍎'
  };

  // Filter foods for search
  const filteredFoods = SAMPLE_FOODS.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate nutrition values
  const totalNutrition = getTotalNutrition();
  const consumedNutrition = getConsumedNutrition();
  const targetCalories = user.dailyCalories;
  const remainingCalories = Math.max(0, targetCalories - consumedNutrition.calories);
  const calorieProgress = Math.min(100, (consumedNutrition.calories / targetCalories) * 100);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Meal Planning</h1>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-center mb-6">
          <button 
            onClick={previousDay} 
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold mx-4">
            {currentDate.toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          <button 
            onClick={nextDay} 
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* AI vs Custom Toggle */}
        <div className="flex justify-center mb-6 bg-gray-200 rounded-lg p-1 w-max mx-auto">
          <button 
            onClick={() => setShowAiRecommendations(true)} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showAiRecommendations 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Rekomendasi AI
          </button>
          <button 
            onClick={() => setShowAiRecommendations(false)} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !showAiRecommendations 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Atur Makan
          </button>
        </div>

        {/* Nutrition Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Target Kalori</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Target</p>
              <p className="text-2xl font-bold text-gray-900">{targetCalories.toLocaleString()}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dikonsumsi</p>
              <p className="text-2xl font-bold text-green-600">{consumedNutrition.calories.toLocaleString()}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tersisa</p>
              <p className="text-2xl font-bold text-blue-600">{remainingCalories.toLocaleString()}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Rencana</p>
              <p className="text-2xl font-bold text-purple-600">{totalNutrition.calories.toLocaleString()}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${calorieProgress}%` }}
            ></div>
          </div>
          
          {/* Progress Text */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{Math.round(calorieProgress)}% dari target</span>
            <span>100%</span>
          </div>
        </div>

        {/* Main Content */}
        {showAiRecommendations ? (
          // AI Recommendations View
          <div>
            {isLoadingAI ? (
              <div className="flex justify-center items-center py-10">
                <Loader className="animate-spin text-green-600" size={40} />
                <p className="ml-4 text-gray-600">Membuat rencana makan khusus untuk Anda...</p>
              </div>
            ) : aiError ? (
              <div className="text-center p-6 bg-red-50 rounded-lg text-red-700">
                <p>{aiError}</p>
                <button 
                  onClick={generateAIMealPlan} 
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center mx-auto transition-colors"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Coba Lagi
                </button>
              </div>
            ) : aiMealPlan ? (
              <div className="space-y-8">
                {/* Meal Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(aiMealPlan)
                    .filter(([key]) => ['Sarapan', 'MakanSiang', 'MakanMalam', 'snacks'].includes(key))
                    .map(([mealType, meal]) => (
                      meal && (
                        <div key={mealType} className="bg-white rounded-xl shadow-sm p-6">
                          <h3 className="font-semibold text-lg flex items-center">
                            {mealIcons[mealType as keyof typeof mealIcons]} 
                            <span className="ml-2 capitalize">{mealType}</span>
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">{meal.time}</p>
                          
                          <div className="flex items-center justify-between font-medium text-gray-800 mb-2">
                            <span className="flex-1">{meal.menu}</span>
                            <button
                              onClick={() => toggleFoodConsumed(mealType, mealType)}
                              className={`ml-2 p-2 rounded-full transition-colors ${
                                isFoodConsumed(mealType, mealType)
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              <Check size={18} />
                            </button>
                          </div>
                          
                          <p className="text-green-600 font-semibold">{meal.calories} kcal</p>
                          <p className="text-sm text-gray-600 mt-2">{meal.portions}</p>
                          
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-600 flex items-start">
                              <Info size={14} className="mr-2 flex-shrink-0 mt-0.5" />
                              <span>{meal.reasoning}</span>
                            </p>
                          </div>
                        </div>
                      )
                    ))}
                </div>

                {/* Nutrition Tips */}
                {aiMealPlan.nutritionTips && (
                  <div className="bg-green-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-lg text-green-800 flex items-center">
                      <Sparkles size={20} className="mr-2"/>
                      Tips Nutrisi
                    </h3>
                    <p className="text-green-700 mt-2">{aiMealPlan.nutritionTips}</p>
                    {aiMealPlan.hydrationGoal && (
                      <p className="text-green-700 mt-2">
                        <strong>Target Minum Air:</strong> {aiMealPlan.hydrationGoal}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          // Custom Meal Plan View
          <div className="grid lg:grid-cols-2 gap-8">
            {(Object.entries(customMealPlan) as [MealType, Food[]][]).map(([mealType, foods]) => (
              <div key={mealType} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-xl capitalize flex items-center">
                    {mealIcons[mealType]} {mealType}
                  </h3>
                  <p className="text-sm text-gray-500">{mealTimes[mealType]}</p>
                </div>
                
                <div className="space-y-3 mb-4">
                  {foods.length > 0 ? (
                    foods.map(food => (
                      <div key={food.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 flex items-center">
                            {food.name}
                            <button
                              onClick={() => toggleFoodConsumed(food.id, mealType)}
                              className={`ml-2 p-1 rounded-full transition-colors ${
                                isFoodConsumed(food.id, mealType)
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              <Check size={16} />
                            </button>
                          </p>
                          <p className="text-sm text-gray-500">{food.servingSize}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-gray-800">{food.calories} kcal</p>
                          <button 
                            onClick={() => removeFoodFromMeal(food.id, mealType)}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">Belum ada makanan</p>
                  )}
                </div>

                <button 
                  onClick={() => { 
                    setSelectedMeal(mealType); 
                    setShowFoodSelector(true); 
                  }}
                  className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  Tambah Makanan
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Food Selector Modal */}
        {showFoodSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  Tambah Makanan untuk {selectedMeal}
                </h2>
                <button
                  onClick={() => setShowFoodSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Search Bar */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Cari makanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* AISearch Integration */}
                <div className="mb-6">
                  <AISearch
                    onSelectFood={(food) => {
                      const newFood: Food = {
                        ...food,
                        id: `food-${Date.now()}`
                      };
                      addFoodToMeal(newFood);
                      setShowFoodSelector(false);
                    }}
                  />
                </div>

                {/* Sample Foods List */}
                {searchQuery && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Makanan yang tersedia:</h3>
                    <div className="space-y-3">
                      {filteredFoods.map(food => (
                        <div 
                          key={food.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            addFoodToMeal(food);
                            setShowFoodSelector(false);
                          }}
                        >
                          <div>
                            <p className="font-medium text-gray-800">{food.name}</p>
                            <p className="text-sm text-gray-500">{food.servingSize}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">{food.calories} kcal</p>
                            <div className="flex text-xs text-gray-500 space-x-2">
                              <span>P: {food.protein}g</span>
                              <span>K: {food.carbs}g</span>
                              <span>L: {food.fat}g</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanning;