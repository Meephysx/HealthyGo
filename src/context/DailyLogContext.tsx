import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDateKey, saveUserLog } from '../services/logger';

// --- TYPE DEFINITIONS ---

interface UserProfile {
  weight: number;
  height: number;
  age: number;
  gender: string;
  goal: string;
  activityLevel: string;
  dailyCalories: number;
  idealWeight?: number;
  dietaryRestrictions?: string[];
  allergies?: string[];
  fullname?: string;
  name?: string;
  bmi?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  mealType: MealType;
  source: 'ai' | 'manual';
  consumed: boolean;
  reasoning?: string; // For AI meals
  portions?: string; // For AI meals
}

interface MealLog {
  date: string;
  userId: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface WorkoutLog {
    date: string;
    userId: string;
    exercises: any[];
    totalCalories: number;
    totalDuration: number;
    workoutType: string;
}

export type MealType = 'Sarapan' | 'MakanSiang' | 'MakanMalam' | 'snacks';

interface DailyLogContextType {
  // State
  userProfile: UserProfile | null;
  mealLog: MealLog | null;
  workoutLog: WorkoutLog | null;
  isLoading: boolean;
  isGeneratingAI: boolean;
  aiError: string | null;
  
  // Derived Data
  consumedCalories: number;
  burnedCalories: number;
  remainingCalories: number;
  macros: { protein: number; carbs: number; fat: number };

