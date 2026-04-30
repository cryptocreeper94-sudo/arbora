import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]",
      className
    )}>
      {children}
    </div>
  );
}

export function BentoItem({ children, className }: BentoGridProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {children}
    </div>
  );
}
