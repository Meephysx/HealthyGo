import React, { useState, useEffect } from 'react';
import { Plus, Clock, ChevronLeft, ChevronRight, Check, Sparkles, Info, Loader, RefreshCw } from 'lucide-react';
import { useNutrition } from '../context/NutritionContext'; // Import untuk menghubungkan dengan Dashboard
import AISearch from './FoodSearch';

// Sample foods data
const SAMPLE_FOODS = [
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

interface AIMealPlan {
  Sarapan: {
    menu: string;
    calories: number;
    time: string;
    reasoning: string;
    portions: string;
  };
  MakanSiang: {
    menu: string;
    calories: number;
    time: string;
    reasoning: string;
    portions: string;
  };
  MakanMalam: {
    menu: string;
    calories: number;
    time: string;
    reasoning: string;
    portions: string;
  };
  snacks?: {
    menu: string;
    calories: number;
    time: string;
    reasoning: string;
    portions: string;
  };
  totalCalories: number;
  nutritionTips?: string;
  hydrationGoal?: string;
}

const MealPlanning: React.FC = () => {
  // Pastikan NutritionProvider membungkus komponen ini di App.tsx atau index.tsx
  // Contoh: <NutritionProvider><MealPlanning /></NutritionProvider>

  // Default user for demo purposes
  const [user] = useState<User>({
    weight: 70,
    height: 170,
    age: 25,
    gender: 'male',
    goal: 'maintain-weight',
    activityLevel: 'moderate',
    dailyCalories: 2200
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState<'Sarapan' | 'MakanSiang' | 'MakanMalam' | 'snacks'>('Sarapan');
  const [aiMealPlan, setAiMealPlan] = useState<AIMealPlan | null>(null);
  const [consumedFoods, setConsumedFoods] = useState<string[]>([]);
  const [customMealPlan, setCustomMealPlan] = useState({
    Sarapan: [] as Food[],
    MakanSiang: [] as Food[],
    MakanMalam: [] as Food[],
    snacks: [] as Food[]
  });
  const [showFoodSelector, setShowFoodSelector] = useState(false);
  const [showAiRecommendations, setShowAiRecommendations] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  // Hook untuk NutritionContext - digunakan untuk sinkronisasi dengan Dashboard
  const { updateNutrition } = useNutrition();


  const { nutrition: todayNutrition } = useNutrition(); // Tambahkan ini untuk membaca data nutrisi terkini dari context

  useEffect(() => {
    // Load consumed foods for current date
    const dateKey = formatDateKey(currentDate);
    const savedConsumed = JSON.parse(localStorage.getItem(`consumed-${dateKey}`) || '[]');
    setConsumedFoods(savedConsumed);
  }, [currentDate]);

  // useEffect baru: Update NutritionContext setiap kali consumedFoods, currentDate, atau meal plan berubah
  // Ini menghubungkan Meals dengan Dashboard - progress di Dashboard akan update real-time
  useEffect(() => {
    const consumedNutrition = getConsumedNutrition();
    updateNutrition({
      calories: consumedNutrition.calories,
      protein: consumedNutrition.protein,
      carbs: consumedNutrition.carbs,
      fat: consumedNutrition.fat,
      date: formatDateKey(currentDate) // Pastikan update per tanggal
    });
  }, [consumedFoods, currentDate, aiMealPlan, customMealPlan, showAiRecommendations, updateNutrition]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // AI Meal Plan Generation using your existing API
  const generateAIMealPlan = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    
    const apiKey = "AIzaSyAtFPZ9ZMr350lAx7Mg8u6CnI95dHBdvK4";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Enhanced prompt for better meal planning
    const prompt = `Sebagai ahli nutrisi AI, buatkan rencana makan sehat dan lengkap untuk 1 hari penuh dengan profil pengguna berikut:\n\nPROFIL PENGGUNA:\n- Berat badan: ${user.weight} kg\n- Tinggi badan: ${user.height} cm  \n- Usia: ${user.age} tahun\n- Jenis kelamin: ${user.gender}\n- Tujuan fitness: ${user.goal}\n- Tingkat aktivitas: ${user.activityLevel}\n- Target kalori harian: ${user.dailyCalories} kcal\n\nINSTRUKSI:\n1. Buat menu menggunakan makanan Indonesia yang mudah didapat dimana saja\n2. Pastikan distribusi kalori seimbang (sarapan 25%, makansiang 35%, makan malam 30%, sisanya snack)\n3. Sesuaikan dengan tujuan fitness pengguna\n4. Berikan penjelasan mengapa menu tersebut cocok untuk profil pengguna\n5. Sertakan estimasi porsi yang realistis\n\nFORMAT OUTPUT (JSON saja tanpa teks tambahan):\n{\n  \"Sarapan\": {\n    \"menu\": \"Menu sarapan lengkap (contoh: Oatmeal dengan pisang dan kacang almond)\",\n    \"calories\": 550,\n    \"time\": \"07:00 - 08:00\",\n    \"reasoning\": \"Penjelasan kenapa menu ini cocok untuk profil pengguna\",\n    \"portions\": \"Ukuran porsi detail (contoh: 1 mangkuk besar oatmeal + 1 buah pisang sedang)\"\n  },\n  \"MakanSiang\": {\n    \"menu\": \"Menu makansiang lengkap\",\n    \"calories\": 770,\n    \"time\": \"12:00 - 13:00\", \n    \"reasoning\": \"Penjelasan kenapa menu ini cocok\",\n    \"portions\": \"Ukuran porsi detail\"\n  },\n  \"MakanMalam\": {\n    \"menu\": \"Menu makan malam lengkap\",\n    \"calories\": 660,\n    \"time\": \"18:00 - 19:00\",\n    \"reasoning\": \"Penjelasan kenapa menu ini cocok\", \n    \"portions\": \"Ukuran porsi detail\"\n  },\n  \"snacks\": {\n    \"menu\": \"Snack sehat\",\n    \"calories\": 220,\n    \"time\": \"15:00 - 16:00\",\n    \"reasoning\": \"Penjelasan kenapa snack ini cocok\",\n    \"portions\": \"Ukuran porsi snack\"\n  },\n  \"totalCalories\": ${user.dailyCalories},\n  \"nutritionTips\": \"Tips nutrisi khusus untuk tujuan ${user.goal}\",\n  \"hydrationGoal\": \"Target minum air per hari\"\n}`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (!text) {
        throw new Error("No response text from AI");
      }
      
      // Clean and parse JSON - handle various response formats
      let cleanedText = text.trim();
      
      // Remove markdown code blocks if present
      if (cleanedText.includes('```json')) {
        cleanedText = cleanedText.replace(/```json\s*\n?/, '').replace(/\n?\s*```/, '');
      } else if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```\s*\n?/, '').replace(/\n?\s*```/, '');
      }
      
      // Find JSON object in the response
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('AI Response:', cleanedText); // Debug log
      
      const mealPlan = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!mealPlan.Sarapan || !mealPlan.MakanSiang || !mealPlan.MakanMalam) {
        throw new Error("Invalid meal plan structure from AI");
      }
      
      setAiMealPlan(mealPlan);
      
      // Cache the result with expiry
      // Store in memory instead of localStorage for this environment
      setAiMealPlan(mealPlan);
      
    } catch (error) {
      console.error('Error generating AI meal plan:', error);
      
      // Fallback with sample data if API fails
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

  // Load cached AI meal plan (memory-based caching for this environment)
  const loadCachedMealPlan = () => {
    // In this environment, we'll generate fresh meal plans each time
    // but you can implement memory-based caching if needed
    return false;
  };

  // Load AI meal plan on component mount or date change
  useEffect(() => {
    if (showAiRecommendations && !loadCachedMealPlan()) {
      generateAIMealPlan();
    }
  }, [currentDate, showAiRecommendations]);

  const isFoodConsumed = (foodId: string, mealType: string, mealIndex?: number) => {
    const uniqueId = showAiRecommendations
      ? `ai-meal-${mealIndex}-${formatDateKey(currentDate)}`
      : `${foodId}-${mealType}-${formatDateKey(currentDate)}`;
    return consumedFoods.includes(uniqueId);
  };

  const toggleFoodConsumed = (foodId: string, mealType: string, mealIndex?: number) => {
  const uniqueId = showAiRecommendations
    ? `ai-meal-${mealIndex}-${formatDateKey(currentDate)}`
    : `${foodId}-${mealType}-${formatDateKey(currentDate)}`;

  const newConsumed = consumedFoods.includes(uniqueId)
    ? consumedFoods.filter(id => id !== uniqueId)
    : [...consumedFoods, uniqueId];

  setConsumedFoods(newConsumed);
  localStorage.setItem(`consumed-${formatDateKey(currentDate)}`, JSON.stringify(newConsumed));

  // 🔹 Hitung ulang total nutrisi dari makanan yang dimakan
  const total = getTotalConsumedNutrition();

  // 🔹 Update progress bar
  updateNutrition({
    calories: total.calories,
    protein: total.protein,
    carbs: total.carbs,
    fat: total.fat,
    date: formatDateKey(currentDate),
  });

  // 🔹 Simpan agar tetap sinkron saat berpindah menu
  localStorage.setItem(
    'total-consumed-nutrition',
    JSON.stringify({ ...total, date: formatDateKey(currentDate) })
  );
};


  const addFoodToMeal = (food: Food) => {
  setCustomMealPlan(prev => {
    const updatedPlan = {
      ...prev,
      [selectedMeal]: [...prev[selectedMeal], food]
    };

    // 🔹 Hitung ulang total nutrisi semua makanan custom
    const allFoods = [
      ...updatedPlan.Sarapan,
      ...updatedPlan.MakanSiang,
      ...updatedPlan.MakanMalam,
      ...updatedPlan.snacks
    ];

    const totalNutrition = allFoods.reduce(
      (sum, item) => ({
        calories: sum.calories + (item.calories || 0),
        protein: sum.protein + (item.protein || 0),
        carbs: sum.carbs + (item.carbs || 0),
        fat: sum.fat + (item.fat || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // 🔹 Panggil updateNutrition supaya progress bar ikut berubah
    updateNutrition({
      calories: totalNutrition.calories,
      protein: totalNutrition.protein,
      carbs: totalNutrition.carbs,
      fat: totalNutrition.fat,
      date: formatDateKey(currentDate)
    });

    return updatedPlan;
  });
};


  const removeFoodFromMeal = (foodId: string, mealType: keyof typeof customMealPlan) => {
    setCustomMealPlan(prev => ({
      ...prev,
      [mealType]: prev[mealType].filter(food => food.id !== foodId)
    }));
  };

  const getTotalNutrition = () => {
    if (showAiRecommendations && aiMealPlan) {
      return {
        calories: aiMealPlan.totalCalories,
        protein: Math.round(aiMealPlan.totalCalories * 0.25 / 4),
        carbs: Math.round(aiMealPlan.totalCalories * 0.45 / 4),
        fat: Math.round(aiMealPlan.totalCalories * 0.30 / 9)
      };
    } else {
      const allFoods = [...customMealPlan.Sarapan, ...customMealPlan.MakanSiang, ...customMealPlan.MakanMalam, ...customMealPlan.snacks];
      return allFoods.reduce((total, food) => ({
        calories: total.calories + food.calories,
        protein: total.protein + food.protein,
        carbs: total.carbs + food.carbs,
        fat: total.fat + food.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
  };

  const getConsumedNutrition = () => {
    let totalNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    if (showAiRecommendations && aiMealPlan) {
      const meals = [aiMealPlan.Sarapan, aiMealPlan.MakanSiang, aiMealPlan.MakanMalam];
      meals.forEach((meal, index) => {
        const mealId = `ai-meal-${index}-${formatDateKey(currentDate)}`;
        if (consumedFoods.includes(mealId)) {
          totalNutrition.calories += meal.calories;
          // Estimasi protein/karbohidrat/lemak berdasarkan kalori (25% protein, 45% carbs, 30% fat)
          totalNutrition.protein += Math.round(meal.calories * 0.25 / 4); // 4 kcal per gram protein
          totalNutrition.carbs += Math.round(meal.calories * 0.45 / 4);   // 4 kcal per gram carbs
          totalNutrition.fat += Math.round(meal.calories * 0.30 / 9);     // 9 kcal per gram fat
        }
      });
      // Jika ada snacks
      if (aiMealPlan.snacks && consumedFoods.includes(`ai-meal-3-${formatDateKey(currentDate)}`)) {
        totalNutrition.calories += aiMealPlan.snacks.calories;
        totalNutrition.protein += Math.round(aiMealPlan.snacks.calories * 0.25 / 4);
        totalNutrition.carbs += Math.round(aiMealPlan.snacks.calories * 0.45 / 4);
        totalNutrition.fat += Math.round(aiMealPlan.snacks.calories * 0.30 / 9);
      }
    } else {
      // Handle custom meal plan consumption
      Object.entries(customMealPlan).forEach(([,foods]) => {
        foods.forEach(food => {
          if (consumedFoods.includes(food.id)) {
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

  const totalNutrition = getTotalNutrition();
  const consumedNutrition = getConsumedNutrition();
  const targetCalories = user.dailyCalories;

  // 🔹 Fungsi untuk menghitung total nutrisi dari makanan yang sudah dimakan
  const getTotalConsumedNutrition = () => {
  let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Dari AI recommendation
  if (Array.isArray(aiMealPlan)) {
    aiMealPlan.forEach((meal, mealIndex) => {
      const id = `ai-meal-${mealIndex}-${formatDateKey(currentDate)}`;
      if (consumedFoods.includes(id) && Array.isArray(meal.items)) {
        meal.items.forEach((item: any) => {
          total.calories += item.calories || 0;
          total.protein += item.protein || 0;
          total.carbs += item.carbs || 0;
          total.fat += item.fat || 0;
        });
      }
    });
  }

  // Dari Atur Makan (custom meal)
  Object.entries(customMealPlan || {}).forEach(([mealType, foods]: any) => {
    (foods || []).forEach((food: any) => {
      const id = `${food.id}-${mealType}-${formatDateKey(currentDate)}`;
      if (consumedFoods.includes(id)) {
        total.calories += food.calories || 0;
        total.protein += food.protein || 0;
        total.carbs += food.carbs || 0;
        total.fat += food.fat || 0;
      }
    });
  });

  return total;
};

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

  const previousDay = () => {
    setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
  };

  const nextDay = () => {
    setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
  };

  // Filter foods based on search query
  const filteredFoods = SAMPLE_FOODS.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Meal Planning</h1>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-center mb-6">
          <button onClick={previousDay} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold mx-4">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <button onClick={nextDay} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* AI vs Custom Toggle */}
        <div className="flex justify-center mb-6 bg-gray-200 rounded-lg p-1 w-max mx-auto">
          <button 
            onClick={() => setShowAiRecommendations(true)} 
            className={`px-4 py-2 text-sm font-medium rounded-md ${showAiRecommendations ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'}`}>
            Rekomendasi AI
          </button>
          <button 
            onClick={() => setShowAiRecommendations(false)} 
            className={`px-4 py-2 text-sm font-medium rounded-md ${!showAiRecommendations ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'}`}>
            Atur Makan
          </button>
        </div>

        {/* Nutrition Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Target Kalori</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Target</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(targetCalories)}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dikonsumsi</p>
              <p className="text-2xl font-bold text-green-600">{Math.round(consumedNutrition.calories)}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tersisa</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(Math.max(0, targetCalories - consumedNutrition.calories))}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Target</p>
              <p className="text-2xl font-bold text-purple-600">{Math.round(totalNutrition.calories)}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (consumedNutrition.calories / targetCalories) * 100)}%` }}></div>
          </div>
        </div>

        {showAiRecommendations ? (
          // AI Recommendations View
          <div>
            {isLoadingAI ? (
              <div className="flex justify-center items-center py-10">
                <Loader className="animate-spin text-green-600" size={40} />
                <p className="ml-4 text-gray-600">Generating your personalized meal plan...</p>
              </div>
            ) : aiError ? (
              <div className="text-center p-6 bg-red-50 rounded-lg text-red-700">
                <p>{aiError}</p>
                <button onClick={generateAIMealPlan} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center mx-auto">
                  <RefreshCw size={16} className="mr-2" />
                  Retry
                </button>
              </div>
            ) : aiMealPlan && (
              <div className="space-y-8">
                {/* Meal Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(aiMealPlan).filter(([key]) => ['Sarapan', 'MakanSiang', 'MakanMalam', 'snacks'].includes(key)).map(([mealType, meal], index) => (
                    meal && <div key={mealType} className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="font-semibold text-lg flex items-center">{mealIcons[mealType as keyof typeof mealIcons]} <span className="ml-2 capitalize">{mealType}</span></h3>
                      <p className="text-sm text-gray-500 mb-4">{meal.time}</p>
                      <div className="flex items-center justify-between font-medium text-gray-800">
                        <span>{meal.menu}</span>
                        <button
                          onClick={() => toggleFoodConsumed(meal.menu, mealType, index)}
                          className={`ml-2 p-1 rounded-full ${isFoodConsumed(meal.menu, mealType, index) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                      <p className="text-green-600 font-semibold mt-2">{meal.calories} kcal</p>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-600 flex">
                          <Info size={14} className="mr-2 flex-shrink-0" />
                          <span>{meal.reasoning}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Nutrition Tips */}
                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-lg text-green-800 flex items-center"><Sparkles size={20} className="mr-2"/>Nutrition Pro-Tips</h3>
                  <p className="text-green-700 mt-2">{aiMealPlan.nutritionTips}</p>
                  <p className="text-green-700 mt-2"><strong>Hydration Goal:</strong> {aiMealPlan.hydrationGoal}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Custom Meal Plan View
          <div className="grid lg:grid-cols-2 gap-8">
            {Object.entries(customMealPlan).map(([mealType, foods]) => (
              <div key={mealType} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-xl capitalize flex items-center">{mealIcons[mealType as keyof typeof mealIcons]} {mealType}</h3>
                  <p className="text-sm text-gray-500">{mealTimes[mealType as keyof typeof mealTimes]}</p>
                </div>
                
                <div className="space-y-3 mb-4">
                  {foods.map(food => (
                    <div key={food.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">
                          {food.name}
                          <button
                            onClick={() => toggleFoodConsumed(food.id, mealType)}
                            className={`ml-2 p-1 rounded-full ${isFoodConsumed(food.id, mealType) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                          >
                            <Check size={16} />
                          </button>
                        </p>
                        <p className="text-sm text-gray-500">{food.servingSize}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{food.calories} kcal</p>
                        <button onClick={() => removeFoodFromMeal(food.id, mealType as keyof typeof customMealPlan)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                      </div>
                    </div>
                  ))}
                  {foods.length === 0 && <p className="text-center text-gray-500 py-4">Tidak ada makanan</p>}
                </div>

                <button 
                  onClick={() => { setSelectedMeal(mealType as any); setShowFoodSelector(true); }}
                  className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                  <Plus size={16} className="mr-2" />
                  Tambah Makanan
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Food Selector Modal */}
{showFoodSelector && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Tambah Makanan Untuk {selectedMeal}</h2>

      {/* 🔗 Integrasi FoodSearch */}
      <AISearch
        onSelectFood={(food) => {
          // Tambahkan ke meal yang sedang aktif + update nutrisi otomatis
          const newFood = {
            ...food,
            id: Date.now().toString(), // beri ID unik
          };
          addFoodToMeal(newFood);
        }}
      />

      <button
        onClick={() => setShowFoodSelector(false)}
        className="mt-6 w-full py-2 px-4 bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
      >
        Tutup
      </button>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default MealPlanning;