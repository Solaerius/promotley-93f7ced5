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

import { getStyles, LOGO_URL, SITE_URL, type Theme } from './_styles.ts'

interface ReauthenticationEmailProps {
  token: string
  theme?: Theme
}

export const ReauthenticationEmail = ({
  token,
  theme = 'light',
}: ReauthenticationEmailProps) => {
  const s = getStyles(theme)
  return (
    <Html lang="sv" dir="ltr">
      <Head />
      <Preview>Din verifieringskod — {token}</Preview>
      <Body style={s.main}>
        <Container style={s.card}>
          <Section style={s.headerBand}>
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
                          <Text style={s.brandName}>Promotley UF</Text>
                        </Link>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </Section>

          <Section style={s.content}>
            <Heading style={s.h1}>Bekrafta din identitet</Heading>
            <Text style={s.text}>
              Ange koden nedan i appen for att bekrafta din identitet:
            </Text>

            <Section style={s.codeCard}>
              <Text style={s.codeText}>{token}</Text>
            </Section>

            <Text style={s.text}>
              Koden upphor snart att galla. Dela den aldrig med nagon annan.
            </Text>
          </Section>

          <Hr style={s.divider} />
          <Section style={s.footer}>
            <Img src={LOGO_URL} alt="Promotley" width="80" height="auto" style={s.footerLogo} />
            <Text style={s.footerLinks}>
              <Link href={`${SITE_URL}/privacy-policy`} style={s.footerLink}>Integritetspolicy</Link>
              {' · '}
              <Link href={`${SITE_URL}/terms-of-service`} style={s.footerLink}>Villkor</Link>
            </Text>
            <Text style={s.footerContact}>
              <Link href="mailto:support@promotley.se" style={s.footerLink}>support@promotley.se</Link>
            </Text>
            <Text style={s.footerAddress}>
              © {new Date().getFullYear()} Promotley · Stockholm, Sverige
            </Text>
            <Text style={s.footerDisclaimer}>
              Begarde du inte detta? Sakra ditt konto direkt via kontoinstellningarna.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ReauthenticationEmail
