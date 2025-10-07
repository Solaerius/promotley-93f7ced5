import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Användarvillkor</h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground mb-4">Senast uppdaterad: {new Date().toLocaleDateString("sv-SE")}</p>
            <p>
              Välkommen till Promotley! Dessa användarvillkor ("Villkor") reglerar din användning av Promotleys
              AI-drivna marknadsföringsplattform och tillhörande tjänster. Genom att använda vår tjänst godkänner du
              dessa villkor.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Tjänstebeskrivning</h2>
            <p className="mb-4">
              Promotley är en AI-driven marknadsföringsplattform specifikt utformad för UF-företag (Ung Företagsamhet).
              Vår tjänst inkluderar:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Social Media Integration:</strong> Koppling till Instagram, Facebook och TikTok för att hämta
                statistik och analysera ditt innehåll
              </li>
              <li>
                <strong>AI-analys:</strong> Automatisk analys av dina inlägg, engagemang och målgruppsinteraktioner
              </li>
              <li>
                <strong>Innehållsförslag:</strong> AI-genererade rekommendationer för att förbättra din marknadsföring
              </li>
              <li>
                <strong>Insikter och rapporter:</strong> Detaljerade analyser av dina sociala mediekanaler
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Kontoskapande och användaransvar</h2>
            <p className="mb-4">För att använda Promotley måste du:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vara minst 13 år gammal</li>
              <li>Tillhandahålla korrekt och aktuell information vid registrering</li>
              <li>Hålla dina inloggningsuppgifter säkra och konfidentiella</li>
              <li>Ansvara för all aktivitet som sker under ditt konto</li>
              <li>Meddela oss omedelbart om obehörig användning av ditt konto</li>
            </ul>
            <p className="mt-4">
              Du är ansvarig för att säkerställa att din användning av Promotley följer alla tillämpliga lagar och
              föreskrifter.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Koppling av sociala mediekonton</h2>
            <p className="mb-4">
              Genom att koppla dina sociala mediekonton (Instagram, Facebook, TikTok) till Promotley ger du oss
              behörighet att:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Hämta och analysera dina publika inlägg och statistik</li>
              <li>Samla in data om engagemang och målgruppsinteraktioner</li>
              <li>Använda denna information för att generera AI-baserade innehållsförslag</li>
            </ul>
            <p className="mt-4">
              Du kan när som helst koppla bort dina konton via inställningssidan. Du ansvarar för att följa respektive
              plattforms användarvillkor och riktlinjer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. AI-genererat innehåll</h2>
            <p className="mb-4">
              Promotleys AI-tjänst tillhandahåller innehållsförslag och marknadsföringsrekommendationer baserat på dina
              data. Observera att:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-genererade förslag är rekommendationer och inte garantier för resultat</li>
              <li>Du är ensam ansvarig för allt innehåll du publicerar baserat på våra förslag</li>
              <li>Vi garanterar inte riktigheten, fullständigheten eller användbarheten av AI-genererade förslag</li>
              <li>Du bör alltid granska och anpassa förslag innan publicering</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Prenumerationer och betalning</h2>
            <p className="mb-4">Promotley erbjuder olika prenumerationsplaner:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Gratis plan:</strong> Grundläggande funktioner med begränsad användning
              </li>
              <li>
                <strong>Betalda planer:</strong> Utökade funktioner och högre användningsgränser
              </li>
            </ul>
            <p className="mt-4 mb-4">För betalda prenumerationer gäller följande:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Betalning sker i förskott på månadsbasis eller årsbasis</li>
              <li>Prenumerationer förnyas automatiskt såvida inte du säger upp dem</li>
              <li>Du kan när som helst säga upp din prenumeration via inställningssidan</li>
              <li>Återbetalning sker inte för oanvända delar av prenumerationsperioden</li>
              <li>Vi förbehåller oss rätten att ändra priser med minst 30 dagars varsel</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Immateriella rättigheter</h2>
            <p className="mb-4">
              <strong>Promotleys rättigheter:</strong> All programvara, design, text och annan innehåll på Promotley är
              vår eller våra licensgivares egendom och skyddas av upphovsrättslagar.
            </p>
            <p className="mb-4">
              <strong>Dina rättigheter:</strong> Du behåller alla rättigheter till ditt innehåll och data som du laddar
              upp till Promotley. Genom att använda tjänsten ger du oss dock en begränsad licens att använda ditt
              innehåll för att tillhandahålla och förbättra tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Förbjuden användning</h2>
            <p className="mb-4">Du får inte använda Promotley för att:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bryta mot lagar eller föreskrifter</li>
              <li>Sprida skadligt, bedrägligt eller olagligt innehåll</li>
              <li>Manipulera eller automatisera användningen av tjänsten på otillåtet sätt</li>
              <li>Försöka få obehörig åtkomst till systemet eller andra användares konton</li>
              <li>Använda tjänsten för att skicka spam eller oönskad marknadsföring</li>
              <li>Kopiera, ändra eller skapa härledda verk från vår programvara</li>
              <li>Konkurrera med Promotley genom att kopiera våra funktioner eller koncept</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Tillgänglighet och support</h2>
            <p>
              Vi strävar efter att hålla Promotley tillgängligt 24/7, men vi garanterar inte oavbruten tillgång. Vi kan
              tillfälligt avbryta tjänsten för underhåll, uppgraderingar eller av andra skäl. Vi ansvarar inte för
              förlust eller skada som uppstår till följd av driftstopp.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Ansvarsbegränsning</h2>
            <p className="mb-4">I den utsträckning som tillåts enligt lag:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Promotley tillhandahålls "i befintligt skick" utan garantier av något slag</li>
              <li>Vi ansvarar inte för indirekta, tillfälliga eller följdskador</li>
              <li>
                Vårt totala ansvar är begränsat till det belopp du betalat för tjänsten under de senaste 12 månaderna
              </li>
              <li>Vi ansvarar inte för innehåll eller åtgärder från tredje parter (sociala medieplattformar)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Uppsägning</h2>
            <p className="mb-4">
              <strong>Din rätt att säga upp:</strong> Du kan när som helst avsluta ditt konto genom inställningssidan.
            </p>
            <p className="mb-4">
              <strong>Vår rätt att säga upp:</strong> Vi kan stänga av eller avsluta ditt konto om:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Du bryter mot dessa användarvillkor</li>
              <li>Din användning skadar andra användare eller våra system</li>
              <li>Du inte betalar för din prenumeration</li>
              <li>Vi är skyldiga att göra det enligt lag</li>
            </ul>
            <p className="mt-4">Vid uppsägning kommer vi att radera dina data enligt vår integritetspolicy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Ändringar av villkoren</h2>
            <p>
              Vi kan uppdatera dessa villkor då och då. Vi kommer att meddela dig om väsentliga ändringar via e-post
              eller genom ett meddelande på vår webbplats minst 30 dagar innan ändringarna träder i kraft. Din fortsatta
              användning av tjänsten efter ändringar innebär att du godkänner de uppdaterade villkoren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Tvistlösning</h2>
            <p>
              Dessa villkor ska tolkas enligt svensk lag. Tvister ska i första hand lösas genom förhandling. Om
              förhandling misslyckas ska tvisten avgöras av svensk domstol.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Särskilda villkor för UF-företag</h2>
            <p className="mb-4">Eftersom Promotley är utformat för UF-företag:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vi förstår att ditt UF-företag är tidsbegränsat (vanligtvis ett läsår)</li>
              <li>Du kan exportera all din data innan du avslutar ditt konto</li>
              <li>Vi erbjuder särskild support för att hjälpa dig maximera din marknadsföring under UF-året</li>
              <li>Rabatterade priser kan vara tillgängliga för verifierade UF-företag</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Kontaktinformation</h2>
            <p>Om du har frågor om dessa användarvillkor, vänligen kontakta oss på:</p>
            <div className="mt-4 space-y-2">
              <p>
                <strong>E-post (Allmänt):</strong> uf@promotley.se
              </p>
              <p>
                <strong>Support:</strong> support@promotley.se
              </p>
              <p>
                <strong>Kontaktpersoner:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Jonas.khaldi@promotley.se</li>
                <li>Thami.Alami@promotley.se</li>
                <li>Eddie.Ervenius@promotley.se</li>
              </ul>
              <p className="mt-4">
                <strong>Adress:</strong> Borgarfjordsgatan 6C, 164 40 Kista, Sverige
              </p>
            </div>
          </section>

          <section className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Genom att använda Promotley bekräftar du att du har läst, förstått och godkänt dessa användarvillkor samt
              vår integritetspolicy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
