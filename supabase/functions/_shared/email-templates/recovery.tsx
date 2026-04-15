/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text, Hr } from 'npm:@react-email/components@0.0.22'
import { getStyles, SITE_URL, type Theme } from './_styles.ts'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string; theme?: Theme }

export const RecoveryEmail = ({ siteName, confirmationUrl, theme = 'light' }: RecoveryEmailProps) => {
  const s = getStyles(theme)
  return (
    <Html lang="sv" dir="ltr">
      <Head><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" /></Head>
      <Preview>Återställ ditt lösenord för {siteName}</Preview>
      <Body style={s.main}>
        <Container style={s.card}>
          <Section style={s.headerBand}><Text style={s.brandName}>promotley</Text></Section>
          <Section style={s.content}>
            <Heading style={s.h1}>Återställ lösenord 🔒</Heading>
            <Text style={s.text}>Vi fick en begäran om att återställa ditt lösenord för {siteName}. Klicka på knappen nedan för att välja ett nytt lösenord.</Text>
            <Section style={s.buttonContainer}><Button style={s.button} href={confirmationUrl}>Återställ lösenord</Button></Section>
            <Text style={s.muted}>Om knappen inte fungerar, kopiera och klistra in denna länk:</Text>
            <Text style={s.muted}><Link href={confirmationUrl} style={s.fallbackLink}>{confirmationUrl}</Link></Text>
          </Section>
          <Hr style={s.divider} />
          <Section style={s.footer}>
            <Text style={s.footerText}><Link href={`${SITE_URL}/privacy`} style={s.footerLink}>Integritetspolicy</Link> · <Link href={`${SITE_URL}/terms`} style={s.footerLink}>Villkor</Link></Text>
            <Text style={s.footerText}>Om du inte begärde detta kan du ignorera mejlet. Ditt lösenord ändras inte.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default RecoveryEmail
