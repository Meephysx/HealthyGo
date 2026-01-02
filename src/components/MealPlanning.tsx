import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Check, Sparkles, Info, Loader, RefreshCw, X } from 'lucide-react';
import { useNutrition } from '../context/NutritionContext';
import AISearch from './FoodSearch';

// --- Types Interfaces ---
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
  // State User default (akan ditimpa oleh localStorage)
  const [user, setUser] = useState<User>({
    weight: 70,
    height: 170,
    age: 25,
    gender: 'pria',
    goal: 'maintain-weight',
    activityLevel: 'moderate',
    dailyCalories: 2000
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
  
  // Nutrition Context
  const { updateNutrition } = useNutrition();

  // Sample foods data (Fallback)
  const SAMPLE_FOODS: Food[] = [
    { id: '1', name: 'Nasi Merah dengan Ayam Bakar', calories: 450, protein: 35, carbs: 45, fat: 12, servingSize: '1 porsi' },
    { id: '2', name: 'Salad Sayuran dengan Tahu', calories: 280, protein: 15, carbs: 25, fat: 8, servingSize: '1 mangkuk' },
    { id: '3', name: 'Smoothie Pisang Protein', calories: 320, protein: 25, carbs: 35, fat: 8, servingSize: '1 gelas' },
    { id: '4', name: 'Ikan Salmon Panggang', calories: 380, protein: 40, carbs: 5, fat: 18, servingSize: '150g' },
    { id: '5', name: 'Oatmeal dengan Buah', calories: 300, protein: 12, carbs: 45, fat: 8, servingSize: '1 mangkuk' }
  ];

  // Utility Functions
  const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];
  const getCurrentDateKey = (): string => formatDateKey(currentDate);

  // Load User Data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Gagal memparsing data user:", error);
      }
    }
  }, []);

  // Load Consumed Foods
  useEffect(() => {
    const dateKey = getCurrentDateKey();
    const savedConsumed = JSON.parse(localStorage.getItem(`consumed-${dateKey}`) || '[]');
    setConsumedFoods(savedConsumed);
  }, [currentDate]);

  // --- LOGIKA API OPENROUTER (Fetch) ---
  const generateAIMealPlan = async (): Promise<void> => {
    setIsLoadingAI(true);
    setAiError(null);
  
    // API KEY BARU ANDA
    const apiKey = "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";
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions"; 
  
    const prompt = `
    Bertindaklah sebagai ahli gizi profesional. Buat rencana makan harian yang mudah ditemui di indonesia dan gampang ditemukan di warung lengkap dalam format JSON.

    Profil Pengguna:
    - Gender: ${user.gender}
    - Umur: ${user.age} tahun
    - Berat: ${user.weight} kg
    - Tinggi: ${user.height} cm
    - Goal: ${user.goal} (Tujuan)
    - Target Kalori Harian: ${user.dailyCalories} kcal.

    Instruksi Output:
    1. WAJIB menggunakan Bahasa Indonesia.
    2. Output HANYA berupa JSON valid (tanpa markdown atau teks tambahan).
    3. Ikuti struktur JSON ini persis:
    {
      "Sarapan": {
        "menu": "Nama Makanan",
        "calories": 400,
        "time": "07:00",
        "reasoning": "Alasan pemilihan menu",
        "portions": "Ukuran porsi"
      },
      "MakanSiang": {
        "menu": "Nama Makanan",
        "calories": 700,
        "time": "13:00",
        "reasoning": "Alasan pemilihan menu",
        "portions": "Ukuran porsi"
      },
      "MakanMalam": {
        "menu": "Nama Makanan",
        "calories": 500,
        "time": "19:00",
        "reasoning": "Alasan pemilihan menu",
        "portions": "Ukuran porsi"
      },
      "snacks": {
        "menu": "Nama Snack",
        "calories": 200,
        "time": "16:00",
        "reasoning": "Alasan pemilihan menu",
        "portions": "Ukuran porsi"
      },
      "totalCalories": 1800,
      "nutritionTips": "Tips kesehatan singkat untuk hari ini",
      "hydrationGoal": "Target minum air (misal: 2.5 Liter)"
    }
    `;

  

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin, // Opsional: Untuk identifikasi di OpenRouter
          "X-Title": "Aplikasi Meal Planner",     // Opsional: Nama aplikasi
        },
        body: JSON.stringify({
          // Menggunakan model Gemini Flash via OpenRouter (Cepat & Hemat)
          // Anda bisa mengganti ini ke 'deepseek/deepseek-chat' atau 'openai/gpt-4o' jika mau
          "model": "google/gemini-2.0-flash-001", 
          "messages": [
            { 
              "role": "user", 
              "content": prompt 
            }
          ],
          "response_format": { "type": "json_object" }
        }),
      });

      if (!response.ok) {
        // Handle error jika status bukan 200 OK
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Ambil konten dari response OpenRouter
      const rawContent = data.choices?.[0]?.message?.content;
      
      if (!rawContent) {
        throw new Error("Respon AI kosong.");
      }

      // Parsing JSON
      const parsedPlan: AIMealPlan = JSON.parse(rawContent);
      setAiMealPlan(parsedPlan);

    } catch (err: any) {
      console.error("Meal plan API error:", err);
      setAiError("Gagal menyusun menu. Pastikan koneksi internet lancar atau coba sesaat lagi.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Trigger AI saat user/mode berubah (Debounce agar tidak spam request)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (showAiRecommendations && user.dailyCalories > 0) {
      timeoutId = setTimeout(() => {
        generateAIMealPlan();
      }, 500); // Delay 500ms
    }
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, showAiRecommendations, user.dailyCalories]); 

  // --- Logic Makanan Dikonsumsi ---
  const getFoodUniqueId = (foodId: string, mealType: string): string => {
    return `${showAiRecommendations ? 'ai' : 'custom'}-${foodId}-${mealType}-${getCurrentDateKey()}`;
  };

  const isFoodConsumed = (foodId: string, mealType: string): boolean => {
    return consumedFoods.includes(getFoodUniqueId(foodId, mealType));
  };

  const toggleFoodConsumed = (foodId: string, mealType: string): void => {
    const uniqueId = getFoodUniqueId(foodId, mealType);
    const newConsumed = consumedFoods.includes(uniqueId)
      ? consumedFoods.filter(id => id !== uniqueId)
      : [...consumedFoods, uniqueId];

    setConsumedFoods(newConsumed);
    localStorage.setItem(`consumed-${getCurrentDateKey()}`, JSON.stringify(newConsumed));
  };

  // Hitung Nutrisi Terkonsumsi
  const getConsumedNutrition = () => {
    let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    if (showAiRecommendations && aiMealPlan) {
      (['Sarapan', 'MakanSiang', 'MakanMalam', 'snacks'] as MealType[]).forEach(type => {
        const meal = aiMealPlan[type];
        if (meal && isFoodConsumed(type, type)) {
          total.calories += meal.calories;
          // Estimasi makro sederhana (karena AI kadang tidak return detail makro per item)
          total.protein += Math.round(meal.calories * 0.25 / 4);
          total.carbs += Math.round(meal.calories * 0.45 / 4);
          total.fat += Math.round(meal.calories * 0.30 / 9);
        }
      });
    } else {
      Object.entries(customMealPlan).forEach(([mealType, foods]) => {
        foods.forEach(food => {
          if (isFoodConsumed(food.id, mealType)) {
            total.calories += food.calories;
            total.protein += food.protein;
            total.carbs += food.carbs;
            total.fat += food.fat;
          }
        });
      });
    }
    return total;
  };

  // Update Global Context & LocalStorage
  useEffect(() => {
    const consumed = getConsumedNutrition();
    const dateKey = getCurrentDateKey();

    updateNutrition({ ...consumed, date: dateKey });
    localStorage.setItem(`daily-nutrition-${dateKey}`, JSON.stringify({
      ...consumed, date: dateKey, targetCalories: user.dailyCalories 
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumedFoods, aiMealPlan, customMealPlan, showAiRecommendations]);

  const addFoodToMeal = (food: Food) => {
    setCustomMealPlan(prev => ({ ...prev, [selectedMeal]: [...prev[selectedMeal], food] }));
  };

  const removeFoodFromMeal = (foodId: string, mealType: MealType) => {
    setCustomMealPlan(prev => ({ ...prev, [mealType]: prev[mealType].filter(f => f.id !== foodId) }));
  };

  const getTotalPlannedCalories = () => {
    if (showAiRecommendations && aiMealPlan) return aiMealPlan.totalCalories;
    return Object.values(customMealPlan).flat().reduce((sum, f) => sum + f.calories, 0);
  };

  const consumedNutrition = getConsumedNutrition();
  const calorieProgress = user.dailyCalories > 0 
    ? Math.min(100, (consumedNutrition.calories / user.dailyCalories) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Toggle */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Meal Planning</h1>
          <div className="flex items-center bg-white shadow-sm rounded-lg p-1">
            <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
            <span className="px-4 font-semibold">{currentDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-200 rounded-lg p-1">
            <button onClick={() => setShowAiRecommendations(true)} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${showAiRecommendations ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'}`}>Rekomendasi AI</button>
            <button onClick={() => setShowAiRecommendations(false)} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${!showAiRecommendations ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'}`}>Atur Manual</button>
          </div>
        </div>

        {/* Nutrition Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wider">Target</p>
              <p className="text-2xl font-bold text-gray-900">{user.dailyCalories} <span className="text-xs font-normal text-gray-400">kcal</span></p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wider">Dikonsumsi</p>
              <p className="text-2xl font-bold text-green-600">{consumedNutrition.calories} <span className="text-xs font-normal text-gray-400">kcal</span></p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wider">Tersisa</p>
              <p className="text-2xl font-bold text-blue-600">{Math.max(0, user.dailyCalories - consumedNutrition.calories)} <span className="text-xs font-normal text-gray-400">kcal</span></p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wider">Rencana</p>
              <p className="text-2xl font-bold text-purple-600">{getTotalPlannedCalories()} <span className="text-xs font-normal text-gray-400">kcal</span></p>
            </div>
          </div>
          <div className="mt-6 h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${calorieProgress}%` }} />
          </div>
        </div>

        {/* Content */}
        {showAiRecommendations ? (
          isLoadingAI ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="animate-spin text-green-500 mb-4" size={48} />
              <p className="text-gray-500 animate-pulse font-medium">AI sedang menyusun menu sehatmu...</p>
              <p className="text-xs text-gray-400 mt-2">(Model: gemini-2.0-flash via OpenRouter)</p>
            </div>
          ) : aiError ? (
            <div className="bg-red-50 text-red-700 p-8 rounded-2xl text-center border border-red-100">
              <p className="mb-4 font-medium">{aiError}</p>
              <button onClick={generateAIMealPlan} className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"><RefreshCw size={18} className="mr-2"/> Coba Lagi</button>
            </div>
          ) : aiMealPlan && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {(['Sarapan', 'MakanSiang', 'MakanMalam', 'snacks'] as const).map((type) => {
                const meal = aiMealPlan[type];
                if (!meal) return null;
                const icons = { Sarapan: '🌅', MakanSiang: '☀️', MakanMalam: '🌙', snacks: '🍎' };
                return (
                  <div key={type} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-2xl">{icons[type]}</span>
                      <button onClick={() => toggleFoodConsumed(type, type)} className={`p-2 rounded-full transition-all ${isFoodConsumed(type, type) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}><Check size={20}/></button>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{type}</h3>
                    <p className="text-xs text-gray-400 mb-3">{meal.time}</p>
                    <p className="text-gray-700 font-medium mb-2 leading-relaxed">{meal.menu}</p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-lg font-bold text-green-600">{meal.calories}</span>
                      <span className="text-xs text-gray-400">kcal</span>
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                      <p className="text-xs text-gray-500 flex gap-2"><Info size={14} className="shrink-0"/> {meal.reasoning}</p>
                    </div>
                  </div>
                );
              })}
              {/* Tips Section */}
              <div className="md:col-span-2 lg:col-span-4 bg-green-50 p-6 rounded-2xl border border-green-100 flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm"><Sparkles className="text-green-500" size={24}/></div>
                <div>
                  <h4 className="font-bold text-green-900 mb-1">Tips Nutrisi Hari Ini</h4>
                  <p className="text-green-800 text-sm leading-relaxed">{aiMealPlan.nutritionTips}</p>
                  <p className="mt-2 text-xs font-bold text-green-700">💧 Target Hidrasi: {aiMealPlan.hydrationGoal}</p>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {(['Sarapan', 'MakanSiang', 'MakanMalam', 'snacks'] as MealType[]).map(type => (
              <div key={type} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 capitalize">{type}</h3>
                  <button onClick={() => { setSelectedMeal(type); setShowFoodSelector(true); }} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"><Plus size={20}/></button>
                </div>
                <div className="space-y-4">
                  {customMealPlan[type].length > 0 ? customMealPlan[type].map(food => (
                    <div key={food.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleFoodConsumed(food.id, type)} className={`p-1.5 rounded-md transition-all ${isFoodConsumed(food.id, type) ? 'bg-green-500 text-white' : 'bg-white border text-transparent'}`}><Check size={14}/></button>
                        <div>
                          <p className="font-semibold text-gray-800">{food.name}</p>
                          <p className="text-xs text-gray-400">{food.servingSize} • {food.calories} kcal</p>
                        </div>
                      </div>
                      <button onClick={() => removeFoodFromMeal(food.id, type)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"><X size={18}/></button>
                    </div>
                  )) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-50 rounded-2xl text-gray-400 text-sm">Belum ada menu dipilih</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Selector */}
        {showFoodSelector && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Pilih Menu {selectedMeal}</h2>
                <button onClick={() => setShowFoodSelector(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <AISearch onSelectFood={(food) => { addFoodToMeal({ ...food, id: `f-${Date.now()}` }); setShowFoodSelector(false); }} />
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Rekomendasi Cepat</h3>
                  <div className="grid gap-3">
                    {SAMPLE_FOODS.map(food => (
                      <div key={food.id} onClick={() => { addFoodToMeal(food); setShowFoodSelector(false); }} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all">
                        <div>
                          <p className="font-bold text-gray-800">{food.name}</p>
                          <p className="text-xs text-gray-400">{food.servingSize}</p>
                        </div>
                        <p className="font-bold text-green-600">{food.calories} kcal</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanning;