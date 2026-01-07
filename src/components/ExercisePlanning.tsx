import React, { useState, useEffect } from "react";
import { Loader, RefreshCw, CheckCircle, Dumbbell } from "lucide-react";

interface WorkoutPlan {
  day: string;
  focus: string;
  exercises: string[];
  duration: string;
  intensity: string;
  reasoning: string;
  totalWorkoutTime?: string;
}

const AIWorkoutPlan: React.FC = () => {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Load data existing jika user refresh halaman di hari yang sama
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedData = localStorage.getItem(`daily-workout-${today}`);
    
    // Jika ada data tersimpan hari ini, kita bisa load state (opsional, untuk persistensi UI)
    // Untuk saat ini kita fokus ke logic penyimpanan agar Progress.tsx bisa baca.
  }, []);

  // 🔹 Update progress bar
  useEffect(() => {
    if (workoutPlan) {
      const total = workoutPlan.exercises.length;
      const done = completed.length;
      setProgress(total === 0 ? 0 : Math.round((done / total) * 100));
    }
  }, [completed, workoutPlan]);

  // --- PERBAIKAN: LOGIC PENYIMPANAN KE LOCALSTORAGE ---
  // Ini adalah bagian yang hilang sebelumnya.
  // Setiap kali 'completed' atau 'workoutPlan' berubah, kita hitung kalori dan simpan.
  useEffect(() => {
    if (!workoutPlan) return;

    // 1. Estimasi Kalori (Karena AI tidak selalu kasih angka pasti)
    // Rumus Sederhana: Durasi (menit) * Faktor Intensitas
    const durationNum = parseInt(workoutPlan.duration) || 30; // Default 30 menit jika gagal parse
    let intensityFactor = 5; // Sedang (kcal/menit)
    if (workoutPlan.intensity.toLowerCase().includes('tinggi')) intensityFactor = 8;
    if (workoutPlan.intensity.toLowerCase().includes('rendah')) intensityFactor = 3;
    
    const totalEstCalories = durationNum * intensityFactor;
    
    // Kalori yang terbakar berdasarkan persentase selesai
    const burnedSoFar = Math.round((completed.length / workoutPlan.exercises.length) * totalEstCalories);

    // 2. Siapkan Data untuk Progress.tsx
    const todayKey = new Date().toISOString().split('T')[0];
    const dataToSave = {
      date: todayKey,
      caloriesBurned: burnedSoFar,        // DIBUTUHKAN Progress.tsx
      completedExercises: completed.length, // DIBUTUHKAN Progress.tsx
      focus: workoutPlan.focus            // DIBUTUHKAN Progress.tsx
    };

    // 3. Simpan ke LocalStorage
    localStorage.setItem(`daily-workout-${todayKey}`, JSON.stringify(dataToSave));
    
    // Debugging di console untuk memastikan data tersimpan
    console.log("Saving workout data:", dataToSave);

  }, [completed, workoutPlan]); 
  // ---------------------------------------------------

  const fetchAIWorkout = async () => {
    setIsLoading(true);
    setError(null);
    setWorkoutPlan(null);
    setCompleted([]); 

    const user = {
      weight: 70,
      height: 170,
      age: 25,
      gender: "male",
      goal: "build-muscle",
      activityLevel: "moderate",
      dailyCalories: 2500,
    };

    const apiKey = "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"; 
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

    const prompt = `
    Sebagai pelatih kebugaran AI profesional, buatkan rencana latihan di rumah tanpa alat lengkap untuk 1 hari penuh berdasarkan profil:
    - Berat: ${user.weight}kg, Tinggi: ${user.height}cm, Tujuan: ${user.goal}.
    
    INSTRUKSI:
    1. Buat rencana latihan yang aman dan efektif tanpa alat (bodyweight).
    2. Format hasil dalam JSON **saja**.
    
    FORMAT JSON:
    {
      "day": "Senin",
      "focus": "Full Body Strength",
      "duration": "45 menit",
      "intensity": "Sedang",
      "reasoning": "Penjelasan singkat kenapa latihan ini cocok.",
      "exercises": [
        { "name": "Push Up", "sets": "3x12" },
        { "name": "Squat", "sets": "3x15" }
      ]
    }
    `;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Aplikasi Workout Planner",
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

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("Respon AI kosong.");

      const parsed = JSON.parse(rawContent);

      setWorkoutPlan({
        day: parsed.day || "Latihan Harian",
        focus: parsed.focus || "Umum",
        duration: parsed.duration || "-",
        intensity: parsed.intensity || "Sedang",
        reasoning: parsed.reasoning || "Latihan disesuaikan dengan kondisi tubuh.",
        exercises: Array.isArray(parsed.exercises)
          ? parsed.exercises.map((ex: any) => (typeof ex === 'string' ? ex : `${ex.name} (${ex.sets || 'Repetisi secukupnya'})`))
          : []
      });

    } catch (err: any) {
      console.error("AI error:", err);
      setError("⚠️ Gagal memuat dari AI. Menampilkan contoh default.");
      setWorkoutPlan({
        day: "Mode Offline",
        focus: "Latihan Dasar",
        duration: "30 menit",
        intensity: "Sedang",
        reasoning: "Koneksi bermasalah, ini latihan dasar untuk menjaga kebugaran.",
        exercises: [
          "Push Up (3x15)",
          "Plank (3x45 detik)",
          "Squat (3x20)",
          "Lunges (3x12 per kaki)",
          "Jumping Jack (3x30 detik)",
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIWorkout();
  }, []);

  const handleComplete = (exercise: string) => {
    if (!completed.includes(exercise)) {
      setCompleted([...completed, exercise]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
        
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <span className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Dumbbell className="w-6 h-6" />
            </span>
            Rencana Latihan
          </h1>
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

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        {workoutPlan ? (
          <>
            <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h2 className="text-xl font-bold text-gray-800">
                {workoutPlan.day} — {workoutPlan.focus}
              </h2>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                <span className="bg-white px-2 py-1 rounded border">⏱ {workoutPlan.duration}</span>
                <span className="bg-white px-2 py-1 rounded border">🔥 {workoutPlan.intensity}</span>
              </div>
              <p className="italic text-gray-600 mt-3 text-sm border-t border-blue-200 pt-2">
                "{workoutPlan.reasoning}"
              </p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress Latihan</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {workoutPlan.exercises.map((ex, index) => {
                const isDone = completed.includes(ex);
                return (
                  <div
                    key={index}
                    onClick={() => !isDone && handleComplete(ex)}
                    className={`
                      group flex justify-between items-center p-4 rounded-xl border transition-all cursor-pointer
                      ${isDone 
                        ? "bg-green-50 border-green-200 opacity-75" 
                        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center border
                        ${isDone ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-transparent group-hover:border-blue-400"}
                      `}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span className={`text-base font-medium ${isDone ? "line-through text-gray-500" : "text-gray-800"}`}>
                        {ex}
                      </span>
                    </div>
                    
                    {!isDone && (
                      <span className="text-xs text-blue-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Tandai Selesai
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {progress === 100 && (
              <div className="mt-8 text-center bg-green-100 text-green-800 p-4 rounded-xl animate-pulse">
                🎉 Selamat! Latihan hari ini selesai.
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">
              {isLoading ? "Sedang meracik latihan terbaik..." : "Klik tombol 'Buat Rencana Baru' untuk memulai."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIWorkoutPlan;