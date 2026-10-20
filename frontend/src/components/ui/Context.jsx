import { createContext, useContext } from "react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./HoverCard";
import { Progress } from "./Progress";
import { Button } from "./Item";
import "./Context.css";

const ContextContext = createContext({
  usedTokens: 0,
  maxTokens: 128000,
  percent: 0,
  usage: null,
  modelId: "gemini-1.5-flash",
});

/**
 * Context Component (shadcn AI Elements Context specification)
 * Tracks and visualizes context window usage via HoverCard and Progress
 */
export function Context({
  usedTokens,
  maxTokens = 128000,
  usage,
  modelId = "gemini-1.5-flash",
  children,
  className = "",
  ...props
}) {
  const safeMax = maxTokens > 0 ? maxTokens : 128000;
  const totalUsed =
    usedTokens !== undefined
      ? Number(usedTokens) || 0
      : (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);

  const percent = Math.min(100, Math.round((totalUsed / safeMax) * 100));

  return (
    <ContextContext.Provider
      value={{
        usedTokens: totalUsed,
        maxTokens: safeMax,
        percent,
        usage,
        modelId,
      }}
    >
      <HoverCard className={`context-root ${className}`} {...props}>
        {children}
      </HoverCard>
    </ContextContext.Provider>
  );
}

/**
 * ContextTrigger renders a HoverCardTrigger with a Button variant="outline" size="sm"
 * displaying the percent used with delay and closeDelay settings
 */
export function ContextTrigger({
  delay = 10,
  closeDelay = 100,
  render,
  children,
  className = "",
  ...props
}) {
  const { percent } = useContext(ContextContext);

  const defaultButton = (
    <Button
      variant="outline"
      size="sm"
      className={`context-trigger-btn ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="11"
        height="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="context-trigger-icon"
      >
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
      <span>{percent}% context</span>
    </Button>
  );

  return (
    <HoverCardTrigger
      delay={delay}
      closeDelay={closeDelay}
      render={render || defaultButton}
      {...props}
    >
      {children}
    </HoverCardTrigger>
  );
}

/**
 * ContextContent renders a HoverCardContent popover
 */
export function ContextContent({
  align = "end",
  side = "bottom",
  className = "",
  children,
  ...props
}) {
  return (
    <HoverCardContent
      align={align}
      side={side}
      className={`context-popover-content ${className}`}
      {...props}
    >
      {children}
    </HoverCardContent>
  );
}

/**
 * ContextContentHeader displays the used and max tokens, and a Progress bar
 */
export function ContextContentHeader({
  title = "Context",
  className = "",
  children,
}) {
  const { usedTokens, maxTokens, percent } = useContext(ContextContext);

  return (
    <div className={`context-content-header ${className}`}>
      <div className="context-header-row">
        <span className="context-header-title">{title}</span>
        <span className="context-header-tokens">
          {usedTokens.toLocaleString()} / {maxTokens.toLocaleString()}
        </span>
      </div>
      <Progress
        value={percent}
        aria-label="Context used"
        className="context-header-progress"
      />
      {children}
    </div>
  );
}

/**
 * ContextContentBody displays the token breakdown (Input, Output, Reasoning, Cache)
 */
export function ContextContentBody({ className = "", children }) {
  const { usage } = useContext(ContextContext);

  if (children) {
    return <div className={`context-content-body ${className}`}>{children}</div>;
  }

  const inputTokens = usage?.inputTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? 0;
  const reasoningTokens = usage?.reasoningTokens;
  const cacheTokens = usage?.cacheTokens;

  return (
    <div className={`context-content-body ${className}`}>
      <div className="context-breakdown-row">
        <span className="breakdown-label">Prompt / Input</span>
        <span className="breakdown-value">{inputTokens.toLocaleString()}</span>
      </div>
      <div className="context-breakdown-row">
        <span className="breakdown-label">Completion / Output</span>
        <span className="breakdown-value">{outputTokens.toLocaleString()}</span>
      </div>
      {reasoningTokens !== undefined && (
        <div className="context-breakdown-row">
          <span className="breakdown-label">Reasoning / Thought</span>
          <span className="breakdown-value">{reasoningTokens.toLocaleString()}</span>
        </div>
      )}
      {cacheTokens !== undefined && (
        <div className="context-breakdown-row">
          <span className="breakdown-label">Cached Context</span>
          <span className="breakdown-value">{cacheTokens.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

/**
 * ContextContentFooter displays model info, remaining context, and status
 */
export function ContextContentFooter({ className = "", children }) {
  const { modelId, maxTokens, usedTokens } = useContext(ContextContext);
  const remaining = Math.max(0, maxTokens - usedTokens);

  if (children) {
    return <div className={`context-content-footer ${className}`}>{children}</div>;
  }

  return (
    <div className={`context-content-footer ${className}`}>
      <div className="context-model-badge">
        <span className="model-dot" />
        <span className="model-label">{modelId}</span>
      </div>
      <span className="context-remaining-text">
        {remaining.toLocaleString()} tokens left
      </span>
    </div>
  );
}

/**
 * High-level turn-key ContextWindowCard
 */
export function ContextWindowCard({
  usedTokens,
  maxTokens = 128000,
  usage,
  modelId = "gemini-1.5-flash",
  className = "",
  triggerClassName = "",
  align = "end",
}) {
  return (
    <Context
      usedTokens={usedTokens}
      maxTokens={maxTokens}
      usage={usage}
      modelId={modelId}
      className={className}
    >
      <ContextTrigger className={triggerClassName} />
      <ContextContent align={align}>
        <ContextContentHeader />
        <ContextContentBody />
        <ContextContentFooter />
      </ContextContent>
    </Context>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent, Progress, Button };
