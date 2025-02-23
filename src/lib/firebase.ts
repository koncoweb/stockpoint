import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDxw5Zr9PDj9b0gY8SkWMn6y2PJu601Hek",
  authDomain: "stockpoint-pro.firebaseapp.com",
  projectId: "stockpoint-pro",
  storageBucket: "stockpoint-pro.firebasestorage.app",
  messagingSenderId: "43986157653",
  appId: "1:43986157653:web:11053f1d6c0e5eeb7154dc"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
