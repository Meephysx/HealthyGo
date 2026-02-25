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
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getUserProfile } from "../services/firestore";
// Firebase auth
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  ConfirmationResult,
} from "firebase/auth";
import authService from "../services/authService";

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
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const totalSteps = 4;

  // ==== LOGIN (REFACTORED) ====
  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError("");
    try {
      // 1. Sign in the user
      const userCred = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      const user = userCred.user;

      // 2. Check if email is verified
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setLoginError("Email belum terverifikasi. Silakan cek email Anda dan verifikasi.");
        setIsLoading(false);
        return;
      }

      // 3. Fetch user profile from Firestore
      const userProfile = await getUserProfile(user.uid);

      // 4. Check if profile exists
      if (!userProfile) {
        console.warn(`User ${user.uid} authenticated but no profile found in Firestore.`);
        setLoginError("Your profile is not complete. Please complete the registration steps.");
        
        setFormData(prev => ({ ...prev, name: user.displayName || '', email: user.email || '' }));
        setIsRegister(true);
        setCurrentStep(2);
        setIsLoading(false);
        return;
      }
      
      localStorage.setItem("user", JSON.stringify(userProfile));
      navigate("/dashboard");

    } catch (err: any) {
      console.error("Login Error:", err);
      let friendlyMessage = "An unknown error occurred.";
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          friendlyMessage = "Invalid email or password. Please try again.";
          break;
        case "auth/too-many-requests":
          friendlyMessage = "Too many attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          friendlyMessage = "Network error. Please check your connection.";
          break;
      }
      setLoginError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ==== REGISTER ====
  const handleRegister = async () => {
    if (!formData.name.trim()) {
      setLoginError("Full Name is required for registration.");
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );

      const user = userCred.user;
      await updateProfile(user, { displayName: formData.name });
      await sendEmailVerification(user);

      const initialData = {
        uid: user.uid,
        fullname: formData.name,
        name: formData.name,
        email: user.email,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), initialData);
      localStorage.setItem("user", JSON.stringify(initialData));

      setLoginError("Email verifikasi telah dikirim. Silakan cek inbox Anda sebelum login.");
      setIsRegister(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (err: any) {
      console.error("Register Error:", err);
      let friendlyMessage = "Registration failed.";
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "This email is already registered. Please login instead.";
      }
      setLoginError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ==== SOCIAL LOGIN HANDLERS ====
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setLoginError("");
    try {
      const user = await authService.loginWithGoogle();
      const userProfile = await getUserProfile(user.uid);
      if (!userProfile) {
        const newProfile = {
          uid: user.uid,
          fullname: user.displayName || "",
          name: user.displayName || "",
          email: user.email,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.uid), newProfile);
        localStorage.setItem("user", JSON.stringify(newProfile));
      } else {
        localStorage.setItem("user", JSON.stringify(userProfile));
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setLoginError("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setLoginError("");
    try {
      const user = await authService.loginWithFacebook();
      const userProfile = await getUserProfile(user.uid);
      if (!userProfile) {
        const newProfile = {
          uid: user.uid,
          fullname: user.displayName || "",
          name: user.displayName || "",
          email: user.email,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.uid), newProfile);
        localStorage.setItem("user", JSON.stringify(newProfile));
      } else {
        localStorage.setItem("user", JSON.stringify(userProfile));
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Facebook Login Error:", err);
      setLoginError("Facebook login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setIsLoading(true);
    setLoginError("");
    try {
      const result = await authService.signInWithPhone(phoneNumber);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error("Send OTP Error:", err);
      setLoginError("Gagal mengirim OTP. Pastikan nomor telepon benar (format: +62...)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOTP = async () => {
    if (!confirmationResult) return;
    setIsLoading(true);
    setLoginError("");
    try {
      const user = await authService.confirmPhone(confirmationResult, otp);
      const userProfile = await getUserProfile(user.uid);
      if (!userProfile) {
        const newProfile = {
          uid: user.uid,
          fullname: user.displayName || "",
          name: user.displayName || "",
          phone: user.phoneNumber,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.uid), newProfile);
        localStorage.setItem("user", JSON.stringify(newProfile));
      } else {
        localStorage.setItem("user", JSON.stringify(userProfile));
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Confirm OTP Error:", err);
      setLoginError("OTP salah atau kadaluarsa. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==== FINAL SUBMIT ====
  const handleComplete = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoginError("You are not logged in. Please go back to the login step.");
      setCurrentStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const age = parseInt(formData.age) || 0;
      const height = parseInt(formData.height) || 0;
      const weight = parseInt(formData.weight) || 0;

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

      const payload = {
        age,
        gender: formData.gender,
        height,
        weight,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        dietaryRestrictions: formData.dietaryRestrictions,
        allergies: formData.allergies,
        bmi,
        idealWeight,
        dailyCalories,
        updatedAt: new Date().toISOString(),
        profileCompleted: true
      };

      await setDoc(doc(db, "users", user.uid), payload, { merge: true });

      const currentUserLocal = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...currentUserLocal,
        ...payload
      }));
      
      navigate("/dashboard");

    } catch (err: any) {
      console.error("HandleComplete Error:", err);
      setLoginError("Failed to save profile data. Please try again.");
    } finally {
      setIsLoading(false);
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

              {/* Email & Password Form */}
              <div className="space-y-4">
                {isRegister && (
                  <div>
                    <label className="block font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-400"
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
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                    placeholder="Enter your password"
                  />
                </div>

                {loginError && (
                  <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{loginError}</p>
                )}

                <button
                  onClick={isRegister ? handleRegister : handleLogin}
                  disabled={isLoading}
                  className="w-full px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg text-white font-semibold disabled:opacity-50 hover:shadow-lg transition"
                >
                  {isLoading ? "Processing..." : (isRegister ? "Register" : "Login")}
                </button>

                <p className="text-center text-sm mt-4">
                  {isRegister ? (
                    <>
                      Already have an account?{" "}
                      <span
                        className="text-green-600 cursor-pointer font-semibold hover:underline"
                        onClick={() => {
                          setIsRegister(false);
                          setLoginError("");
                          setLoginEmail("");
                          setLoginPassword("");
                        }}
                      >
                        Login
                      </span>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <span
                        className="text-green-600 cursor-pointer font-semibold hover:underline"
                        onClick={() => {
                          setIsRegister(true);
                          setLoginError("");
                        }}
                      >
                        Register
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-gray-300" />
                <div className="px-4 text-sm text-gray-500 font-medium">OR</div>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition font-medium"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21.35 11.1h-9.18v2.8h5.36c-.23 1.4-1.6 4.1-5.36 4.1-3.22 0-5.85-2.66-5.85-5.95 0-3.29 2.63-5.95 5.85-5.95 1.84 0 3.06.79 3.76 1.46l2.56-2.47C17.57 3.4 15.6 2.5 12.17 2.5 6.84 2.5 2.5 6.86 2.5 12.18 2.5 17.51 6.84 21.86 12.17 21.86c6 0 9.9-4.2 9.9-10.18 0-.68-.07-1.2-.72-1.58z" fill="#4285F4"/>
                  </svg>
                  Login with Google
                </button>

                <button
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition font-medium"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07c0 4.9 3.66 8.96 8.44 9.82v-6.94H8.08V12.1h2.36V9.79c0-2.33 1.38-3.61 3.49-3.61.99 0 2.03.18 2.03.18v2.23h-1.14c-1.12 0-1.47.7-1.47 1.41v1.7h2.5l-.4 2.85h-2.1v6.94C18.34 21.03 22 16.97 22 12.07z" fill="#1877F2"/>
                  </svg>
                  Login with Facebook
                </button>
              </div>

              {/* Phone OTP */}
              <div className="border-t pt-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Login dengan Nomor Telepon</p>
                
                {!confirmationResult ? (
                  <div className="space-y-3">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+62 812 3456 7890"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                    />
                    <button
                      onClick={handleSendOTP}
                      disabled={isLoading || !phoneNumber}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition"
                    >
                      {isLoading ? "Mengirim..." : "Kirim OTP"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Kode OTP telah dikirim ke {phoneNumber}</p>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Masukkan 6 digit OTP"
                      maxLength={6}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-400 text-center text-xl font-mono"
                    />
                    <button
                      onClick={handleConfirmOTP}
                      disabled={isLoading || otp.length !== 6}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition"
                    >
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmationResult(null);
                        setOtp("");
                        setPhoneNumber("");
                      }}
                      className="w-full px-4 py-3 text-gray-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div id="recaptcha-container" className="flex justify-center" />
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
                disabled={!isStepValid() || isLoading}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Saving..." : (currentStep === totalSteps ? "Complete Setup" : "Next")}
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
