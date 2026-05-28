/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface BoasVindasDonoProps {
  nomeDono?: string
  nomeBarbearia?: string
}

const FORMULARIO_URL = 'https://forms.gle/JnDhMLcig4ij84h96'

const BoasVindasDonoEmail = ({
  nomeDono = 'Barbeiro',
  nomeBarbearia = 'sua barbearia',
}: BoasVindasDonoProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo ao Barber Maestro – A nova era da sua barbearia</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Olá, {nomeDono}!</Heading>

        <Text style={text}>
          Seja muito bem-vindo à nova era da sua barbearia. ✂️
        </Text>

        <Text style={text}>
          Meu nome é <strong>Bernardo Strabelli</strong>, sou um dos fundadores do{' '}
          <strong>Barber Maestro</strong>, e faço questão de te dar as boas-vindas
          pessoalmente. Ficamos muito felizes em saber que agora a{' '}
          <strong>{nomeBarbearia}</strong> faz parte de uma nova era!
        </Text>

        <Text style={text}>
          Criamos o Barber Maestro para barbearias que buscam mais organização,
          controle e crescimento profissional, tudo isso sem complicação. Nosso
          objetivo é transformar a gestão do seu negócio em algo simples, claro
          e estratégico.
        </Text>

        <Text style={text}>
          A partir de agora, você contará com um único sistema para gerenciar
          toda a sua barbearia, incluindo:
        </Text>

        <Section style={list}>
          <Text style={listItem}>• Agendamentos inteligentes</Text>
          <Text style={listItem}>• Gestão financeira e fluxo de caixa</Text>
          <Text style={listItem}>• Controle de estoque</Text>
          <Text style={listItem}>• Gestão de profissionais</Text>
          <Text style={listItem}>• Visão clara e estratégica do seu negócio</Text>
        </Section>

        <Text style={text}>Quero te acompanhar de perto nesse início 🤝</Text>

        <Heading as="h2" style={h2}>
          📋 Sobre Você e sua Barbearia
        </Heading>

        <Text style={text}>
          Para que possamos personalizar ao máximo a sua experiência com o
          Barber Maestro, preparamos um formulário rápido onde você poderá nos
          contar mais sobre a sua barbearia, sua rotina, seus objetivos e
          desafios atuais.
        </Text>

        <Text style={text}>
          Essas informações são essenciais para que possamos configurar o
          sistema da melhor forma possível e entregar uma solução realmente
          alinhada à realidade do seu negócio.
        </Text>

        <Text style={text}>
          É só clicar no link abaixo e preencher. É super rápido e leva menos de
          10 minutos!
        </Text>

        <Text style={text}>
          <Link href={FORMULARIO_URL} style={link}>
            {FORMULARIO_URL}
          </Link>
        </Text>

        <Heading as="h2" style={h2}>
          🎓 Treinamento Inicial
        </Heading>

        <Text style={text}>
          Após o preenchimento do formulário, gostaria de agendar com você o
          nosso Treinamento Inicial, onde vou te apresentar todos os detalhes
          do sistema, auxiliar nas configurações iniciais e entender ainda mais
          a fundo o seu negócio, garantindo uma experiência completa e
          personalizada desde o primeiro acesso.
        </Text>

        <Text style={text}>
          Fico no aguardo da sua resposta para seguirmos juntos nessa jornada.
        </Text>

        <Text style={text}>
          Seja muito bem-vindo a essa nova era.
          <br />
          Agora, sua barbearia tem um maestro. ✂️
        </Text>

        <Text style={signature}>
          Atenciosamente,
          <br />
          <strong>Bernardo Strabelli &amp; Bruno Camargo</strong>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BoasVindasDonoEmail,
  subject: 'Bem-vindo ao Barber Maestro – A nova era da sua barbearia',
  displayName: 'Boas-vindas ao Dono da Barbearia',
  previewData: {
    nomeDono: 'João Silva',
    nomeBarbearia: 'Barbearia do João',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '600px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#0a0a0a',
  margin: '0 0 24px',
}
const h2 = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#0a0a0a',
  margin: '28px 0 12px',
}
const text = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const list = { margin: '0 0 20px', paddingLeft: '8px' }
const listItem = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.8',
  margin: '0',
}
const link = { color: '#dc2626', textDecoration: 'underline', wordBreak: 'break-all' as const }
const signature = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.6',
  margin: '24px 0 0',
}
