import { cn } from "@/lib/utils";
import { Check, Shield, Star, Crown } from "lucide-react";

type TrustLevel = 1 | 2 | 3 | 4;

const trustConfig: Record<TrustLevel, { label: string; icon: typeof Check; colorClass: string; bgClass: string }> = {
  1: { label: "Basic", icon: Check, colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
  2: { label: "Verified", icon: Shield, colorClass: "text-emerald-400", bgClass: "bg-emerald-400/10" },
  3: { label: "Premium", icon: Star, colorClass: "text-amber-500", bgClass: "bg-amber-500/10" },
  4: { label: "Elite", icon: Crown, colorClass: "text-amber-300", bgClass: "bg-amber-300/10" },
};

interface TrustBadgeProps {
  level: TrustLevel;
  className?: string;
  showLabel?: boolean;
}

export function TrustBadge({ level, className, showLabel = true }: TrustBadgeProps) {
  const config = trustConfig[level];
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full", config.bgClass, className)}>
      <Icon className={cn("w-3.5 h-3.5", config.colorClass)} />
      {showLabel && (
        <span className={cn("text-xs font-medium", config.colorClass)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

interface TrustScoreProps {
  score: number;
  className?: string;
}

export function TrustScore({ score, className }: TrustScoreProps) {
  const percentage = (score / 1000) * 100;
  const color = score >= 800 ? "text-emerald-500" : score >= 600 ? "text-amber-500" : "text-slate-500";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/30"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            className={color}
          />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center text-[10px] font-bold", color)}>
          {score}
        </span>
      </div>
    </div>
  );
}
