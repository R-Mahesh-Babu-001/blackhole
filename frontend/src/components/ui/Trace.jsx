import { createContext, useContext, useState } from "react";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentTrigger,
  AttachmentGroup,
} from "./Attachment";
import { CodeBlockCard } from "./CodeBlock";
import "./Trace.css";

// Collapsible Context for open/close state
const TraceCollapsibleContext = createContext({
  isOpen: true,
  toggle: () => {},
});

export function Trace({ children, className = "" }) {
  return <div className={`trace-root ${className}`}>{children}</div>;
}

export function TraceCollapsible({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className = "",
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const toggle = () => {
    const nextState = !isOpen;
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextState);
    }
    if (onOpenChange) {
      onOpenChange(nextState);
    }
  };

  return (
    <TraceCollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div
        className={`trace-collapsible ${isOpen ? "open" : "collapsed"} ${className}`}
      >
        {children}
      </div>
    </TraceCollapsibleContext.Provider>
  );
}

export function TraceCollapsibleTrigger({ children, className = "" }) {
  const { isOpen, toggle } = useContext(TraceCollapsibleContext);

  return (
    <button
      type="button"
      className={`trace-collapsible-trigger ${className}`}
      onClick={toggle}
      aria-expanded={isOpen}
    >
      <div className="trace-trigger-content">{children}</div>
      <span className={`trace-chevron ${isOpen ? "chevron-open" : ""}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>
  );
}

export function TraceCollapsibleContent({ children, keepMounted = false, className = "" }) {
  const { isOpen } = useContext(TraceCollapsibleContext);

  if (!isOpen && !keepMounted) return null;

  return (
    <div
      className={`trace-collapsible-content ${isOpen ? "content-visible" : "content-hidden"} ${className}`}
    >
      <div className="trace-content-inner">{children}</div>
    </div>
  );
}

export function TraceLine({
  status, // "running" | "error" | "pending" | undefined
  children,
  className = "",
  ...props
}) {
  const statusClass = status ? `trace-status-${status}` : "";
  return (
    <span className={`trace-line ${statusClass} ${className}`} {...props}>
      {children}
    </span>
  );
}

export function TraceIcon({ children, status, className = "" }) {
  return (
    <span
      className={`trace-icon ${status ? `icon-${status}` : ""} ${className}`}
      aria-hidden="true"
    >
      {children || (
        status === "running" ? (
          <span className="trace-spinner" />
        ) : status === "error" ? (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : status === "pending" ? (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )
      )}
    </span>
  );
}

export function TraceTitle({ children, className = "" }) {
  return <span className={`trace-title ${className}`}>{children}</span>;
}

export function TraceDescription({ children, className = "" }) {
  return <span className={`trace-description ${className}`}>{children}</span>;
}

export function Badge({ children, variant = "default", className = "" }) {
  return (
    <span className={`trace-badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}

function getTraceDefaultIcon(iconType, status) {
  if (status === "running") {
    return <span className="trace-spinner" />;
  }
  if (status === "error") {
    return (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  if (status === "pending") {
    return (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
      </svg>
    );
  }

  switch (iconType) {
    case "terminal":
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "file":
    case "document":
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "tool":
    case "code":
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "source":
    case "sources":
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
  }
}

export function AgentTrace({ trace, className = "" }) {
  if (!trace) return null;
  const steps = trace.steps || [];

  return (
    <div className={`agent-trace-container ${className}`}>
      <Trace>
        {steps.map((step, idx) => {
          const stepKey = step.id || `step-${idx}`;
          const isCollapsible = Boolean(
            step.collapsible || step.content || (step.sources && step.sources.length > 0)
          );

          if (isCollapsible) {
            return (
              <TraceCollapsible
                key={stepKey}
                defaultOpen={step.defaultOpen ?? (step.status === "running")}
              >
                <TraceCollapsibleTrigger>
                  <TraceLine status={step.status}>
                    <TraceIcon status={step.status}>
                      {step.iconNode || getTraceDefaultIcon(step.icon, step.status)}
                    </TraceIcon>
                    <TraceTitle>{step.title}</TraceTitle>
                    {step.description && (
                      <TraceDescription>{step.description}</TraceDescription>
                    )}
                  </TraceLine>
                </TraceCollapsibleTrigger>
                <TraceCollapsibleContent keepMounted={step.keepMounted ?? true}>
                  {step.content && (
                    <div className="trace-detail-output">
                      <code>{step.content}</code>
                    </div>
                  )}
                  {step.sources && step.sources.length > 0 && (
                    <div className="trace-sources-group">
                      <span className="trace-sources-kicker">SOURCES REFERENCED:</span>
                      <Trace className="trace-nested-sources">
                        {step.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="trace-link-anchor"
                          >
                            <TraceLine>
                              <TraceIcon>
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="2" y1="12" x2="22" y2="12" />
                                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                              </TraceIcon>
                              <TraceTitle>
                                {src.title}
                                <span className="sr-only"> (opens in a new tab)</span>
                              </TraceTitle>
                              <TraceIcon>
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="7" y1="17" x2="17" y2="7" />
                                  <polyline points="7 7 17 7 17 17" />
                                </svg>
                              </TraceIcon>
                            </TraceLine>
                          </a>
                        ))}
                      </Trace>
                    </div>
                  )}
                </TraceCollapsibleContent>
              </TraceCollapsible>
            );
          }

          return (
            <TraceLine key={stepKey} status={step.status}>
              <TraceIcon status={step.status}>
                {step.iconNode || getTraceDefaultIcon(step.icon, step.status)}
              </TraceIcon>
              <TraceTitle>{step.title}</TraceTitle>
              {step.description && (
                <TraceDescription>{step.description}</TraceDescription>
              )}
            </TraceLine>
          );
        })}
      </Trace>
    </div>
  );
}

/**
 * High-level Subagent Run Component
 * Conforming directly to the Subagent UI element specification
 */
export function Subagent({
  name = "Research Subagent",
  task = "",
  model = "gemini-flash",
  tools = [],
  status = "completed", // "running" | "completed" | "error"
  duration = "",
  result = "",
  code = "",
  attachments = [],
  onInsertCode = null,
  onPreviewAttachment = null,
  activeFileType = "ipynb",
  defaultOpen = true,
}) {
  const isRunning = status === "running";
  const isError = status === "error";

  const runTitle = isRunning
    ? `Running ${name}…`
    : isError
    ? `Failed to run ${name}`
    : `Ran ${name}`;

  return (
    <Trace className="subagent-trace-card">
      <TraceCollapsible defaultOpen={defaultOpen}>
        <TraceCollapsibleTrigger>
          <TraceLine status={isRunning ? "running" : isError ? "error" : "completed"}>
            <TraceIcon status={isRunning ? "running" : isError ? "error" : "completed"} />
            <div className="subagent-trigger-main">
              <TraceTitle>{runTitle}</TraceTitle>
              {duration && <TraceDescription>{duration}</TraceDescription>}
            </div>
            <div className="subagent-badges-strip">
              {model && <Badge variant="model">{model}</Badge>}
            </div>
          </TraceLine>
        </TraceCollapsibleTrigger>

        <TraceCollapsibleContent keepMounted className="subagent-body">
          {/* Subagent Task Description & Tags */}
          {task && (
            <div className="subagent-task-header">
              <span className="task-kicker">TASK:</span>
              <p className="task-text">{task}</p>
              <div className="task-badges">
                {tools.map((t, i) => (
                  <Badge key={i} variant="tool">
                    {typeof t === "string" ? t : t.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Nested Tool Call Traces */}
          {tools && tools.length > 0 && (
            <div className="subagent-tools-container">
              <span className="tools-heading">TOOL CALLS:</span>
              <Trace className="nested-tools-trace">
                {tools.map((tool, idx) => {
                  const toolName = typeof tool === "string" ? tool : tool.name;
                  const toolStatus = typeof tool === "object" ? tool.status || "completed" : "completed";
                  const toolOutput = typeof tool === "object" ? tool.output : null;

                  return (
                    <div key={idx} className="tool-call-item">
                      <TraceLine status={toolStatus}>
                        <TraceIcon status={toolStatus} />
                        <TraceTitle>{toolName}</TraceTitle>
                      </TraceLine>
                      {toolOutput && (
                        <div className="tool-output-snippet">
                          <code>{toolOutput}</code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Trace>
            </div>
          )}

          {/* Output / Result */}
          {result && (
            <div className="subagent-result-box">
              <div className="result-text">{result}</div>
            </div>
          )}

          {/* Subagent Output Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="subagent-attachments-container">
              <span className="tools-heading">ATTACHMENTS / ARTIFACTS:</span>
              <AttachmentGroup className="subagent-attachment-group">
                {attachments.map((att) => (
                  <Attachment
                    key={att.id || att.name}
                    size="sm"
                    state={att.state || "done"}
                    orientation="horizontal"
                  >
                    <AttachmentMedia variant={att.variant || "icon"}>
                      {att.variant === "image" && att.previewUrl ? (
                        <img src={att.previewUrl} alt={att.name} />
                      ) : (
                        att.icon || (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        )
                      )}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{att.name}</AttachmentTitle>
                      <AttachmentDescription>
                        {att.description || att.sizeStr || "Ready"}
                      </AttachmentDescription>
                    </AttachmentContent>
                    {onPreviewAttachment && (
                      <AttachmentTrigger
                        aria-label={`Preview ${att.name}`}
                        onClick={() => onPreviewAttachment(att)}
                      />
                    )}
                  </Attachment>
                ))}
              </AttachmentGroup>
            </div>
          )}

          {/* Generated Code Block with 1-click Insert, Copy, and Line Numbers */}
          {code && (
            <CodeBlockCard
              size="sm"
              language={activeFileType === "ipynb" ? "python" : "markdown"}
              code={code}
              lineNumbers={true}
              onInsert={onInsertCode}
            />
          )}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
