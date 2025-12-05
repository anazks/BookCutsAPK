// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDQZPSbfcHZeOpS11mUZlhxQk3hF1lG1c",
  authDomain: "bookmycuts-b4c1d.firebaseapp.com",
  projectId: "bookmycuts-b4c1d",
  storageBucket: "bookmycuts-b4c1d.firebasestorage.app",
  messagingSenderId: "446940837987",
  appId: "1:446940837987:web:92a39b432e2fb226ff2056",
  measurementId: "G-P717CQXKLJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);