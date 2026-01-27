// Firebase Configuration
// Configuração do Firebase para o Groom Guru Platform

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Configuração do Firebase (substitua pelos valores do seu projeto)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validar se as variáveis de ambiente estão definidas
if (!firebaseConfig.projectId) {
    console.warn('⚠️ [FIREBASE] VITE_FIREBASE_PROJECT_ID não está definido. Firebase pode não funcionar corretamente.');
}

// Inicializar Firebase apenas uma vez e apenas se tiver configuração válida
let app;
if (firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} else {
    console.warn('⚠️ [FIREBASE] Firebase não inicializado - projectId ausente');
    // Criar um objeto mock para evitar erros
    app = null as any;
}

// Inicializar Firestore apenas se o app foi inicializado
let db;
if (app && firebaseConfig.projectId) {
    try {
        db = getFirestore(app);
        
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
    } catch (error) {
        console.error('❌ [FIREBASE] Erro ao inicializar Firestore:', error);
        db = null as any;
    }
} else {
    console.warn('⚠️ [FIREBASE] Firestore não inicializado - app ou projectId ausente');
    db = null as any;
}

export { db };

export default app;
