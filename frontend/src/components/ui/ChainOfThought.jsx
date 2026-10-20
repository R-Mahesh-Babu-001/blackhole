import { useState, forwardRef } from "react";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
  Badge,
} from "./Trace";
import "./ChainOfThought.css";

/**
 * Root ChainOfThought component
 * Renders a Trace with a TraceCollapsible
 */
export const ChainOfThought = forwardRef(function ChainOfThought(
  {
    open,
    defaultOpen = false,
    onOpenChange,
    className = "",
    children,
    ...props
  },
  ref
) {
  return (
    <Trace className={`chain-of-thought-root ${className}`} ref={ref} {...props}>
      <TraceCollapsible
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        {children}
      </TraceCollapsible>
    </Trace>
  );
});

/**
 * Header trigger for ChainOfThought
 * Renders TraceCollapsibleTrigger with TraceLine, TraceIcon, and TraceTitle
 */
export const ChainOfThoughtHeader = forwardRef(function ChainOfThoughtHeader(
  {
    status = "completed", // "running" | "completed" | "error" | "default"
    title = "Reasoned in steps",
    duration = "",
    className = "",
    children,
    ...props
  },
  ref
) {
  const isRunning = status === "running";
  const isError = status === "error";

  return (
    <TraceCollapsibleTrigger className={`cot-header-trigger ${className}`} ref={ref} {...props}>
      <TraceLine status={isRunning ? "running" : isError ? "error" : "completed"}>
        <TraceIcon status={isRunning ? "running" : isError ? "error" : "completed"}>
          {isRunning ? (
            <span className="trace-spinner" />
          ) : isError ? (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08A2.5 2.5 0 0 1 2 14.5a2.5 2.5 0 0 1 1.05-2.03A2.5 2.5 0 0 1 2 10a2.5 2.5 0 0 1 2.96-2.44A2.5 2.5 0 0 1 7 4.5 2.5 2.5 0 0 1 9.5 2z" />
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08A2.5 2.5 0 0 0 22 14.5a2.5 2.5 0 0 0-1.05-2.03A2.5 2.5 0 0 0 22 10a2.5 2.5 0 0 0-2.96-2.44A2.5 2.5 0 0 0 17 4.5 2.5 2.5 0 0 0 14.5 2z" />
            </svg>
          )}
        </TraceIcon>
        <div className="cot-header-title-box">
          <TraceTitle>{title}</TraceTitle>
          {duration && <TraceDescription>{duration}</TraceDescription>}
        </div>
      </TraceLine>
      {children}
    </TraceCollapsibleTrigger>
  );
});

/**
 * Content container for ChainOfThought
 * Renders TraceCollapsibleContent with keepMounted and a nested Trace
 */
export const ChainOfThoughtContent = forwardRef(function ChainOfThoughtContent(
  { keepMounted = true, className = "", children, ...props },
  ref
) {
  return (
    <TraceCollapsibleContent
      keepMounted={keepMounted}
      className={`cot-content ${className}`}
      ref={ref}
      {...props}
    >
      <Trace className="cot-steps-trace">{children}</Trace>
    </TraceCollapsibleContent>
  );
});

/**
 * Individual step inside ChainOfThought
 * Maps status: "active"|"running" -> "running", "complete"|"done" -> "completed", "error" -> "error"
 */
export const ChainOfThoughtStep = forwardRef(function ChainOfThoughtStep(
  {
    status = "completed", // "running" | "completed" | "error" | "pending"
    title = "",
    description = "",
    icon = null,
    className = "",
    children,
    ...props
  },
  ref
) {
  // Normalize status
  const normalizedStatus =
    status === "active" || status === "running"
      ? "running"
      : status === "error" || status === "failed"
      ? "error"
      : status === "pending"
      ? "default"
      : "completed";

  return (
    <div className={`cot-step-item ${className}`} ref={ref} {...props}>
      <TraceLine status={normalizedStatus}>
        <TraceIcon status={normalizedStatus}>
          {icon || (
            normalizedStatus === "running" ? (
              <span className="trace-spinner" />
            ) : normalizedStatus === "error" ? (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )
          )}
        </TraceIcon>
        <div className="cot-step-text-wrapper">
          <TraceTitle className="cot-step-title">{title}</TraceTitle>
          {description && (
            <TraceDescription className="cot-step-desc">
              {description}
            </TraceDescription>
          )}
        </div>
      </TraceLine>
      {children && <div className="cot-step-children">{children}</div>}
    </div>
  );
});

/**
 * Flex-wrap container for search results / citations
 */
export const ChainOfThoughtSearchResults = forwardRef(
  function ChainOfThoughtSearchResults({ className = "", children, ...props }, ref) {
    return (
      <div className={`cot-search-results ${className}`} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);

/**
 * Badge for individual search result hostname
 */
export const ChainOfThoughtSearchResult = forwardRef(
  function ChainOfThoughtSearchResult(
    { variant = "secondary", hostname = "", url = "", className = "", children, ...props },
    ref
  ) {
    let displayHost = hostname;
    if (!displayHost && url) {
      try {
        displayHost = new URL(url).hostname;
      } catch {
        displayHost = url;
      }
    }

    return (
      <Badge
        variant={variant}
        className={`cot-search-badge ${className}`}
        ref={ref}
        {...props}
      >
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>{children || displayHost}</span>
      </Badge>
    );
  }
);

/**
 * Image thumbnail inside ChainOfThought
 */
export const ChainOfThoughtImage = forwardRef(function ChainOfThoughtImage(
  { src, alt = "Chain of thought asset", className = "", ...props },
  ref
) {
  return (
    <div className={`cot-image-wrapper ${className}`} ref={ref} {...props}>
      <img src={src} alt={alt} />
    </div>
  );
});

/**
 * High-level convenient composite Chain of Thought block
 */
export function ChainOfThoughtBlock({
  summary = "Reasoned in steps",
  status = "completed", // "running" | "completed" | "error"
  duration = "",
  steps = [],
  defaultOpen = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen || status === "running");
  const running = status === "running";

  return (
    <ChainOfThought
      open={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={setIsOpen}
      className={`cot-block ${className}`}
    >
      <ChainOfThoughtHeader
        status={status}
        title={running ? "Reasoning & Analyzing…" : summary}
        duration={duration}
      />
      <ChainOfThoughtContent keepMounted>
        {steps.map((step, idx) => (
          <ChainOfThoughtStep
            key={idx}
            status={step.status || (running && idx === steps.length - 1 ? "running" : "completed")}
            title={step.title}
            description={step.description}
            icon={step.icon}
          >
            {step.searchResults && step.searchResults.length > 0 && (
              <ChainOfThoughtSearchResults>
                {step.searchResults.map((res, sIdx) => (
                  <ChainOfThoughtSearchResult
                    key={sIdx}
                    hostname={typeof res === "string" ? res : res.hostname}
                    url={typeof res === "object" ? res.url : undefined}
                  />
                ))}
              </ChainOfThoughtSearchResults>
            )}
            {step.image && <ChainOfThoughtImage src={step.image} alt={step.title} />}
          </ChainOfThoughtStep>
        ))}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

export default ChainOfThought;
