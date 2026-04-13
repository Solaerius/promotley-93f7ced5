// Admin pages are Swedish-only (internal use). i18n not applied here.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { SWISH_PLANS, CREDIT_PACKAGES, SwishPlanType, CreditPackageType } from "@/lib/swishConfig";

interface SwishOrder {
  id: string;
  order_id: string;
  user_id: string | null;
  email: string;
  name: string;
  company_name: string | null;
  plan: string;
  amount: number;
  swish_message: string;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// Helper to get product name from plan field
const getProductName = (plan: string): string => {
  if (plan.startsWith("credits_")) {
    const packageKey = plan.replace("credits_", "") as CreditPackageType;
    const pkg = CREDIT_PACKAGES[packageKey];
    return pkg ? `${pkg.credits} krediter (påfyllning)` : plan;
  }
  const planConfig = SWISH_PLANS[plan as SwishPlanType];
  return planConfig ? planConfig.name : plan;
};

// Helper to check if order is a credit package
const isCreditPackage = (plan: string): boolean => plan.startsWith("credits_");

const AdminSwishOrders = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: isAdminLoading } = useAdminStatus();
  
  const [orders, setOrders] = useState<SwishOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SwishOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      navigate("/dashboard");
      toast.error("Du har inte behörighet att se denna sida");
    }
  }, [isAdmin, isAdminLoading, navigate]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("swish_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data as SwishOrder[]);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Kunde inte hämta beställningar");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const handleApprove = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update order status
      const { error: orderError } = await supabase
        .from("swish_orders")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id);

      if (orderError) throw orderError;

      // If user exists, update their plan or credits
      if (selectedOrder.user_id) {
        if (isCreditPackage(selectedOrder.plan)) {
          // Credit package - add credits to existing balance
          const packageKey = selectedOrder.plan.replace("credits_", "") as CreditPackageType;
          const pkg = CREDIT_PACKAGES[packageKey];
          if (pkg) {
            // Get current credits
            const { data: userData } = await supabase
              .from("users")
              .select("credits_left")
              .eq("id", selectedOrder.user_id)
              .single();
            
            const currentCredits = userData?.credits_left || 0;
            
            const { error: userError } = await supabase
              .from("users")
              .update({
                credits_left: currentCredits + pkg.credits,
              })
              .eq("id", selectedOrder.user_id);

            if (userError) {
              console.error("Error updating user credits:", userError);
            }
          }
        } else {
          // Subscription plan
          const planConfig = SWISH_PLANS[selectedOrder.plan as SwishPlanType];
          if (planConfig) {
            const { error: userError } = await supabase
              .from("users")
              .update({
                plan: selectedOrder.plan as "starter" | "growth" | "pro",
                max_credits: planConfig.credits,
                credits_left: planConfig.credits,
                renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              })
              .eq("id", selectedOrder.user_id);

            if (userError) {
              console.error("Error updating user plan:", userError);
            }
          }
        }
      }

      toast.success("Betalning godkänd!");
      setApproveDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error approving order:", error);
      toast.error("Kunde inte godkänna betalningen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("swish_orders")
        .update({
          status: "rejected",
          rejected_by: user?.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Betalning avvisad");
      setRejectDialogOpen(false);
      setSelectedOrder(null);
      setRejectionReason("");
      fetchOrders();
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast.error("Kunde inte avvisa betalningen");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Väntar</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><Check className="w-3 h-3 mr-1" />Godkänd</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><X className="w-3 h-3 mr-1" />Avvisad</Badge>;
      default:
        return null;
    }
  };

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till Admin
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Swish-betalningar</h1>
            <p className="text-muted-foreground mt-1">Hantera och godkänn Swish-betalningar</p>
          </div>
          <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Uppdatera
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Sök på namn, e-post eller order-ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" && "Alla"}
                {status === "pending" && "Väntar"}
                {status === "approved" && "Godkända"}
                {status === "rejected" && "Avvisade"}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground">Totalt</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="bg-yellow-500/5 rounded-xl p-4 border border-yellow-500/20">
            <p className="text-sm text-yellow-600">Väntar</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === "pending").length}
            </p>
          </div>
          <div className="bg-green-500/5 rounded-xl p-4 border border-green-500/20">
            <p className="text-sm text-green-600">Godkända</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === "approved").length}
            </p>
          </div>
          <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
            <p className="text-sm text-red-600">Avvisade</p>
            <p className="text-2xl font-bold text-red-600">
              {orders.filter(o => o.status === "rejected").length}
            </p>
          </div>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery || statusFilter !== "all" 
              ? "Inga beställningar matchar din sökning"
              : "Inga beställningar ännu"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border/50 overflow-hidden"
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{order.name}</p>
                        <p className="text-sm text-muted-foreground">{order.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="font-medium">{order.amount} kr</p>
                        <p className="text-sm text-muted-foreground">
                          {getProductName(order.plan)}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/50 p-4 bg-muted/20"
                  >
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Order-ID:</span>
                          <p className="font-mono">{order.order_id}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Företag:</span>
                          <p>{order.company_name || "-"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Datum:</span>
                          <p>{new Date(order.created_at).toLocaleString("sv-SE")}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Swish-meddelande:</span>
                          <p className="font-mono text-sm bg-muted/50 p-2 rounded">{order.swish_message}</p>
                        </div>
                        {order.rejection_reason && (
                          <div>
                            <span className="text-sm text-muted-foreground">Avvisningsorsak:</span>
                            <p className="text-red-600">{order.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {order.status === "pending" && (
                      <div className="flex gap-2 pt-4 border-t border-border/50">
                        <Button
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setApproveDialogOpen(true);
                          }}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Godkänn
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-600/30 hover:bg-red-600/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Avvisa
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Godkänn betalning</DialogTitle>
              <DialogDescription>
                Är du säker på att du vill godkänna denna betalning? {selectedOrder && (
                  isCreditPackage(selectedOrder.plan) 
                    ? `${CREDIT_PACKAGES[selectedOrder.plan.replace("credits_", "") as CreditPackageType]?.credits || 0} krediter kommer att läggas till på kundens konto.`
                    : `Kundens konto kommer att uppgraderas till ${getProductName(selectedOrder.plan)}.`
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kund:</span>
                <span>{selectedOrder?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Belopp:</span>
                <span>{selectedOrder?.amount} kr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order-ID:</span>
                <span className="font-mono">{selectedOrder?.order_id}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                Avbryt
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700" 
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Godkänner...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Godkänn betalning
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Avvisa betalning</DialogTitle>
              <DialogDescription>
                Är du säker på att du vill avvisa denna betalning?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kund:</span>
                  <span>{selectedOrder?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Belopp:</span>
                  <span>{selectedOrder?.amount} kr</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Orsak (valfritt)</label>
                <Textarea
                  placeholder="Ange orsak till avvisning..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}>
                Avbryt
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Avvisar...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Avvisa betalning
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminSwishOrders;
