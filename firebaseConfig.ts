import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAATZ3oaPbNW2ZDgbuHHUJbGA4cIYzI-Lk",
  authDomain: "earnbot-f03ed.firebaseapp.com",
  databaseURL: "https://earnbot-f03ed-default-rtdb.firebaseio.com",
  projectId: "earnbot-f03ed",
  storageBucket: "earnbot-f03ed.firebasestorage.app",
  messagingSenderId: "652016621781",
  appId: "1:652016621781:web:3b3a2cd2dcad958e4cea5c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Admin Access Control
export const ADMIN_UIDS = ["BTzrEG0DYEbnqyGdYqZTry0DnTI3"];