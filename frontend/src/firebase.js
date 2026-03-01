// Firebase configuration for MindSaathi
// Requires: npm install firebase
// Values loaded from frontend/.env (VITE_ prefix required for Vite)

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;
let db = null;

// Only initialize if Firebase config is present
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("your_");

if (hasConfig) {
  try {
    app  = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db   = getFirestore(app);
  } catch (e) {
    console.warn("Firebase init failed:", e.message);
  }
}

export { auth, db };
export default app;


