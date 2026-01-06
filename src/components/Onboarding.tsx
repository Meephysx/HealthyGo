import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Icons
import {
  ChevronRight,
  ChevronLeft,
  User,
  Target,
  LogIn,
} from "lucide-react";

// Utils
import {
  calculateBMI,
  calculateIdealWeight,
  calculateDailyCalories,
} from "../utils/calculations";

import {
  ACTIVITY_LEVELS,
  DIETARY_RESTRICTIONS,
  COMMON_ALLERGIES,
} from "../utils/constants";

// Firebase core
import { auth, db } from "../firebase";

// Firebase auth
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

// Firebase database
// Tambahkan 'update' di sini
import { ref, get, set, update } from "firebase/database"; 

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    activityLevel: "",
    goal: "",
    dietaryRestrictions: [] as string[],
    allergies: [] as string[],
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const totalSteps = 4;

  // Auto-sync email to form
  useEffect(() => {
    if (loginEmail) {
      setFormData((prev) => ({ ...prev, email: loginEmail }));
    }
  }, [loginEmail]);

  // ==== LOGIN ====
  const handleLogin = async () => {
    try {
      setLoginError(""); // Reset error
      const userCred = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );

      const user = userCred.user;

      // AMBIL DATA USER DARI REALTIME DB
      const snapshot = await get(ref(db, "users/" + user.uid));
      
      // Jika data tidak ada di database (misal user lama atau error saat register)
      if (!snapshot.exists()) {
        // Opsi: Arahkan ke pengisian profil jika data kosong
        // setLoginError("Data profil belum lengkap, silakan register ulang atau hubungi admin.");
        // Atau paksa isi data:
        // setIsRegister(true); 
        // setCurrentStep(2);
        // return;
        
        // Untuk sekarang kita biarkan, tapi beri object kosong agar tidak error
        console.warn("User data not found in DB");
      }

      const userData = snapshot.exists() ? snapshot.val() : {};
      const token = await user.getIdToken();

      localStorage.setItem("token", token);
      
      // Gabungkan data auth dan data dari DB untuk localStorage
      localStorage.setItem("user", JSON.stringify({
        uid: user.uid,
        email: user.email,
        ...userData // Spread data dari database (fullname, bmi, dll)
      }));

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      setLoginError("Login gagal: " + (err.message || "Unknown error"));
    }
  };

  // ==== REGISTER ====
  const handleRegister = async () => {
    try {
      setLoginError("");
      const userCred = await createUserWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );

      const user = userCred.user;

      // SIMPAN DATA AWAL KE FIREBASE REALTIME DATABASE
      const initialData = {
        fullname: formData.name,
        email: user.email,
        createdAt: Date.now(),
      };

      await set(ref(db, "users/" + user.uid), initialData);

      const token = await user.getIdToken();

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({
        uid: user.uid,
        ...initialData
      }));

      setCurrentStep(2);
    } catch (err: any) {
      console.error("Register Error:", err);
      setLoginError("Register gagal: " + err.message);
    }
  };

  // ==== FINAL SUBMIT (UPDATED) ====
  const handleComplete = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("User not logged in");
      return;
    }

    try {
      // Validasi dan parsing angka dengan fallback
      const age = parseInt(formData.age) || 0;
      const height = parseInt(formData.height) || 0;
      const weight = parseInt(formData.weight) || 0;

      // Hitung data kesehatan
      const bmi = calculateBMI(weight, height);
      const idealWeight = calculateIdealWeight(height, formData.gender as "male" | "female");
      const dailyCalories = calculateDailyCalories(
        weight,
        height,
        age,
        formData.gender as "male" | "female",
        formData.activityLevel,
        formData.goal
      );

      // Siapkan payload lengkap
      const payload = {
        fullname: formData.name || "", // Pastikan key konsisten (fullname vs name)
        age,
        gender: formData.gender || "",
        height,
        weight,
        activityLevel: formData.activityLevel || "",
        goal: formData.goal || "",
        dietaryRestrictions: formData.dietaryRestrictions || [],
        allergies: formData.allergies || [],
        bmi,
        idealWeight,
        dailyCalories,
        updatedAt: Date.now()
      };

      // === PERBAIKAN: UPDATE LANGSUNG KE FIREBASE ===
      // Jangan gunakan fetch ke localhost:5000 lagi
      await update(ref(db, "users/" + user.uid), payload);

      // Update LocalStorage agar Dashboard langsung dapat data terbaru
      const currentUserLocal = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...currentUserLocal,
        ...payload
      }));

      alert("Profile updated successfully!");
      navigate("/dashboard"); 

    } catch (err: any) {
      console.error("HandleComplete Error:", err);
      alert("Gagal menyimpan data ke Firebase: " + (err.message || "Unknown error"));
    }
  };

  // ==== NAVIGATION ====
  const handleNext = () => {
    currentStep < totalSteps
      ? setCurrentStep(currentStep + 1)
      : handleComplete();
  };
  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return (
          formData.name &&
          formData.age &&
          formData.gender &&
          formData.height &&
          formData.weight
        );
      case 3:
        return formData.activityLevel && formData.goal;
      default:
        return true;
    }
  };

  const handleCheckboxChange = (
    value: string,
    field: "dietaryRestrictions" | "allergies"
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((x) => x !== value)
        : [...prev[field], value],
    }));
  };

  // ==== UI ====
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
        {/* background logo */}
        <img
          src="/img/logo.jpg"
          alt="Logo Background"
          className="absolute opacity-10 w-[500px] h-[500px] object-contain z-0"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            filter: "blur(1px)",
          }}
        />

        {/* Progress Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 relative z-10">
          <div className="flex items-center justify-between text-white mb-4">
            <h1 className="text-2xl font-bold">Let's Get Started</h1>
            <span className="text-green-100">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          <div className="w-full bg-green-700 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* FORM STEPS */}
        <div className="p-8 relative z-10">
          {/* STEP 1 — LOGIN / REGISTER */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <LogIn className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold">
                  {isRegister ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="text-gray-600">
                  {isRegister
                    ? "Register to get started"
                    : "Login or create a new account"}
                </p>
              </div>

              {isRegister && (
                <div>
                  <label className="block font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Enter your password"
                />
              </div>

              {loginError && (
                <p className="text-red-600 text-sm">{loginError}</p>
              )}

              <button
                onClick={isRegister ? handleRegister : handleLogin}
                className="w-full px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg text-white font-semibold"
              >
                {isRegister ? "Register" : "Login"}
              </button>

              <p className="text-center text-sm mt-4">
                {isRegister ? (
                  <>
                    Already have an account?{" "}
                    <span
                      className="text-green-600 cursor-pointer font-semibold"
                      onClick={() => setIsRegister(false)}
                    >
                      Login
                    </span>
                  </>
                ) : (
                  <>
                    Don’t have an account?{" "}
                    <span
                      className="text-green-600 cursor-pointer font-semibold"
                      onClick={() => setIsRegister(true)}
                    >
                      Register
                    </span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* STEP 2 — PROFILE INPUT */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <User className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold">Profile Setup</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-medium">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium">Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {formData.height && formData.weight && (
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <h3 className="font-semibold text-green-800">
                    Your BMI Preview
                  </h3>
                  <p className="text-green-700 text-lg font-bold">
                    {calculateBMI(
                      parseInt(formData.weight),
                      parseInt(formData.height)
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — GOALS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold">Goals & Activity</h2>
              </div>

              {/* Activity Level */}
              <label className="block font-medium mb-2">Activity Level</label>
              <div className="space-y-3">
                {ACTIVITY_LEVELS.map((level) => (
                  <label
                    key={level.value}
                    className="flex items-center p-4 border rounded-lg cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="activityLevel"
                      value={level.value}
                      checked={formData.activityLevel === level.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activityLevel: e.target.value,
                        })
                      }
                    />
                    <div className="ml-3">
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-gray-500">
                        {level.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Goal */}
              <label className="block font-medium mb-2">Primary Goal</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    value: "weight-loss",
                    label: "Weight Loss",
                    desc: "Lose weight healthily",
                  },
                  {
                    value: "weight-gain",
                    label: "Weight Gain",
                    desc: "Gain weight safely",
                  },
                  {
                    value: "muscle-gain",
                    label: "Muscle Gain",
                    desc: "Build lean muscle",
                  },
                ].map((goal) => (
                  <label
                    key={goal.value}
                    className="flex flex-col items-center p-6 border rounded-xl cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="goal"
                      value={goal.value}
                      checked={formData.goal === goal.value}
                      onChange={(e) =>
                        setFormData({ ...formData, goal: e.target.value })
                      }
                      className="mb-2"
                    />
                    <div className="text-center">
                      <div className="font-medium">{goal.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {goal.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 — DIETARY */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-center text-3xl font-bold mb-8">
                Dietary Preferences
              </h2>

              {/* Dietary Restrictions */}
              <label className="block font-medium mb-3">
                Dietary Restrictions
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DIETARY_RESTRICTIONS.map((item) => (
                  <label
                    key={item}
                    className="flex items-center p-3 border rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.dietaryRestrictions.includes(item)}
                      onChange={() =>
                        handleCheckboxChange(item, "dietaryRestrictions")
                      }
                    />
                    <span className="ml-2 text-sm">{item}</span>
                  </label>
                ))}
              </div>

              {/* Allergies */}
              <label className="block font-medium mb-3">Allergies</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {COMMON_ALLERGIES.map((item) => (
                  <label
                    key={item}
                    className="flex items-center p-3 border rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.allergies.includes(item)}
                      onChange={() =>
                        handleCheckboxChange(item, "allergies")
                      }
                    />
                    <span className="ml-2 text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons — Except Step 1 */}
          {currentStep !== 1 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={handlePrevious}
                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg"
              >
                {currentStep === totalSteps ? "Complete Setup" : "Next"}
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;