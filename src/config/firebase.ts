
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAf3ak-5S-1ZhSGxKfPiMy2or-83dNFB5c",
  authDomain: "study-ai-12fcd.firebaseapp.com",
  projectId: "study-ai-12fcd",
  storageBucket: "study-ai-12fcd.firebasestorage.app",
  messagingSenderId: "747684597937",
  appId: "1:747684597937:web:9b815b9b649fdb1c751290",
  measurementId: "G-RGLEE1R25B"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
