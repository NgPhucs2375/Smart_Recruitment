import { cn } from "@/lib/utils";

export const colors = {
  primary: {
    50: "rgb(var(--color-primary-50) / <alpha-value>)",
    100: "rgb(var(--color-primary-100) / <alpha-value>)",
    200: "rgb(var(--color-primary-200) / <alpha-value>)",
    300: "rgb(var(--color-primary-300) / <alpha-value>)",
    400: "rgb(var(--color-primary-400) / <alpha-value>)",
    500: "rgb(var(--color-primary-500) / <alpha-value>)",
    600: "rgb(var(--color-primary-600) / <alpha-value>)",
    700: "rgb(var(--color-primary-700) / <alpha-value>)",
    800: "rgb(var(--color-primary-800) / <alpha-value>)",
    900: "rgb(var(--color-primary-900) / <alpha-value>)",
    950: "rgb(var(--color-primary-950) / <alpha-value>)",
  },
  surface: {
    50: "rgb(var(--color-surface-50) / <alpha-value>)",
    100: "rgb(var(--color-surface-100) / <alpha-value>)",
    200: "rgb(var(--color-surface-200) / <alpha-value>)",
    300: "rgb(var(--color-surface-300) / <alpha-value>)",
    400: "rgb(var(--color-surface-400) / <alpha-value>)",
    500: "rgb(var(--color-surface-500) / <alpha-value>)",
    600: "rgb(var(--color-surface-600) / <alpha-value>)",
    700: "rgb(var(--color-surface-700) / <alpha-value>)",
    800: "rgb(var(--color-surface-800) / <alpha-value>)",
    900: "rgb(var(--color-surface-900) / <alpha-value>)",
    950: "rgb(var(--color-surface-950) / <alpha-value>)",
  },
};

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
};

export const borderRadius = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px",
};

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};

export const transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  normal: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
};

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export const componentVariants = {
  card: {
    base: "bg-card text-card-foreground rounded-xl border border-border shadow-sm",
    elevated: "bg-card text-card-foreground rounded-xl border border-border shadow-lg",
    outlined: "bg-transparent text-card-foreground rounded-xl border-2 border-border",
  },
  button: {
    base: "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    link: "text-primary underline-offset-4 hover:underline",
  },
  input: {
    base: "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    error: "border-destructive focus-visible:ring-destructive",
  },
  badge: {
    base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border border-border",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
};

export function card(className?: string, variant: keyof typeof componentVariants.card = "base") {
  return cn(componentVariants.card[variant], className);
}

export function button(className?: string, variant: keyof typeof componentVariants.button = "primary") {
  return cn(componentVariants.button.base, componentVariants.button[variant], className);
}

export function input(className?: string, variant: keyof typeof componentVariants.input = "base") {
  return cn(componentVariants.input[variant], className);
}

export function badge(className?: string, variant: keyof typeof componentVariants.badge = "default") {
  return cn(componentVariants.badge.base, componentVariants.badge[variant], className);
}