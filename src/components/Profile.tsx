import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Edit, 
  Save, 
  Target, 
  AlertCircle,
  CheckCircle,
  Bell,
  Shield,
  LogOut,
  XCircle // Icon baru untuk error state
} from 'lucide-react';
import { calculateBMI, calculateIdealWeight, calculateDailyCalories, getBMICategory } from '../utils/calculations';
import { ACTIVITY_LEVELS, DIETARY_RESTRICTIONS, COMMON_ALLERGIES } from '../utils/constants';
import type { User as UserType } from '../types';

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State baru untuk menangani error tanpa redirect
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    goal: '',
    dietaryRestrictions: [] as string[],
    allergies: [] as string[]
  });
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- BAGIAN 1: LOAD DATA LEBIH AMAN ---
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userDataString = localStorage.getItem('user');
        
        // Hanya redirect jika data BENAR-BENAR kosong (belum login)
        if (!userDataString) {
          window.location.href = '/';
          return;
        }

        const parsedUser = JSON.parse(userDataString);
        
        // Validasi minimal: Asal ada object, kita terima.
        // Jangan throw error cuma karena nama kosong.
        if (!parsedUser || typeof parsedUser !== 'object') {
            // Hanya jika data benar-benar korup (bukan JSON valid), baru kita anggap error fatal
            throw new Error("Data user rusak (Invalid Format)");
        }

        setUser(parsedUser);
        
        // Set Form Data dengan fallback nilai kosong agar tidak error controlled input
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          age: parsedUser.age ? String(parsedUser.age) : '',
          gender: parsedUser.gender || 'male',
          height: parsedUser.height ? String(parsedUser.height) : '',
          weight: parsedUser.weight ? String(parsedUser.weight) : '',
          activityLevel: parsedUser.activityLevel || 'moderate',
          goal: parsedUser.goal || 'weight-loss',
          dietaryRestrictions: Array.isArray(parsedUser.dietaryRestrictions) ? parsedUser.dietaryRestrictions : [],
          allergies: Array.isArray(parsedUser.allergies) ? parsedUser.allergies : []
        });

      } catch (err: any) {
        console.error("Gagal memuat profil:", err);
        // JANGAN LANGSUNG LOGOUT. Tampilkan error di layar agar user tau kenapa.
        setError("Gagal memuat data profil. Data mungkin rusak. Silakan coba login ulang atau hubungi support.");
        // Opsi: Uncomment baris bawah ini jika ingin logout otomatis HANYA jika JSON error parah
        // localStorage.removeItem('user');
        // window.location.href = '/';
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // --- BAGIAN 2: SIMPAN DATA DENGAN KONVERSI TIPE ---
  const handleSave = () => {
    if (!user) return;

    try {
      // Pastikan konversi ke Number aman. Jika NaN, ubah jadi 0.
      const heightVal = Number(formData.height) || 0;
      const weightVal = Number(formData.weight) || 0;
      const ageVal = Number(formData.age) || 0;

      // Hitung ulang metrik kesehatan
      const bmiVal = calculateBMI(weightVal, heightVal);
      const idealWeightVal = calculateIdealWeight(heightVal, formData.gender as 'male' | 'female');
      
      // Hitung kalori (bungkus try-catch kecil jaga-jaga helper function error)
      let dailyCaloriesVal = 0;
      try {
        dailyCaloriesVal = calculateDailyCalories(
          weightVal,
          heightVal,
          ageVal,
          formData.gender as 'male' | 'female',
          formData.activityLevel,
          formData.goal
        );
      } catch (calError) {
        console.warn("Gagal hitung kalori:", calError);
        dailyCaloriesVal = user.dailyCalories || 0; // Pakai nilai lama jika error
      }

      const updatedUser: UserType = {
        ...user,
        name: formData.name,
        email: formData.email,
        age: ageVal,
        gender: formData.gender as 'male' | 'female',
        height: heightVal,
        weight: weightVal,
        activityLevel: formData.activityLevel as any,
        goal: formData.goal as any,
        dietaryRestrictions: formData.dietaryRestrictions,
        allergies: formData.allergies,
        bmi: bmiVal,
        idealWeight: idealWeightVal,
        dailyCalories: dailyCaloriesVal
      };

      // Simpan ke State dan LocalStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditing(false);
      alert("Profil berhasil diperbarui!"); // Feedback visual

    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Gagal menyimpan perubahan. Pastikan data angka diisi dengan benar.");
    }
  };

  const handleLogout = () => {
    // Bersihkan semua data
    const keysToRemove = [
        'user', 'workoutPlan', 'completedExercises', 
        'progressEntries', 'favoriteFoods', 'recentFoods'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    window.location.href = '/';
  };

  const handleCheckboxChange = (value: string, field: 'dietaryRestrictions' | 'allergies') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // Helper aman untuk warna BMI
  const getBmiColorClass = (colorString: string | undefined, type: 'text' | 'bg') => {
    if (!colorString) return type === 'text' ? 'text-gray-600' : 'bg-gray-100';
    const colorBase = colorString.replace('text-', '');
    if (type === 'bg') {
      // Pastikan format warna valid sebelum di-split
      return `bg-${colorBase.split('-')[0]}-100`; 
    }
    return colorString;
  };

  // --- RENDER STATES ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Tampilan jika terjadi Error Fatal (bukan redirect)
  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Refresh Halaman
                    </button>
                    <button onClick={handleLogout} className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50">
                        Logout & Reset
                    </button>
                </div>
            </div>
        </div>
    );
  }

  if (!user) return null; // Seharusnya tidak tercapai karena ada handling error di atas

  // Hitung BMI info secara aman di render
  let bmiInfo = { category: 'Unknown', color: 'text-gray-600' };
  try {
    if(user.bmi) {
        bmiInfo = getBMICategory(user.bmi);
    }
  } catch (e) {
    console.warn("BMI calc error render", e);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center text-center md:text-left space-y-4 md:space-y-0 md:space-x-6 w-full">
              <div className="p-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex-shrink-0">
                <User className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                  {user.name || 'User'}
                </h1>
                <p className="text-gray-600 truncate">{user.email}</p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                  <span className="text-sm text-gray-500">
                    Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                  {user.bmi && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getBmiColorClass(bmiInfo.color, 'text')} ${getBmiColorClass(bmiInfo.color, 'bg')}`}>
                        BMI: {user.bmi} ({bmiInfo.category})
                      </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 w-full md:w-auto justify-center">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-3 w-full md:w-auto">
                  <button
                    onClick={() => {
                        // Reset form ke data user asli saat cancel
                        setFormData(prev => ({...prev, name: user.name})); 
                        setIsEditing(false);
                    }}
                    className="flex-1 md:flex-none px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="py-2 text-gray-900">{user.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="py-2 text-gray-900">{user.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="py-2 text-gray-900">{user.age} years</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  {isEditing ? (
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  ) : (
                    <p className="py-2 text-gray-900 capitalize">{user.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="py-2 text-gray-900">{user.height} cm</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="py-2 text-gray-900">{user.weight} kg</p>
                  )}
                </div>
              </div>
            </div>

            {/* Fitness Goals */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Fitness Goals</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
                  {isEditing ? (
                    <select
                      value={formData.activityLevel}
                      onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {ACTIVITY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="py-2 text-gray-900">
                      {ACTIVITY_LEVELS.find(level => level.value === user.activityLevel)?.label || user.activityLevel}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Goal</label>
                  {isEditing ? (
                    <select
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="weight-loss">Weight Loss</option>
                      <option value="weight-gain">Weight Gain</option>
                      <option value="muscle-gain">Muscle Gain</option>
                    </select>
                  ) : (
                    <p className="py-2 text-gray-900 capitalize">{user.goal ? user.goal.replace('-', ' ') : ''}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Dietary Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Dietary Restrictions</label>
                  {isEditing ? (
                    <div className="grid md:grid-cols-3 gap-3">
                      {DIETARY_RESTRICTIONS.map(restriction => (
                        <label key={restriction} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.dietaryRestrictions.includes(restriction)}
                            onChange={() => handleCheckboxChange(restriction, 'dietaryRestrictions')}
                            className="text-green-600 focus:ring-green-500 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{restriction}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user.dietaryRestrictions && user.dietaryRestrictions.length > 0 ? (
                        user.dietaryRestrictions.map(restriction => (
                          <span key={restriction} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            {restriction}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No dietary restrictions</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Allergies</label>
                  {isEditing ? (
                    <div className="grid md:grid-cols-4 gap-3">
                      {COMMON_ALLERGIES.map(allergy => (
                        <label key={allergy} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.allergies.includes(allergy)}
                            onChange={() => handleCheckboxChange(allergy, 'allergies')}
                            className="text-green-600 focus:ring-green-500 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{allergy}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user.allergies && user.allergies.length > 0 ? (
                        user.allergies.map(allergy => (
                          <span key={allergy} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No known allergies</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Health Metrics */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">BMI</span>
                  <span className={`font-semibold ${getBmiColorClass(bmiInfo.color, 'text')}`}>
                    {user.bmi || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ideal Weight</span>
                  <span className="font-semibold text-gray-900">{user.idealWeight || '-'}kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Daily Calories</span>
                  <span className="font-semibold text-gray-900">{user.dailyCalories || '-'}</span>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">Notifications</span>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">Privacy</span>
                  </div>
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
                
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center p-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Goal Progress */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Target className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Your Goal</h3>
              </div>
              <p className="text-gray-700 mb-4 capitalize">
                {user.goal ? user.goal.replace('-', ' ') : 'Fitness'} Journey
              </p>
              <div className="text-sm text-gray-600">
                Stay consistent with your meal planning and workouts to achieve your {user.goal ? user.goal.replace('-', ' ') : ''} goals!
              </div>
            </div>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Sign Out</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to sign out? You'll need to complete the onboarding process again to access your dashboard.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;