/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

// Environment variables with fallback to provisioned configuration
const env = (import.meta as any).env || {};

export const PRIMARY_STORAGE_BUCKET =
  env.VITE_FIREBASE_STORAGE_BUCKET || 'artisan-pro-afrique-ci.firebasestorage.app';
export const SECONDARY_STORAGE_BUCKET = 'artisan-pro-afrique-ci.appspot.com';
export const FALLBACK_STORAGE_BUCKET = 'zany-set-7pthm.firebasestorage.app';

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCKVSDTRXZX6sAdj4elWkgOmMs3HXPM9fI',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'artisan-pro-afrique-ci.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'artisan-pro-afrique-ci',
  storageBucket: PRIMARY_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '619560392554',
  appId: env.VITE_FIREBASE_APP_ID || '1:619560392554:web:204ed6f66eaad34089b713',
};

export const FIRESTORE_DATABASE_ID =
  env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  'ai-studio-artisanpro-c5a582c3-2249-48a1-a497-7690f920f24b';

// Initialize Firebase App
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with the provisioned database ID
export const firestore: Firestore = getFirestore(app, FIRESTORE_DATABASE_ID);

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

export default firestore;
