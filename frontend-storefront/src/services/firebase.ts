import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBWq3bq_y6iH-L1G5o1WpP47r40EcBkb7Q",
  authDomain: "amazingdeal-prod-2026-a1b2c.firebaseapp.com",
  projectId: "amazingdeal-prod-2026-a1b2c",
  storageBucket: "amazingdeal-prod-2026-a1b2c.firebasestorage.app",
  messagingSenderId: "586928319675",
  appId: "1:586928319675:web:a425c1e25a3b281cedcd9e"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
