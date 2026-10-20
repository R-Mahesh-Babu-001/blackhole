import "./Message.css";

/**
 * Message component conforming to shadcn AI Elements Message specification
 * Represents a single turn in a chat conversation
 */
export function Message({
  align = "start", // "start" | "end" | "center"
  className = "",
  children,
  ...props
}) {
  return (
    <div
      className={`ui-message message-align-${align} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function MessageContent({ className = "", children, ...props }) {
  return (
    <div className={`ui-message-content ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Bubble component conforming to shadcn/ui Bubble specification
 * Wraps textual or custom responses inside a message
 */
export function Bubble({
  align = "start", // "start" | "end"
  variant = "default", // "default" | "muted" | "accent" | "outline"
  className = "",
  children,
  ...props
}) {
  return (
    <div
      className={`ui-bubble bubble-align-${align} bubble-variant-${variant} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function BubbleContent({ className = "", children, ...props }) {
  return (
    <div className={`ui-bubble-content ${className}`} {...props}>
      {children}
    </div>
  );
}