  // Actions
  addFoodItem: (food: Omit<FoodItem, 'id' | 'consumed' | 'mealType' | 'source'>, mealType: MealType) => Promise<void>;
  toggleFoodConsumed: (foodId: string) => Promise<void>;
  removeFoodItem: (foodId: string) => Promise<void>;
  generateAIMealPlan: () => Promise<void>;
}

// --- HELPER ---
const normalizeAIMealPlan = (plan: any): FoodItem[] => {
    const MEAL_TYPES: MealType[] = ['Sarapan', 'MakanSiang', 'MakanMalam', 'snacks'];
    const foods: FoodItem[] = [];
  
    MEAL_TYPES.forEach((type) => {
      const value = plan[type];
      let arr: any[] = [];
      if (!value) return;
      else if (Array.isArray(value)) arr = value;
      else arr = [value];
  
      arr.forEach((m: any, idx: number) => {
        foods.push({
          id: m.id ?? `ai-${type}-${idx}-${Date.now()}`,
          name: m.menu ?? m.name ?? '',
          calories: Number(m.calories ?? 0),
          protein: Number(m.protein ?? 0),
          carbs: Number(m.carbs ?? 0),
          fat: Number(m.fat ?? 0),
          servingSize: m.portions ?? m.servingSize ?? '1 porsi',
          mealType: type,
          source: 'ai',
          consumed: false, // AI meals start as not consumed
          reasoning: m.reasoning ?? '',
          portions: m.portions ?? '',
        });
      });
    });
    return foods;
  };

// --- CONTEXT CREATION ---
const DailyLogContext = createContext<DailyLogContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const DailyLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mealLog, setMealLog] = useState<MealLog | null>(null);
  const [workoutLog, setWorkoutLog] = useState<WorkoutLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // --- REALTIME DATA FETCHING ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
        setIsLoading(false);
        setUserProfile(null);
        setMealLog(null);
        setWorkoutLog(null);
        return;
    }

    setIsLoading(true);
    const uid = user.uid;
    const todayKey = getDateKey(new Date());

    const loadLocalProfile = (): UserProfile | null => {
      const stored = localStorage.getItem('user');
      if (!stored) return null;
      try {
        return JSON.parse(stored) as UserProfile;
      } catch (e) {
        console.warn('Failed to parse local user profile:', e);
        return null;
      }
    };

    const unsubProfile = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        // Fallback: try localStorage so the UI can still show something useful
        const local = loadLocalProfile();
        if (local) {
          setUserProfile(local);
        } else {
          setUserProfile(null);
        }
      }
    });
    const unsubMeals = onSnapshot(doc(db, 'meal_logs', `${uid}_${todayKey}`), (doc) => {
      if (doc.exists()) {
        setMealLog(doc.data() as MealLog);
      } else {
        setMealLog({ userId: uid, date: todayKey, foods: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
      }
    });
    const unsubWorkouts = onSnapshot(doc(db, 'workout_logs', `${uid}_${todayKey}`), (doc) => {
      setWorkoutLog(doc.exists() ? (doc.data() as WorkoutLog) : null);
    });

    const timer = setTimeout(() => setIsLoading(false), 1500);

    return () => {
      unsubProfile();
      unsubMeals();
      unsubWorkouts();
      clearTimeout(timer);
    };
  }, []);

  // --- DERIVED DATA ---
  const { consumedCalories, macros } = useMemo(() => {
    const initial = { consumedCalories: 0, macros: { protein: 0, carbs: 0, fat: 0 } };
    if (!mealLog) return initial;
    return mealLog.foods.reduce((acc, food) => {
      if (food.consumed) {
        acc.consumedCalories += food.calories || 0;
        acc.macros.protein += food.protein || 0;
        acc.macros.carbs += food.carbs || 0;
        acc.macros.fat += food.fat || 0;
      }
      return acc;
    }, initial);
  }, [mealLog]);

  const burnedCalories = useMemo(() => workoutLog?.totalCalories || 0, [workoutLog]);

  const remainingCalories = useMemo(() => 
    (userProfile?.dailyCalories || 0) - consumedCalories + burnedCalories,
    [userProfile, consumedCalories, burnedCalories]
  );

  // --- ACTIONS ---
  const updateMealLog = useCallback(async (updatedFoods: FoodItem[]) => {
    if (!auth.currentUser || !userProfile) return;
    const totals = updatedFoods.filter(f => f.consumed).reduce((acc, f) => {
        acc.totalCalories += f.calories || 0;
        acc.totalProtein += f.protein || 0;
        acc.totalCarbs += f.carbs || 0;
        acc.totalFat += f.fat || 0;
        return acc;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
    
    await saveUserLog('meal', { foods: updatedFoods, ...totals }, getDateKey(new Date()));
  }, [userProfile]);

  const addFoodItem = useCallback(async (food: Omit<FoodItem, 'id' | 'consumed' | 'mealType' | 'source'>, mealType: MealType) => {
    const newFood: FoodItem = {
      ...food,
      id: `f-${Date.now()}`,
      consumed: true,
      mealType: mealType,
      source: 'manual',
    };
    await updateMealLog([...(mealLog?.foods || []), newFood]);
  }, [mealLog, updateMealLog]);

  const toggleFoodConsumed = useCallback(async (foodId: string) => {
    if (!mealLog) return;
    const updatedFoods = mealLog.foods.map(f => f.id === foodId ? { ...f, consumed: !f.consumed } : f);
    await updateMealLog(updatedFoods);
  }, [mealLog, updateMealLog]);
  
  const removeFoodItem = useCallback(async (foodId: string) => {
    if (!mealLog) return;
    await updateMealLog(mealLog.foods.filter(f => f.id !== foodId));
  }, [mealLog, updateMealLog]);

  const generateAIMealPlan = useCallback(async () => {
    if (!userProfile) {
      setAiError("User profile is not loaded.");
      return;
    }
    setIsGeneratingAI(true);
    setAiError(null);
    try {
        const { callAi, parseJsonLike } = await import('../utils/aiClient');
        const variationSeed = Math.floor(Math.random() * 10000);
        const prompt = `
        TUGAS: Buatkan 1 set rencana makan harian Indonesia. OUTPUT WAJIB JSON VALID.
        ATURAN:
        1. KELENGKapan NUTRISI: Target Harian: ${userProfile.dailyCalories} kcal.
        2. PORSI DETAIL: Field "portions" WAJIB spesifik (contoh: "100g Nasi Merah, 1 butir Telur Rebus").
        STRUKTUR JSON:
        {
          "Sarapan": {"id":"b-${variationSeed}","menu":"Nama Menu","calories":0,"protein":0,"carbs":0,"fat":0,"reasoning":"...","portions":"..."},
          "MakanSiang": {"id":"l-${variationSeed}","menu":"Nama Menu","calories":0,"protein":0,"carbs":0,"fat":0,"reasoning":"...","portions":"..."},
          "MakanMalam": {"id":"d-${variationSeed}","menu":"Nama Menu","calories":0,"protein":0,"carbs":0,"fat":0,"reasoning":"...","portions":"..."},
          "snacks": {"id":"s-${variationSeed}","menu":"Nama Menu","calories":0,"protein":0,"carbs":0,"fat":0,"reasoning":"...","portions":"..."}
        }
        PROFIL USER:
        - Usia: ${userProfile.age}, Gender: ${userProfile.gender}
        - BB: ${userProfile.weight}kg, TB: ${userProfile.height}cm
        - Target: ${userProfile.goal}`;

        const data = await callAi([{ role: 'user', content: prompt }], 'llama-3.1-8b-instant');
        if (data.offline || !data.reply) throw new Error(data.reply || 'AI is offline.');

        const parsedPlan = parseJsonLike(data.reply);
        if (!parsedPlan) throw new Error('Failed to parse AI response.');

        const aiFoods = normalizeAIMealPlan(parsedPlan);
        const manualFoods = mealLog?.foods.filter(f => f.source === 'manual') || [];
        await updateMealLog([...manualFoods, ...aiFoods]);

    } catch (err: any) {
        console.error("AI Error:", err);
        setAiError("Gagal menyusun menu AI. Silakan coba lagi.");
    } finally {
        setIsGeneratingAI(false);
    }
  }, [userProfile, mealLog, updateMealLog]);

  const value = {
    userProfile, mealLog, workoutLog, isLoading, isGeneratingAI, aiError,
    consumedCalories, burnedCalories, remainingCalories, macros,
    addFoodItem, toggleFoodConsumed, removeFoodItem, generateAIMealPlan,
  };

  return <DailyLogContext.Provider value={value}>{children}</DailyLogContext.Provider>;
};

export const useDailyLog = (): DailyLogContextType => {
  const context = useContext(DailyLogContext);
  if (context === undefined) throw new Error('useDailyLog must be used within a DailyLogProvider');
  return context;
};
