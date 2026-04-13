import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowLeft, Smartphone, CreditCard, Zap, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import {
  SWISH_PLANS,
  CREDIT_PACKAGES,
  SwishPlanType,
  CreditPackageType,
  generateOrderId,
  SWISH_CONFIG,
  SWISH_QR_IMAGES
} from "@/lib/swishConfig";

const SwishCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const checkoutType = searchParams.get("type") || "plan"; // "plan" or "credits"
  const planParam = searchParams.get("plan") as SwishPlanType | null;
  const packageParam = searchParams.get("package") as CreditPackageType | null;

  const [step, setStep] = useState<"details" | "payment" | "confirmation">("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId] = useState(generateOrderId());

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
  });

  // Determine what we're purchasing
  const isPlanPurchase = checkoutType === "plan" && planParam && SWISH_PLANS[planParam];
  const isCreditPurchase = checkoutType === "credits" && packageParam && CREDIT_PACKAGES[packageParam];

  const currentItem = isPlanPurchase
    ? SWISH_PLANS[planParam!]
    : isCreditPurchase
      ? CREDIT_PACKAGES[packageParam!]
      : null;

  const itemName = isPlanPurchase
    ? currentItem?.name
    : isCreditPurchase
      ? `${currentItem?.credits} krediter`
      : "";

  const itemPrice = currentItem?.price || 0;

  // Get current user data
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData(prev => ({
          ...prev,
          email: user.email || "",
        }));

        // Get user profile data
        const { data: userData } = await supabase
          .from("users")
          .select("company_name")
          .eq("id", user.id)
          .single();

        if (userData?.company_name) {
          setFormData(prev => ({
            ...prev,
            companyName: userData.company_name || "",
          }));
        }
      }
    };
    fetchUser();
  }, []);

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('swish.invalid_product_title')}</h1>
          <p className="text-muted-foreground mb-6">{t('swish.invalid_product_desc')}</p>
          <Button onClick={() => navigate("/pricing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('swish.back_to_pricing')}
          </Button>
        </div>
      </div>
    );
  }

  // Get the correct QR image path
  const qrImageKey = isPlanPurchase ? planParam : packageParam;
  const qrImagePath = qrImageKey ? SWISH_QR_IMAGES[qrImageKey] : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${t('swish.copied')}`);
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error(t('swish.fill_name_email'));
      return;
    }

    setStep("payment");
  };

  const handlePaymentConfirm = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const orderType = isPlanPurchase ? planParam : `credits_${packageParam}`;

      const { error } = await supabase.from("swish_orders").insert({
        order_id: orderId,
        user_id: user?.id || null,
        email: formData.email,
        name: formData.name,
        company_name: formData.companyName || null,
        plan: orderType,
        amount: itemPrice,
        swish_message: orderId,
        status: "pending",
      });

      if (error) throw error;

      // Send Discord notification about new order
      try {
        await supabase.functions.invoke("notify-swish-order", {
          body: {
            orderId,
            productName: itemName,
            amount: itemPrice,
            customerName: formData.name,
            customerEmail: formData.email,
          },
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
        // Don't fail the order if notification fails
      }

      setStep("confirmation");
      toast.success(t('swish.payment_registered'));
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(t('common.error_generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => step === "details" ? navigate(isPlanPurchase ? "/pricing" : "/account") : setStep("details")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('swish.back')}
        </Button>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["details", "payment", "confirmation"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s ? "bg-primary text-primary-foreground" :
                ["details", "payment", "confirmation"].indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {["details", "payment", "confirmation"].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 2 && <div className={`w-12 h-0.5 mx-2 ${["details", "payment", "confirmation"].indexOf(step) > i ? "bg-primary/20" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Item summary */}
              <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isCreditPurchase ? (
                      <Zap className="w-6 h-6 text-warning" />
                    ) : (
                      <CreditCard className="w-6 h-6 text-primary" />
                    )}
                    <h2 className="text-xl font-bold">{itemName}</h2>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {itemPrice} kr{isPlanPurchase && t('swish.per_month')}
                  </span>
                </div>
                {isPlanPurchase && 'features' in currentItem && (
                  <ul className="space-y-2">
                    {currentItem.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                {isCreditPurchase && (
                  <p className="text-sm text-muted-foreground">
                    {t('swish.one_time_credits', { credits: currentItem.credits })}
                  </p>
                )}
              </div>

              {/* Details form */}
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold">{t('swish.your_details')}</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">{t('swish.name_label')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('swish.name_placeholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('swish.email_label')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('swish.email_placeholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">{t('swish.company_label')}</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder={t('swish.company_placeholder')}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('swish.continue_to_payment')}
                </Button>
              </form>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{t('swish.pay_with_swish')}</h2>
                <p className="text-muted-foreground">
                  {t('swish.scan_qr')}
                </p>
              </div>

              {/* QR Code - Static image */}
              <div className="flex justify-center">
                <img
                  src={qrImagePath}
                  alt={t('swish.qr_alt')}
                  className="w-[320px] h-auto"
                />
              </div>

              {/* Important notice */}
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium text-center">
                  {t('swish.important_notice')}
                </p>
              </div>

              {/* Payment details with copy buttons */}
              <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <span className="font-medium">{t('swish.swish_number')}</span>
                    <span className="text-muted-foreground">{SWISH_CONFIG.phoneNumber}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(SWISH_CONFIG.phoneNumber, "Nummer")}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {t('swish.copy')}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="font-medium">{t('swish.amount')}</span>
                    <span className="text-xl font-bold text-primary">{itemPrice} kr</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(itemPrice.toString(), "Belopp")}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {t('swish.copy')}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-primary font-bold">M</div>
                    <span className="font-medium">{t('swish.message')}</span>
                    <span className="font-mono bg-muted/50 px-2 py-1 rounded text-sm font-bold">{orderId}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(orderId, "Order-kod")}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {t('swish.copy')}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50 mt-4">
                  {t('swish.copy_msg')}
                </p>
              </div>

              {/* Confirm button */}
              <Button
                onClick={handlePaymentConfirm}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
                variant="gradient"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('swish.registering')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t('swish.i_have_paid')}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t('swish.order_id_label')} <span className="font-mono">{orderId}</span>
              </p>
            </motion.div>
          )}

          {step === "confirmation" && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-primary" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{t('swish.thank_you_title')}</h2>
                <p className="text-muted-foreground">
                  {isPlanPurchase ? t('swish.thank_you_desc_plan') : t('swish.thank_you_desc_credits')}
                </p>
              </div>

              <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('swish.order_id')}</span>
                  <span className="font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('swish.product')}</span>
                  <span>{itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('swish.amount_label')}</span>
                  <span>{itemPrice} kr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('swish.status')}</span>
                  <span className="text-yellow-600 dark:text-yellow-500">{t('swish.status_pending')}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('swish.email_confirm')}
              </p>

              <Button onClick={() => navigate("/dashboard")} className="w-full" size="lg">
                {t('swish.go_to_dashboard')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SwishCheckout;
