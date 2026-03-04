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
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL = 'https://fmvbzhlqzzwzciqgbzgp.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din inloggningslänk för {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={siteName} width="140" height="auto" style={logo} />
        <Heading style={h1}>Din inloggningslänk</Heading>
        <Text style={text}>
          Klicka på knappen nedan för att logga in på {siteName}. Länken upphör snart att gälla.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Logga in
        </Button>
        <Text style={footer}>
          Om du inte begärde denna länk kan du ignorera detta mejl.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
