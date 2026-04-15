/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din inloggningslänk – Promotely</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Din inloggningslänk</Heading>
        <Text style={text}>
          Klicka på knappen nedan för att logga in på Promotely. Länken upphör att gälla inom kort.
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
