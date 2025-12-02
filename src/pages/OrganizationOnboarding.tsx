import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@/hooks/useOrganization";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Loader2, ArrowRight, Link as LinkIcon } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

export default function OrganizationOnboarding() {
  const { createOrganization, joinByCode } = useOrganization();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create form state
  const [orgName, setOrgName] = useState("");
  
  // Join form state
  const [inviteCode, setInviteCode] = useState("");

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

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    const success = await joinByCode(inviteCode.trim());
    setIsSubmitting(false);

    if (success) {
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
          <CardTitle className="text-2xl">Välkommen till Promotley!</CardTitle>
          <CardDescription>
            Skapa en ny organisation eller gå med i en befintlig för att komma igång
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "join")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Skapa ny
              </TabsTrigger>
              <TabsTrigger value="join" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gå med
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
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

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  size="lg"
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
              </form>
            </TabsContent>

            <TabsContent value="join">
              <form onSubmit={handleJoinOrg} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Inbjudningskod</Label>
                  <Input
                    id="inviteCode"
                    placeholder="T.ex. ABC123XY"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    disabled={isSubmitting}
                    required
                    className="uppercase"
                    maxLength={8}
                  />
                  <p className="text-sm text-muted-foreground">
                    Be din teamledare om inbjudningskoden
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Har du fått en inbjudningslänk?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Klicka på länken du fick så ansluter du automatiskt till organisationen
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || !inviteCode.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ansluter...
                    </>
                  ) : (
                    <>
                      Gå med i organisation
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
