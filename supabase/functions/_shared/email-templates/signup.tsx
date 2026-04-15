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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Bekräfta din e-post – Promotely</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bekräfta din e-postadress</Heading>
        <Text style={text}>
          Tack för att du registrerade dig på{' '}
          <Link href={siteUrl} style={link}>
            <strong>Promotely</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Klicka på knappen nedan för att verifiera din e-postadress (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) och komma igång.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Bekräfta e-post
        </Button>
        <Text style={footerText}>
          ⏰ Denna länk är giltig i 24 timmar.
        </Text>
        <Text style={footer}>
          Om du inte har skapat ett konto på Promotely kan du ignorera detta mejl.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const footerText = { fontSize: '13px', color: 'hsl(215, 16%, 47%)', margin: '24px 0 8px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
