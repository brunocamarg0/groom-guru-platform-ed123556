/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface SuporteClienteProps {
  clienteNome?: string
  clienteEmail?: string
  categoria?: string
  assunto?: string
  mensagem?: string
}

const SuporteClienteEmail = ({
  clienteNome = 'Cliente',
  clienteEmail = '-',
  categoria = '-',
  assunto = '-',
  mensagem = '-',
}: SuporteClienteProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Nova mensagem de suporte de cliente</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nova mensagem de suporte</Heading>
        <Section style={card}>
          <Text style={label}>De</Text>
          <Text style={value}>{clienteNome} ({clienteEmail})</Text>
          <Text style={label}>Categoria</Text>
          <Text style={value}>{categoria}</Text>
          <Text style={label}>Assunto</Text>
          <Text style={value}>{assunto}</Text>
          <Text style={label}>Mensagem</Text>
          <Text style={message}>{mensagem}</Text>
        </Section>
        <Text style={footer}>Barber Maestro · Suporte ao Cliente</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SuporteClienteEmail,
  subject: (data: Record<string, any>) =>
    `[Suporte] ${data?.assunto || data?.categoria || 'Nova mensagem'}`,
  to: 'brunocamargocontato@hotmail.com',
  displayName: 'Mensagem de Suporte do Cliente',
  previewData: {
    clienteNome: 'João da Silva',
    clienteEmail: 'joao@example.com',
    categoria: 'Pagamento',
    assunto: 'Dúvida sobre PIX',
    mensagem: 'Olá, fiz um pagamento por PIX e ainda não recebi a confirmação.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#f6f6f7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '0 0 20px' }
const card = { backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e5e5' }
const label = { fontSize: '12px', textTransform: 'uppercase' as const, color: '#737373', margin: '12px 0 4px', letterSpacing: '0.05em' }
const value = { fontSize: '15px', color: '#0a0a0a', margin: '0 0 4px', fontWeight: 500 as const }
const message = { fontSize: '15px', color: '#333', margin: '0', whiteSpace: 'pre-wrap' as const, lineHeight: '1.6' }
const footer = { fontSize: '12px', color: '#737373', textAlign: 'center' as const, margin: '24px 0 0' }
