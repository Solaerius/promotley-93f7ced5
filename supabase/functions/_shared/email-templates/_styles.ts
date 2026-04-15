// Shared dual-theme styles for all Promotley email templates

export type Theme = 'light' | 'dark'

const LOGO_URL = 'https://fmvbzhlqzzwzciqgbzgp.supabase.co/storage/v1/object/public/email-assets/logo.png'
const SITE_URL = 'https://promotley.se'

export { LOGO_URL, SITE_URL }

export function getStyles(theme: Theme) {
  const isLight = theme === 'light'

  return {
    main: {
      backgroundColor: isLight ? '#F9FAFB' : '#120A0E',
      fontFamily: "'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '40px 16px',
    },
    card: {
      backgroundColor: isLight ? '#FFFFFF' : '#1A1014',
      borderRadius: '20px',
      maxWidth: '480px',
      margin: '0 auto',
      boxShadow: isLight
        ? '0 8px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)'
        : '0 8px 40px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2)',
      overflow: 'hidden' as const,
    },
    headerBand: {
      backgroundColor: isLight ? '#FFFFFF' : '#1A1014',
      borderBottom: `1px solid ${isLight ? '#E2E8F0' : '#2A1A22'}`,
      padding: '24px 32px',
      textAlign: 'center' as const,
    },
    brandName: {
      fontSize: '18px',
      fontWeight: '700' as const,
      color: isLight ? '#1E293B' : '#F5F5F5',
      margin: '0',
      lineHeight: '1',
    },
    content: { padding: '36px 32px 28px' },
    h1: {
      fontSize: '22px',
      fontWeight: '700' as const,
      color: isLight ? '#1E293B' : '#F5F5F5',
      margin: '0 0 16px',
      lineHeight: '1.3',
    },
    text: {
      fontSize: '15px',
      color: isLight ? '#64748B' : '#8B9AB8',
      lineHeight: '1.7',
      margin: '0 0 18px',
    },
    buttonContainer: { textAlign: 'center' as const, margin: '28px 0' },
    button: {
      background: 'linear-gradient(135deg, #EE593D 0%, #952A5E 100%)',
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: '600' as const,
      borderRadius: '16px',
      padding: '16px 36px',
      textDecoration: 'none',
      display: 'inline-block' as const,
    },
    muted: {
      fontSize: '12px',
      color: isLight ? '#94A3B8' : '#6B7A94',
      lineHeight: '1.5',
      margin: '0 0 4px',
    },
    fallbackLink: {
      fontSize: '12px',
      color: isLight ? '#952A5E' : '#D94F8C',
      textDecoration: 'underline',
    },
    link: {
      color: isLight ? '#952A5E' : '#D94F8C',
      textDecoration: 'none',
    },
    codeCard: {
      backgroundColor: isLight ? '#F8FAFC' : '#221520',
      borderRadius: '14px',
      border: `1px solid ${isLight ? '#E2E8F0' : '#2A1A22'}`,
      padding: '24px',
      textAlign: 'center' as const,
      margin: '24px 0',
    },
    codeText: {
      fontFamily: "'SF Mono', 'Fira Code', Courier, monospace",
      fontSize: '32px',
      fontWeight: '700' as const,
      color: '#EE593D',
      letterSpacing: '6px',
      margin: '0',
    },
    divider: {
      borderTop: `1px solid ${isLight ? '#E2E8F0' : '#2A1A22'}`,
      margin: '0 32px',
    },
    footer: { padding: '24px 32px 32px', textAlign: 'center' as const },
    footerText: {
      fontSize: '12px',
      color: isLight ? '#94A3B8' : '#6B7A94',
      margin: '0 0 8px',
      lineHeight: '1.5',
    },
    footerLink: {
      color: isLight ? '#952A5E' : '#D94F8C',
      textDecoration: 'none',
    },
  }
}
