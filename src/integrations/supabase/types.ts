export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamento_profissional: {
        Row: {
          agendamento_id: string
          created_at: string
          id: string
          profissional_id: string
        }
        Insert: {
          agendamento_id: string
          created_at?: string
          id?: string
          profissional_id: string
        }
        Update: {
          agendamento_id?: string
          created_at?: string
          id?: string
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_profissional_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_profissional_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_profissional_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos: {
        Row: {
          barbearia_id: string
          cliente_id: string | null
          cliente_nome: string
          confirmado_automaticamente: boolean
          created_at: string
          data: string
          data_confirmacao_automatica: string | null
          forma_pagamento: string | null
          horario: string
          id: string
          observacao: string | null
          servico_id: string
          status: string
          telefone: string
          updated_at: string
        }
        Insert: {
          barbearia_id: string
          cliente_id?: string | null
          cliente_nome: string
          confirmado_automaticamente?: boolean
          created_at?: string
          data: string
          data_confirmacao_automatica?: string | null
          forma_pagamento?: string | null
          horario: string
          id?: string
          observacao?: string | null
          servico_id: string
          status?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          barbearia_id?: string
          cliente_id?: string | null
          cliente_nome?: string
          confirmado_automaticamente?: boolean
          created_at?: string
          data?: string
          data_confirmacao_automatica?: string | null
          forma_pagamento?: string | null
          horario?: string
          id?: string
          observacao?: string | null
          servico_id?: string
          status?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          barbearia_id: string
          created_at: string
          data_inicio: string
          data_vencimento: string
          id: string
          mercadopago_subscription_id: string | null
          pagamento_recorrente: boolean
          plano_id: string
          proximo_vencimento: string
          status: string
          updated_at: string
        }
        Insert: {
          barbearia_id: string
          created_at?: string
          data_inicio?: string
          data_vencimento: string
          id?: string
          mercadopago_subscription_id?: string | null
          pagamento_recorrente?: boolean
          plano_id: string
          proximo_vencimento: string
          status?: string
          updated_at?: string
        }
        Update: {
          barbearia_id?: string
          created_at?: string
          data_inicio?: string
          data_vencimento?: string
          id?: string
          mercadopago_subscription_id?: string | null
          pagamento_recorrente?: boolean
          plano_id?: string
          proximo_vencimento?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: true
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_cliente: {
        Row: {
          cliente_id: string
          created_at: string
          data_inicio: string
          data_vencimento: string
          id: string
          mercadopago_subscription_id: string | null
          pagamento_recorrente: boolean
          plano_id: string
          profissional_id: string | null
          proximo_vencimento: string
          status: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_inicio?: string
          data_vencimento: string
          id?: string
          mercadopago_subscription_id?: string | null
          pagamento_recorrente?: boolean
          plano_id: string
          profissional_id?: string | null
          proximo_vencimento: string
          status?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_inicio?: string
          data_vencimento?: string
          id?: string
          mercadopago_subscription_id?: string | null
          pagamento_recorrente?: boolean
          plano_id?: string
          profissional_id?: string | null
          proximo_vencimento?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_cliente_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_cliente_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_cliente_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          agendamento_id: string
          cliente_id: string
          comentario: string | null
          created_at: string
          id: string
          nota_ambiente: number
          nota_atendimento: number
          nota_profissional: number
          respondido_em: string | null
          resposta: string | null
          updated_at: string
        }
        Insert: {
          agendamento_id: string
          cliente_id: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota_ambiente: number
          nota_atendimento: number
          nota_profissional: number
          respondido_em?: string | null
          resposta?: string | null
          updated_at?: string
        }
        Update: {
          agendamento_id?: string
          cliente_id?: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota_ambiente?: number
          nota_atendimento?: number
          nota_profissional?: number
          respondido_em?: string | null
          resposta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: true
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      barbearia_mp_credentials: {
        Row: {
          access_token: string | null
          barbearia_id: string
          connected_at: string | null
          mp_user_id: string | null
          public_key: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          barbearia_id: string
          connected_at?: string | null
          mp_user_id?: string | null
          public_key?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          barbearia_id?: string
          connected_at?: string | null
          mp_user_id?: string | null
          public_key?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbearia_mp_credentials_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: true
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      barbearias: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj_cpf: string
          created_at: string
          data_vencimento: string | null
          email: string | null
          endereco: string | null
          foto: string | null
          horario_funcionamento: Json
          id: string
          latitude: number | null
          longitude: number | null
          modo_confirmacao: string
          nome: string
          plano: string
          politica_cancelamento: Json
          responsavel: string
          slug: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf: string
          created_at?: string
          data_vencimento?: string | null
          email?: string | null
          endereco?: string | null
          foto?: string | null
          horario_funcionamento?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          modo_confirmacao?: string
          nome: string
          plano?: string
          politica_cancelamento?: Json
          responsavel: string
          slug: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string
          created_at?: string
          data_vencimento?: string | null
          email?: string | null
          endereco?: string | null
          foto?: string | null
          horario_funcionamento?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          modo_confirmacao?: string
          nome?: string
          plano?: string
          politica_cancelamento?: Json
          responsavel?: string
          slug?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cliente_profissional: {
        Row: {
          ativo: boolean
          cliente_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          profissional_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cliente_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          profissional_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cliente_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          profissional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_profissional_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_profissional_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_profissional_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          created_at: string
          data_nascimento: string | null
          email: string
          email_verificado: boolean
          foto: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string | null
          vip: boolean
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_nascimento?: string | null
          email: string
          email_verificado?: boolean
          foto?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          vip?: boolean
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_nascimento?: string | null
          email?: string
          email_verificado?: boolean
          foto?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          vip?: boolean
        }
        Relationships: []
      }
      comissoes_assinatura: {
        Row: {
          assinatura_id: string
          barbearia_id: string
          created_at: string
          data_pagamento: string | null
          id: string
          mes_referencia: string
          observacao: string | null
          pagamento_id: string
          pago: boolean
          profissional_id: string
          updated_at: string
          valor_comissao: number
          valor_total: number
        }
        Insert: {
          assinatura_id: string
          barbearia_id: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mes_referencia: string
          observacao?: string | null
          pagamento_id: string
          pago?: boolean
          profissional_id: string
          updated_at?: string
          valor_comissao: number
          valor_total: number
        }
        Update: {
          assinatura_id?: string
          barbearia_id?: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mes_referencia?: string
          observacao?: string | null
          pagamento_id?: string
          pago?: boolean
          profissional_id?: string
          updated_at?: string
          valor_comissao?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_assinatura_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas_cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_assinatura_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_assinatura_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos_assinatura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_assinatura_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_assinatura_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_pagas: {
        Row: {
          agendamento_id: string
          barbearia_id: string
          created_at: string
          data_pagamento: string | null
          id: string
          mes_referencia: string
          observacao: string | null
          pago: boolean
          porcentagem: number
          profissional_id: string
          updated_at: string
          valor_comissao: number
          valor_total: number
        }
        Insert: {
          agendamento_id: string
          barbearia_id: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mes_referencia: string
          observacao?: string | null
          pago?: boolean
          porcentagem: number
          profissional_id: string
          updated_at?: string
          valor_comissao: number
          valor_total: number
        }
        Update: {
          agendamento_id?: string
          barbearia_id?: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mes_referencia?: string
          observacao?: string | null
          pago?: boolean
          porcentagem?: number
          profissional_id?: string
          updated_at?: string
          valor_comissao?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_pagas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_pagas_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_pagas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_pagas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          barbearia_id: string
          created_at: string
          email: string | null
          expira_em: string
          id: string
          token: string
          updated_at: string
          usado: boolean
          usado_em: string | null
        }
        Insert: {
          barbearia_id: string
          created_at?: string
          email?: string | null
          expira_em: string
          id?: string
          token: string
          updated_at?: string
          usado?: boolean
          usado_em?: string | null
        }
        Update: {
          barbearia_id?: string
          created_at?: string
          email?: string | null
          expira_em?: string
          id?: string
          token?: string
          updated_at?: string
          usado?: boolean
          usado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      donos_barbearia: {
        Row: {
          ativo: boolean
          barbearia_id: string
          created_at: string
          email_verificado: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          barbearia_id: string
          created_at?: string
          email_verificado?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          created_at?: string
          email_verificado?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donos_barbearia_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: true
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      faturas: {
        Row: {
          assinatura_id: string
          codigo_boleto: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          link_pagamento: string | null
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          mercadopago_status: string | null
          metodo_pagamento: string | null
          observacoes: string | null
          qr_code_pix: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          assinatura_id: string
          codigo_boleto?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          link_pagamento?: string | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_status?: string | null
          metodo_pagamento?: string | null
          observacoes?: string | null
          qr_code_pix?: string | null
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          assinatura_id?: string
          codigo_boleto?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          link_pagamento?: string | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_status?: string | null
          metodo_pagamento?: string | null
          observacoes?: string | null
          qr_code_pix?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          barbearia_id: string | null
          created_at: string
          data: string
          id: string
          label_acao: string | null
          lida: boolean
          mensagem: string
          tipo: string
          titulo: string
          updated_at: string
          url_acao: string | null
        }
        Insert: {
          barbearia_id?: string | null
          created_at?: string
          data?: string
          id?: string
          label_acao?: string | null
          lida?: boolean
          mensagem: string
          tipo: string
          titulo: string
          updated_at?: string
          url_acao?: string | null
        }
        Update: {
          barbearia_id?: string | null
          created_at?: string
          data?: string
          id?: string
          label_acao?: string | null
          lida?: boolean
          mensagem?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          url_acao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          agendamento_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          id: string
          mercadopago_payment_id: string | null
          mercadopago_payment_type: string | null
          mercadopago_preference_id: string | null
          mercadopago_status: string | null
          metodo: string
          status: string
          taxa_gateway: number | null
          updated_at: string
          valor: number
        }
        Insert: {
          agendamento_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_payment_type?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_status?: string | null
          metodo: string
          status?: string
          taxa_gateway?: number | null
          updated_at?: string
          valor: number
        }
        Update: {
          agendamento_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_payment_type?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_status?: string | null
          metodo?: string
          status?: string
          taxa_gateway?: number | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: true
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_assinatura: {
        Row: {
          assinatura_id: string
          codigo_boleto: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          link_pagamento: string | null
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          mercadopago_status: string | null
          metodo_pagamento: string | null
          observacoes: string | null
          qr_code_pix: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          assinatura_id: string
          codigo_boleto?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          link_pagamento?: string | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_status?: string | null
          metodo_pagamento?: string | null
          observacoes?: string | null
          qr_code_pix?: string | null
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          assinatura_id?: string
          codigo_boleto?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          link_pagamento?: string | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_status?: string | null
          metodo_pagamento?: string | null
          observacoes?: string | null
          qr_code_pix?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_assinatura_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas_cliente"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          limite_agendamentos: number
          limite_barbeiros: number
          nome: string
          recursos: string[]
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          limite_agendamentos?: number
          limite_barbeiros?: number
          nome: string
          recursos?: string[]
          updated_at?: string
          valor_mensal: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          limite_agendamentos?: number
          limite_barbeiros?: number
          nome?: string
          recursos?: string[]
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      planos_cliente: {
        Row: {
          ativo: boolean
          barbearia_id: string
          beneficios: string[]
          created_at: string
          descricao: string | null
          duracao_meses: number
          id: string
          nome: string
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          barbearia_id: string
          beneficios?: string[]
          created_at?: string
          descricao?: string | null
          duracao_meses: number
          id?: string
          nome: string
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          beneficios?: string[]
          created_at?: string
          descricao?: string | null
          duracao_meses?: number
          id?: string
          nome?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "planos_cliente_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          barbearia_id: string
          categoria: string
          created_at: string
          descricao: string | null
          estoque: number
          estoque_minimo: number
          foto: string | null
          id: string
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          barbearia_id: string
          categoria: string
          created_at?: string
          descricao?: string | null
          estoque?: number
          estoque_minimo?: number
          foto?: string | null
          id?: string
          nome: string
          preco: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          categoria?: string
          created_at?: string
          descricao?: string | null
          estoque?: number
          estoque_minimo?: number
          foto?: string | null
          id?: string
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          data_nascimento: string | null
          email: string | null
          foto: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          foto?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          foto?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          ativo: boolean
          barbearia_id: string
          comissao_assinatura: number
          comissao_tipo: string
          comissao_valor: number
          created_at: string
          data_admissao: string
          email: string | null
          especialidades: string[]
          foto: string | null
          id: string
          nome: string
          telefone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          barbearia_id: string
          comissao_assinatura?: number
          comissao_tipo?: string
          comissao_valor?: number
          created_at?: string
          data_admissao?: string
          email?: string | null
          especialidades?: string[]
          foto?: string | null
          id?: string
          nome: string
          telefone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          comissao_assinatura?: number
          comissao_tipo?: string
          comissao_valor?: number
          created_at?: string
          data_admissao?: string
          email?: string | null
          especialidades?: string[]
          foto?: string | null
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      promocoes: {
        Row: {
          aplicavel_a: string
          ativo: boolean
          barbearia_id: string
          created_at: string
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          nome: string
          servico_id: string | null
          tipo: string
          updated_at: string
          valido_ate: string
          valido_de: string
          valor: number
        }
        Insert: {
          aplicavel_a?: string
          ativo?: boolean
          barbearia_id: string
          created_at?: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          nome: string
          servico_id?: string | null
          tipo: string
          updated_at?: string
          valido_ate: string
          valido_de: string
          valor: number
        }
        Update: {
          aplicavel_a?: string
          ativo?: boolean
          barbearia_id?: string
          created_at?: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          nome?: string
          servico_id?: string | null
          tipo?: string
          updated_at?: string
          valido_ate?: string
          valido_de?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "promocoes_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          barbearia_id: string
          created_at: string
          descricao: string | null
          duracao: number
          id: string
          nome: string
          ordem: number
          preco: number
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          barbearia_id: string
          created_at?: string
          descricao?: string | null
          duracao: number
          id?: string
          nome: string
          ordem?: number
          preco: number
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          created_at?: string
          descricao?: string | null
          duracao?: number
          id?: string
          nome?: string
          ordem?: number
          preco?: number
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_cadastro: {
        Row: {
          aprovada_em: string | null
          aprovada_por: string | null
          barbearia_id: string | null
          cnpj_cpf: string
          created_at: string
          email: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          plano: string
          responsavel: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          aprovada_em?: string | null
          aprovada_por?: string | null
          barbearia_id?: string | null
          cnpj_cpf: string
          created_at?: string
          email: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          plano?: string
          responsavel: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          aprovada_em?: string | null
          aprovada_por?: string | null
          barbearia_id?: string | null
          cnpj_cpf?: string
          created_at?: string
          email?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          plano?: string
          responsavel?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_cadastro_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: true
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tickets_suporte: {
        Row: {
          assunto: string
          categoria: string
          cliente_email: string
          cliente_id: string | null
          cliente_nome: string
          created_at: string
          id: string
          mensagem: string
          prioridade: string
          resolvido_em: string | null
          respondido_em: string | null
          respondido_por: string | null
          resposta: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assunto: string
          categoria: string
          cliente_email: string
          cliente_id?: string | null
          cliente_nome: string
          created_at?: string
          id?: string
          mensagem: string
          prioridade?: string
          resolvido_em?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assunto?: string
          categoria?: string
          cliente_email?: string
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string
          id?: string
          mensagem?: string
          prioridade?: string
          resolvido_em?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_suporte_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          barbearia_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          barbearia_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          barbearia_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profissionais_publicos: {
        Row: {
          ativo: boolean | null
          barbearia_id: string | null
          data_admissao: string | null
          especialidades: string[] | null
          foto: string | null
          id: string | null
          nome: string | null
        }
        Insert: {
          ativo?: boolean | null
          barbearia_id?: string | null
          data_admissao?: string | null
          especialidades?: string[] | null
          foto?: string | null
          id?: string | null
          nome?: string | null
        }
        Update: {
          ativo?: boolean | null
          barbearia_id?: string | null
          data_admissao?: string | null
          especialidades?: string[] | null
          foto?: string | null
          id?: string | null
          nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_barbearia_publica_by_id: {
        Args: { _id: string }
        Returns: {
          bairro: string
          cidade: string
          endereco: string
          foto: string
          id: string
          latitude: number
          longitude: number
          modo_confirmacao: string
          nome: string
          plano: string
          slug: string
          status: string
          telefone: string
        }[]
      }
      get_barbearia_publica_by_slug: {
        Args: { _slug: string }
        Returns: {
          bairro: string
          cidade: string
          endereco: string
          foto: string
          id: string
          latitude: number
          longitude: number
          modo_confirmacao: string
          nome: string
          plano: string
          slug: string
          status: string
          telefone: string
        }[]
      }
      get_horarios_ocupados: {
        Args: { _barbearia_id: string; _data: string }
        Returns: {
          horario: string
        }[]
      }
      get_mp_connection_status: {
        Args: { _barbearia_id: string }
        Returns: {
          connected: boolean
          connected_at: string
          mp_user_id: string
          public_key: string
        }[]
      }
      get_profissionais_publicos_by_barbearia: {
        Args: { _barbearia_ids: string[] }
        Returns: {
          ativo: boolean
          barbearia_id: string
          especialidades: string[]
          foto: string
          id: string
          nome: string
        }[]
      }
      get_user_barbearia_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_cliente_da_minha_barbearia: {
        Args: { _cliente_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      search_barbearias_publicas: {
        Args: { _bairro?: string; _busca?: string; _cidade?: string }
        Returns: {
          bairro: string
          cidade: string
          endereco: string
          foto: string
          id: string
          latitude: number
          longitude: number
          modo_confirmacao: string
          nome: string
          plano: string
          slug: string
          status: string
          telefone: string
        }[]
      }
      slugify: { Args: { _text: string }; Returns: string }
      validar_agendamento_input: {
        Args: { _barbearia_id: string; _servico_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "owner" | "professional" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "owner", "professional", "client"],
    },
  },
} as const
