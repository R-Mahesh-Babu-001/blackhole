import {
  createContext,
  useContext,
  useState,
  forwardRef,
} from "react";
import "./CodeBlock.css";

const CodeBlockContext = createContext({
  size: "default", // "default" | "sm"
  variant: "default", // "default" | "destructive"
  wrap: false,
});

/**
 * Root CodeBlock container
 */
export const CodeBlock = forwardRef(function CodeBlock(
  {
    variant = "default",
    size = "default",
    wrap = false,
    className = "",
    children,
    ...props
  },
  ref
) {
  return (
    <CodeBlockContext.Provider value={{ size, variant, wrap }}>
      <div
        ref={ref}
        className={`code-block-root code-block-size-${size} code-block-variant-${variant} ${className}`}
        data-size={size}
        data-variant={variant}
        {...props}
      >
        {children}
      </div>
    </CodeBlockContext.Provider>
  );
});

/**
 * CodeBlockHeader bar
 */
export const CodeBlockHeader = forwardRef(function CodeBlockHeader(
  { className = "", children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`code-block-header ${className}`} {...props}>
      {children}
    </div>
  );
});

/**
 * CodeBlockTitle displaying filename or label
 */
export const CodeBlockTitle = forwardRef(function CodeBlockTitle(
  { className = "", children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`code-block-title ${className}`} {...props}>
      {children}
    </div>
  );
});

/**
 * CodeBlockActions holding action buttons (or floating when direct child)
 */
export const CodeBlockActions = forwardRef(function CodeBlockActions(
  { className = "", floating = false, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`code-block-actions ${floating ? "code-block-actions-floating" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * CodeBlockCopyButton with animated feedback
 */
export const CodeBlockCopyButton = forwardRef(function CodeBlockCopyButton(
  { value = "", className = "", onCopy, ...props },
  ref
) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!value) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy code snippet:", err);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`code-block-btn code-block-copy-btn ${copied ? "copied" : ""} ${className}`}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy"}
      title={copied ? "Copied to clipboard" : "Copy to clipboard"}
      {...props}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="btn-label">Copied</span>
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span className="btn-label">Copy</span>
        </>
      )}
    </button>
  );
});

/**
 * CodeBlockLine for individual line rendering (supports added, removed, highlighted)
 */
export const CodeBlockLine = forwardRef(function CodeBlockLine(
  {
    variant = "default", // "default" | "added" | "removed" | "highlighted"
    lineNumber = null,
    className = "",
    children,
    ...props
  },
  ref
) {
  const isDiff = variant === "added" || variant === "removed";

  return (
    <div
      ref={ref}
      className={`code-block-line line-variant-${variant} ${className}`}
      data-variant={variant}
      {...props}
    >
      {lineNumber !== null && (
        <span className="code-line-number" aria-hidden="true">
          {lineNumber}
        </span>
      )}
      {isDiff && (
        <span className="code-diff-marker" aria-hidden="true">
          {variant === "added" ? "+" : "−"}
        </span>
      )}
      <span className="code-line-content">{children}</span>
    </div>
  );
});

/**
 * CodeBlockContent: pre tag with LTR direction, optional line numbers and wrapping
 */
export const CodeBlockContent = forwardRef(function CodeBlockContent(
  {
    wrap: wrapProp = undefined,
    lineNumbers = false,
    startLine = 1,
    tabIndex = 0,
    className = "",
    children,
    ...props
  },
  ref
) {
  const context = useContext(CodeBlockContext);
  const shouldWrap = wrapProp !== undefined ? wrapProp : context.wrap;

  // If string child and line numbers or lines are requested
  const isString = typeof children === "string";

  const renderContent = () => {
    if (!isString) return children;

    if (lineNumbers) {
      const lines = children.split("\n");
      return lines.map((line, idx) => (
        <CodeBlockLine
          key={idx}
          lineNumber={startLine + idx}
        >
          {line || " "}
        </CodeBlockLine>
      ));
    }

    return children;
  };

  return (
    <pre
      ref={ref}
      dir="ltr"
      tabIndex={tabIndex}
      className={`code-block-content ${shouldWrap ? "code-block-wrap" : "code-block-scroll"} ${
        lineNumbers ? "has-line-numbers" : ""
      } ${className}`}
      {...props}
    >
      <code>{renderContent()}</code>
    </pre>
  );
});

/**
 * CodeBlockFooter for expand/collapse or action buttons
 */
export const CodeBlockFooter = forwardRef(function CodeBlockFooter(
  { className = "", children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`code-block-footer ${className}`} {...props}>
      {children}
    </div>
  );
});

/**
 * High-level composite CodeBlock with syntax styling, header, line numbers, and copy action
 */
export function CodeBlockCard({
  title = "",
  language = "python",
  code = "",
  lineNumbers = true,
  wrap = false,
  maxHeight = null,
  size = "default",
  variant = "default",
  onInsert = null,
  className = "",
}) {
  const [isWrapped, setIsWrapped] = useState(wrap);
  const [expanded, setExpanded] = useState(false);

  const linesCount = typeof code === "string" ? code.split("\n").length : 0;
  const showMoreThreshold = 18;
  const isLong = maxHeight && linesCount > showMoreThreshold;

  return (
    <CodeBlock
      size={size}
      variant={variant}
      wrap={isWrapped}
      className={`code-block-card ${className}`}
    >
      <CodeBlockHeader>
        <CodeBlockTitle>
          <span className="lang-tag">{language}</span>
          {title && <span className="title-text">{title}</span>}
        </CodeBlockTitle>
        <CodeBlockActions>
          {/* Line Wrap Toggle Button */}
          <button
            type="button"
            className={`code-block-btn ${isWrapped ? "active" : ""}`}
            onClick={() => setIsWrapped(!isWrapped)}
            aria-label="Toggle line wrap"
            title={isWrapped ? "Disable line wrap" : "Enable line wrap"}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M3 12h15a3 3 0 1 1 0 6h-4" />
              <polyline points="16 16 14 18 16 20" />
            </svg>
          </button>

          {/* Copy Button */}
          <CodeBlockCopyButton value={code} />

          {/* 1-Click Document Insert Button */}
          {onInsert && (
            <button
              type="button"
              className="code-block-insert-btn"
              onClick={() => onInsert(code, language === "ipynb" || language === "python" ? "code" : "markdown")}
              title="Insert snippet directly into active workspace document"
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Insert</span>
            </button>
          )}
        </CodeBlockActions>
      </CodeBlockHeader>

      <CodeBlockContent
        lineNumbers={lineNumbers}
        className={isLong && !expanded ? "code-content-collapsed" : ""}
        style={maxHeight && !expanded ? { maxHeight } : undefined}
      >
        {code}
      </CodeBlockContent>

      {isLong && (
        <CodeBlockFooter>
          <button
            type="button"
            className="code-block-expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : `Show more (${linesCount} lines)`}
          </button>
        </CodeBlockFooter>
      )}
    </CodeBlock>
  );
}

export default CodeBlock;
