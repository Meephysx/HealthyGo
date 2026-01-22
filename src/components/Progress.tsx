import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus,
  Scale,
  TrendingUp,
  Utensils,     
  Flame,         
  Dumbbell,
  Activity,
  ChevronDown
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
  dailyCalories: number;
}

interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

interface DailyStats {
  date: string;
  caloriesIn: number;
  caloriesBurned: number;
  protein: number;
  carbs: number;
  fat: number;
  workoutCount: number;
  workoutFocus: string;
  netCalories: number;
}

const Progress: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ weight: '', notes: '' });

  // --- HELPER: FORMAT TANGGAL LOKAL (PENTING AGAR TIDAK ERROR TIMEZONE) ---
  const getLocalDateKey = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    loadUserData();
    loadProgressEntries();
    loadIntegratedData();
  }, []);

  const loadUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const loadProgressEntries = () => {
    const saved = localStorage.getItem('progressEntries');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Urutkan entry berdasarkan tanggal
      setProgressEntries(parsed.sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    }
  };

  // --- INTEGRASI DATA MEAL & EXERCISE ---
  const loadIntegratedData = () => {
    const stats: DailyStats[] = [];
    const today = new Date();
    
    // Loop 7 hari terakhir (6 hari lalu s/d hari ini)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = getLocalDateKey(d); // Gunakan helper local date

      // 1. Ambil Data Makanan
      const mealRaw = localStorage.getItem(`daily-nutrition-${dateKey}`);
      const mealData = mealRaw ? JSON.parse(mealRaw) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      // 2. Ambil Data Latihan
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
    
    const todayKey = getLocalDateKey(new Date());
    
    const entry: ProgressEntry = {
      id: Date.now().toString(),
      date: todayKey,
      weight: parseFloat(newEntry.weight),
      notes: newEntry.notes
    };

    // Update state dan localStorage
    // Cek jika hari ini sudah ada entry, update entry tersebut, jika belum, tambah baru
    const filtered = progressEntries.filter(p => p.date !== todayKey);
    const updated = [...filtered, entry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setProgressEntries(updated);
    localStorage.setItem('progressEntries', JSON.stringify(updated));
    
    // Update data user utama juga agar dashboard depan update
    if (user) {
      const updatedUser = { ...user, weight: parseFloat(newEntry.weight) };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    setShowAddEntry(false);
    setNewEntry({ weight: '', notes: '' });
  };

  // --- KALKULASI UNTUK UI ---
  const currentWeight = progressEntries.length > 0 
    ? progressEntries[progressEntries.length - 1].weight 
    : user?.weight || 0;
    
  const startWeight = user?.weight || 0; // Idealnya simpan startWeight terpisah, tapi ini fallback
  const targetWeight = user?.idealWeight || 0;
  const weightDiff = Math.abs(currentWeight - startWeight);
  const totalGoalDiff = Math.abs(targetWeight - startWeight);
  
  // Kalkulasi Persentase Progress
  // Jika target < start (Diet): (Start - Current) / (Start - Target)
  // Jika target > start (Bulking): (Current - Start) / (Target - Start)
  let progressPercent = 0;
  if (totalGoalDiff > 0) {
     if (targetWeight < startWeight) {
        progressPercent = Math.max(0, Math.min(100, ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100));
     } else {
        progressPercent = Math.max(0, Math.min(100, ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100));
     }
  }

  // Rata-rata 7 Hari
  const avgCaloriesIn = Math.round(weeklyStats.reduce((acc, curr) => acc + curr.caloriesIn, 0) / 7);
  const avgCaloriesBurn = Math.round(weeklyStats.reduce((acc, curr) => acc + curr.caloriesBurned, 0) / 7);

  if (!user) return <div className="p-10 text-center text-gray-500">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Track Progress</h1>
            <p className="text-gray-600 mt-1">Pantau perkembangan berat badan & kalori harianmu.</p>
          </div>
          <button
            onClick={() => setShowAddEntry(true)}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            Catat Berat Hari Ini
          </button>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card Berat */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">Berat Saat Ini</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{currentWeight} <span className="text-base font-normal text-gray-500">kg</span></h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Scale size={24} />
              </div>
            </div>
          </div>

          {/* Card Target */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">Target Kamu</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{targetWeight} <span className="text-base font-normal text-gray-500">kg</span></h3>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Target size={24} />
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
              <div 
                className="bg-green-500 h-1.5 rounded-full transition-all duration-1000" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">{Math.round(progressPercent)}% tercapai</p>
          </div>

          {/* Card Intake */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-sm text-gray-500 font-medium">Rata-rata Makan</p>
                   <h3 className="text-2xl font-bold text-gray-900 mt-1">{avgCaloriesIn} <span className="text-sm text-gray-500">kcal/hari</span></h3>
                </div>
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                   <Utensils size={20} />
                </div>
             </div>
             <p className="text-xs text-gray-400 mt-2">Data 7 hari terakhir</p>
          </div>

          {/* Card Burn */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-sm text-gray-500 font-medium">Rata-rata Bakar</p>
                   <h3 className="text-2xl font-bold text-gray-900 mt-1">{avgCaloriesBurn} <span className="text-sm text-gray-500">kcal/hari</span></h3>
                </div>
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                   <Flame size={20} />
                </div>
             </div>
             <p className="text-xs text-gray-400 mt-2">Data 7 hari terakhir</p>
          </div>
        </div>

        {/* --- GRAFIK SECTION --- */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* GRAFIK 1: BERAT BADAN (Dynamic Scale) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="mr-2 text-green-600" size={20}/> Grafik Berat Badan
            </h3>
            
            <div className="relative h-64 w-full">
              {progressEntries.length > 0 ? (
                <div className="flex items-end justify-between h-full px-2 gap-2">
                  {progressEntries.slice(-7).map((entry, idx) => {
                    // LOGIC ZOOM: Cari min dan max dari data yang ditampilkan saja
                    const recentEntries = progressEntries.slice(-7);
                    const weights = recentEntries.map(e => e.weight);
                    const minWeight = Math.min(...weights) - 0.5; // Buffer bawah
                    const maxWeight = Math.max(...weights) + 0.5; // Buffer atas
                    const range = maxWeight - minWeight || 1; 

                    // Hitung tinggi batang dalam persen (relatif terhadap min/max view)
                    const heightPercent = ((entry.weight - minWeight) / range) * 100;
                    // Clamp nilai agar tidak overflow
                    const safeHeight = Math.max(5, Math.min(100, heightPercent));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip Hover */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap z-10">
                          {entry.weight} kg
                          <div className="text-[10px] text-gray-300">{entry.notes}</div>
                        </div>
                        
                        {/* Bar */}
                        <div 
                          className="w-full max-w-[40px] bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg shadow-sm hover:from-green-600 hover:to-green-500 transition-all cursor-pointer relative"
                          style={{ height: `${safeHeight}%` }}
                        >
                            {/* Label Berat di atas batang (jika cukup ruang) */}
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600">
                                {entry.weight}
                            </span>
                        </div>
                        
                        {/* Tanggal */}
                        <span className="text-[10px] text-gray-400 mt-2 font-medium">
                          {new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <Scale className="mb-2 opacity-50" size={32} />
                  <p className="text-sm">Belum ada data berat badan.</p>
                  <button onClick={() => setShowAddEntry(true)} className="mt-2 text-green-600 font-medium text-sm hover:underline">
                    + Tambah Data Awal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* GRAFIK 2: KALORI MASUK VS KELUAR */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <Activity className="mr-2 text-blue-600" size={20}/> Kalori (7 Hari Terakhir)
            </h3>
            
            <div className="h-64 relative">
                {/* Garis Grid Background (Optional Visual Aid) */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-gray-100 w-full h-full"></div>
                    <div className="border-t border-gray-100 w-full h-full"></div>
                    <div className="border-t border-gray-100 w-full h-full"></div>
                    <div className="border-t border-gray-100 w-full h-full"></div>
                </div>

                <div className="flex items-end justify-between gap-2 h-full relative z-10 px-2">
                {weeklyStats.map((stat, idx) => {
                    const maxVal = Math.max(2500, ...weeklyStats.map(s => Math.max(s.caloriesIn, s.caloriesBurned)));
                    // Pastikan minimal bar terlihat sedikit (5%) jika ada nilai
                    const hIn = stat.caloriesIn > 0 ? Math.max(5, (stat.caloriesIn / maxVal) * 100) : 0;
                    const hOut = stat.caloriesBurned > 0 ? Math.max(5, (stat.caloriesBurned / maxVal) * 100) : 0;

                    const isToday = stat.date === getLocalDateKey(new Date());

                    return (
                    <div key={idx} className={`flex-1 flex flex-col items-center gap-1 group relative ${isToday ? 'bg-blue-50/50 rounded-lg' : ''}`}>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded z-20 pointer-events-none whitespace-nowrap">
                            <div className="font-bold border-b border-gray-700 pb-1 mb-1">{new Date(stat.date).toLocaleDateString('id-ID', {weekday: 'long'})}</div>
                            <div className="text-green-300">Makan: {stat.caloriesIn}</div>
                            <div className="text-orange-300">Bakar: {stat.caloriesBurned}</div>
                        </div>
                        
                        <div className="w-full flex gap-1 items-end justify-center h-full pb-6">
                            {/* Bar In */}
                            <div className="relative w-1/2 h-full flex items-end justify-center">
                                <div style={{ height: `${hIn}%` }} className="w-full bg-green-400 rounded-t-sm opacity-90 hover:opacity-100 transition-all"></div>
                            </div>
                            {/* Bar Out */}
                            <div className="relative w-1/2 h-full flex items-end justify-center">
                                <div style={{ height: `${hOut}%` }} className="w-full bg-orange-400 rounded-t-sm opacity-90 hover:opacity-100 transition-all"></div>
                            </div>
                        </div>

                        <span className={`absolute bottom-0 text-[10px] font-medium ${isToday ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                            {new Date(stat.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                        </span>
                    </div>
                    );
                })}
                </div>
            </div>
            
            <div className="flex justify-center gap-6 mt-4 text-xs font-medium text-gray-500">
                <div className="flex items-center"><div className="w-3 h-3 bg-green-400 rounded mr-1"></div> Makanan (In)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-orange-400 rounded mr-1"></div> Latihan (Out)</div>
            </div>
          </div>
        </div>

        {/* --- RIWAYAT HARIAN (LIST VIEW) --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Riwayat Detail</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">7 Hari Terakhir</span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {[...weeklyStats].reverse().map((day) => {
              const isToday = day.date === getLocalDateKey(new Date());
              // Tampilkan jika hari ini ATAU ada datanya
              const hasData = day.caloriesIn > 0 || day.caloriesBurned > 0;

              if (!hasData && !isToday) return null;

              return (
                <div key={day.date} className={`p-5 hover:bg-gray-50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Tanggal */}
                    <div className="min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long' })}</span>
                        {isToday && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">HARI INI</span>}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="flex-grow grid grid-cols-3 gap-2 sm:gap-4">
                       {/* Box Makanan */}
                       <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-500 mb-1 flex justify-center items-center gap-1"><Utensils size={10}/> Makan</div>
                          <div className="font-bold text-green-700">{day.caloriesIn}</div>
                       </div>
                       
                       {/* Box Latihan */}
                       <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-500 mb-1 flex justify-center items-center gap-1"><Dumbbell size={10}/> Bakar</div>
                          <div className="font-bold text-orange-600">{day.caloriesBurned}</div>
                       </div>

                       {/* Box Net */}
                       <div className={`border rounded-lg p-2 text-center ${day.netCalories > 0 ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'}`}>
                          <div className="text-xs text-gray-500 mb-1">Sisa/Defisit</div>
                          <div className={`font-bold ${day.netCalories > 0 ? 'text-gray-800' : 'text-green-600'}`}>
                             {day.netCalories > 0 ? '+' : ''}{day.netCalories}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODAL INPUT BERAT */}
        {showAddEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Update Berat Badan</h2>
                <button onClick={() => setShowAddEntry(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berat Hari Ini (kg)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={newEntry.weight}
                      onChange={(e) => setNewEntry({...newEntry, weight: e.target.value})}
                      className="w-full p-3 pl-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-2xl font-bold text-center"
                      placeholder="0.0"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <textarea
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none text-sm"
                    rows={2}
                    placeholder="Misal: Habis cheat day..."
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowAddEntry(false)} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                  <button onClick={addProgressEntry} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-colors">Simpan</button>
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