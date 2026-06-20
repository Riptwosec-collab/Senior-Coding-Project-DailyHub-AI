import {
  Children,
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
  asChild?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-2xl font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "px-4 py-2 text-xs" : "px-5 py-3 text-sm",
    variant === "primary" &&
      "bg-gradient-to-r from-cyan-400 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:opacity-95",
    variant === "secondary" && "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
    variant === "danger" && "border border-rose-300/30 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15",
    className,
  );

  if (asChild) {
    const child = Children.only(children);

    if (isValidElement<{ className?: string }>(child)) {
      return cloneElement(child as ReactElement<{ className?: string }>, {
        className: cn(classes, child.props.className),
      });
    }
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
