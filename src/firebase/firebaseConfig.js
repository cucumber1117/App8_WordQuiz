// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAT7OWGrYQahgT-yLdx-yQAvPtqZFboFO8",
  authDomain: "app8wordquiz.firebaseapp.com",
  projectId: "app8wordquiz",
  storageBucket: "app8wordquiz.firebasestorage.app",
  messagingSenderId: "339831864498",
  appId: "1:339831864498:web:8f1685667ad10a95415dab",
  measurementId: "G-LR4PVV1E1S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);