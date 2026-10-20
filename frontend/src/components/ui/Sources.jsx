import React, { useState } from "react";
import { extractHostname } from "./citationUtils";
import "./Sources.css";

/**
 * Sources container
 * Displays a list of external references and web sources after an agent reply
 */
export function Sources({
  sources = [],
  title = "Sources",
  defaultOpen = false,
  className = "",
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const count = sources.length;

  if (!sources || sources.length === 0) {
    if (!children) return null;
  }

  return (
    <div className={`ui-sources-card ${className}`}>
      <button
        type="button"
        className="sources-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="sources-toggle-left">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="sources-icon"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="sources-label">{title}</span>
          {count > 0 && (
            <span className="sources-count-badge">{count}</span>
          )}
        </div>
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`sources-chevron ${isOpen ? "is-open" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="sources-content">
          {children || (
            <div className="sources-grid">
              {sources.map((src, index) => (
                <Source
                  key={src.url || index}
                  title={src.title}
                  url={src.url}
                  hostname={src.hostname}
                  snippet={src.snippet || src.description}
                  index={index + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Source item
 */
export function Source({
  title,
  url,
  hostname: customHost,
  snippet,
  index,
  className = "",
}) {
  const host = customHost || extractHostname(url);
  const displayTitle = title || host || "Reference Source";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`source-item ${className}`}
      title={displayTitle}
    >
      <div className="source-item-header">
        {index && <span className="source-index">{index}</span>}
        <span className="source-host">{host}</span>
        <svg
          viewBox="0 0 24 24"
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="source-external-icon"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </div>
      <div className="source-title">{displayTitle}</div>
      {snippet && <div className="source-snippet">{snippet}</div>}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default Sources;
