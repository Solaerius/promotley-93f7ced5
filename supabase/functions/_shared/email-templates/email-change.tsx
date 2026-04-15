/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Bekräfta din nya e-postadress – Promotely</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bekräfta byte av e-postadress</Heading>
        <Text style={text}>
          Du har begärt att ändra din e-postadress på Promotely från{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          till{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Klicka på knappen nedan för att bekräfta ändringen:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Bekräfta ny e-post
        </Button>
        <Text style={footer}>
          Om du inte begärde denna ändring, säkra ditt konto omedelbart.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '40px 40px 30px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(347, 45%, 14%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(215, 16%, 47%)',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const link = { color: 'hsl(326, 56%, 37%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(10, 84%, 58%)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
