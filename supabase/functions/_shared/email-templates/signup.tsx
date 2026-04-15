/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text, Hr } from 'npm:@react-email/components@0.0.22'
import { getStyles, SITE_URL, type Theme } from './_styles.ts'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  theme?: Theme
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl, theme = 'light' }: SignupEmailProps) => {
  const s = getStyles(theme)
  return (
    <Html lang="sv" dir="ltr">
      <Head><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" /></Head>
      <Preview>Bekräfta din e-post för {siteName}</Preview>
      <Body style={s.main}>
        <Container style={s.card}>
          <Section style={s.headerBand}><Text style={s.brandName}>promotley</Text></Section>
          <Section style={s.content}>
            <Heading style={s.h1}>Välkommen! 🎉</Heading>
            <Text style={s.text}>Tack för att du registrerade dig på <Link href={siteUrl} style={s.link}><strong>{siteName}</strong></Link>!</Text>
            <Text style={s.text}>Bekräfta din e-postadress (<Link href={`mailto:${recipient}`} style={s.link}>{recipient}</Link>) genom att klicka på knappen nedan:</Text>
            <Section style={s.buttonContainer}><Button style={s.button} href={confirmationUrl}>Verifiera e-post</Button></Section>
            <Text style={s.muted}>Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:</Text>
            <Text style={s.muted}><Link href={confirmationUrl} style={s.fallbackLink}>{confirmationUrl}</Link></Text>
          </Section>
          <Hr style={s.divider} />
          <Section style={s.footer}>
            <Text style={s.footerText}><Link href={`${SITE_URL}/privacy`} style={s.footerLink}>Integritetspolicy</Link> · <Link href={`${SITE_URL}/terms`} style={s.footerLink}>Villkor</Link></Text>
            <Text style={s.footerText}>Om du inte skapade ett konto kan du ignorera detta mejl.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail
