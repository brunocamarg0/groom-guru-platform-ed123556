// Firebase Configuration
// Configuração do Firebase para o Groom Guru Platform

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Configuração do Firebase (substitua pelos valores do seu projeto)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase apenas uma vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializar Firestore
export const db = getFirestore(app);

// Habilitar persistência offline para carregamento instantâneo
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('⚠️ Firebase: Persistência não disponível (múltiplas abas abertas)');
        } else if (err.code === 'unimplemented') {
            console.warn('⚠️ Firebase: Navegador não suporta persistência offline');
        }
    });
}

export default app;
