/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  theme?: Theme
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  theme = 'light',
}: SignupEmailProps) => {
  const s = getStyles(theme)
  return (
    <Html lang="sv" dir="ltr">
      <Head />
      <Preview>Bekrafta din e-post for {siteName}</Preview>
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
                          <Img src={LOGO_URL} alt={siteName} width="40" height="40" style={{ display: 'block' }} />
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
            <Heading style={s.h1}>Valkommen!</Heading>
            <Text style={s.text}>
              Tack for att du skapade ett konto hos{' '}
              <Link href={siteUrl} style={s.link}>
                <strong>{siteName}</strong>
              </Link>
              . Bekrafta din e-postadress ({recipient}) genom att klicka pa knappen nedan.
            </Text>

            <Section style={s.buttonContainer}>
              <Button style={s.button} href={confirmationUrl}>
                Bekrafta e-post
              </Button>
            </Section>

            <Text style={s.muted}>
              Knappen fungerar inte? Tryck pa lanken nedan:
            </Text>
            <Link href={confirmationUrl} style={s.fallbackLink}>Tryck har</Link>
          </Section>

          <Hr style={s.divider} />
          <Section style={s.footer}>
            <Img src={LOGO_URL} alt={siteName} width="80" height="auto" style={s.footerLogo} />
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
              Skapade du inte detta konto? Ignorera mejlet.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail
