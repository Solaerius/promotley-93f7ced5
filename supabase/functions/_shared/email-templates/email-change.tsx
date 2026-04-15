/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text, Hr } from 'npm:@react-email/components@0.0.22'
import { getStyles, SITE_URL, type Theme } from './_styles.ts'

interface EmailChangeEmailProps { siteName: string; email: string; newEmail: string; confirmationUrl: string; theme?: Theme }

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl, theme = 'light' }: EmailChangeEmailProps) => {
  const s = getStyles(theme)
  return (
    <Html lang="sv" dir="ltr">
      <Head><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" /></Head>
      <Preview>Bekräfta din nya e-post för {siteName}</Preview>
      <Body style={s.main}>
        <Container style={s.card}>
          <Section style={s.headerBand}><Text style={s.brandName}>promotley</Text></Section>
          <Section style={s.content}>
            <Heading style={s.h1}>Bekräfta ny e-post 📧</Heading>
            <Text style={s.text}>Du har begärt att byta e-postadress för {siteName} från <Link href={`mailto:${email}`} style={s.link}>{email}</Link> till <Link href={`mailto:${newEmail}`} style={s.link}>{newEmail}</Link>.</Text>
            <Text style={s.text}>Klicka på knappen nedan för att bekräfta bytet:</Text>
            <Section style={s.buttonContainer}><Button style={s.button} href={confirmationUrl}>Bekräfta e-postbyte</Button></Section>
            <Text style={s.muted}>Om knappen inte fungerar, kopiera och klistra in denna länk:</Text>
            <Text style={s.muted}><Link href={confirmationUrl} style={s.fallbackLink}>{confirmationUrl}</Link></Text>
          </Section>
          <Hr style={s.divider} />
          <Section style={s.footer}>
            <Text style={s.footerText}><Link href={`${SITE_URL}/privacy`} style={s.footerLink}>Integritetspolicy</Link> · <Link href={`${SITE_URL}/terms`} style={s.footerLink}>Villkor</Link></Text>
            <Text style={s.footerText}>Om du inte begärde detta, säkra ditt konto omedelbart.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailChangeEmail
