import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase configuration for Midnight Dough
const firebaseConfig = {
  apiKey: "AIzaSyAk5HUbSEofUEY_GCqRmovaeUL4Rmlxd8A",
  authDomain: "midnightdough-3320c.firebaseapp.com",
  projectId: "midnightdough-3320c",
  storageBucket: "midnightdough-3320c.firebasestorage.app",
  messagingSenderId: "1031829271168",
  appId: "1:1031829271168:web:557b0c999bd70518252c65"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

