/**
 * CodeAtlas Client-Side Firebase Integration
 *
 * Provides Firebase App, Authentication, App Check with reCAPTCHA v3 & debug token support,
 * and Firebase AI Logic (Gemini Developer API via GoogleAIBackend).
 *
 * Safe for static prerendering / SSR: never calls browser APIs or initializeApp at top level.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";
import { getAI, GoogleAIBackend, getGenerativeModel, type AI, type GenerativeModel } from "firebase/ai";

export const isFirebaseConfigured: boolean = Boolean(
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
);

// Firebase AI Logic recommended flash model constant (Gemini Developer API backend)
export const AI_MODEL = process.env.NEXT_PUBLIC_FIREBASE_AI_MODEL || "gemini-1.5-flash";

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedAppCheck: AppCheck | null = null;
let cachedAI: AI | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Lazily returns or creates the FirebaseApp instance only in client browser context.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebaseConfigured) {
    return null;
  }
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return cachedApp;
}

/**
 * Lazily returns the Auth instance only in client browser context.
 */
export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined" || !isFirebaseConfigured) {
    return null;
  }
  if (!cachedAuth) {
    const app = getFirebaseApp();
    if (app) {
      cachedAuth = getAuth(app);
    }
  }
  return cachedAuth;
}

/**
 * Lazily returns the App Check instance.
 * On localhost, automatically sets self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
 * and prints a console reminder to register the debug token in Firebase Console.
 */
export function getFirebaseAppCheck(): AppCheck | null {
  if (typeof window === "undefined" || !isFirebaseConfigured) {
    return null;
  }
  if (!cachedAppCheck) {
    const app = getFirebaseApp();
    if (!app) return null;

    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local");

    if (isLocalhost) {
      // In local development, enable the debug token provider for App Check
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      console.info(
        "🔑 [CodeAtlas App Check] Local development detected: FIREBASE_APPCHECK_DEBUG_TOKEN set to true.\n" +
        "Firebase will output a debug token in this console. To authorize local requests to Gemini, copy the debug token into Firebase Console -> App Check -> Apps -> Manage debug tokens."
      );
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (siteKey || isLocalhost) {
      try {
        cachedAppCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey || "6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-"),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn("[CodeAtlas] App Check initialization warning:", err);
      }
    }
  }
  return cachedAppCheck;
}

/**
 * Lazily returns the Firebase AI Logic instance (Gemini Developer API backend).
 */
export function getFirebaseAI(): AI | null {
  if (typeof window === "undefined" || !isFirebaseConfigured) {
    return null;
  }
  if (!cachedAI) {
    const app = getFirebaseApp();
    if (!app) return null;

    // Ensure App Check is configured before calling AI
    getFirebaseAppCheck();

    try {
      cachedAI = getAI(app, {
        backend: new GoogleAIBackend(),
      });
    } catch (err) {
      console.error("[CodeAtlas] Failed to initialize Firebase AI Logic:", err);
      return null;
    }
  }
  return cachedAI;
}

/**
 * Returns a configured Gemini GenerativeModel with optional system instructions.
 */
export function getCodeAtlasModel(systemInstruction?: string): GenerativeModel | null {
  const ai = getFirebaseAI();
  if (!ai) return null;

  try {
    return getGenerativeModel(ai, {
      model: AI_MODEL,
      systemInstruction: systemInstruction ? { role: "system", parts: [{ text: systemInstruction }] } : undefined,
    });
  } catch (err) {
    console.error("[CodeAtlas] Failed to create GenerativeModel:", err);
    return null;
  }
}
