import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus,
  Scale,
  TrendingUp,
  Utensils,     
  Flame,         
  Dumbbell,
  Calendar,
  Activity,
  ArrowRight
} from 'lucide-react';

// --- TIPE DATA ---
interface User {
  id?: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  goal: string;
  idealWeight: number;
  dailyCalories: number; // Target kalori user
}

interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

interface DailyStats {
  date: string;
  caloriesIn: number;   // Dari MealPlanning
  caloriesBurned: number; // Dari ExercisePlanning
  protein: number;
  carbs: number;
  fat: number;
  workoutCount: number;
  workoutFocus: string;
  netCalories: number; // Masuk - Keluar
}

const Progress: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ weight: '', notes: '' });

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    loadUserData();
    loadProgressEntries();
    loadIntegratedData(); // Load data Meal & Exercise
  }, []);

  const loadUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const loadProgressEntries = () => {
    const saved = localStorage.getItem('progressEntries');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Urutkan dari tanggal lama ke baru untuk grafik
      setProgressEntries(parsed.sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    }
  };

  // --- CORE LOGIC: INTEGRASI MEAL & EXERCISE ---
  const loadIntegratedData = () => {
    const stats: DailyStats[] = [];
    const today = new Date();
    
    // Ambil data 7 hari terakhir (termasuk hari ini)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];

      // 1. AMBIL DATA DARI MEAL PLANNING
      // Key harus sesuai dengan yang disimpan di MealPlanning.tsx
      const mealRaw = localStorage.getItem(`daily-nutrition-${dateKey}`);
      const mealData = mealRaw ? JSON.parse(mealRaw) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      // 2. AMBIL DATA DARI EXERCISE PLANNING
      // Asumsi ExercisePlanning menyimpan dengan key 'daily-workout-{dateKey}'
      const workoutRaw = localStorage.getItem(`daily-workout-${dateKey}`);
      const workoutData = workoutRaw ? JSON.parse(workoutRaw) : { caloriesBurned: 0, completedExercises: 0, focus: '-' };

      stats.push({
        date: dateKey,
        caloriesIn: mealData.calories || 0,
        protein: mealData.protein || 0,
        carbs: mealData.carbs || 0,
        fat: mealData.fat || 0,
        caloriesBurned: workoutData.caloriesBurned || 0,
        workoutCount: workoutData.completedExercises || 0,
        workoutFocus: workoutData.focus || '-',
        netCalories: (mealData.calories || 0) - (workoutData.caloriesBurned || 0)
      });
    }
    setWeeklyStats(stats);
  };

  const addProgressEntry = () => {
    if (!newEntry.weight) return;
    const entry: ProgressEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newEntry.weight),
      notes: newEntry.notes
    };
    const updated = [...progressEntries, entry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setProgressEntries(updated);
    localStorage.setItem('progressEntries', JSON.stringify(updated));
    setShowAddEntry(false);
    setNewEntry({ weight: '', notes: '' });
  };

  // --- HELPER CALCULATIONS ---
  const currentWeight = progressEntries.length > 0 ? progressEntries[progressEntries.length - 1].weight : user?.weight || 0;
  const startWeight = user?.weight || 0;
  const targetWeight = user?.idealWeight || 0;
  const weightDiff = Math.abs(currentWeight - startWeight);
  const totalGoalDiff = Math.abs(targetWeight - startWeight);
  
  // Progress bar logic (prevent division by zero)
  const progressPercent = totalGoalDiff > 0 ? Math.min(100, (weightDiff / totalGoalDiff) * 100) : 0;
  
  // Rata-rata mingguan
  const avgCaloriesIn = Math.round(weeklyStats.reduce((acc, curr) => acc + curr.caloriesIn, 0) / 7);
  const avgCaloriesBurn = Math.round(weeklyStats.reduce((acc, curr) => acc + curr.caloriesBurned, 0) / 7);

  if (!user) return <div className="p-10 text-center text-gray-500">Memuat data pengguna...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Progress</h1>
            <p className="text-gray-600 mt-1">Pantau sinkronisasi antara diet & latihanmu.</p>
          </div>
          <button
            onClick={() => setShowAddEntry(true)}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            Update Berat Badan
          </button>
        </div>

        {/* --- SECTION 1: RINGKASAN DATA (Stats Cards) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Berat Badan */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Scale size={60} />
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase">Berat Saat Ini</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{currentWeight} <span className="text-lg font-normal text-gray-400">kg</span></h3>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center font-medium ${currentWeight < startWeight ? 'text-green-600' : 'text-orange-600'}`}>
                {currentWeight < startWeight ? 'Turun' : 'Naik'} {Math.abs(currentWeight - startWeight).toFixed(1)} kg
              </span>
              <span className="text-gray-400 ml-2">dari awal</span>
            </div>
          </div>

          {/* Rata-rata Kalori Masuk */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Utensils size={60} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase">Rata-rata Makan (7 Hari)</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{avgCaloriesIn} <span className="text-lg font-normal text-gray-400">kcal</span></h3>
            <p className="text-sm text-gray-400 mt-2">Target Harian: {user.dailyCalories} kcal</p>
          </div>

          {/* Rata-rata Kalori Keluar */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Flame size={60} className="text-orange-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase">Rata-rata Bakar (7 Hari)</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{avgCaloriesBurn} <span className="text-lg font-normal text-gray-400">kcal</span></h3>
            <p className="text-sm text-gray-400 mt-2">Dari aktivitas latihan</p>
          </div>

          {/* Menuju Target */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target size={60} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase">Progress Target</p>
            <div className="flex items-baseline mt-1">
              <h3 className="text-3xl font-bold text-gray-900">{Math.round(progressPercent)}%</h3>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">Target: {targetWeight} kg</p>
          </div>
        </div>

        {/* --- SECTION 2: GRAFIK ANALYSIS --- */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Grafik 1: Berat Badan */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="mr-2 text-green-600" size={20}/> Riwayat Berat Badan
            </h3>
            {progressEntries.length > 0 ? (
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {progressEntries.slice(-7).map((entry, idx) => {
                  const min = Math.min(...progressEntries.map(p => p.weight));
                  const max = Math.max(...progressEntries.map(p => p.weight));
                  const range = max - min || 1; 
                  const height = ((entry.weight - min) / range) * 70 + 20; // Scale 20% - 90%

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded mb-2 whitespace-nowrap z-10">
                        {entry.weight} kg
                      </div>
                      {/* Bar */}
                      <div 
                        className="w-full max-w-[40px] bg-green-100 border-t-4 border-green-500 rounded-t-sm hover:bg-green-200 transition-all relative"
                        style={{ height: `${height}%` }}
                      ></div>
                      {/* Date */}
                      <span className="text-[10px] text-gray-400 mt-2 font-medium">
                        {new Date(entry.date).getDate()}/{new Date(entry.date).getMonth() + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                Belum ada data berat badan.
              </div>
            )}
          </div>

          {/* Grafik 2: Kalori Masuk vs Keluar (INTEGRASI UTAMA) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <Activity className="mr-2 text-blue-600" size={20}/> Keseimbangan Kalori (7 Hari)
            </h3>
            <div className="h-64 flex items-end justify-between gap-3 px-2">
              {weeklyStats.map((stat, idx) => {
                 // Cari nilai max untuk skala grafik
                 const maxVal = Math.max(2500, ...weeklyStats.map(s => Math.max(s.caloriesIn, s.caloriesBurned)));
                 const hIn = (stat.caloriesIn / maxVal) * 100;
                 const hOut = (stat.caloriesBurned / maxVal) * 100;

                 return (
                   <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip Double */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded z-10 pointer-events-none">
                         <div className="text-green-300">In: {stat.caloriesIn}</div>
                         <div className="text-orange-300">Burn: {stat.caloriesBurned}</div>
                      </div>
                      
                      <div className="w-full flex gap-1 items-end justify-center h-full">
                         {/* Bar In */}
                         <div style={{ height: `${hIn}%` }} className="w-1/2 bg-green-400 rounded-t-sm opacity-80 hover:opacity-100"></div>
                         {/* Bar Out */}
                         <div style={{ height: `${hOut}%` }} className="w-1/2 bg-orange-400 rounded-t-sm opacity-80 hover:opacity-100"></div>
                      </div>

                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(stat.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                   </div>
                 );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-gray-500">
                <div className="flex items-center"><div className="w-3 h-3 bg-green-400 rounded mr-1"></div> Makanan (In)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-orange-400 rounded mr-1"></div> Latihan (Out)</div>
            </div>
          </div>
        </div>

        {/* --- SECTION 3: DETAIL HARIAN (Reverse Chronological) --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Log Aktivitas Harian</h3>
            <p className="text-sm text-gray-500">Detail nutrisi dan latihan yang terekam sistem.</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {[...weeklyStats].reverse().map((day) => { // Balik urutan: Hari ini paling atas
              const isToday = day.date === new Date().toISOString().split('T')[0];
              const hasData = day.caloriesIn > 0 || day.caloriesBurned > 0;

              if (!hasData && !isToday) return null; // Sembunyikan hari kosong yang bukan hari ini

              return (
                <div key={day.date} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Kolom Tanggal */}
                    <div className="min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long' })}</span>
                        {isToday && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">HARI INI</span>}
                      </div>
                      <span className="text-sm text-gray-500">{new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>

                    {/* Kolom Summary Bar */}
                    <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4">
                       {/* Makanan */}
                       <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <div className="flex items-center gap-2 mb-1">
                             <Utensils size={14} className="text-green-600"/>
                             <span className="text-xs font-bold text-green-700">MAKANAN</span>
                          </div>
                          <div className="text-lg font-bold text-gray-800">{day.caloriesIn} <span className="text-xs font-normal text-gray-500">kcal</span></div>
                          <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                             <span>P: {day.protein}g</span>
                             <span>K: {day.carbs}g</span>
                             <span>L: {day.fat}g</span>
                          </div>
                       </div>

                       {/* Latihan */}
                       <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center gap-2 mb-1">
                             <Dumbbell size={14} className="text-orange-600"/>
                             <span className="text-xs font-bold text-orange-700">LATIHAN</span>
                          </div>
                          <div className="text-lg font-bold text-gray-800">{day.caloriesBurned} <span className="text-xs font-normal text-gray-500">kcal</span></div>
                          <div className="text-[10px] text-gray-500 mt-1 truncate">
                             {day.workoutFocus !== '-' ? `Fokus: ${day.workoutFocus}` : 'Istirahat'}
                          </div>
                       </div>

                       {/* Net Calories */}
                       <div className={`rounded-lg p-3 border ${day.netCalories > 0 ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'}`}>
                          <div className="flex items-center gap-2 mb-1">
                             <Activity size={14} className="text-gray-600"/>
                             <span className="text-xs font-bold text-gray-700">NET KALORI</span>
                          </div>
                          <div className={`text-lg font-bold ${day.netCalories > 0 ? 'text-gray-800' : 'text-green-600'}`}>
                             {day.netCalories > 0 ? '+' : ''}{day.netCalories}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                             Masuk - Keluar
                          </div>
                       </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Tambah Berat */}
        {showAddEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Catat Berat Badan</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berat (kg)</label>
                  <input
                    type="number"
                    value={newEntry.weight}
                    onChange={(e) => setNewEntry({...newEntry, weight: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                    placeholder="0.0"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <textarea
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    rows={3}
                    placeholder="Ada perubahan pola makan?"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowAddEntry(false)} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl">Batal</button>
                  <button onClick={addProgressEntry} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md">Simpan</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;