import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import "./MessageScroller.css";

const MessageScrollerContext = createContext({
  viewportRef: null,
  isAtBottom: true,
  scrollToBottom: () => {},
  autoScroll: true,
});

/**
 * MessageScrollerProvider
 * Provides smart auto-scrolling, anchor settling, and bottom-detection state
 */
export function MessageScrollerProvider({
  autoScroll = true,
  children,
}) {
  const viewportRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkIsAtBottom = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return true;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceToBottom < 60;
  }, []);

  const handleScroll = useCallback(() => {
    setIsAtBottom(checkIsAtBottom());
  }, [checkIsAtBottom]);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = viewportRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
      setIsAtBottom(true);
    }
  }, []);

  // Auto-scroll when content expands if the user was already at bottom
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !autoScroll) return;

    const observer = new ResizeObserver(() => {
      if (checkIsAtBottom()) {
        el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
      }
    });

    observer.observe(el);
    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    return () => observer.disconnect();
  }, [autoScroll, checkIsAtBottom]);

  return (
    <MessageScrollerContext.Provider
      value={{
        viewportRef,
        isAtBottom,
        scrollToBottom,
        autoScroll,
        handleScroll,
      }}
    >
      {children}
    </MessageScrollerContext.Provider>
  );
}

/**
 * MessageScroller
 * Root container for the message thread viewport and floating buttons
 */
export function MessageScroller({ className = "", children, ...props }) {
  return (
    <div className={`ui-message-scroller ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * MessageScrollerViewport
 * The scrollable container that tracks viewport position
 */
export function MessageScrollerViewport({
  className = "",
  children,
  ...props
}) {
  const { viewportRef, handleScroll } = useContext(MessageScrollerContext);

  return (
    <div
      ref={viewportRef}
      onScroll={handleScroll}
      className={`ui-message-scroller-viewport ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * MessageScrollerContent
 * Inner layout container holding all message items
 */
export function MessageScrollerContent({
  className = "",
  children,
  ...props
}) {
  return (
    <div className={`ui-message-scroller-content ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * MessageScrollerItem
 * Wraps each turn. When scrollAnchor is set to true (e.g. on user turns),
 * it settles the message near the top so the reply streams in under it.
 */
export function MessageScrollerItem({
  messageId,
  scrollAnchor = false,
  className = "",
  children,
  ...props
}) {
  const itemRef = useRef(null);

  useEffect(() => {
    if (scrollAnchor && itemRef.current) {
      // Settle smoothly near top of the scroller
      itemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [scrollAnchor]);

  return (
    <div
      ref={itemRef}
      data-message-id={messageId}
      className={`ui-message-scroller-item ${scrollAnchor ? "is-scroll-anchor" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * MessageScrollerButton
 * Floating "Scroll to bottom" button that appears when scrolled up
 */
export function MessageScrollerButton({
  className = "",
  onClick,
  ...props
}) {
  const { isAtBottom, scrollToBottom } = useContext(MessageScrollerContext);

  if (isAtBottom) return null;

  const handleClick = (e) => {
    onClick?.(e);
    scrollToBottom("smooth");
  };

  return (
    <button
      type="button"
      className={`ui-message-scroller-btn ${className}`}
      onClick={handleClick}
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
