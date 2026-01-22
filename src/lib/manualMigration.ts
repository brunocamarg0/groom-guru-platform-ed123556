// Script manual para migrar dados do PostgreSQL para o Firebase Firestore
import { apiGet } from '../services/api';
import * as firestoreUtils from './firestoreUtils';

export async function executarMigracaoCompleta(barbeariaId: string) {
    console.log('🚀 [MIGRAÇÃO] Iniciando migração completa para barbearia:', barbeariaId);

    try {
        // Buscar todos os dados do banco antigo (PostgreSQL)
        const [
            profissionais,
            clientes,
            servicos,
            agendamentos,
            produtos,
            promocoes,
            notificacoes
        ] = await Promise.all([
            apiGet<any[]>('/dono/profissionais').catch(() => []),
            apiGet<any[]>('/dono/clientes').catch(() => []),
            apiGet<any[]>('/dono/servicos').catch(() => []),
            apiGet<any[]>(`/agendamentos/barbearia/${barbeariaId}`).catch(() => []),
            apiGet<any[]>('/dono/produtos').catch(() => []),
            apiGet<any[]>('/dono/promocoes').catch(() => []),
            apiGet<any[]>('/dono/notificacoes').catch(() => [])
        ]);

        console.log('📥 [MIGRAÇÃO] Dados recuperados do PostgreSQL:', {
            profissionais: profissionais.length,
            clientes: clientes.length,
            servicos: servicos.length,
            agendamentos: agendamentos.length
        });

        // Enviar para o Firebase em lote
        await firestoreUtils.migrateBarbeariaData(barbeariaId, {
            profissionais,
            clientes,
            servicos,
            agendamentos,
            produtos,
            promocoes,
            notificacoes
        });

        // Marcar barbearia como migrada no Firestore
        await firestoreUtils.setBarbeariaConfig(barbeariaId, {
            migracaoconcluida: true,
            dataMigracao: new Date().toISOString()
        });

        console.log('✅ [MIGRAÇÃO] Sucesso! Todos os dados estão no Firebase.');
        return { success: true, count: agendamentos.length };
    } catch (error) {
        console.error('❌ [MIGRAÇÃO] Erro crítico durante migração:', error);
        throw error;
    }
}
