// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBWi3C5JbKsfb1iMI6tMy1GFlrL4gi4MdI",
  authDomain: "healthygo-ef2ac.firebaseapp.com",
  databaseURL:
    "https://healthygo-ef2ac-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "healthygo-ef2ac",
  storageBucket: "healthygo-ef2ac.appspot.com",
  messagingSenderId: "1015467739577",
  appId: "1:1015467739577:web:981f9e8d2da9e16a000e68",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
