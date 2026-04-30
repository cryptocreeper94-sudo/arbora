import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-white/20 shadow-lg shadow-black/5",
        "bg-white/10 backdrop-blur-xl",
        hover && "transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-black/10",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassNav({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <nav
      className={cn(
        "bg-white/5 backdrop-blur-[30px] border-b border-white/10",
        className
      )}
    >
      {children}
    </nav>
  );
}
