// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBEXNRRK71mbv_YqtfwZXI0o9ecz6pM1qw",
    authDomain: "staffsync-pro-40ebs.firebaseapp.com",
    projectId: "staffsync-pro-40ebs",
    storageBucket: "staffsync-pro-40ebs.firebasestorage.app",
    messagingSenderId: "594343078193",
    appId: "1:594343078193:web:e20298fe2f9833ef892810"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a time.
      console.warn('Firestore persistence failed: failed-precondition. Multiple tabs open?');
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn('Firestore persistence failed: unimplemented. Browser not supported.');
    }
  });


export { app, auth, db };
