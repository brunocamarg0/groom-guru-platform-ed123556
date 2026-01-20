-- Script para limpar todos os dados operacionais do sistema
-- ATENÇÃO: Este script DELETA todos os dados! Use com cuidado.
-- Execute este SQL diretamente no Supabase SQL Editor

-- Desabilita verificações de chave estrangeira temporariamente
SET session_replication_role = 'replica';

-- 1. Limpar tabelas de relacionamento (dependentes primeiro)
DELETE FROM "ComissaoPaga";
DELETE FROM "AgendamentoProfissional";
DELETE FROM "Pagamento";
DELETE FROM "Avaliacao";

-- 2. Limpar tabelas principais
DELETE FROM "Agendamento";
DELETE FROM "Notificacao";
DELETE FROM "Promocao";
DELETE FROM "Produto";
DELETE FROM "Profissional";
DELETE FROM "Servico";
DELETE FROM "Cliente";

-- 3. Limpar convites
DELETE FROM "Convite";

-- 4. Limpar usuários dono (opcional - descomente se quiser)
-- DELETE FROM "UsuarioDono";

-- 5. Limpar solicitações
DELETE FROM "SolicitacaoCadastro";

-- 6. Limpar barbearias (opcional - descomente se quiser limpar TUDO)
-- DELETE FROM "Barbearia";

-- Reabilita verificações de chave estrangeira
SET session_replication_role = 'origin';

-- Confirma limpeza
SELECT 'Limpeza concluída!' as status;

-- Contagens para verificação
SELECT 'Agendamentos' as tabela, COUNT(*) as registros FROM "Agendamento"
UNION ALL SELECT 'Clientes', COUNT(*) FROM "Cliente"
UNION ALL SELECT 'Profissionais', COUNT(*) FROM "Profissional"
UNION ALL SELECT 'Servicos', COUNT(*) FROM "Servico"
UNION ALL SELECT 'Produtos', COUNT(*) FROM "Produto"
UNION ALL SELECT 'Promocoes', COUNT(*) FROM "Promocao"
UNION ALL SELECT 'Comissoes', COUNT(*) FROM "ComissaoPaga"
UNION ALL SELECT 'Avaliacoes', COUNT(*) FROM "Avaliacao";
