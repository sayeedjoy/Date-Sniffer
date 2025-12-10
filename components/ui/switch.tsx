import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full bg-muted transition-colors peer-checked:bg-primary"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 translate-x-0.5 rounded-full bg-background shadow transition-transform peer-checked:translate-x-4"
            )}
          />
        </span>
      </label>
    );
  }
);
Switch.displayName = "Switch";

