import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "nimbus-card-3d nimbus-hologram rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-cyan-950/20 backdrop-blur-xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
