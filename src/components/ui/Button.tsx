import type { ComponentProps, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonFormat = "icon" | "text" | "iconThenText" | "textThenIcon";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#5b4eff] text-white hover:bg-[#4a3dee] shadow-[0_1px_6px_rgba(91,78,255,0.35)] hover:shadow-[0_2px_12px_rgba(91,78,255,0.45)]",
  secondary:
    "border border-black/[0.1] bg-white text-gray-700 hover:bg-gray-50 hover:border-black/[0.15]",
  tertiary:
    "bg-transparent text-gray-600 hover:bg-black/[0.05] hover:text-gray-900",
};

type ButtonProps = {
  variant: ButtonVariant;
  text?: string;
  icon?: ReactNode;
  format?: ButtonFormat;
} & Omit<ComponentProps<"button">, "children">;

export const Button = ({
  variant,
  type = "button",
  text,
  icon,
  format = "text",
  disabled = false,
  className = "",
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "focusable flex items-center gap-normal rounded-lg px-normal py-small text-sm font-medium transition-all duration-150",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        variantStyles[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {format === "icon" && icon}
      {format === "text" && text}
      {format === "iconThenText" && (
        <>
          {icon}
          {text}
        </>
      )}
      {format === "textThenIcon" && (
        <>
          {text}
          {icon}
        </>
      )}
    </button>
  );
};
