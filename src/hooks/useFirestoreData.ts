// Hooks para dados do Firestore com carregamento em tempo real
import { useState, useEffect } from 'react';
import {
    collection,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    DocumentData,
    QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Hook genérico para coleções
export function useFirestoreCollection<T>(
    collectionPath: string,
    constraints: QueryConstraint[] = [],
    enabled: boolean = true
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled || !collectionPath) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const collectionRef = collection(db, collectionPath);
        const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

        // Listener em tempo real - sincroniza automaticamente
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const items: T[] = [];
                snapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() } as T);
                });
                setData(items);
                setLoading(false);
                setError(null);
                console.log(`✅ [Firestore] ${collectionPath}: ${items.length} items`);
            },
            (err) => {
                console.error(`❌ [Firestore] Erro em ${collectionPath}:`, err);
                setError(err);
                setLoading(false);
            }
        );

        // Cleanup: remover listener quando componente desmontar
        return () => unsubscribe();
    }, [collectionPath, enabled, JSON.stringify(constraints)]);

    return { data, loading, error };
}

// Hook para documento único
export function useFirestoreDoc<T>(
    docPath: string,
    enabled: boolean = true
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled || !docPath) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const docRef = doc(db, docPath);

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setData({ id: snapshot.id, ...snapshot.data() } as T);
                } else {
                    setData(null);
                }
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error(`❌ [Firestore] Erro em ${docPath}:`, err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [docPath, enabled]);

    return { data, loading, error };
}

// Hooks específicos para dados do painel do dono
export function useProfissionais(barbeariaId: string | null) {
    const path = barbeariaId ? `barbearias/${barbeariaId}/profissionais` : '';
    return useFirestoreCollection(path, [], !!barbeariaId);
}

export function useClientes(barbeariaId: string | null) {
    const path = barbeariaId ? `barbearias/${barbeariaId}/clientes` : '';
    return useFirestoreCollection(path, [], !!barbeariaId);
}

export function useServicos(barbeariaId: string | null) {
    const path = barbeariaId ? `barbearias/${barbeariaId}/servicos` : '';
    return useFirestoreCollection(path, [], !!barbeariaId);
}

export function useAgendamentos(barbeariaId: string | null) {
    const path = barbeariaId ? `barbearias/${barbeariaId}/agendamentos` : '';
    return useFirestoreCollection(path, [orderBy('data', 'desc')], !!barbeariaId);
}

export function useProdutos(barbeariaId: string | null) {
    const path = barbeariaId ? `barbearias/${barbeariaId}/produtos` : '';
    return useFirestoreCollection(path, [], !!barbeariaId);
}

export function usePromocoes(barbeariaId: string | null) {
    const path = barbeariaId ? `barbearias/${barbeariaId}/promocoes` : '';
    return useFirestoreCollection(path, [], !!barbeariaId);
}

export function useNotificacoes(barbeariaId: string | null) {
    const path = barbeariaId ? `barbearias/${barbeariaId}/notificacoes` : '';
    return useFirestoreCollection(path, [orderBy('data', 'desc')], !!barbeariaId);
}

export function useConfiguracaoBarbearia(barbeariaId: string | null) {
    const path = barbeariaId ? `barbearias/${barbeariaId}` : '';
    return useFirestoreDoc(path, !!barbeariaId);
}
