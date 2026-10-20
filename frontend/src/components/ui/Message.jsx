import { useContext, useState, useEffect } from "react";
import { Button } from "./Item";
import { Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip";
import { MessageContext } from "./MessageContext";
import "./Message.css";

/**
 * Message / MessageRoot
 * Conforms to shadcn AI Elements Message specification
 * Represents a single turn in a thread.
 */
export function Message({
  from = "assistant",
  role,
  align,
  className = "",
  children,
  ...props
}) {
  const effectiveRole = role || from || "assistant";
  const effectiveAlign =
    align || (effectiveRole === "user" ? "end" : "start");

  return (
    <MessageContext.Provider
      value={{ from: effectiveRole, role: effectiveRole, align: effectiveAlign }}
    >
      <div
        className={`ui-message message-role-${effectiveRole} message-align-${effectiveAlign} ${className}`}
        {...props}
      >
        {children}
      </div>
    </MessageContext.Provider>
  );
}

export const MessageRoot = Message;

/**
 * Bubble Component
 * Conforms to shadcn/ui Bubble specification
 */
export function Bubble({
  align,
  variant = "default", // "default" | "muted" | "accent" | "outline"
  className = "",
  children,
  ...props
}) {
  const context = useContext(MessageContext);
  const effectiveAlign = align || context.align || "start";

  return (
    <div
      className={`ui-bubble bubble-align-${effectiveAlign} bubble-variant-${variant} ${className}`}
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

/**
 * MessageContent / MessageBody
 * For user messages, automatically ensures children are wrapped in Bubble variant="muted"
 */
export function MessageContent({
  className = "",
  variant = "muted",
  children,
  ...props
}) {
  const { from } = useContext(MessageContext);

  const isAlreadyBubble =
    children &&
    typeof children === "object" &&
    children.type &&
    (children.type === Bubble || children.props?.className?.includes?.("ui-bubble"));

  if (from === "user" && !isAlreadyBubble) {
    return (
      <div className={`ui-message-content message-content-user ${className}`} {...props}>
        <Bubble align="end" variant={variant}>
          <BubbleContent>{children}</BubbleContent>
        </Bubble>
      </div>
    );
  }

  return (
    <div className={`ui-message-content ${className}`} {...props}>
      {children}
    </div>
  );
}

export const MessageBody = MessageContent;

/**
 * MessageFooter / MessageActions
 * Sits below the message text/reply following alignment
 */
export function MessageFooter({
  align,
  className = "",
  children,
  ...props
}) {
  const context = useContext(MessageContext);
  const effectiveAlign = align || context.align || "start";

  return (
    <div
      className={`ui-message-footer message-footer-align-${effectiveAlign} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export const MessageActions = MessageFooter;

/**
 * MessageAction
 * Renders a ghost icon-sm Button inside a Tooltip with its label as aria-label
 */
export function MessageAction({
  label,
  tooltip,
  icon,
  pressed,
  onClick,
  disabled = false,
  variant = "ghost",
  size = "icon-sm",
  className = "",
  children,
  ...props
}) {
  const tooltipText = tooltip || label;

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger>
        <Button
          variant={variant}
          size={size}
          aria-label={label}
          aria-pressed={pressed}
          disabled={disabled}
          onClick={onClick}
          className={`ui-message-action ${pressed ? "is-pressed" : ""} ${className}`}
          {...props}
        >
          {icon || children}
        </Button>
      </TooltipTrigger>
      {tooltipText && <TooltipContent side="top">{tooltipText}</TooltipContent>}
    </Tooltip>
  );
}

/**
 * Standard Action: Copy
 * Writes reply to clipboard and swaps to checkmark icon for 2 seconds
 */
export function MessageCopyAction({
  text,
  getText,
  onCopy,
  label = "Copy",
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    const stringToCopy = getText ? getText() : text;
    if (typeof stringToCopy === "string" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(stringToCopy);
      } catch (err) {
        console.warn("Clipboard write failed:", err);
      }
    }
    setCopied(true);
    if (onCopy) onCopy(stringToCopy);
  };

  return (
    <MessageAction
      label={copied ? "Copied to clipboard" : label}
      tooltip={copied ? "Copied!" : label}
      onClick={handleCopy}
      className={`message-action-copy ${className}`}
      icon={
        copied ? (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#ffffff" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )
      }
    />
  );
}

/**
 * Standard Action: Good response toggle with aria-pressed
 */
export function MessageGoodAction({
  pressed = false,
  onToggle,
  label = "Good response",
  className = "",
}) {
  return (
    <MessageAction
      label={label}
      tooltip={label}
      pressed={pressed}
      onClick={onToggle}
      className={`message-action-feedback ${className}`}
      icon={
        <svg viewBox="0 0 24 24" width="13" height="13" fill={pressed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      }
    />
  );
}

/**
 * Standard Action: Bad response toggle with aria-pressed
 */
export function MessageBadAction({
  pressed = false,
  onToggle,
  label = "Bad response",
  className = "",
}) {
  return (
    <MessageAction
      label={label}
      tooltip={label}
      pressed={pressed}
      onClick={onToggle}
      className={`message-action-feedback ${className}`}
      icon={
        <svg viewBox="0 0 24 24" width="13" height="13" fill={pressed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
        </svg>
      }
    />
  );
}

/**
 * Standard Action: Retry runs the turn again
 */
export function MessageRetryAction({
  onRetry,
  label = "Retry",
  className = "",
}) {
  return (
    <MessageAction
      label={label}
      tooltip={label}
      onClick={onRetry}
      className={`message-action-retry ${className}`}
      icon={
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      }
    />
  );
}

/**
 * Standard Action: Edit on user's turn puts text back in composer
 */
export function MessageEditAction({
  onEdit,
  label = "Edit",
  className = "",
}) {
  return (
    <MessageAction
      label={label}
      tooltip={label}
      onClick={onEdit}
      className={`message-action-edit ${className}`}
      icon={
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      }
    />
  );
}

/**
 * MessageToolbar & MessageResponse helpers
 */
export function MessageToolbar({ className = "", children, ...props }) {
  return (
    <div className={`ui-message-toolbar ${className}`} {...props}>
      {children}
    </div>
  );
}

export function MessageResponse({ className = "", children, ...props }) {
  return (
    <div className={`ui-message-response ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Message;
