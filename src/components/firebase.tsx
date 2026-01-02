// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Ganti dengan config Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyBWi3C5JbKsfb1iMI6tMy1GFlrL4gi4MdI",
  authDomain: "healthygo-ef2ac.firebaseapp.com",
  projectId: "healthygo-ef2ac",
  storageBucket: "healthygo-ef2ac.firebasestorage.app",
  messagingSenderId: "1015467739577",
  appId: "1:1015467739577:web:981f9e8d2da9e16a000e68"
};

// Inisialisasi aplikasi
const app = initializeApp(firebaseConfig);

// Export Auth supaya bisa digunakan di mana saja
export const auth = getAuth(app);
