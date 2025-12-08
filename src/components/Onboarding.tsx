import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, User, Target, Activity, LogIn } from 'lucide-react';
import { calculateBMI, calculateIdealWeight, calculateDailyCalories } from '../utils/calculations';
import { ACTIVITY_LEVELS, DIETARY_RESTRICTIONS, COMMON_ALLERGIES } from '../utils/constants';
import type { User as UserType } from '../types';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const totalSteps = 4;

  // PENTING: Email dari step 1 otomatis masuk ke formData tanpa perlu input ulang
  useEffect(() => {
    if (loginEmail) {
      setFormData(prev => ({ ...prev, email: loginEmail }));
    }
  }, [loginEmail]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Jika login data user ada nama, bisa di set juga disini (opsional)
        if (data.user && data.user.name) {
             setFormData(prev => ({ ...prev, name: data.user.name }));
        }
        setCurrentStep(2); 
      } else {
        setLoginError(data.message);
      }
    } catch (err) {
      setLoginError("Server error");
    }
  };

  const handleRegister = async () => {
    if (!loginEmail || !loginPassword || !formData.name) {
      setLoginError("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("Registration successful!");
        setCurrentStep(2); 
      } else {
        setLoginError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      setLoginError("Server error");
    }
  };

  const handleComplete = () => {
    const user: UserType = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email, // Email diambil dari state yang sudah diset via useEffect
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
      ),
      createdAt: new Date()
    };

    localStorage.setItem('user', JSON.stringify(user));
    navigate('/dashboard');
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true; 
      case 2:
        return formData.name && formData.age && formData.gender && formData.height && formData.weight;
      case 3:
        return formData.activityLevel && formData.goal;
      case 4:
        return true; 
      default:
        return false;
    }
  };

  const handleCheckboxChange = (value: string, field: 'dietaryRestrictions' | 'allergies') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
        {/* Background Logo Transparan */}
        <img
          src="/img/logo.jpg" 
          alt="Logo Background"
          className="absolute opacity-10 w-[500px] h-[500px] object-contain z-0 select-none pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            filter: "blur(1px)",
          }}
        />

        {/* Progress Bar */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 relative z-10">
          <div className="flex items-center justify-between text-white mb-4">
            <h1 className="text-2xl font-bold">Let's Get Started</h1>
            <span className="text-green-100">Step {currentStep} of {totalSteps}</span>
          </div>
          <div className="w-full bg-green-700 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="p-8 relative z-10">
          
          {/* STEP 1: LOGIN / REGISTER */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <LogIn className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isRegister ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600">
                  {isRegister ? 'Register to get started' : 'Login to your account or create a new one'}
                </p>
              </div>

              <div className="space-y-4">
                {isRegister && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>

                {loginError && <p className="text-red-600 text-sm">{loginError}</p>}

                <button
                  onClick ={isRegister ? handleRegister : handleLogin}
                  className="w-full px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {isRegister ? 'Register' : 'Login'}
                </button>

                <p className="text-center text-sm text-gray-600 mt-4">
                  {isRegister ? (
                    <>
                      Already have an account?{' '}
                      <span
                        onClick={() => setIsRegister(false)}
                        className="text-green-600 cursor-pointer font-semibold hover:underline"
                      >
                        Login
                      </span>
                    </>
                  ) : (
                    <>
                      Don’t have an account?{' '}
                      <span
                        onClick={() => setIsRegister(true)}
                        className="text-green-600 cursor-pointer font-semibold hover:underline"
                      >
                        Register
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE SETUP (Tanpa Input Email Lagi) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <User className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile Setup</h2>
                <p className="text-gray-600">Let's build your personal profile</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Kolom Kiri: Nama, Umur, Gender */}
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your full name"
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Age"
                        min="18"
                        max="100"
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                    </div>
                </div>

                {/* Kolom Kanan: Tinggi & Berat (EMAIL DIHAPUS DARI SINI) */}
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                    <input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Height in cm"
                        min="100"
                        max="250"
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                    <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Weight in kg"
                        min="30"
                        max="300"
                    />
                    </div>
                </div>
              </div>
              
              {/* BMI Preview */}
              {formData.height && formData.weight && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg text-center animate-fade-in">
                  <h3 className="font-semibold text-green-800 mb-1">Your BMI Preview</h3>
                  <p className="text-green-700 text-lg font-bold">
                    {calculateBMI(parseInt(formData.weight), parseInt(formData.height))}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: GOALS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Goals & Activity</h2>
                <p className="text-gray-600">What do you want to achieve?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Activity Level</label>
                <div className="space-y-3">
                  {ACTIVITY_LEVELS.map((level) => (
                    <label key={level.value} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="activityLevel"
                        value={level.value}
                        checked={formData.activityLevel === level.value}
                        onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{level.label}</div>
                        <div className="text-sm text-gray-500">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Primary Goal</label>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { value: 'weight-loss', label: 'Weight Loss', desc: 'Lose weight healthily' },
                    { value: 'weight-gain', label: 'Weight Gain', desc: 'Gain healthy weight' },
                    { value: 'muscle-gain', label: 'Muscle Gain', desc: 'Build lean muscle' }
                  ].map((goal) => (
                    <label key={goal.value} className="flex flex-col items-center p-6 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="goal"
                        value={goal.value}
                        checked={formData.goal === goal.value}
                        onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                        className="text-green-600 focus:ring-green-500 mb-3"
                      />
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{goal.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{goal.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PREFERENCES */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Dietary Preferences</h2>
                <p className="text-gray-600">Optional: Tell us about any dietary restrictions or allergies</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Dietary Restrictions</label>
                <div className="grid md:grid-cols-3 gap-3">
                  {DIETARY_RESTRICTIONS.map((restriction) => (
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Allergies</label>
                <div className="grid md:grid-cols-4 gap-3">
                  {COMMON_ALLERGIES.map((allergy) => (
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
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;