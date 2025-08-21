import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// La configurazione che Firebase ti ha fornito
const firebaseConfig = {
  apiKey: "AIzaSyDUjfn1XvSq5A4lDoBat8qss3BeLzci0v0",
  authDomain: "costycalendar.firebaseapp.com",
  projectId: "costycalendar",
  storageBucket: "costycalendar.firebasestorage.app",
  messagingSenderId: "83263745145",
  appId: "1:83263745145:web:e9433a003431f3855838a8"
  // measurementId opzionale, serve solo per Analytics
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // se vuoi usare autenticazione
export const db = getFirestore(app); // Firestore database
