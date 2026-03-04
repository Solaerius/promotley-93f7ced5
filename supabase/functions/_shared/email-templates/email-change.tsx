/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
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

const LOGO_URL = 'https://fmvbzhlqzzwzciqgbzgp.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Bekräfta din nya e-postadress för {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={siteName} width="140" height="auto" style={logo} />
        <Heading style={h1}>Bekräfta ny e-postadress</Heading>
        <Text style={text}>
          Du har begärt att ändra din e-postadress för {siteName} från{' '}
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
          Om du inte begärde denna ändring, vänligen säkra ditt konto omedelbart.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { margin: '0 0 24px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#2d1114',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#6b4d54',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const link = { color: '#952A5E', textDecoration: 'underline' }
const button = {
  backgroundColor: '#EE593D',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
