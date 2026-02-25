import { initializeApp, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWi3C5JbKsfb1iMI6tMy1GFlrL4gi4MdI",
  authDomain: "healthygo-ef2ac.firebaseapp.com",
  projectId: "healthygo-ef2ac",
  storageBucket: "healthygo-ef2ac.appspot.com",
  messagingSenderId: "1015467739577",
  appId: "1:1015467739577:web:981f9e8d2da9e16a000e68",
};

// Initialize Firebase
let app: FirebaseApp;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
