import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowDown, XCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import CreditsDisplay from "@/components/CreditsDisplay";
import PromoCodeInput from "@/components/PromoCodeInput";
import { useNavigate } from "react-router-dom";
import { STRIPE_CREDIT_PACKAGES, STRIPE_PLANS } from "@/lib/stripeConfig";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export function CreditsSettingsInner() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { credits, getPlanLabel, getTierLevel, refetch: refetchCredits } =
    useUserCredits();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<
    string | null
  >(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [hasActiveStripeSubscription, setHasActiveStripeSubscription] =
    useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    const checkStripeSubscription = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('stripe_subscriptions' as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      setHasActiveStripeSubscription(!!data);
    };
    checkStripeSubscription();
  }, [user]);

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "stripe-portal",
        { body: {} }
      );
      if (error || !data?.url) {
        toast({
          title: t("account.no_subscription"),
          variant: "destructive",
        });
        return;
      }
      window.location.href = data.url;
    } catch {
      toast({
        title: t("common.error"),
        description: t("account.cant_open_billing"),
        variant: "destructive",
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) return;
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          plan: "free_trial",
          max_credits: 1,
          credits_left: 0,
          renewal_date: null,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: t("account.subscription_cancelled") });
      refetchCredits();
      setShowCancelDialog(false);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDowngrade = async () => {
    if (!user?.id || !selectedDowngradePlan) return;
    setIsDowngrading(true);
    try {
      const plan =
        STRIPE_PLANS[selectedDowngradePlan as keyof typeof STRIPE_PLANS];
      const { error } = await supabase
        .from("users")
        .update({
          plan: selectedDowngradePlan as any,
          max_credits: plan.credits,
          credits_left: Math.min(
            credits?.credits_left || 0,
            plan.credits
          ),
        })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: t("account.plan_downgraded") });
      refetchCredits();
      setShowDowngradeDialog(false);
      setSelectedDowngradePlan(null);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setIsDowngrading(false);
    }
  };

  const hasActivePlan =
    credits?.plan && !["free_trial"].includes(credits.plan);
  const currentTierLevel = credits?.plan
    ? getTierLevel(credits.plan)
    : 0;
  const downgradeOptions = Object.entries(STRIPE_PLANS).filter(
    ([key]) => getTierLevel(key) < currentTierLevel
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {t("settings.credits_billing")}
      </h1>

      <div className="space-y-6">
        <div className="rounded-xl bg-card shadow-sm p-4 space-y-3">
          <CreditsDisplay variant="full" />

          <div className="pt-3 border-t border-border">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> {t("account.top_up_credits")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(STRIPE_CREDIT_PACKAGES).map(([key, pkg]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="flex flex-col h-auto py-2"
                  onClick={() =>
                    navigate(`/checkout?package=${key}&type=credits`)
                  }
                >
                  <span className="text-base font-bold">{pkg.credits}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {t("account.credits")}
                  </span>
                  <span className="text-sm font-semibold text-primary mt-0.5">
                    {pkg.price} kr
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            <Button onClick={() => navigate("/pricing")} size="sm">
              <CreditCard className="w-4 h-4 mr-1.5" />
              {hasActivePlan
                ? t("account.upgrade_plan")
                : t("account.choose_plan")}
            </Button>
            {hasActiveStripeSubscription && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPortal}
                disabled={isOpeningPortal}
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                {isOpeningPortal
                  ? t("account.opening")
                  : t("account.manage_subscription")}
              </Button>
            )}
            {hasActivePlan && downgradeOptions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDowngradeDialog(true)}
              >
                <ArrowDown className="w-4 h-4 mr-1.5" />{" "}
                {t("account.downgrade")}
              </Button>
            )}
            {hasActivePlan && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="w-4 h-4 mr-1.5" />{" "}
                {t("account.cancel_plan")}
              </Button>
            )}
          </div>

          <div className="pt-3 border-t border-border">
            <PromoCodeInput
              variant="inline"
              onSuccess={() => refetchCredits()}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("account.dialog_cancel_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("account.dialog_cancel_desc", {
                plan: credits ? getPlanLabel(credits.plan) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("account.keep_plan")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCancelling
                ? t("account.cancelling")
                : t("account.cancel_plan")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDowngradeDialog}
        onOpenChange={setShowDowngradeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("account.dialog_downgrade_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("account.dialog_downgrade_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={selectedDowngradePlan || ""}
              onValueChange={setSelectedDowngradePlan}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("account.choose_plan")} />
              </SelectTrigger>
              <SelectContent>
                {downgradeOptions.map(([key, plan]) => (
                  <SelectItem key={key} value={key}>
                    {plan.name} - {plan.credits} krediter ({plan.price} kr)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSelectedDowngradePlan(null)}
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDowngrade}
              disabled={isDowngrading || !selectedDowngradePlan}
            >
              {isDowngrading ? t("account.downgrading") : t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CreditsSettings() {
  return (
    <DashboardLayout>
      <CreditsSettingsInner />
    </DashboardLayout>
  );
}
