/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
  recipientName?: string | null
}

const LOGO_URL = 'https://fmvbzhlqzzwzciqgbzgp.supabase.co/storage/v1/object/public/email-assets/logo.png'
const SITE_URL = 'https://promotley.se'

export const ReauthenticationEmail = ({ token, recipientName }: ReauthenticationEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din verifieringskod – {token}</Preview>
    <Body style={main}>
      <Container style={card}>
        <Section style={headerBand}>
          <table cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
            <tr>
              <td style={{ paddingLeft: '32px', paddingTop: '20px', paddingBottom: '20px' }}>
                <table cellPadding="0" cellSpacing="0">
                  <tr>
                    <td style={{ verticalAlign: 'middle' }}>
                      <Link href={SITE_URL}>
                        <Img src={LOGO_URL} alt="Promotley" width="40" height="40" style={{ display: 'block' }} />
                      </Link>
                    </td>
                    <td style={{ verticalAlign: 'middle', paddingLeft: '12px' }}>
                      <Link href={SITE_URL} style={{ textDecoration: 'none' }}>
                        <Text style={brandName}>Promotley UF</Text>
                      </Link>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </Section>

        <Section style={content}>
          <Heading style={h1}>Hej{recipientName ? ` ${recipientName}` : ''}!</Heading>
          <Text style={text}>
            Ange koden nedan i appen för att bekräfta din identitet:
          </Text>

          <Section style={codeCard}>
            <Text style={codeText}>{token}</Text>
          </Section>

          <Text style={text}>
            Koden upphör snart att gälla. Dela den aldrig med någon annan.
          </Text>
        </Section>

        <Hr style={divider} />
        <Section style={footer}>
          <Img src={LOGO_URL} alt="Promotley" width="80" height="auto" style={footerLogo} />
          <Text style={footerLinks}>
            <Link href={`${SITE_URL}/privacy-policy`} style={footerLink}>Integritetspolicy</Link>
            {' · '}
            <Link href={`${SITE_URL}/terms-of-service`} style={footerLink}>Villkor</Link>
          </Text>
          <Text style={footerContact}>
            <Link href="mailto:support@promotley.se" style={footerLink}>support@promotley.se</Link>
          </Text>
          <Text style={footerAddress}>
            © {new Date().getFullYear()} Promotley · Stockholm, Sverige
          </Text>
          <Text style={footerDisclaimer}>
            Begärde du inte detta? Säkra ditt konto direkt via kontoinställningarna.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = {
  backgroundColor: '#FFF8F5',
  fontFamily: "'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  padding: '40px 16px',
}
const card = {
  backgroundColor: '#ffffff', borderRadius: '20px', maxWidth: '480px', margin: '0 auto',
  boxShadow: '0 8px 40px rgba(53, 20, 29, 0.08), 0 1px 3px rgba(53, 20, 29, 0.04)', overflow: 'hidden' as const,
}
const headerBand = { backgroundColor: '#ffffff', borderBottom: '1px solid #F0E6E8' }
const brandName = { fontSize: '18px', fontWeight: '700' as const, color: '#000000', margin: '0', lineHeight: '1' }
const content = { padding: '36px 32px 28px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#35141D', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#5C3D45', lineHeight: '1.7', margin: '0 0 18px' }
const codeCard = {
  backgroundColor: '#FFF8F5',
  borderRadius: '14px',
  border: '1px solid #F0E6E8',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '24px 0',
}
const codeText = {
  fontFamily: "'SF Mono', 'Fira Code', Courier, monospace",
  fontSize: '32px',
  fontWeight: '700' as const,
  color: '#EE593D',
  letterSpacing: '6px',
  margin: '0',
}
const divider = { borderTop: '1px solid #F0E6E8', margin: '0 32px' }
const footer = { padding: '24px 32px 32px', textAlign: 'center' as const }
const footerLogo = { margin: '0 auto 12px', display: 'block' as const, opacity: '0.6' }
const footerLinks = { fontSize: '13px', color: '#9B8A8E', margin: '0 0 8px', lineHeight: '1.5' }
const footerLink = { color: '#952A5E', textDecoration: 'none' }
const footerAddress = { fontSize: '11px', color: '#B8A5AA', margin: '0 0 8px' }
const footerContact = { fontSize: '13px', color: '#9B8A8E', margin: '0 0 8px', lineHeight: '1.5' }
const footerDisclaimer = { fontSize: '11px', color: '#C8BCC0', margin: '0', fontStyle: 'italic' as const }
