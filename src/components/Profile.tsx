import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Edit, 
  Save, 
  Target, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Bell,
  Shield,
  LogOut
} from 'lucide-react';
import { calculateBMI, calculateIdealWeight, calculateDailyCalories, getBMICategory } from '../utils/calculations';
import { ACTIVITY_LEVELS, DIETARY_RESTRICTIONS, COMMON_ALLERGIES } from '../utils/constants';
import type { User as UserType } from '../types';

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData({
        name: parsedUser.name,
        email: parsedUser.email,
        age: parsedUser.age.toString(),
        gender: parsedUser.gender,
        height: parsedUser.height.toString(),
        weight: parsedUser.weight.toString(),
        activityLevel: parsedUser.activityLevel,
        goal: parsedUser.goal,
        dietaryRestrictions: parsedUser.dietaryRestrictions || [],
        allergies: parsedUser.allergies || []
      });
    }
  }, []);

  const handleSave = () => {
    if (!user) return;

    const updatedUser: UserType = {
      ...user,
      name: formData.name,
      email: formData.email,
      age: parseInt(formData.age),
      gender: formData.gender as 'male' | 'female',
      height: parseInt(formData.height),
      weight: parseInt(formData.weight),
      activityLevel: formData.activityLevel as any,
      goal: formData.goal as any,
      dietaryRestrictions: formData.dietaryRestrictions,
      allergies: formData.allergies,
      bmi: calculateBMI(parseInt(formData.weight), parseInt(formData.height)),
      idealWeight: calculateIdealWeight(parseInt(formData.height), formData.gender as 'male' | 'female'),
      dailyCalories: calculateDailyCalories(
        parseInt(formData.weight),
        parseInt(formData.height),
        parseInt(formData.age),
        formData.gender as 'male' | 'female',
        formData.activityLevel,
        formData.goal
      )
    };

    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('workoutPlan');
    localStorage.removeItem('completedExercises');
    localStorage.removeItem('progressEntries');
    localStorage.removeItem('favoriteFoods');
    localStorage.removeItem('recentFoods');
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const bmiInfo = getBMICategory(user.bmi);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-full">
                <User className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${bmiInfo.color.replace('text-', 'text-')} ${bmiInfo.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    BMI: {user.bmi} ({bmiInfo.category})
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </>
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
                      {ACTIVITY_LEVELS.find(level => level.value === user.activityLevel)?.label}
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
                    <p className="py-2 text-gray-900 capitalize">{user.goal.replace('-', ' ')}</p>
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
                      {user.dietaryRestrictions.length > 0 ? (
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
                      {user.allergies.length > 0 ? (
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
                  <span className={`font-semibold ${bmiInfo.color}`}>{user.bmi}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ideal Weight</span>
                  <span className="font-semibold text-gray-900">{user.idealWeight}kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Daily Calories</span>
                  <span className="font-semibold text-gray-900">{user.dailyCalories}</span>
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
                {user.goal.replace('-', ' ')} Journey
              </p>
              <div className="text-sm text-gray-600">
                Stay consistent with your meal planning and workouts to achieve your {user.goal.replace('-', ' ')} goals!
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