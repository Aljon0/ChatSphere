import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClHMkGYv8amm-LKGx_nIzLen0E3-yz7Yw",
  authDomain: "chat-web-app-1c91d.firebaseapp.com",
  projectId: "chat-web-app-1c91d",
  storageBucket: "chat-web-app-1c91d.firebasestorage.app",
  messagingSenderId: "130553709067",
  appId: "1:130553709067:web:305a3373333177dd533d0e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export {
  auth, createUserWithEmailAndPassword, db, googleProvider, signInWithEmailAndPassword, signInWithPopup
};

