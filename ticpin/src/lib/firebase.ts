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
    apiKey: "AIzaSyB5kBbalHfhAVDmwMyuX56BDJ64nX-drA4",
    authDomain: "luxorstayhomes.firebaseapp.com",
    projectId: "luxorstayhomes",
    storageBucket: "luxorstayhomes.firebasestorage.app",
    messagingSenderId: "583547923942",
    appId: "1:583547923942:web:2a6190ea978452543cba27",
    measurementId: "G-JCER68LZ3B"
};

const app = (firebaseConfig.apiKey && getApps().length === 0)
    ? initializeApp(firebaseConfig)
    : (getApps().length > 0 ? getApps()[0] : undefined);

const auth = app ? getAuth(app) : undefined;
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
