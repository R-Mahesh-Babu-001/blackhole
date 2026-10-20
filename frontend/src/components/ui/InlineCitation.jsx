import React, { useState } from "react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./HoverCard";
import { Button } from "./Item";
import "./InlineCitation.css";

import { extractHostname } from "./citationUtils";

/**
 * InlineCitationCard renders a HoverCard
 */
export function InlineCitationCard({
  open,
  defaultOpen = false,
  onOpenChange,
  openDelay = 10,
  closeDelay = 100,
  className = "",
  children,
  ...props
}) {
  return (
    <HoverCard
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      openDelay={openDelay}
      closeDelay={closeDelay}
      className={`inline-citation-card-root ${className}`}
      {...props}
    >
      {children}
    </HoverCard>
  );
}

/**
 * InlineCitationCardTrigger renders a HoverCardTrigger with Button variant="secondary" size="xs"
 * so that it can receive keyboard focus and be accessible.
 */
export function InlineCitationCardTrigger({
  delay = 10,
  closeDelay = 100,
  render,
  children,
  className = "",
  ...props
}) {
  const defaultTrigger = (
    <Button
      variant="secondary"
      size="xs"
      className={`inline-citation-btn ${className}`}
    />
  );

  return (
    <HoverCardTrigger
      delay={delay}
      closeDelay={closeDelay}
      render={render || defaultTrigger}
      {...props}
    >
      {children}
    </HoverCardTrigger>
  );
}

/**
 * InlineCitationCardBody renders a HoverCardContent
 */
export function InlineCitationCardBody({
  align = "start",
  side = "top",
  className = "",
  children,
  ...props
}) {
  return (
    <HoverCardContent
      align={align}
      side={side}
      className={`inline-citation-body ${className}`}
      {...props}
    >
      {children}
    </HoverCardContent>
  );
}

/**
 * InlineCitationSource renders the title and an accessible link to the URL
 * with '(opens in a new tab)' in an sr-only span.
 */
export function InlineCitationSource({
  title,
  url,
  hostname: customHostname,
  quote,
  className = "",
}) {
  const displayHost = customHostname || extractHostname(url);
  const displayTitle = title || displayHost || "External Source";

  return (
    <div className={`inline-citation-source ${className}`}>
      <div className="inline-citation-header">
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="inline-citation-globe-icon"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="inline-citation-host-tag">{displayHost}</span>
      </div>

      <div className="inline-citation-title">{displayTitle}</div>

      {quote && (
        <InlineCitationQuote>{quote}</InlineCitationQuote>
      )}

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-citation-link"
        >
          <span>{displayHost || url}</span>
          <svg
            viewBox="0 0 24 24"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}

/**
 * InlineCitationText wraps inline sentence text associated with the citation
 */
export function InlineCitationText({ className = "", children }) {
  return <span className={`inline-citation-text ${className}`}>{children}</span>;
}

/**
 * InlineCitationQuote renders a cited quote excerpt
 */
export function InlineCitationQuote({ className = "", children }) {
  return (
    <blockquote className={`inline-citation-quote ${className}`}>
      &ldquo;{children}&rdquo;
    </blockquote>
  );
}

/**
 * Carousel components for cycling multiple sources in a single citation
 */
export function InlineCitationCarousel({ sources = [], className = "", children }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sources.length - 1));
  };

  const next = () => {
    setCurrentIndex((prev) => (prev < sources.length - 1 ? prev + 1 : 0));
  };

  if (!sources || sources.length === 0) return null;

  return (
    <div className={`inline-citation-carousel ${className}`}>
      <div className="inline-citation-carousel-nav">
        <span className="carousel-count">
          {currentIndex + 1} of {sources.length} sources
        </span>
        <div className="carousel-btns">
          <button
            type="button"
            className="carousel-nav-btn"
            onClick={prev}
            aria-label="Previous source"
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-nav-btn"
            onClick={next}
            aria-label="Next source"
          >
            ›
          </button>
        </div>
      </div>
      <InlineCitationSource {...sources[currentIndex]} />
      {children}
    </div>
  );
}

export function InlineCitationCarouselContent({ className = "", children }) {
  return <div className={`inline-citation-carousel-content ${className}`}>{children}</div>;
}

export function InlineCitationCarouselItem({ className = "", children }) {
  return <div className={`inline-citation-carousel-item ${className}`}>{children}</div>;
}

export function InlineCitationCarouselPrevious({ onClick, className = "" }) {
  return (
    <button
      type="button"
      className={`carousel-nav-btn ${className}`}
      onClick={onClick}
      aria-label="Previous source"
    >
      ‹
    </button>
  );
}

export function InlineCitationCarouselNext({ onClick, className = "" }) {
  return (
    <button
      type="button"
      className={`carousel-nav-btn ${className}`}
      onClick={onClick}
      aria-label="Next source"
    >
      ›
    </button>
  );
}

/**
 * Main InlineCitation component
 * Can be used as a standalone inline source or as a wrapper with children
 */
export function InlineCitation({
  url,
  title,
  hostname,
  quote,
  sources,
  index,
  label,
  className = "",
  children,
  ...props
}) {
  const displayHost = hostname || extractHostname(url);
  const displayLabel = label || (index !== undefined ? `${index + 1}` : displayHost);

  // If used as a composite wrapper with custom children
  if (children) {
    return (
      <span className={`inline-citation-wrapper ${className}`} {...props}>
        {children}
      </span>
    );
  }

  // If multiple sources provided
  if (sources && sources.length > 1) {
    return (
      <span className={`inline-citation ${className}`} {...props}>
        <InlineCitationCard>
          <InlineCitationCardTrigger>
            <span className="citation-badge-text">
              <span className="citation-icon">🔗</span>
              {displayLabel || `${sources.length} sources`}
            </span>
          </InlineCitationCardTrigger>
          <InlineCitationCardBody>
            <InlineCitationCarousel sources={sources} />
          </InlineCitationCardBody>
        </InlineCitationCard>
      </span>
    );
  }

  // Standard single inline citation
  return (
    <span className={`inline-citation ${className}`} {...props}>
      <InlineCitationCard>
        <InlineCitationCardTrigger>
          <span className="citation-badge-text">
            <span className="citation-icon">🔗</span>
            {displayLabel}
          </span>
        </InlineCitationCardTrigger>
        <InlineCitationCardBody>
          <InlineCitationSource
            title={title}
            url={url}
            hostname={displayHost}
            quote={quote}
          />
        </InlineCitationCardBody>
      </InlineCitationCard>
    </span>
  );
}

export default InlineCitation;
