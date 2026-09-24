import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "ghost"
  | "link";

type ButtonSize = "xs" | "sm" | "md" | "lg";

const baseClasses =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-xs",
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-contrast shadow-card hover:bg-accent-hover hover:shadow-raised",
  secondary:
    "border border-border bg-surface text-secondary shadow-card hover:border-border-strong hover:bg-surface-subtle hover:text-primary",
  destructive:
    "bg-danger text-white shadow-card hover:opacity-90 hover:shadow-raised",
  ghost: "text-secondary hover:bg-neutral-muted hover:text-primary",
  link: "text-accent underline-offset-4 hover:underline",
};

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps = (
  | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ButtonHTMLAttributes<HTMLButtonElement>
) &
  BaseProps;

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    icon,
    iconRight,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  const content = (
    <>
      {icon}
      {children}
      {iconRight}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    return (
      <Link
        href={props.href}
        className={classes}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
