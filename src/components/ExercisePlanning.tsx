import React, { useState, useEffect } from "react";
import { Loader, RefreshCw, CheckCircle, Dumbbell, Plus, Trash2, Home, Building2, Zap } from "lucide-react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface WorkoutPlan {
  day: string;
  focus: string;
  exercises: Exercise[];
  duration: string;
  intensity: string;
  reasoning: string;
  location?: 'home' | 'gym';
}

interface Exercise {
  name: string;
  sets: string;
  caloriesPerSet: number;
}

interface CompletedExercise {
  name: string;
  sets: string;
  reps: number;
  caloriesBurned: number;
  caloriesPerRep: number;
}

interface User {
  weight: number;
  height: number;
  age: number;
  gender: string;
  goal: string;
  activityLevel: string;
  dailyCalories: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EXERCISE_DATABASE: { [key: string]: number } = {
  'push up': 2.5,
  'push-up': 2.5,
  'squat': 3.5,
  'burpee': 4.5,
  'plank': 1,
  'pull up': 3.5,
  'pull-up': 3.5,
  'chin up': 3.5,
  'lunges': 3,
  'lunge': 3,
  'jumping jack': 2,
  'jumping jacks': 2,
  'dumbbell': 4,
  'bench press': 4,
  'deadlift': 5,
  'row': 3.5,
  'bicep curl': 2.5,
  'tricep dip': 3,
  'mountain climber': 3,
  'sit up': 2,
  'crunch': 1.5,
  'leg raise': 2.5,
};

const DEFAULT_USER: User = {
  weight: 70,
  height: 170,
  age: 25,
  gender: "male",
  goal: "build-muscle",
  activityLevel: "moderate",
  dailyCalories: 2500,
};

const FALLBACK_EXERCISES = {
  home: [
    { name: "Push Up", sets: "3x15", caloriesPerSet: 2.5 },
    { name: "Plank", sets: "3x45", caloriesPerSet: 1 },
    { name: "Squat", sets: "3x20", caloriesPerSet: 3.5 },
    { name: "Lunges", sets: "3x12", caloriesPerSet: 3 },
    { name: "Jumping Jack", sets: "3x30", caloriesPerSet: 2 }
  ],
  gym: [
    { name: "Bench Press", sets: "3x12", caloriesPerSet: 4 },
    { name: "Deadlift", sets: "3x8", caloriesPerSet: 5 },
    { name: "Dumbbell Row", sets: "3x10", caloriesPerSet: 3.5 },
    { name: "Barbell Squat", sets: "3x15", caloriesPerSet: 3.5 },
    { name: "Overhead Press", sets: "3x12", caloriesPerSet: 4 }
  ]
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getDateKey = (): string => new Date().toISOString().split('T')[0];

const getCaloriesPerRep = (exerciseName: string): number => {
  const lowerName = exerciseName.toLowerCase();
  for (const [key, value] of Object.entries(EXERCISE_DATABASE)) {
    if (lowerName.includes(key)) return value;
  }
  return 3;
};

const parseExerciseSets = (sets: string): { setsNum: number; repsNum: number } => {
  const setsNum = parseInt(sets.split('x')[0]) || 1;
  const repsNum = parseInt(sets.split('x')[1]) || 1;
  return { setsNum, repsNum };
};

const calculateExerciseCalories = (
  exercise: Exercise,
  userWeight: number
): number => {
  const { setsNum, repsNum } = parseExerciseSets(exercise.sets);
  const weightAdjustment = userWeight / 70;
  return Math.round(exercise.caloriesPerSet * setsNum * repsNum * weightAdjustment);
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const StorageKeys = {
  user: 'user',
  workoutPlan: (date: string) => `ai-workout-plan-${date}`,
  completed: (date: string) => `workout-completed-${date}`,
  location: (date: string) => `workout-location-${date}`,
  dailyWorkout: (date: string) => `daily-workout-${date}`,
};

const loadUserData = (): User => {
  const stored = localStorage.getItem(StorageKeys.user);
  if (!stored) return DEFAULT_USER;
  
  try {
    const parsed = JSON.parse(stored);
    return {
      weight: parsed.weight || DEFAULT_USER.weight,
      height: parsed.height || DEFAULT_USER.height,
      age: parsed.age || DEFAULT_USER.age,
      gender: parsed.gender || DEFAULT_USER.gender,
      goal: parsed.goal || DEFAULT_USER.goal,
      activityLevel: parsed.activityLevel || DEFAULT_USER.activityLevel,
      dailyCalories: parsed.dailyCalories || DEFAULT_USER.dailyCalories
    };
  } catch {
    return DEFAULT_USER;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AIWorkoutPlan: React.FC = () => {
  // State
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState<CompletedExercise[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [workoutLocation, setWorkoutLocation] = useState<'home' | 'gym'>('home');
  const [exerciseInput, setExerciseInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [user, setUser] = useState<User>(DEFAULT_USER);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load user data on mount
  useEffect(() => {
    setUser(loadUserData());
  }, []);

  // Load workout plan and completed exercises
  useEffect(() => {
    const todayKey = getDateKey();
    const savedPlan = localStorage.getItem(StorageKeys.workoutPlan(todayKey));
    const savedCompleted = localStorage.getItem(StorageKeys.completed(todayKey));
    const savedLocation = localStorage.getItem(StorageKeys.location(todayKey));

    if (savedPlan && savedLocation === workoutLocation) {
      setWorkoutPlan(JSON.parse(savedPlan));
      if (savedCompleted) {
        setCompleted(JSON.parse(savedCompleted));
      }
    } else {
      fetchAIWorkout();
    }
  }, [workoutLocation]);

  // Update progress bar
  useEffect(() => {
    if (!workoutPlan?.exercises.length) {
      setProgress(0);
      return;
    }

    const totalEstimated = workoutPlan.exercises.reduce((sum, ex) => {
      return sum + calculateExerciseCalories(ex, user.weight);
    }, 0);

    const burned = completed.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
    const percent = totalEstimated > 0 ? (burned / totalEstimated) * 100 : 0;
    setProgress(Math.min(100, Math.round(percent)));
  }, [completed, workoutPlan, user.weight]);

  // Save progress data
  useEffect(() => {
    if (!workoutPlan) return;

    const todayKey = getDateKey();
    const burned = completed.reduce((sum, ex) => sum + ex.caloriesBurned, 0);

    localStorage.setItem(StorageKeys.dailyWorkout(todayKey), JSON.stringify({
      date: todayKey,
      caloriesBurned: burned,
      completedExercises: completed.length,
      focus: workoutPlan.focus
    }));
    
    localStorage.setItem(StorageKeys.completed(todayKey), JSON.stringify(completed));
    localStorage.setItem(StorageKeys.location(todayKey), workoutLocation);
  }, [completed, workoutPlan, workoutLocation]);

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  const fetchAIWorkout = async () => {
    setIsLoading(true);
    setError(null);
    setWorkoutPlan(null);
    setCompleted([]);

    const todayKey = getDateKey();
    const locationText = workoutLocation === 'home' 
      ? 'di rumah tanpa alat' 
      : 'di gym dengan peralatan lengkap';

    const prompt = `
Sebagai pelatih kebugaran AI profesional, buatkan rencana latihan ${locationText} untuk 1 hari penuh berdasarkan profil:
- Berat: ${user.weight}kg, Usia: ${user.age}
- Tujuan: ${user.goal}
- Level Aktivitas: ${user.activityLevel}

INSTRUKSI:
1. Buat rencana latihan yang REALISTIC dan AMAN.
2. Untuk SETIAP EXERCISE, estimasi kalori yang terbakar untuk berat 70KG per repetisi.
3. Format hasil dalam JSON valid.

KALORI REFERENSI (untuk 70kg, per rep):
- Push Up: 2.5 kalori | Squat: 3.5 kalori | Burpee: 4.5 kalori
- Plank: 1 kalori | Pull Up: 3.5 kalori | Dumbbell: 4 kalori | Lunges: 3 kalori

FORMAT JSON:
{
  "day": "Senin",
  "focus": "Full Body Strength",
  "location": "${workoutLocation}",
  "duration": "45 menit",
  "intensity": "Sedang",
  "reasoning": "Penjelasan singkat.",
  "exercises": [
    { "name": "Push Up", "sets": "3x12", "caloriesPerSet": 2.5 },
    { "name": "Squat", "sets": "3x15", "caloriesPerSet": 3.5 }
  ]
}`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: "Kamu adalah API JSON generator untuk aplikasi fitness. Hanya berikan output JSON valid." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("Respon AI kosong.");

      const parsed = JSON.parse(rawContent);
      const newPlan: WorkoutPlan = {
        day: parsed.day || "Latihan Harian",
        focus: parsed.focus || "Umum",
        duration: parsed.duration || "-",
        intensity: parsed.intensity || "Sedang",
        reasoning: parsed.reasoning || "Latihan disesuaikan dengan kondisi tubuh.",
        exercises: Array.isArray(parsed.exercises)
          ? parsed.exercises.map((ex: any) => ({
              name: ex.name || 'Exercise',
              sets: ex.sets || '3x10',
              caloriesPerSet: parseFloat(ex.caloriesPerSet) || 3
            }))
          : []
      };

      setWorkoutPlan(newPlan);
      localStorage.setItem(StorageKeys.workoutPlan(todayKey), JSON.stringify(newPlan));
      localStorage.removeItem(StorageKeys.completed(todayKey));

    } catch (err) {
      console.error("AI error:", err);
      setError("⚠️ Gagal memuat dari AI. Menampilkan contoh default.");
      
      const fallbackPlan: WorkoutPlan = {
        day: "Mode Offline",
        focus: "Latihan Dasar",
        duration: "30 menit",
        intensity: "Sedang",
        reasoning: "Koneksi bermasalah, ini latihan dasar untuk menjaga kebugaran.",
        exercises: FALLBACK_EXERCISES[workoutLocation],
      };
      
      setWorkoutPlan(fallbackPlan);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleAddExercise = (exerciseName: string, reps: number) => {
    if (!exerciseName.trim() || !reps) return;

    const caloriesPerRep = getCaloriesPerRep(exerciseName);
    const weightAdjustment = user.weight / 70;
    const caloriesBurned = Math.round(caloriesPerRep * reps * weightAdjustment);

    setCompleted([...completed, {
      name: exerciseName,
      sets: `${reps}x1`,
      reps,
      caloriesBurned,
      caloriesPerRep
    }]);

    setExerciseInput('');
    setRepsInput('');
  };

  const handleRemoveExercise = (index: number) => {
    setCompleted(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompleteExercise = (exercise: Exercise) => {
    const { setsNum, repsNum } = parseExerciseSets(exercise.sets);
    handleAddExercise(exercise.name, repsNum * setsNum);
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const totalCalories = workoutPlan 
    ? workoutPlan.exercises.reduce((sum, ex) => sum + calculateExerciseCalories(ex, user.weight), 0)
    : 0;

  const burnedCalories = completed.reduce((sum, ex) => sum + ex.caloriesBurned, 0);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <span className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Dumbbell className="w-6 h-6" />
            </span>
            Rencana Latihan
          </h1>

          {/* Location Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setWorkoutLocation('home')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                workoutLocation === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Home className="w-4 h-4 mr-2" />
              Rumah
            </button>
            <button
              onClick={() => setWorkoutLocation('gym')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                workoutLocation === 'gym' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Gym
            </button>
          </div>

          {/* Generate Button */}
          <button
            onClick={fetchAIWorkout}
            disabled={isLoading}
            className="flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Memuat..." : "Buat Rencana Baru"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Main Content */}
        {workoutPlan ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Workout Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Workout Info Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {workoutPlan.day} — {workoutPlan.focus}
                </h2>
                <div className="flex flex-wrap gap-3 text-sm mb-4">
                  <span className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    ⏱ {workoutPlan.duration}
                  </span>
                  <span className="bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                    🔥 {workoutPlan.intensity}
                  </span>
                  <span className="bg-green-50 px-3 py-1 rounded-lg border border-green-200 flex items-center gap-1">
                    {workoutLocation === 'home' ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    {workoutLocation === 'home' ? 'Rumah' : 'Gym'}
                  </span>
                </div>
                <p className="italic text-gray-600 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                  "{workoutPlan.reasoning}"
                </p>
              </div>

              {/* Planned Exercises */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Rencana Latihan</h3>
                <div className="space-y-3">
                  {workoutPlan.exercises.map((ex, idx) => {
                    const totalCals = calculateExerciseCalories(ex, user.weight);
                    const { setsNum, repsNum } = parseExerciseSets(ex.sets);

                    return (
                      <div 
                        key={idx} 
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-800">{ex.name}</p>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {ex.sets}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {ex.caloriesPerSet} kcal/rep × {setsNum} set × {repsNum} rep = 
                            <span className="font-semibold text-green-600 ml-1">{totalCals} kcal</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleCompleteExercise(ex)}
                          className="ml-4 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          ✓ Selesai
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Completed Exercises */}
              {completed.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    ✅ Latihan yang Sudah Dilakukan
                  </h3>
                  <div className="space-y-3">
                    {completed.map((ex, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={18} className="text-green-600" />
                            <p className="font-semibold text-gray-800">{ex.name}</p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {ex.reps} reps • 
                            <span className="font-semibold text-green-700 ml-1">
                              {ex.caloriesBurned} kcal
                            </span> terbakar
                            <span className="text-xs text-gray-500 ml-2">
                              ({ex.caloriesPerRep} kcal/rep)
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveExercise(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              
              {/* Calories Info */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-yellow-500" /> 
                  Kalori Terbakar
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimasi Total</p>
                    <p className="text-4xl font-bold text-green-600">{totalCalories}</p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-1">Sudah Terbakar</p>
                    <p className="text-4xl font-bold text-blue-600">{burnedCalories}</p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-1">Sisa</p>
                    <p className="text-4xl font-bold text-gray-400">
                      {Math.max(0, totalCalories - burnedCalories)}
                    </p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-bold text-gray-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Exercise Form */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">➕ Tambah Latihan</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 font-medium block mb-1">
                      Nama Latihan
                    </label>
                    <input
                      type="text"
                      placeholder="Push Up, Squat..."
                      value={exerciseInput}
                      onChange={(e) => setExerciseInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium block mb-1">
                      Jumlah Reps
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 15"
                      value={repsInput}
                      onChange={(e) => setRepsInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Calorie Preview */}
                  {exerciseInput && repsInput && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600">Estimasi kalori:</p>
                      <p className="text-lg font-bold text-blue-600">
                        {Math.round(
                          getCaloriesPerRep(exerciseInput) * 
                          parseInt(repsInput) * 
                          (user.weight / 70)
                        )} kcal
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ({getCaloriesPerRep(exerciseInput)} kcal × {repsInput} reps)
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleAddExercise(exerciseInput, parseInt(repsInput) || 0)}
                    disabled={!exerciseInput.trim() || !repsInput}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 font-medium"
                  >
                    <Plus size={18} /> Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-gray-500">Sedang meracik latihan terbaik...</p>
              </div>
            ) : (
              <p className="text-gray-500 text-lg">
                Pilih lokasi (Rumah/Gym) dan klik Generate untuk membuat rencana latihan
              </p>
            )}
          </div>
        )}

        {/* Success Message */}
        {progress === 100 && completed.length > 0 && (
          <div className="mt-8 text-center bg-gradient-to-r from-green-100 to-blue-100 text-green-800 p-6 rounded-xl border-2 border-green-300 animate-pulse">
            <p className="text-2xl font-bold">🎉 Selamat! Latihan hari ini selesai!</p>
            <p className="text-sm mt-2">
              Total kalori terbakar: 
              <span className="font-bold text-lg ml-1">{burnedCalories} kcal</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIWorkoutPlan;