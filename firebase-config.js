// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAz1MQbUJXDCSgDNs4NeWJ9wce7d2ympmk",
  authDomain: "mywebsite-586eb.firebaseapp.com",
  projectId: "mywebsite-586eb",
  storageBucket: "mywebsite-586eb.firebasestorage.app",
  messagingSenderId: "171540968393",
  appId: "1:171540968393:web:e44dc560ace2702c24ae18"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
