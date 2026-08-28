import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "dark" | "outline" | "ghost" | "yellow" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[14px] font-bold transition-all duration-200 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-framboise disabled:cursor-not-allowed disabled:opacity-55";

const variants: Record<Variant, string> = {
  primary: "bg-framboise text-white shadow-framboise hover:bg-framboise-fonce hover:-translate-y-0.5 active:translate-y-0",
  dark: "bg-prune text-white hover:bg-framboise hover:-translate-y-0.5 active:translate-y-0",
  outline: "border border-line bg-white text-prune hover:border-prune/35 hover:-translate-y-0.5 active:translate-y-0",
  ghost: "text-prune/60 hover:text-framboise hover:bg-rose-pale/60",
  yellow: "bg-jaune text-prune hover:brightness-95 hover:-translate-y-0.5 active:translate-y-0",
  danger: "bg-error text-white hover:brightness-90",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-xs",
  md: "h-12 px-5 text-sm",
  lg: "h-[52px] px-6 text-sm",
};

function classes(variant: Variant, size: Size, className?: string) {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "lg",
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "lg",
  className,
  children,
  href,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link href={href} className={classes(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
