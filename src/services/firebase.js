// Firebase configuration and initialization
// To use Firebase:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (e.g., "govprep-ai")
// 3. Enable Authentication > Email/Password sign-in
// 4. Enable Firestore Database
// 5. Copy your config values into .env file

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Only initialize if config is present
let app = null;
let auth = null;
let db = null;

const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export const firebaseService = {
  isConfigured() {
    return isFirebaseConfigured;
  },

  // ========== AUTH ==========

  async register(email, password, displayName) {
    if (!auth) throw new Error('Firebase not configured');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    // Create user doc in Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName,
      email,
      createdAt: new Date().toISOString(),
      testHistory: [],
      streakInfo: { count: 0, lastDate: null },
      studiedTopics: [],
      targetExam: 'BCI'
    });
    return cred.user;
  },

  async login(email, password) {
    if (!auth) throw new Error('Firebase not configured');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async logout() {
    if (!auth) return;
    await signOut(auth);
  },

  getCurrentUser() {
    if (!auth) return null;
    return auth.currentUser;
  },

  onAuthChange(callback) {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  },

  // ========== FIRESTORE USER DATA ==========

  async getUserData() {
    const user = this.getCurrentUser();
    if (!user || !db) return null;
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.exists() ? snap.data() : null;
  },

  async saveTestResult(testResult) {
    const user = this.getCurrentUser();
    if (!user || !db) return;
    const record = {
      id: testResult.id || 'test_' + Date.now(),
      date: new Date().toISOString(),
      ...testResult
    };
    await updateDoc(doc(db, 'users', user.uid), {
      testHistory: arrayUnion(record)
    });
    await this.updateStreak();
    return record;
  },

  async updateStreak() {
    const user = this.getCurrentUser();
    if (!user || !db) return;
    const data = await this.getUserData();
    if (!data) return;

    const info = data.streakInfo || { count: 0, lastDate: null };
    const today = new Date().toDateString();
    
    if (!info.lastDate) {
      info.count = 1;
      info.lastDate = today;
    } else {
      const last = new Date(info.lastDate).toDateString();
      if (last !== today) {
        const diffTime = Math.abs(new Date(today) - new Date(last));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        info.count = diffDays === 1 ? info.count + 1 : 1;
        info.lastDate = today;
      }
    }

    await updateDoc(doc(db, 'users', user.uid), { streakInfo: info });
  },

  async markTopicStudied(topic) {
    const user = this.getCurrentUser();
    if (!user || !db || !topic) return;
    await updateDoc(doc(db, 'users', user.uid), {
      studiedTopics: arrayUnion(topic)
    });
  },

  async getStudiedTopics() {
    const data = await this.getUserData();
    return data?.studiedTopics || [];
  },

  async getTestHistory() {
    const data = await this.getUserData();
    return data?.testHistory || [];
  },

  async getStreakInfo() {
    const data = await this.getUserData();
    return data?.streakInfo || { count: 0, lastDate: null };
  }
};
