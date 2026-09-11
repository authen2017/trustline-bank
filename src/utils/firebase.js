import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDJRQa8G_QEZzbwCyV-zdgTPL_sZpJoJvA",
  authDomain: "trustline-bank.firebaseapp.com",
  projectId: "trustline-bank",
  storageBucket: "trustline-bank.firebasestorage.app",
  messagingSenderId: "516070769017",
  appId: "1:516070769017:web:21ce0841ab556ac7e26fa8",
  measurementId: "G-GFF0YX1JVR"
};

const app = initializeApp(firebaseConfig);

// Some networks (mobile hotspots, certain ISPs/routers, school/work firewalls)
// block Firestore's default streaming connection, causing "client is offline"
// errors even when the internet works fine otherwise. Long-polling avoids this.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);