import "./Item.css";

export function Item({
  variant = "default", // "default" | "outline" | "solid"
  size = "default",    // "sm" | "default" | "lg"
  children,
  className = "",
  ...props
}) {
  return (
    <div
      className={`ui-item item-variant-${variant} item-size-${size} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function ItemMedia({
  variant = "icon", // "icon" | "image"
  children,
  className = "",
  ...props
}) {
  return (
    <div
      className={`ui-item-media item-media-${variant} ${className}`}
      aria-hidden="true"
      {...props}
    >
      {children}
    </div>
  );
}

export function ItemContent({ children, className = "", ...props }) {
  return (
    <div className={`ui-item-content ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ItemTitle({ children, className = "", ...props }) {
  return (
    <div className={`ui-item-title ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ItemDescription({ children, className = "", ...props }) {
  return (
    <div className={`ui-item-description ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ItemActions({ children, className = "", ...props }) {
  return (
    <div className={`ui-item-actions ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Button({
  variant = "default", // "default" (accent) | "outline" | "secondary" | "destructive" | "ghost"
  size = "default",    // "sm" | "default" | "lg" | "icon"
  children,
  className = "",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`ui-button btn-variant-${variant} btn-size-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
