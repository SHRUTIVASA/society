import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { setPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAen7xDVXYyo0JhHD73zTVl4J03t_CzhPI",
  authDomain: "yeshkrupasociety.firebaseapp.com",
  projectId: "yeshkrupasociety",
  storageBucket: "yeshkrupasociety.firebasestorage.app",
  messagingSenderId: "301607352245",
  appId: "1:301607352245:web:1faf5f067af7992ca68bfc",
  measurementId: "G-CKHC3WKV1T"
};

const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const auth = getAuth(app);
export const db = getFirestore(app);
const firestore = getFirestore(app);

setPersistence(auth, browserSessionPersistence);

export { auth };
export { firestore };