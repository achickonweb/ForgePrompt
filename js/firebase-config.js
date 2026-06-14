// Firebase version 10 - Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDrdkJaqpP0Z83yPEPljxJcgR8SUkRVL8w",
    authDomain: "forgeprompt-92b38.firebaseapp.com",
    projectId: "forgeprompt-92b38",
    storageBucket: "forgeprompt-92b38.firebasestorage.app",
    messagingSenderId: "837456280960",
    appId: "1:837456280960:web:1cc2b5511b33a0dbedd565",
    measurementId: "G-P804TH4RRE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
