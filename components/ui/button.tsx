import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
  ghost: "bg-transparent hover:bg-muted text-foreground",
  outline:
    "border border-input bg-background hover:bg-muted text-foreground shadow-sm",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

type Variant = keyof typeof buttonVariants;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", block = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
          "ring-offset-background",
          buttonVariants[variant],
          block && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

