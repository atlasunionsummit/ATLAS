import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAseJWjdl-_264T6RlZjVsqRtP-71l6z-M",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "atlasunionsummit-9ac21.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "atlasunionsummit-9ac21",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "atlasunionsummit-9ac21.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "286476979504",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:286476979504:web:7588da332bfe13a16c4cf5",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-TJRRN7X0KZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
