import { createContext, useContext, useState } from "react";
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
  defaultOpen = true,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <TraceCollapsibleContext.Provider
      value={{ isOpen, toggle: () => setIsOpen((prev) => !prev) }}
    >
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
      <span className={`trace-chevron ${isOpen ? "chevron-open" : ""}`}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>
  );
}

export function TraceCollapsibleContent({ children, keepMounted = true, className = "" }) {
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
  status = "default", // "running" | "completed" | "error" | "default"
  children,
  className = "",
}) {
  return (
    <div className={`trace-line trace-status-${status} ${className}`}>
      {children}
    </div>
  );
}

export function TraceIcon({ children, status, className = "" }) {
  return (
    <span className={`trace-icon ${status ? `icon-${status}` : ""} ${className}`}>
      {children || (
        status === "running" ? (
          <span className="trace-spinner" />
        ) : status === "error" ? (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
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
  onInsertCode = null,
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

          {/* Generated Code Block with 1-click Insert */}
          {code && (
            <div className="subagent-code-block">
              <div className="code-block-header">
                <span className="code-lang-tag">
                  {activeFileType === "ipynb" ? "python" : "markdown"}
                </span>
                {onInsertCode && (
                  <button
                    type="button"
                    className="subagent-insert-btn"
                    onClick={() => onInsertCode(code, activeFileType === "ipynb" ? "code" : "markdown")}
                    title="Insert directly into active workspace document"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Insert into Document</span>
                  </button>
                )}
              </div>
              <pre className="code-block-pre">
                <code>{code}</code>
              </pre>
            </div>
          )}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
