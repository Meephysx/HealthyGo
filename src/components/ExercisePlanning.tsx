import React, { useState, useEffect } from "react";
import { Loader, RefreshCw, CheckCircle } from "lucide-react";
import Lottie from "lottie-react";

// 🔹 Import animasi (pastikan sudah kamu punya)
import pushupAnim from "../animations/Military Push Ups.json";
import plankAnim from "../animations/plank.json";
import squatAnim from "../animations/squat.json";
//import situpAnim from "../animations/situp.json";
import jumpingjackAnim from "../animations/jumpingjack.json";
import lungeAnim from "../animations/lunge.json";
import BurpeeExerciseAnim from "../animations/Burpee.json";
import supermanAnim from "../animations/superman.json";
import glutebridgeAnim from "../animations/glutebridge.json";
import CrunchesAnim from "../animations/Crunches.json";


interface WorkoutPlan {
  day: string;
  focus: string;
  exercises: string[];
  duration: string;
  intensity: string;
  reasoning: string;
}

const AIWorkoutAnimated: React.FC = () => {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Fungsi memilih animasi otomatis berdasarkan nama latihan
  const getAnimation = (exercise: string) => {
    const lower = exercise.toLowerCase();
    if (lower.includes("push")) return pushupAnim;
    if (lower.includes("plank")) return plankAnim;
    if (lower.includes("squat")) return squatAnim;
    //if (lower.includes("sit")) return situpAnim;
    if (lower.includes("jumping")) return jumpingjackAnim;
    if (lower.includes("lunge")) return lungeAnim;
    if (lower.includes("burpee")) return BurpeeExerciseAnim;
    if (lower.includes("superman")) return supermanAnim;
    if (lower.includes("glute bridge")) return glutebridgeAnim;
    if (lower.includes("crunches")) return CrunchesAnim;
    return null;
  };

  // 🔹 Update progress bar
  useEffect(() => {
    if (workoutPlan) {
      const total = workoutPlan.exercises.length;
      const done = completed.length;
      setProgress(Math.round((done / total) * 100));
    }
  }, [completed, workoutPlan]);

  // 🔹 Ambil rekomendasi AI dari API Gemini
  const fetchAIWorkout = async () => {
  setIsLoading(true);
  setError(null);
  setWorkoutPlan(null);

  // 🔹 Data profil pengguna (bisa diambil dari state user)
  const user = {
    weight: 70,
    height: 170,
    age: 25,
    gender: "male",
    goal: "build-muscle",
    activityLevel: "moderate",
    dailyCalories: 2500,
  };

  const apiKey = "AIzaSyAtFPZ9ZMr350lAx7Mg8u6CnI95dHBdvK4";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // 🔹 Prompt AI yang menyesuaikan dengan profil pengguna (mirip Meal Planning)
  const prompt = `
Sebagai pelatih kebugaran AI profesional, buatkan rencana latihan dirumah tanpa alat lengkap untuk 1 hari penuh berdasarkan profil pengguna berikut:

PROFIL PENGGUNA:
- Berat badan: ${user.weight} kg
- Tinggi badan: ${user.height} cm
- Usia: ${user.age} tahun
- Jenis kelamin: ${user.gender}
- Tujuan fitness: ${user.goal}
- Tingkat aktivitas: ${user.activityLevel}
- Asupan kalori harian: ${user.dailyCalories} kcal

INSTRUKSI:
1. Buat rencana latihan 1 hari yang aman, efektif, dan disesuaikan dengan tujuan fitness pengguna diusahakan tanpa alat.
2. Sertakan kombinasi latihan pemanasan, latihan utama, dan pendinginan.
3. Pastikan intensitas latihan sesuai dengan tingkat aktivitas pengguna.
4. Jelaskan alasan mengapa latihan ini cocok dengan profil pengguna.
5. Format hasil dalam JSON **tanpa teks tambahan**, agar dapat langsung diproses program.

FORMAT OUTPUT (JSON SAJA TANPA TEKS TAMBAHAN):
{
  "day": "Senin",
  "focus": "Latihan Kekuatan dan Kardio",
  "duration": "45 menit",
  "intensity": "Sedang hingga Tinggi",
  "reasoning": "Latihan ini menargetkan seluruh tubuh untuk meningkatkan kekuatan dan stamina.",
  "exercises": [
    {
      "name": "Push Up",
      "sets": "3x15",
      "duration": "5 menit",
      "type": "Kekuatan",
      "reasoning": "Melatih otot dada, bahu, dan lengan atas."
    },
    {
      "name": "Plank",
      "sets": "3x45 detik",
      "duration": "5 menit",
      "type": "Core",
      "reasoning": "Menguatkan otot perut dan punggung bawah untuk stabilitas tubuh."
    },
    {
      "name": "Squat",
      "sets": "3x20",
      "duration": "5 menit",
      "type": "Kaki",
      "reasoning": "Melatih otot paha, gluteus, dan meningkatkan mobilitas."
    },
    {
      "name": "Sit Up",
      "sets": "3x15",
      "duration": "5 menit",
      "type": "Core",
      "reasoning": "Meningkatkan kekuatan otot perut bagian atas."
    },
    {
      "name": "Stretching 1 gerakan",
      "sets": "1x10 menit",
      "duration": "10 menit",
      "type": "Pendinginan",
      "reasoning": "Membantu pemulihan otot dan mengurangi risiko cedera."
    }
  ],
  "totalWorkoutTime": "45 menit",
  "coachTips": "Fokus pada teknik yang benar dan jaga pernapasan setiap repetisi."
}
`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Bersihkan format kode
    text = text.replace(/```json|```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1)
      throw new Error("Format JSON tidak ditemukan");

    const jsonText = text.slice(start, end + 1);

    // Parse JSON aman
    let plan: WorkoutPlan;
    try {
      plan = JSON.parse(jsonText);
    } catch (err) {
      console.error("JSON parse gagal:", err, jsonText);
      throw new Error("AI mengirim format tidak valid");
    }

    // Konversi struktur AI ke format internal
    setWorkoutPlan({
      day: plan.day,
      focus: plan.focus,
      duration: plan.duration,
      intensity: plan.intensity,
      reasoning: plan.reasoning,
      exercises: plan.exercises.map(
        (ex: any) => `${ex.name} (${ex.sets})`
      ),
    });
  } catch (err: any) {
    console.error("AI error:", err);
    setError("⚠️ Gagal memuat dari AI. Menampilkan contoh default.");
    setWorkoutPlan({
      day: "Senin",
      focus: "Latihan Tubuh Atas & Kardio",
      duration: "45 menit",
      intensity: "Sedang hingga Tinggi",
      reasoning:
        "Latihan menyeluruh untuk meningkatkan kekuatan dan stamina.",
      exercises: [
        "Push Up (3x15)",
        "Plank (3x45 detik)",
        "Squat (3x20)",
        "Sit Up (3x15)",
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

  // 🔹 Tandai latihan selesai
  const handleComplete = (exercise: string) => {
    if (!completed.includes(exercise)) {
      setCompleted([...completed, exercise]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            💪 Rencana Latihan Hari Ini
          </h1>
          <button
            onClick={fetchAIWorkout}
            disabled={isLoading}
            className="flex items-center px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Perbarui
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {workoutPlan ? (
          <>
            <h2 className="text-xl font-semibold">
              {workoutPlan.day} - {workoutPlan.focus}
            </h2>
            <p className="text-gray-600 text-sm">
              Durasi: {workoutPlan.duration} | Intensitas: {workoutPlan.intensity}
            </p>
            <p className="italic text-gray-500 mt-2 mb-4">
              {workoutPlan.reasoning}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Progress: {progress}% selesai
            </p>

            {/* 🔹 Latihan + animasi langsung muncul */}
            <div className="space-y-6">
              {workoutPlan.exercises.map((ex, index) => {
                const isDone = completed.includes(ex);
                const anim = getAnimation(ex);
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 shadow-sm ${
                      isDone ? "bg-green-50 border-green-300" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className={`text-lg font-medium ${
                          isDone ? "line-through text-gray-400" : "text-gray-800"
                        }`}
                      >
                        {ex}
                      </span>
                      {!isDone && (
                        <button
                          onClick={() => handleComplete(ex)}
                          className="flex items-center text-sm bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Tandai Selesai
                        </button>
                      )}
                    </div>
                    {anim && (
                      <div className="bg-gray-100 rounded-xl p-3">
                        <Lottie
                          animationData={anim}
                          loop
                          style={{ height: 200 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-10">
            {isLoading
              ? "Menghasilkan rekomendasi AI..."
              : "Belum ada rencana latihan."}
          </p>
        )}
      </div>
    </div>
  );
};

export default AIWorkoutAnimated;
