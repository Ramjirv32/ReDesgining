import { initializeApp, getApps } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = (firebaseConfig.apiKey && getApps().length === 0)
    ? initializeApp(firebaseConfig)
    : (getApps().length > 0 ? getApps()[0] : undefined);

const auth = app ? getAuth(app) : undefined;
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
