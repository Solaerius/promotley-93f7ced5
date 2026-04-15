/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text, Hr } from 'npm:@react-email/components@0.0.22'
import { getStyles, SITE_URL, type Theme } from './_styles.ts'

interface ReauthenticationEmailProps { token: string; theme?: Theme }

export const ReauthenticationEmail = ({ token, theme = 'light' }: ReauthenticationEmailProps) => {
  const s = getStyles(theme)
  return (
    <Html lang="sv" dir="ltr">
      <Head><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" /></Head>
      <Preview>Din verifieringskod</Preview>
      <Body style={s.main}>
        <Container style={s.card}>
          <Section style={s.headerBand}><Text style={s.brandName}>promotley</Text></Section>
          <Section style={s.content}>
            <Heading style={s.h1}>Verifieringskod 🔐</Heading>
            <Text style={s.text}>Använd koden nedan för att bekräfta din identitet:</Text>
            <Section style={s.codeCard}><Text style={s.codeText}>{token}</Text></Section>
            <Text style={s.muted}>Koden upphör snart att gälla.</Text>
          </Section>
          <Hr style={s.divider} />
          <Section style={s.footer}>
            <Text style={s.footerText}><Link href={`${SITE_URL}/privacy`} style={s.footerLink}>Integritetspolicy</Link> · <Link href={`${SITE_URL}/terms`} style={s.footerLink}>Villkor</Link></Text>
            <Text style={s.footerText}>Om du inte begärde detta kan du ignorera mejlet.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ReauthenticationEmail
