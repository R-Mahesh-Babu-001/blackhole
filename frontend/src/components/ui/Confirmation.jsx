import { createContext, useContext } from "react";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, Button } from "./Item";
import { Trace, TraceLine, TraceIcon, TraceTitle, TraceCollapsible, TraceCollapsibleTrigger, TraceCollapsibleContent } from "./Trace";
import "./Confirmation.css";

const ConfirmationContext = createContext({
  state: "approval-requested", // "approval-requested" | "approved" | "denied"
  onApprove: () => {},
  onDeny: () => {},
});

export function Confirmation({
  state = "approval-requested",
  onApprove,
  onDeny,
  children,
  className = "",
  ...props
}) {
  return (
    <ConfirmationContext.Provider value={{ state, onApprove, onDeny }}>
      <div className={`confirmation-wrapper confirmation-state-${state} ${className}`} {...props}>
        {children}
      </div>
    </ConfirmationContext.Provider>
  );
}

export function ConfirmationRequest({ children }) {
  const { state } = useContext(ConfirmationContext);
  if (state !== "approval-requested") return null;
  return children;
}

export function ConfirmationAccepted({ children }) {
  const { state } = useContext(ConfirmationContext);
  if (state !== "approved") return null;
  return children;
}

export function ConfirmationRejected({ children }) {
  const { state } = useContext(ConfirmationContext);
  if (state !== "denied") return null;
  return children;
}

export function ConfirmationTitle({ title, description, children, className = "" }) {
  return (
    <ItemContent className={className}>
      {title && <ItemTitle>{title}</ItemTitle>}
      {description && <ItemDescription>{description}</ItemDescription>}
      {children}
    </ItemContent>
  );
}

export function ConfirmationActions({ children, className = "" }) {
  return <ItemActions className={className}>{children}</ItemActions>;
}

export function ConfirmationAction({
  variant = "default",
  action = "approve", // "approve" | "deny"
  onClick,
  children,
  ...props
}) {
  const { onApprove, onDeny } = useContext(ConfirmationContext);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (action === "approve") {
      onApprove?.();
    } else {
      onDeny?.();
    }
  };

  return (
    <Button
      size="sm"
      variant={variant}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * Standard High-Level Tool Confirmation Component
 * Conforms to shadcn AI Elements Confirmation specification
 * Renders an Item with Deny and Approve buttons before approval,
 * and becomes a Tool / Trace line once answered.
 */
export function ToolConfirmation({
  id = "tool-approval-1",
  command = "python simulation.py",
  description = "The command runs in this project sandbox.",
  state = "approval-requested", // "approval-requested" | "approved" | "denied"
  onApprove,
  onDeny,
  output = "",
  className = "",
}) {
  return (
    <Confirmation
      state={state}
      onApprove={onApprove}
      onDeny={onDeny}
      data-approval-id={id}
      className={`tool-confirmation-card ${className}`}
    >
      {/* 1. Before approval: Asks for permission */}
      <ConfirmationRequest>
        <Item variant="outline" size="sm" className="confirmation-item">
          <ItemMedia variant="icon">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Run {command}?</ItemTitle>
            <ItemDescription>{description}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              size="sm"
              variant="outline"
              onClick={onDeny}
              title="Deny tool execution"
            >
              Deny
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={onApprove}
              title="Approve and execute tool"
            >
              Approve
            </Button>
          </ItemActions>
        </Item>
      </ConfirmationRequest>

      {/* 2. After approval: Becomes a completed Tool / Trace line */}
      <ConfirmationAccepted>
        <Trace className="confirmation-resolved-trace">
          <TraceCollapsible defaultOpen={true}>
            <TraceCollapsibleTrigger>
              <TraceLine status="completed">
                <TraceIcon status="completed">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </TraceIcon>
                <TraceTitle>Ran {command}</TraceTitle>
                <span className="confirmation-approved-badge">Approved</span>
              </TraceLine>
            </TraceCollapsibleTrigger>
            {output && (
              <TraceCollapsibleContent keepMounted>
                <div className="confirmation-tool-output">
                  <pre><code>{output}</code></pre>
                </div>
              </TraceCollapsibleContent>
            )}
          </TraceCollapsible>
        </Trace>
      </ConfirmationAccepted>

      {/* 3. After denial: Becomes a denied Tool / Trace line */}
      <ConfirmationRejected>
        <Trace className="confirmation-resolved-trace">
          <TraceLine status="error">
            <TraceIcon status="error">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </TraceIcon>
            <TraceTitle>Tool execution denied by user</TraceTitle>
            <span className="confirmation-denied-badge">Denied: {command}</span>
          </TraceLine>
        </Trace>
      </ConfirmationRejected>
    </Confirmation>
  );
}

export { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, Button };
