import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
// Platform SVG logos
const TikTokLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AppleLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

const OAuthButton = ({
  onClick,
  logo,
  label,
  delay,
}: {
  onClick: () => void;
  logo: React.ReactNode;
  label: string;
  delay: number;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: "easeOut" }}
    onClick={onClick}
    className="group flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer bg-muted/60 dark:bg-white/5 border border-border dark:border-white/10 text-foreground"
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
    }}
  >
    {logo}
    <span>{label}</span>
    <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
  </motion.button>
);


// SVG wordmark logos for Swedish UF companies shown in social proof strip
const NordicHoodiesLogo = () => (
  <svg width="80" height="28" viewBox="0 0 80 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="NordicHoodies">
    {/* N crossbar */}
    <rect x="0" y="4" width="2.5" height="18" />
    <rect x="9" y="4" width="2.5" height="18" />
    <polygon points="0,4 2.5,4 11.5,22 9,22" />
    {/* H left post */}
    <rect x="15" y="4" width="2.5" height="18" />
    <rect x="15" y="12.5" width="9" height="2.5" />
    <rect x="21.5" y="4" width="2.5" height="18" />
    {/* wordmark */}
    <text x="28" y="20" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="500" letterSpacing="0.5" opacity="0.65">NordicHoodies</text>
  </svg>
);

const GreenTechLogo = () => (
  <svg width="80" height="28" viewBox="0 0 80 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="GreenTech UF">
    {/* Leaf shape */}
    <path d="M6 22 C6 22 2 16 4 10 C6 4 12 3 14 6 C16 9 14 16 10 19 C8 21 6 22 6 22Z" opacity="0.9" />
    {/* Stem */}
    <line x1="6" y1="22" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5" />
    <text x="19" y="20" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="500" letterSpacing="0.5" opacity="0.65">GreenTech UF</text>
  </svg>
);

const StreetStyleLogo = () => (
  <svg width="80" height="28" viewBox="0 0 80 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="StreetStyle">
    {/* Bold oblique S */}
    <text x="0" y="20" fontFamily="system-ui,sans-serif" fontSize="18" fontWeight="900" fontStyle="italic" letterSpacing="-1">SS</text>
    <text x="26" y="20" fontFamily="system-ui,sans-serif" fontSize="8" fontWeight="600" letterSpacing="2" opacity="0.6">STYLE</text>
  </svg>
);

const FoodieBoxLogo = () => (
  <svg width="80" height="28" viewBox="0 0 80 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="FoodieBox">
    {/* Box outline */}
    <rect x="1" y="7" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    {/* Box lid flaps */}
    <path d="M1 11 L5 7 L13 7 L17 11" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <text x="22" y="20" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="500" letterSpacing="0.5" opacity="0.65">FoodieBox</text>
  </svg>
);

const Hero = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast({ title: t('common.error'), description: error.message, variant: "destructive" });
  };

  const handleApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast({ title: t('common.error'), description: error.message, variant: "destructive" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background layer */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 90% 70% at 50% -5%, hsl(var(--gradient-hero-bg)) 0%, hsl(var(--gradient-hero-bg)) 55%, hsl(var(--gradient-hero-bg)) 100%)",
      }} />

      {/* Ambient orb — violet, top-left (CSS animation for smooth GPU compositing) */}
      <div
        className="absolute pointer-events-none hero-orb-a"
        style={{
          width: 680,
          height: 680,
          top: -180,
          left: -200,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(0 84% 55%) 0%, transparent 68%)",
          filter: "blur(70px)",
        }}
      />

      {/* Ambient orb — teal, bottom-right (CSS animation for smooth GPU compositing) */}
      <div
        className="absolute pointer-events-none hero-orb-b"
        style={{
          width: 520,
          height: 520,
          bottom: -80,
          right: "5%",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(var(--accent-brand)) 0%, transparent 68%)",
          filter: "blur(90px)",
        }}
      />

      {/* Content */}
      <div className="container mx-auto px-6 relative py-12 z-10">
        <div className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-14 xl:gap-24 items-center">

          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight mb-6"
              style={{ lineHeight: 0.95, color: "hsl(var(--foreground))" }}
            >
              {t('hero.headline')}
              <br />
              <span
                style={{
                  background: "var(--gradient-text)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="text-lg md:text-xl font-light max-w-md leading-relaxed mb-10"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {t('hero.subheadline')}
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38 }}
              className="flex flex-wrap gap-2 mb-10"
            >
              {(t('hero.feature_pills', { returnObjects: true }) as string[]).map((pill) => (
                <span
                  key={pill}
                  className="text-xs px-3 py-1.5 rounded-full font-medium bg-muted/60 border border-border text-muted-foreground"
                >
                  {pill}
                </span>
              ))}
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-3"
            >
              {/* UF company wordmark logos */}
              <div className="flex flex-wrap items-center gap-4">
                {[NordicHoodiesLogo, GreenTechLogo, StreetStyleLogo, FoodieBoxLogo].map((Logo, i) => (
                  <div
                    key={i}
                    className="opacity-40 hover:opacity-75 transition-opacity duration-300 grayscale hover:grayscale-0"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    <Logo />
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>120+</span>{" "}
                {t('hero.social_proof')}
              </p>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Auth card ── */}
          <div className="relative min-w-0">
            {/* Card glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
                filter: "blur(40px)",
                transform: "scale(1.25)",
              }}
            />

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, x: 24, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: "hsl(var(--card) / 0.85)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 32px 80px hsl(347 40% 2% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
              }}
              className="relative rounded-2xl p-7 border border-border dark:border-white/8"
            >
              {/* Card header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <h2 className="text-xl font-bold mb-1 text-foreground">
                  {t('hero.cta_primary')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('hero.card_subheader')}
                </p>
              </motion.div>

              {/* OAuth buttons */}
              <div className="space-y-2.5">
                <OAuthButton
                  onClick={() => (window.location.href = "/auth")}
                  logo={<TikTokLogo />}
                  label={t('hero.continue_tiktok')}
                  delay={0.42}
                />
                <OAuthButton
                  onClick={handleGoogle}
                  logo={<GoogleLogo />}
                  label={t('hero.continue_google')}
                  delay={0.52}
                />
                <OAuthButton
                  onClick={handleApple}
                  logo={<AppleLogo />}
                  label={t('hero.continue_apple')}
                  delay={0.62}
                />
              </div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.72 }}
                className="flex items-center gap-3 my-5"
              >
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-medium text-muted-foreground">
                  {t('hero.or_divider')}
                </span>
                <div className="flex-1 h-px bg-border" />
              </motion.div>

              {/* Email option */}
              <motion.a
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.78 }}
                href="/auth?mode=register"
                className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 text-foreground border border-border hover:border-border/80 hover:bg-muted/40"
                style={{
                  background: "hsl(var(--muted) / 0.3)",
                }}
              >
                {t('hero.email_register')}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
              </motion.a>

              {/* Terms note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                className="text-center text-xs mt-4 leading-relaxed text-muted-foreground"
              >
                {t('hero.terms_text')}{" "}
                <a
                  href="/terms-of-service"
                  className="underline underline-offset-2 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {t('hero.terms_link')}
                </a>
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
