import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithRedirect,
} from "firebase/auth";

// Prefer environment variables (Vite requires VITE_ prefix)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Avoid double init during HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function mapError(code) {
  if (!code) return "Authentication failed.";
  if (code.includes("invalid-api-key")) return "Invalid Firebase API key.";
  if (code.includes("unauthorized-domain")) return "Domain not authorized in Firebase Authentication settings.";
  if (code.includes("operation-not-allowed")) return "Provider not enabled in Firebase console.";
  if (code.includes("popup-blocked")) return "Popup was blocked. Enable popups for this site.";
  if (code.includes("popup-closed-by-user")) return "Popup closed before completing sign in.";
  if (code.includes("email-already-in-use")) return "Email already in use.";
  if (code.includes("weak-password")) return "Password too weak.";
  if (code.includes("wrong-password") || code.includes("user-not-found")) return "Invalid email or password.";
  return "Authentication failed.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("app_user_v1")) || null; } catch { return null; }
  });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const u = {
          uid: fbUser.uid,
          name: fbUser.displayName || null,
          email: fbUser.email || null,
          photoURL: fbUser.photoURL || null,
        };
        setUser(u);
        try { localStorage.setItem("app_user_v1", JSON.stringify(u)); } catch {}
      } else {
        setUser(null);
        try { localStorage.removeItem("app_user_v1"); } catch {}
      }
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  async function signinWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      // Fallback for COOP / popup issues
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/popup-closed-by-user"
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      console.error("Google sign-in error:", err.code, err);
      throw new Error(mapError(err.code));
    }
  }

  async function signinWithEmail(email, password) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (err) {
      console.error("Email sign-in error:", err.code, err);
      throw new Error(mapError(err.code));
    }
  }

  async function signupWithEmail(email, password) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (err) {
      console.error("Signup error:", err.code, err);
      throw new Error(mapError(err.code));
    }
  }

  async function sendResetEmail(email) {
    return sendPasswordResetEmail(auth, email).catch((err) => {
      console.error("Reset error:", err.code, err);
      throw new Error(mapError(err.code));
    });
  }

  async function signout() {
    await firebaseSignOut(auth);
    setUser(null);
    try { localStorage.removeItem("app_user_v1"); } catch {}
  }

  const value = {
    user,
    initializing,
    signinWithGoogle,
    signinWithEmail,
    signupWithEmail,
    sendResetEmail,
    signout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
