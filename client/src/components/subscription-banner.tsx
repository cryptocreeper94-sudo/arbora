import { Info, Crown, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface SubscriptionBannerProps {
  tier: string;
  price: string;
  features?: string[];
  className?: string;
  compact?: boolean;
}

export function SubscriptionBanner({ tier, price, features, className, compact }: SubscriptionBannerProps) {
  const { user } = useAuth();

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border",
        "bg-amber-500/5 border-amber-500/20",
        className
      )} data-testid="banner-subscription-compact">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Crown className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground" data-testid="text-tier-compact">
            {tier} — {price}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {user ? "Upgrade your plan to unlock this feature" : "Subscribe to unlock this feature"}
          </p>
        </div>
        <Link href="/pricing" data-testid="link-upgrade-compact">
          <Button size="sm" variant="default" className="text-xs gap-1 flex-shrink-0" data-testid="button-upgrade-compact">
            View Plans <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border p-5",
      "bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5 border-amber-500/20",
      className
    )} data-testid="banner-subscription">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Crown className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-foreground" data-testid="text-tier-name">{tier}</h3>
            <Badge className="bg-amber-500/15 text-amber-400 text-[10px]" data-testid="badge-tier-price">{price}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {user
              ? "Upgrade your plan to access all features in this section."
              : "Create an account and subscribe to unlock all features in this section."}
          </p>
          {features && features.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`text-feature-${i}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          <Link href="/pricing" data-testid="link-view-plans">
            <Button variant="default" className="text-xs gap-2" data-testid="button-view-plans">
              <Crown className="w-3.5 h-3.5" /> View Plans & Pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface FeatureInfoBubbleProps {
  title: string;
  description: string;
  tier?: string;
  className?: string;
}

export function FeatureInfoBubble({ title, description, tier, className }: FeatureInfoBubbleProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 rounded-xl",
      "bg-card/50 border border-card-border",
      className
    )} data-testid={`info-bubble-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Info className="w-3.5 h-3.5 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-medium text-foreground" data-testid="text-info-title">{title}</p>
          {tier && (
            <Badge className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0" data-testid="badge-info-tier">{tier}</Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed" data-testid="text-info-description">{description}</p>
      </div>
    </div>
  );
}
