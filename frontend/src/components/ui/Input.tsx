import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, rightIcon, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label ? (
          <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <input
            id={id}
            ref={ref}
            className={cn(
              "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightIcon}
            </div>
          ) : null}
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
