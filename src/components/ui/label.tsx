"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Optional text to display when a field is required
   */
  requiredIndicator?: React.ReactNode;
  /**
   * Whether the associated form field is required
   */
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, requiredIndicator, ...props }, ref) => {
    const required = props.required ? (
      requiredIndicator || <span className="text-destructive">*</span>
    ) : null;

    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      >
        {children}
        {required}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Label }
