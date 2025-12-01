import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Instagram, Music2, Facebook, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface MarketingPost {
  date: string;
  channel: 'instagram' | 'tiktok' | 'facebook';
  title: string;
  content: string;
  tags: string[];
  status: 'scheduled' | 'draft' | 'published';
}

interface MarketingPlan {
  timeframe: {
    start: string;
    end: string;
  };
  goals: string[];
  budgetHints: string[];
  posts: MarketingPost[];
}

interface MarketingPlanCardProps {
  plan: MarketingPlan;
  onImplement: (plan: MarketingPlan, requestId: string) => Promise<void>;
}

const platformIcons = {
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
};

const platformColors = {
  instagram: "bg-pink-500",
  tiktok: "bg-cyan-500",
  facebook: "bg-blue-600",
};

const MarketingPlanCard = ({ plan, onImplement }: MarketingPlanCardProps) => {
  const [isImplementing, setIsImplementing] = useState(false);
  const [implemented, setImplemented] = useState(false);

  const handleImplement = async () => {
    setIsImplementing(true);
    try {
      const requestId = `plan-${Date.now()}`;
      await onImplement(plan, requestId);
      setImplemented(true);
    } catch (error) {
      console.error('Error implementing plan:', error);
    } finally {
      setIsImplementing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sv-SE', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="p-4 md:p-6 bg-muted/50 border-primary/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">Marknadsföringsplan</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(plan.timeframe.start)} - {formatDate(plan.timeframe.end)}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {plan.posts.length} inlägg
          </Badge>
        </div>

        {/* Goals */}
        {plan.goals && plan.goals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Mål:</h4>
            <div className="space-y-1">
              {plan.goals.map((goal, idx) => (
                <p key={idx} className="text-sm flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>{goal}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Posts Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Planerade inlägg:</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {plan.posts.slice(0, 8).map((post, idx) => {
              const Icon = platformIcons[post.channel];
              const colorClass = platformColors[post.channel];
              
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate">{post.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(post.date)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {post.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {plan.posts.length > 8 && (
            <p className="text-xs text-muted-foreground text-center">
              + {plan.posts.length - 8} fler inlägg
            </p>
          )}
        </div>

        {/* Budget Hints */}
        {plan.budgetHints && plan.budgetHints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Budget tips:</h4>
            <div className="space-y-1">
              {plan.budgetHints.slice(0, 3).map((hint, idx) => (
                <p key={idx} className="text-xs text-muted-foreground">
                  • {hint}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="gradient"
          className="w-full"
          onClick={handleImplement}
          disabled={isImplementing || implemented}
        >
          {isImplementing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Implementerar...
            </>
          ) : implemented ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Implementerad!
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Implementera planen
            </>
          )}
        </Button>

        {implemented && (
          <p className="text-xs text-center text-muted-foreground">
            Inläggen har lagts till i din kalender
          </p>
        )}
      </div>
    </Card>
  );
};

export default MarketingPlanCard;
