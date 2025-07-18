import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBc3t_1R8xqdCDWrG0v9bUov2CSLgYQBq0",
  authDomain: "a1lifter.firebaseapp.com",
  projectId: "a1lifter",
  storageBucket: "a1lifter.firebasestorage.app",
  messagingSenderId: "170087597581",
  appId: "1:170087597581:web:4f5751fc2a3b7b86ccb744",
  measurementId: "G-6X66YYBF0R"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;