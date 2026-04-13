import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Integritetspolicy</h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground mb-4">Senast uppdaterad: {new Date().toLocaleDateString("sv-SE")}</p>
            <p>
              Denna integritetspolicy beskriver hur Promotley ("vi", "oss", "vår") samlar in, använder och skyddar din
              personliga information när du använder vår tjänst.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information vi samlar in</h2>
            <p className="mb-4">Vi samlar in följande typer av information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Kontoinformation:</strong> E-postadress, företagsnamn och annan information du tillhandahåller
                vid registrering
              </li>
              <li>
                <strong>Sociala medier-data:</strong> När du kopplar dina sociala mediekonton (Instagram, TikTok,
                Facebook) får vi tillgång till publikt tillgänglig data såsom inlägg, engagemang och statistik
              </li>
              <li>
                <strong>Användningsdata:</strong> Information om hur du använder vår tjänst, inklusive besökta sidor och
                funktioner
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Hur vi använder din information</h2>
            <p className="mb-4">Vi använder din information för att:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tillhandahålla och förbättra vår AI-drivna marknadsföringstjänst</li>
              <li>Analysera dina sociala medier och generera personliga innehållsförslag</li>
              <li>Kommunicera med dig om din tjänst och uppdateringar</li>
              <li>Säkerställa säkerheten och integriteten hos vår plattform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Datadelning och tredje part</h2>
            <p>Vi delar inte din personliga information med tredje part utan ditt samtycke, förutom:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>När det krävs enligt lag</li>
              <li>För att skydda våra rättigheter och säkerhet</li>
              <li>Med tjänsteleverantörer som hjälper oss tillhandahålla tjänsten (t.ex. cloud-hosting)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Säkerhet</h2>
            <p>
              Vi vidtar lämpliga tekniska och organisatoriska åtgärder för att skydda din personliga information mot
              obehörig åtkomst, förlust eller missbruk. All data överförs krypterat via HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Dina rättigheter</h2>
            <p className="mb-4">Du har rätt att:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Få tillgång till dina personuppgifter</li>
              <li>Rätta felaktiga uppgifter</li>
              <li>Radera ditt konto och dina uppgifter</li>
              <li>Exportera dina data</li>
              <li>Återkalla samtycke till databehandling</li>
            </ul>
            <p className="mt-4">
              Du kan utöva dessa rättigheter genom inställningssidan i din kontoprofil eller genom att kontakta oss.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Cookies och spårning</h2>
            <p>
              Vi använder cookies och liknande tekniker för att förbättra din upplevelse på vår webbplats. Du kan
              kontrollera cookie-inställningar genom din webbläsare.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Barn</h2>
            <p>
              Vår tjänst är inte avsedd för barn under 13 år. Vi samlar inte medvetet in personlig information från
              barn.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Ändringar av integritetspolicyn</h2>
            <p>
              Vi kan uppdatera denna integritetspolicy då och då. Vi kommer att meddela dig om väsentliga ändringar via
              e-post eller genom ett meddelande på vår webbplats.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Kontakta oss</h2>
            <p>
              Om du har frågor om denna integritetspolicy eller hur vi hanterar dina personuppgifter, vänligen kontakta
              oss på:
            </p>
            <p className="mt-4">
              E-post: uf@promotley.se
              <br />
              Adress: Promotley, Stockholm, Sverige
            </p>
          </section>

          <section className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Genom att använda Promotley godkänner du denna integritetspolicy och vår behandling av dina
              personuppgifter enligt beskrivningen ovan.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
