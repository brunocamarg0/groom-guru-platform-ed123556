// Utilitários para escrever dados no Firestore
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    getDoc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Profissionais
export async function addProfissional(barbeariaId: string, data: any) {
    const ref = collection(db, `barbearias / ${barbeariaId}/profissionais`);
    const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Profissional criado:', docRef.id);
    return docRef.id;
}

export async function updateProfissional(barbeariaId: string, id: string, data: any) {
    const ref = doc(db, `barbearias/${barbeariaId}/profissionais`, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Profissional atualizado:', id);
}

export async function deleteProfissional(barbeariaId: string, id: string) {
    const ref = doc(db, `barbearias/${barbeariaId}/profissionais`, id);
    await deleteDoc(ref);
    console.log('✅ [Firestore] Profissional removido:', id);
}

// Clientes
export async function addCliente(barbeariaId: string, data: any) {
    const ref = collection(db, `barbearias/${barbeariaId}/clientes`);
    const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Cliente criado:', docRef.id);
    return docRef.id;
}

export async function updateCliente(barbeariaId: string, id: string, data: any) {
    const ref = doc(db, `barbearias/${barbeariaId}/clientes`, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Cliente atualizado:', id);
}

export async function deleteCliente(barbeariaId: string, id: string) {
    const ref = doc(db, `barbearias/${barbeariaId}/clientes`, id);
    await deleteDoc(ref);
    console.log('✅ [Firestore] Cliente removido:', id);
}

// Serviços
export async function addServico(barbeariaId: string, data: any) {
    const ref = collection(db, `barbearias/${barbeariaId}/servicos`);
    const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Serviço criado:', docRef.id);
    return docRef.id;
}

export async function updateServico(barbeariaId: string, id: string, data: any) {
    const ref = doc(db, `barbearias/${barbeariaId}/servicos`, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Serviço atualizado:', id);
}

export async function deleteServico(barbeariaId: string, id: string) {
    const ref = doc(db, `barbearias/${barbeariaId}/servicos`, id);
    await deleteDoc(ref);
    console.log('✅ [Firestore] Serviço removido:', id);
}

// Agendamentos
export async function addAgendamento(barbeariaId: string, data: any) {
    const ref = collection(db, `barbearias/${barbeariaId}/agendamentos`);
    const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Agendamento criado:', docRef.id);
    return docRef.id;
}

export async function updateAgendamento(barbeariaId: string, id: string, data: any) {
    const ref = doc(db, `barbearias/${barbeariaId}/agendamentos`, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Agendamento atualizado:', id);
}

export async function deleteAgendamento(barbeariaId: string, id: string) {
    const ref = doc(db, `barbearias/${barbeariaId}/agendamentos`, id);
    await deleteDoc(ref);
    console.log('✅ [Firestore] Agendamento removido:', id);
}

// Produtos
export async function addProduto(barbeariaId: string, data: any) {
    const ref = collection(db, `barbearias/${barbeariaId}/produtos`);
    const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Produto criado:', docRef.id);
    return docRef.id;
}

export async function updateProduto(barbeariaId: string, id: string, data: any) {
    const ref = doc(db, `barbearias/${barbeariaId}/produtos`, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Produto atualizado:', id);
}

export async function deleteProduto(barbeariaId: string, id: string) {
    const ref = doc(db, `barbearias/${barbeariaId}/produtos`, id);
    await deleteDoc(ref);
    console.log('✅ [Firestore] Produto removido:', id);
}

// Promoções
export async function addPromocao(barbeariaId: string, data: any) {
    const ref = collection(db, `barbearias/${barbeariaId}/promocoes`);
    const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Promoção criada:', docRef.id);
    return docRef.id;
}

export async function updatePromocao(barbeariaId: string, id: string, data: any) {
    const ref = doc(db, `barbearias/${barbeariaId}/promocoes`, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Promoção atualizada:', id);
}

export async function deletePromocao(barbeariaId: string, id: string) {
    const ref = doc(db, `barbearias/${barbeariaId}/promocoes`, id);
    await deleteDoc(ref);
    console.log('✅ [Firestore] Promoção removida:', id);
}

// Avaliações
export async function updateAvaliacao(barbeariaId: string, id: string, data: any) {
    const ref = doc(db, `barbearias/${barbeariaId}/avaliacoes`, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Avaliação atualizada:', id);
}

// Notificações
export async function addNotificacao(barbeariaId: string, data: any) {
    const ref = collection(db, `barbearias/${barbeariaId}/notificacoes`);
    const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Notificação criada:', docRef.id);
    return docRef.id;
}

export async function updateNotificacao(barbeariaId: string, id: string, data: any) {
    const ref = doc(db, `barbearias/${barbeariaId}/notificacoes`, id);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
    console.log('✅ [Firestore] Notificação atualizada:', id);
}

export async function deleteNotificacao(barbeariaId: string, id: string) {
    const ref = doc(db, `barbearias/${barbeariaId}/notificacoes`, id);
    await deleteDoc(ref);
    console.log('✅ [Firestore] Notificação removida:', id);
}

// Configuração da barbearia
export async function setBarbeariaConfig(barbeariaId: string, data: any) {
    const ref = doc(db, `barbearias/${barbeariaId}`);
    await setDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('✅ [Firestore] Configuração da barbearia atualizada');
}

export async function getMigrationStatus(barbeariaId: string) {
    const ref = doc(db, `barbearias/${barbeariaId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().migracaoconcluida : false;
}

// Migrar dados do PostgreSQL para Firestore (em lote)
export async function migrateBarbeariaData(
    barbeariaId: string,
    data: {
        profissionais?: any[];
        clientes?: any[];
        servicos?: any[];
        agendamentos?: any[];
        produtos?: any[];
        promocoes?: any[];
        notificacoes?: any[];
    }
) {
    const batch = writeBatch(db);

    // Migrar profissionais
    if (data.profissionais) {
        data.profissionais.forEach((prof) => {
            const ref = doc(db, `barbearias/${barbeariaId}/profissionais`, prof.id);
            batch.set(ref, { ...prof, migratedAt: serverTimestamp() });
        });
    }

    // Migrar clientes
    if (data.clientes) {
        data.clientes.forEach((cli) => {
            const ref = doc(db, `barbearias/${barbeariaId}/clientes`, cli.id);
            batch.set(ref, { ...cli, migratedAt: serverTimestamp() });
        });
    }

    // Migrar serviços
    if (data.servicos) {
        data.servicos.forEach((serv) => {
            const ref = doc(db, `barbearias/${barbeariaId}/servicos`, serv.id);
            batch.set(ref, { ...serv, migratedAt: serverTimestamp() });
        });
    }

    // Migrar agendamentos
    if (data.agendamentos) {
        data.agendamentos.forEach((ag) => {
            const ref = doc(db, `barbearias/${barbeariaId}/agendamentos`, ag.id);
            batch.set(ref, { ...ag, migratedAt: serverTimestamp() });
        });
    }

    // Migrar produtos
    if (data.produtos) {
        data.produtos.forEach((prod) => {
            const ref = doc(db, `barbearias/${barbeariaId}/produtos`, prod.id);
            batch.set(ref, { ...prod, migratedAt: serverTimestamp() });
        });
    }

    // Migrar promoções
    if (data.promocoes) {
        data.promocoes.forEach((prom) => {
            const ref = doc(db, `barbearias/${barbeariaId}/promocoes`, prom.id);
            batch.set(ref, { ...prom, migratedAt: serverTimestamp() });
        });
    }

    // Migrar notificações
    if (data.notificacoes) {
        data.notificacoes.forEach((not) => {
            const ref = doc(db, `barbearias/${barbeariaId}/notificacoes`, not.id);
            batch.set(ref, { ...not, migratedAt: serverTimestamp() });
        });
    }

    await batch.commit();
    console.log('✅ [Firestore] Migração em lote concluída');
}
