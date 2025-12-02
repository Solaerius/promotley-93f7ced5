import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganization } from "@/hooks/useOrganization";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

export default function CreateOrganization() {
  const { createOrganization } = useOrganization();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgName, setOrgName] = useState("");

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsSubmitting(true);
    const orgId = await createOrganization(orgName.trim());
    setIsSubmitting(false);

    if (orgId) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-12">
      <Card className="w-full max-w-lg shadow-elegant">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <img src={logo} alt="Promotley Logo" className="w-12 h-12" />
            <span className="font-bold text-2xl">Promotley</span>
          </Link>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6" />
            Skapa ny organisation
          </CardTitle>
          <CardDescription>
            Skapa en ny organisation för att börja samarbeta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleCreateOrg} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organisationsnamn</Label>
              <Input
                id="orgName"
                placeholder="T.ex. Mitt UF-företag"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <p className="text-sm text-muted-foreground">
                Du kan ändra detta senare i inställningarna
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Som grundare kan du:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Bjuda in teammedlemmar</li>
                <li>• Hantera behörigheter för alla</li>
                <li>• Koppla sociala medier-konton</li>
                <li>• Använda alla AI-funktioner</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="flex-1"
                disabled={isSubmitting || !orgName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Skapar...
                  </>
                ) : (
                  <>
                    Skapa organisation
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
