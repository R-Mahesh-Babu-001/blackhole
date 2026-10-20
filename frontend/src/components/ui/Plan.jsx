import React, { createContext, useContext, useMemo } from "react";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
} from "./Trace";
import "./Plan.css";

export function PlanIcon({ className = "", children, ...props }) {
  return (
    <TraceIcon className={`ui-plan-icon ${className}`} {...props}>
      {children}
    </TraceIcon>
  );
}
export { TraceIcon };

const PlanContext = createContext({
  isStreaming: false,
});

/**
 * Plan
 * Displays the steps the agent plans to take and how far it has got.
 * Conforms to shadcn AI Elements Plan specification.
 * Rebuilt on Trace and TraceCollapsible.
 */
export function Plan({
  isStreaming = false,
  defaultOpen = true,
  open,
  onOpenChange,
  className = "",
  children,
  ...props
}) {
  const contextValue = useMemo(() => ({ isStreaming }), [isStreaming]);

  return (
    <PlanContext.Provider value={contextValue}>
      <div className={`ui-plan-wrapper ${className}`} {...props}>
        <Trace className="ui-plan-trace-root">
          <TraceCollapsible
            defaultOpen={defaultOpen}
            open={open}
            onOpenChange={onOpenChange}
            className="ui-plan-collapsible"
          >
            {children}
          </TraceCollapsible>
        </Trace>
      </div>
    </PlanContext.Provider>
  );
}

/**
 * PlanHeader
 * Sits in TraceCollapsibleTrigger with a TraceLine.
 * Reflects status="running" while isStreaming is true.
 */
export function PlanHeader({
  status,
  className = "",
  children,
  action,
  ...props
}) {
  const { isStreaming } = useContext(PlanContext);
  const effectiveStatus = status || (isStreaming ? "running" : undefined);

  return (
    <div className={`ui-plan-header-row ${className}`}>
      <TraceCollapsibleTrigger className="ui-plan-header-trigger" {...props}>
        <TraceLine status={effectiveStatus} className="ui-plan-header-line">
          {children}
        </TraceLine>
      </TraceCollapsibleTrigger>
      {action && <div className="ui-plan-header-action">{action}</div>}
    </div>
  );
}

/**
 * PlanTitle
 */
export function PlanTitle({ className = "", children, ...props }) {
  return (
    <TraceTitle className={`ui-plan-title ${className}`} {...props}>
      {children}
    </TraceTitle>
  );
}

/**
 * PlanDescription
 * Typically displays progress counter: e.g. "2 of 5 done"
 */
export function PlanDescription({ className = "", children, ...props }) {
  return (
    <TraceDescription className={`ui-plan-description ${className}`} {...props}>
      {children}
    </TraceDescription>
  );
}

/**
 * PlanContent
 * Collapsible body containing optional description and a nested Trace for the steps
 */
export function PlanContent({ className = "", description, children, ...props }) {
  return (
    <TraceCollapsibleContent className={`ui-plan-content ${className}`} {...props}>
      {description && <div className="ui-plan-detail-description">{description}</div>}
      <Trace className="ui-plan-steps-trace">{children}</Trace>
    </TraceCollapsibleContent>
  );
}

/**
 * PlanTrigger
 * In shadcn specification, PlanTrigger renders only its children
 * because the entire TraceCollapsibleTrigger line is clickable.
 */
export function PlanTrigger({ children }) {
  return <>{children}</>;
}

/**
 * PlanAction
 * Buttons cannot sit inside a button trigger; renders next to TraceCollapsibleTrigger.
 */
export function PlanAction({ className = "", children, ...props }) {
  return (
    <div className={`ui-plan-action ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * PlanFooter
 * Plain container for summary info or actions below steps
 */
export function PlanFooter({ className = "", children, ...props }) {
  return (
    <div className={`ui-plan-footer ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * PlanStep
 * Convenience component to render an individual plan step line
 */
export function PlanStep({
  status = "pending", // "completed" | "done" | "running" | "pending" | "error"
  title,
  description,
  icon,
  className = "",
  children,
  ...props
}) {
  const isDone = status === "completed" || status === "done";
  const isRunning = status === "running";

  return (
    <TraceLine
      status={isRunning ? "running" : status === "error" ? "error" : undefined}
      className={`ui-plan-step-line step-${status} ${className}`}
      {...props}
    >
      <TraceIcon>
        {icon || (
          isDone ? (
            <PlanCircleCheckIcon />
          ) : isRunning ? (
            <PlanCircleDotIcon />
          ) : (
            <PlanCircleIcon />
          )
        )}
      </TraceIcon>
      <TraceTitle className="ui-plan-step-title">{title || children}</TraceTitle>
      {description && (
        <TraceDescription className="ui-plan-step-desc">
          {description}
        </TraceDescription>
      )}
    </TraceLine>
  );
}

/* ==================================================
   Plan Standard Monochrome Icons (Pitch Black & Pure White)
================================================== */

export function PlanRouteIcon({ width = 14, height = 14, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

export function PlanCircleCheckIcon({ width = 13, height = 13, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.5"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function PlanCircleDotIcon({ width = 13, height = 13, className = "" }) {
  return (
    <span className="ui-plan-running-dot-wrapper">
      <span className="ui-plan-running-pulse" />
      <svg
        viewBox="0 0 24 24"
        width={width}
        height={height}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className={className}
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    </span>
  );
}

export function PlanCircleIcon({ width = 13, height = 13, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      opacity="0.45"
    >
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
    </svg>
  );
}

export default Plan;
