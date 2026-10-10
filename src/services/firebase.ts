import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';

const REQUIRED_CONFIG_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export function getMissingFirebaseConfig(): string[] {
  return REQUIRED_CONFIG_KEYS.filter((key) => {
    const val = import.meta.env[key];
    return !val || typeof val !== 'string' || val.trim().length === 0;
  });
}

export const missingFirebaseConfigKeys: string[] = getMissingFirebaseConfig();
export const isFirebaseConfigValid: boolean = missingFirebaseConfigKeys.length === 0;

if (!isFirebaseConfigValid) {
  console.error(
    `[Daylee] Firebase configuration is incomplete. Missing environment variable(s): ${missingFirebaseConfigKeys.join(
      ', '
    )}. Please configure these in your deployment or .env file.`
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Singleton Firebase initialization
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

// Configure Firestore with ignoreUndefinedProperties to safeguard against undefined task fields (e.g. repeatRule)
export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
  } catch {
    return getFirestore(app);
  }
})();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function assertFirebaseConfigured(): void {
  if (!isFirebaseConfigValid) {
    throw new Error(
      `Daylee is not connected to Firebase: missing environment variable(s) [${missingFirebaseConfigKeys.join(
        ', '
      )}]. Please verify your Vercel or local environment configuration.`
    );
  }
}

/**
 * Sign in using Google OAuth popup via Firebase Authentication
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  assertFirebaseConfigured();
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in using verified Email and Password via Firebase Authentication
 */
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  assertFirebaseConfigured();
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

/**
 * Register a new user account with Email and Password via Firebase Authentication
 */
export async function registerWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<FirebaseUser> {
  assertFirebaseConfigured();
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name && name.trim()) {
    try {
      await updateProfile(result.user, { displayName: name.trim() });
    } catch (e) {
      console.warn('Could not update profile name', e);
    }
  }
  return result.user;
}

/**
 * Sign out the currently authenticated user from Firebase
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to authoritative Firebase Authentication state changes
 */
export function onAuthStatusChanged(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
