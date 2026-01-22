import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Check, Sparkles, Info, Loader, RefreshCw, X, Trash2 } from 'lucide-react';
import { useNutrition } from '../context/NutritionContext'; // Pastikan path ini benar
import AISearch from './FoodSearch'; // Pastikan path ini benar

// --- Types Interfaces ---
interface User {
  weight: number;
  height: number;
  age: number;
  gender: string;
  goal: string;
  activityLevel: string;
  dailyCalories: number;
  dietaryRestrictions?: string[];
  allergies?: string[];
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
  protein: number;
  carbs: number;
  fat: number;
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
  // --- STATE ---
  const [user, setUser] = useState<User>({
    weight: 70, height: 170, age: 25, gender: 'pria', goal: 'maintain-weight', activityLevel: 'moderate', dailyCalories: 2000, dietaryRestrictions: [], allergies: []
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState<MealType>('Sarapan');
  const [aiMealPlan, setAiMealPlan] = useState<AIMealPlan | null>(null);
  const [consumedFoods, setConsumedFoods] = useState<string[]>([]);
  
  // State untuk Menu Manual (Sekarang disimpan LocalStorage)
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
  
  const { updateNutrition } = useNutrition();

  // --- UTILITY ---
  const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];
  const getCurrentDateKey = (): string => formatDateKey(currentDate);

  // --- LOAD DATA (Effect Awal) ---
  useEffect(() => {
    // 1. Load User (Lengkap dengan dietary restrictions dan allergies)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          weight: parsed.weight || 70,
          height: parsed.height || 170,
          age: parsed.age || 25,
          gender: parsed.gender || 'pria',
          goal: parsed.goal || 'maintain-weight',
          activityLevel: parsed.activityLevel || 'moderate',
          dailyCalories: parsed.dailyCalories || 2000,
          dietaryRestrictions: parsed.dietaryRestrictions || [],
          allergies: parsed.allergies || []
        });
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // 2. Load UI Preference (Terakhir pakai AI atau Manual?)
    const savedMode = localStorage.getItem('meal-plan-mode');
    if (savedMode) setShowAiRecommendations(savedMode === 'ai');
  }, []);

  // --- LOAD DAILY DATA (Saat Tanggal Berubah) ---
  useEffect(() => {
    const dateKey = getCurrentDateKey();

    // 1. Load Consumed IDs (Checklist)
    const savedConsumed = JSON.parse(localStorage.getItem(`consumed-${dateKey}`) || '[]');
    setConsumedFoods(savedConsumed);

    // 2. Load Custom Meal Plan (PENTING: Agar menu manual tidak hilang saat refresh)
    const savedCustom = localStorage.getItem(`custom-meal-${dateKey}`);
    if (savedCustom) {
      setCustomMealPlan(JSON.parse(savedCustom));
    } else {
      setCustomMealPlan({ Sarapan: [], MakanSiang: [], MakanMalam: [], snacks: [] });
    }

    // 3. Load AI Plan (Agar tidak generate ulang terus menerus jika sudah ada hari ini)
    const savedAI = localStorage.getItem(`ai-meal-${dateKey}`);
    if (savedAI) {
      setAiMealPlan(JSON.parse(savedAI));
    } else {
      setAiMealPlan(null); // Reset jika belum ada, nanti akan trigger generate
    }
  }, [currentDate]);

  // --- SAVE CUSTOM MEAL PLAN ---
  useEffect(() => {
    const dateKey = getCurrentDateKey();
    localStorage.setItem(`custom-meal-${dateKey}`, JSON.stringify(customMealPlan));
  }, [customMealPlan, currentDate]);

  // --- LOGIKA AI (Generate) ---
  const generateAIMealPlan = async (): Promise<void> => {
    const dateKey = getCurrentDateKey();
    // Jika sudah ada plan di localstorage hari ini, jangan fetch ulang (hemat kuota AI)
    if (localStorage.getItem(`ai-meal-${dateKey}`)) return;

    setIsLoadingAI(true);
    setAiError(null);
  
    const apiKey = "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";
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions"; 
  
    // Format dietary restrictions dan allergies dengan baik
    const dietaryInfo = user.dietaryRestrictions && user.dietaryRestrictions.length > 0 
      ? `Pantangan diet: ${user.dietaryRestrictions.join(', ')}` 
      : 'Tidak ada pantangan diet khusus';
    
    const allergiesInfo = user.allergies && user.allergies.length > 0 
      ? `Alergi: ${user.allergies.join(', ')}. HARUS hindari makanan ini sepenuhnya!` 
      : 'Tidak ada alergi';

    const prompt = `
    Bertindaklah sebagai ahli gizi profesional yang berpengalaman. Buat rencana makan harian Indonesia yang sehat, mudah didapat, dan DISESUAIKAN dengan profil user.
    
    PROFIL USER:
    - Usia: ${user.age} tahun
    - Gender: ${user.gender === 'pria' ? 'Laki-laki' : 'Perempuan'}
    - Tinggi: ${user.height} cm
    - Berat: ${user.weight} kg
    - Target Kalori Harian: ${user.dailyCalories} kcal
    - Level Aktivitas: ${user.activityLevel}
    - Tujuan: ${user.goal === 'weight-loss' ? 'Penurunan Berat Badan' : user.goal === 'weight-gain' ? 'Penambahan Berat Badan' : user.goal === 'muscle-gain' ? 'Penambahan Otot' : 'Mempertahankan Berat Badan'}
    - ${dietaryInfo}
    - ${allergiesInfo}
    
    PENTING: Menu HARUS sesuai dengan pantangan diet dan alergi. Jangan rekomendasikan makanan yang mengandung alergen.
    
    Output JSON Valid:
    {
      "Sarapan": { "menu": "...", "calories": 400, "protein": 15, "carbs": 45, "fat": 12, "time": "07:00", "reasoning": "...", "portions": "..." },
      "MakanSiang": { "menu": "...", "calories": 700, "protein": 30, "carbs": 80, "fat": 20, "time": "13:00", "reasoning": "...", "portions": "..." },
      "MakanMalam": { "menu": "...", "calories": 500, "protein": 25, "carbs": 55, "fat": 15, "time": "19:00", "reasoning": "...", "portions": "..." },
      "snacks": { "menu": "...", "calories": 200, "protein": 8, "carbs": 25, "fat": 6, "time": "16:00", "reasoning": "...", "portions": "..." },
      "totalCalories": 1800,
      "nutritionTips": "...",
      "hydrationGoal": "..."
    }
    `;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-001",
          "messages": [{ "role": "user", "content": prompt }],
          "response_format": { "type": "json_object" }
        }),
      });

      if (!response.ok) throw new Error("API Error: " + response.status);
      const data = await response.json();
      console.log('AI raw response:', data);

      // openrouter / LM providers sometimes return the JSON object directly
      // or return a string containing JSON. Support both.
      const rawContent = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.message ?? data.choices?.[0]?.content ?? null;
      if (!rawContent) throw new Error("Respon kosong dari AI");

      let parsedPlan: AIMealPlan | null = null;

      if (typeof rawContent === 'string') {
        // try direct parse, otherwise extract JSON block inside text
        try {
          parsedPlan = JSON.parse(rawContent);
        } catch (e) {
          const match = rawContent.match(/\{[\s\S]*\}/);
          if (match) {
            parsedPlan = JSON.parse(match[0]);
          }
        }
      } else if (typeof rawContent === 'object') {
        parsedPlan = rawContent as AIMealPlan;
      }

      if (!parsedPlan) throw new Error('Gagal mem-parsing response AI');

      setAiMealPlan(parsedPlan);
      // Simpan hasil AI ke storage hari ini
      localStorage.setItem(`ai-meal-${dateKey}`, JSON.stringify(parsedPlan));

    } catch (err: any) {
      console.error("AI Error:", err);
      setAiError("Gagal menyusun menu. Silakan coba lagi.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Trigger AI hanya jika mode AI aktif dan belum ada data
  useEffect(() => {
    if (showAiRecommendations && user.dailyCalories > 0 && !aiMealPlan && !isLoadingAI) {
       generateAIMealPlan();
    }
    // Simpan preferensi mode
    localStorage.setItem('meal-plan-mode', showAiRecommendations ? 'ai' : 'manual');
  }, [showAiRecommendations, user.dailyCalories, currentDate]);

  // --- LOGIKA CONSUMED & PROGRESS ---
  const getFoodUniqueId = (foodId: string, mealType: string): string => {
    // ID unik kombinasi ID makanan + Tipe waktu + Tanggal
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

  // Hitung Total Nutrisi (Digabungkan ke Progress.tsx)
  const calculateDailyNutrition = () => {
    let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    // Hitung dari AI Plan (jika ada yg dicentang)
    if (aiMealPlan) {
       (['Sarapan', 'MakanSiang', 'MakanMalam', 'snacks'] as MealType[]).forEach(type => {
          const meal = aiMealPlan[type];
          // Cek ID unik versi AI
          const aiId = `ai-${type}-${type}-${getCurrentDateKey()}`; 
          if (meal && consumedFoods.includes(aiId)) {
             total.calories += meal.calories;
             total.protein += Math.round(meal.calories * 0.25 / 4);
             total.carbs += Math.round(meal.calories * 0.45 / 4);
             total.fat += Math.round(meal.calories * 0.30 / 9);
          }
       });
    }

    // Hitung dari Custom Plan (jika ada yg dicentang)
    Object.entries(customMealPlan).forEach(([mealType, foods]) => {
      foods.forEach(food => {
        // Cek ID unik versi Custom
        const customId = `custom-${food.id}-${mealType}-${getCurrentDateKey()}`;
        if (consumedFoods.includes(customId)) {
          total.calories += food.calories;
          total.protein += food.protein;
          total.carbs += food.carbs;
          total.fat += food.fat;
        }
      });
    });

    return total;
  };

  // Update Global Context & LocalStorage untuk Progress Dashboard
  useEffect(() => {
    const consumed = calculateDailyNutrition();
    const dateKey = getCurrentDateKey();

    updateNutrition({ ...consumed, date: dateKey });
    
    // Simpan agar Progress.tsx bisa baca
    localStorage.setItem(`daily-nutrition-${dateKey}`, JSON.stringify({
      ...consumed, date: dateKey, targetCalories: user.dailyCalories 
    }));
  }, [consumedFoods, aiMealPlan, customMealPlan]);

  // --- HANDLER UI ---
  const addFoodToMeal = (food: Food) => {
    setCustomMealPlan(prev => ({ 
      ...prev, 
      [selectedMeal]: [...prev[selectedMeal], food] 
    }));
  };

  const removeFoodFromMeal = (foodId: string, mealType: MealType) => {
    setCustomMealPlan(prev => ({ 
      ...prev, 
      [mealType]: prev[mealType].filter(f => f.id !== foodId) 
    }));
    // Hapus juga status consumed-nya jika dihapus dari list
    const uniqueId = getFoodUniqueId(foodId, mealType);
    setConsumedFoods(prev => prev.filter(id => id !== uniqueId));
  };

  const consumedNutrition = calculateDailyNutrition();
  const calorieProgress = user.dailyCalories > 0 
    ? Math.min(100, (consumedNutrition.calories / user.dailyCalories) * 100) 
    : 0;

  // --- HANDLER REFRESH MENU ---
  const handleRefreshMenu = () => {
    const dateKey = getCurrentDateKey();
    localStorage.removeItem(`ai-meal-${dateKey}`);
    setAiMealPlan(null);
    generateAIMealPlan();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Tanggal */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Rencana Makan</h1>
          <div className="flex items-center bg-white shadow-sm rounded-lg p-1">
            <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
            <span className="px-4 font-semibold w-32 text-center">{currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
          </div>
        </div>

        {/* Toggle Mode & Refresh Button */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <div className="inline-flex bg-gray-200 rounded-lg p-1">
            <button onClick={() => setShowAiRecommendations(true)} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${showAiRecommendations ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'}`}>Rekomendasi AI</button>
            <button onClick={() => setShowAiRecommendations(false)} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${!showAiRecommendations ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'}`}>Atur Manual</button>
          </div>
          {showAiRecommendations && aiMealPlan && !isLoadingAI && (
            <button 
              onClick={handleRefreshMenu}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={16} /> Ganti Menu
            </button>
          )}
        </div>

        {/* Nutrition Summary Bar - DETAILED */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          {/* Kalori Section */}
          <div className="mb-6">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase font-bold">Target</p>
                <p className="text-lg md:text-xl font-bold text-gray-900">{user.dailyCalories}</p>
                <p className="text-xs text-gray-400">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase font-bold">Masuk</p>
                <p className="text-lg md:text-xl font-bold text-green-600">{consumedNutrition.calories}</p>
                <p className="text-xs text-gray-400">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase font-bold">Sisa</p>
                <p className="text-lg md:text-xl font-bold text-blue-600">{Math.max(0, user.dailyCalories - consumedNutrition.calories)}</p>
                <p className="text-xs text-gray-400">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase font-bold">Progress</p>
                <p className="text-lg md:text-xl font-bold text-gray-900">{Math.round(calorieProgress)}%</p>
                <p className="text-xs text-gray-400">dari target</p>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${calorieProgress}%` }} />
            </div>
          </div>

          {/* Makronutrient Details */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase">Rincian Makronutrisi</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Protein */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Protein</span>
                  <span className="text-sm font-bold text-orange-600">{consumedNutrition.protein}g</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${Math.min(100, (consumedNutrition.protein / 150) * 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Target: ~150g/hari</p>
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Karbohidrat</span>
                  <span className="text-sm font-bold text-blue-600">{consumedNutrition.carbs}g</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(100, (consumedNutrition.carbs / 250) * 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Target: ~250g/hari</p>
              </div>

              {/* Fat */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Lemak</span>
                  <span className="text-sm font-bold text-amber-600">{consumedNutrition.fat}g</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(100, (consumedNutrition.fat / 70) * 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Target: ~70g/hari</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- KONTEN UTAMA --- */}
        {showAiRecommendations ? (
          // MODE AI
          isLoadingAI ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="animate-spin text-green-500 mb-4" size={40} />
              <p className="text-gray-500 text-sm">Meracik menu spesial...</p>
            </div>
          ) : aiError ? (
            <div className="text-center p-8 bg-red-50 rounded-xl text-red-600">
              <p>{aiError}</p>
              <button onClick={() => { localStorage.removeItem(`ai-meal-${getCurrentDateKey()}`); generateAIMealPlan(); }} className="mt-2 font-bold underline">Coba Lagi</button>
            </div>
          ) : aiMealPlan && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {(['Sarapan', 'MakanSiang', 'MakanMalam', 'snacks'] as const).map((type) => {
                const meal = aiMealPlan[type];
                if (!meal) return null;
                const isDone = isFoodConsumed(type, type);
                
                return (
                  <div key={type} className={`bg-white p-6 rounded-2xl border transition-all ${isDone ? 'border-green-200 bg-green-50' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-gray-900">{type}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleRefreshMenu}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ganti menu ini"
                        >
                          <RefreshCw size={16}/>
                        </button>
                        <button 
                          onClick={() => toggleFoodConsumed(type, type)} 
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isDone ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                        >
                          <Check size={16}/>
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-800 font-medium mb-3">{meal.menu}</p>
                    
                    {/* Waktu & Kalori */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <span>⏰ {meal.time}</span>
                      <span>🔥 {meal.calories} kcal</span>
                    </div>

                    {/* Macronutrients */}
                    <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs font-bold text-orange-600">{meal.protein}g</p>
                        <p className="text-xs text-gray-500">Protein</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-blue-600">{meal.carbs}g</p>
                        <p className="text-xs text-gray-500">Carbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-amber-600">{meal.fat}g</p>
                        <p className="text-xs text-gray-500">Fat</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded italic">"{meal.reasoning}"</p>
                  </div>
                );
              })}
              {/* Tips AI */}
              <div className="md:col-span-2 lg:col-span-4 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                <Info className="text-blue-500 shrink-0" />
                <div>
                   <p className="text-sm text-blue-800 font-medium">{aiMealPlan.nutritionTips}</p>
                   <p className="text-xs text-blue-600 mt-1">Target Minum: {aiMealPlan.hydrationGoal}</p>
                </div>
              </div>
            </div>
          )
        ) : (
          // MODE MANUAL (Integrated with AISearch)
          <div className="grid gap-6 md:grid-cols-2">
            {(['Sarapan', 'MakanSiang', 'MakanMalam', 'snacks'] as MealType[]).map(type => (
              <div key={type} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 capitalize">{type}</h3>
                  <button 
                    onClick={() => { setSelectedMeal(type); setShowFoodSelector(true); }} 
                    className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Plus size={16}/> Tambah
                  </button>
                </div>
                
                <div className="space-y-3">
                  {customMealPlan[type].length > 0 ? customMealPlan[type].map(food => {
                    const isDone = isFoodConsumed(food.id, type);
                    return (
                      <div key={food.id} className={`p-4 rounded-xl border transition-all ${isDone ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 overflow-hidden min-w-0">
                            <button 
                              onClick={() => toggleFoodConsumed(food.id, type)} 
                              className={`shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-green-400'}`}
                            >
                              <Check size={12}/>
                            </button>
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${isDone ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{food.name}</p>
                              <p className="text-xs text-gray-400">{food.servingSize}</p>
                            </div>
                          </div>
                          <button onClick={() => removeFoodFromMeal(food.id, type)} className="text-gray-300 hover:text-red-500 p-1 shrink-0"><Trash2 size={16}/></button>
                        </div>
                        
                        {/* Nutrition Details */}
                        <div className="grid grid-cols-4 gap-2 text-center bg-gray-50 p-2 rounded-lg">
                          <div>
                            <p className="text-xs font-bold text-green-600">{food.calories}</p>
                            <p className="text-xs text-gray-500">kcal</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-orange-600">{food.protein}g</p>
                            <p className="text-xs text-gray-500">Protein</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-blue-600">{food.carbs}g</p>
                            <p className="text-xs text-gray-500">Carbs</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-amber-600">{food.fat}g</p>
                            <p className="text-xs text-gray-500">Fat</p>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-6 text-gray-300 text-xs italic border border-dashed rounded-xl">
                      Belum ada menu.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL SEARCH (FoodSearch Integration) */}
        {showFoodSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800">Cari Makanan</h3>
                  <p className="text-xs text-gray-500">Menambahkan ke: <span className="text-green-600 font-bold uppercase">{selectedMeal}</span></p>
                </div>
                <button onClick={() => setShowFoodSelector(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
              </div>
                
              <div className="p-4 overflow-y-auto">
                {/* KOMPONEN AI SEARCH YANG ANDA BUAT */}
                <AISearch 
                  onSelectFood={(food) => { 
                    addFoodToMeal({ ...food, id: `f-${Date.now()}` }); 
                    // Tutup modal otomatis setelah memilih
                    setShowFoodSelector(false); 
                  }} 
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MealPlanning;