import React from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "accent-inverted"
  | "accent-on-dark"
  | "outline"
  | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
}

const getVariantClasses = (variant: ButtonVariant): string => {
  switch (variant) {
    case "primary":
      return "bg-theme-primary text-white hover:bg-theme-primary-dark shadow-soft hover:shadow-lg";
    case "secondary":
      return "bg-theme-secondary text-white hover:bg-theme-secondary-dark shadow-soft hover:shadow-lg";
    case "accent":
      return "bg-theme-accent text-white hover:bg-theme-accent-dark shadow-soft hover:shadow-lg";
    case "accent-inverted":
      return "bg-white text-theme-accent-darker hover:bg-gray-50 shadow-soft hover:shadow-lg";
    case "accent-on-dark":
      return "bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-soft hover:shadow-lg";
    case "outline":
      return "bg-transparent border-2 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white hover:shadow-md";
    case "ghost":
      return "bg-transparent text-theme-primary hover:bg-theme-primary/10";
    default:
      return "";
  }
};

const getSizeClasses = (size: ButtonSize): string => {
  switch (size) {
    case "sm":
      return "px-4 py-2 text-sm";
    case "lg":
      return "px-8 py-4 text-lg font-semibold";
    case "md":
    default:
      return "px-6 py-3 text-base font-medium";
  }
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  href,
  onClick,
  disabled = false,
  className = "",
  children,
  type = "button",
  "aria-label": ariaLabel,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 no-underline focus-ring disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none";
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);
  const widthClass = fullWidth ? "w-full" : "";

  const combinedClasses =
    `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`.trim();

  if (href) {
    return (
      <a
        href={href}
        className={combinedClasses}
        aria-label={ariaLabel}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default Button;
