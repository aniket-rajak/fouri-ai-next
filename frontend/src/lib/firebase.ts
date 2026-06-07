import { initializeApp, getApps } from "firebase/app";
import {
  getAuth as getFirebaseAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getFirebaseApp() {
  if (typeof window === "undefined") return null;
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey) return null;
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export async function getAuth() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getFirebaseAuth(app);
}

export async function getGoogleProvider() {
  return new GoogleAuthProvider();
}

export async function signInWithGoogle() {
  const auth = await getAuth();
  const provider = await getGoogleProvider();
  if (!auth) throw new Error("Firebase not initialized");
  return signInWithPopup(auth, provider);
}

export async function signInWithEmail(email: string, password: string) {
  const auth = await getAuth();
  if (!auth) throw new Error("Firebase not initialized");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  const auth = await getAuth();
  if (!auth) throw new Error("Firebase not initialized");
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email: string) {
  const auth = await getAuth();
  if (!auth) throw new Error("Firebase not initialized");
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  const auth = await getAuth();
  if (!auth) return;
  return signOut(auth);
}

export async function getCurrentUser() {
  const auth = await getAuth();
  if (!auth) return null;
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
