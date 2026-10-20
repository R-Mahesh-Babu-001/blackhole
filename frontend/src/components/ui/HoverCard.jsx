import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import "./HoverCard.css";

const HoverCardContext = createContext({
  isOpen: false,
  openCard: () => {},
  closeCard: () => {},
});

/**
 * Root HoverCard Component
 * Manages open/close delays and contextual state
 */
export function HoverCard({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  openDelay = 10,
  closeDelay = 100,
  children,
  className = "",
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const setCardOpen = (val) => {
    if (!isControlled) {
      setUncontrolledOpen(val);
    }
    onOpenChange?.(val);
  };

  const openCard = (customDelay) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    const delay = customDelay !== undefined ? customDelay : openDelay;
    if (delay <= 0) {
      setCardOpen(true);
    } else {
      openTimerRef.current = setTimeout(() => {
        setCardOpen(true);
      }, delay);
    }
  };

  const closeCard = (customDelay) => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    const delay = customDelay !== undefined ? customDelay : closeDelay;
    if (delay <= 0) {
      setCardOpen(false);
    } else {
      closeTimerRef.current = setTimeout(() => {
        setCardOpen(false);
      }, delay);
    }
  };

  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <HoverCardContext.Provider value={{ isOpen, openCard, closeCard }}>
      <div className={`ui-hover-card-root ${className}`}>
        {children}
      </div>
    </HoverCardContext.Provider>
  );
}

/**
 * Trigger component for HoverCard
 * Supports custom render prop (e.g. render={<Button .../>}) or children
 */
export function HoverCardTrigger({
  delay,
  closeDelay,
  render,
  children,
  className = "",
  ...props
}) {
  const { openCard, closeCard } = useContext(HoverCardContext);

  const handleMouseEnter = () => openCard(delay);
  const handleMouseLeave = () => closeCard(closeDelay);
  const handleFocus = () => openCard(0);
  const handleBlur = () => closeCard(closeDelay);

  // If a render prop element is supplied (shadcn HoverCardTrigger style)
  if (render && React.isValidElement(render)) {
    return React.cloneElement(render, {
      ...props,
      className: `${render.props.className || ""} ${className}`.trim(),
      onMouseEnter: (e) => {
        render.props.onMouseEnter?.(e);
        handleMouseEnter();
      },
      onMouseLeave: (e) => {
        render.props.onMouseLeave?.(e);
        handleMouseLeave();
      },
      onFocus: (e) => {
        render.props.onFocus?.(e);
        handleFocus();
      },
      onBlur: (e) => {
        render.props.onBlur?.(e);
        handleBlur();
      },
      children: children || render.props.children,
    });
  }

  return (
    <button
      type="button"
      className={`ui-hover-card-trigger ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Floating Content popover for HoverCard
 */
export function HoverCardContent({
  align = "end", // "start" | "center" | "end"
  side = "bottom", // "top" | "bottom"
  className = "",
  children,
  ...props
}) {
  const { isOpen, openCard, closeCard } = useContext(HoverCardContext);

  if (!isOpen) return null;

  return (
    <div
      className={`ui-hover-card-content align-${align} side-${side} ${className}`}
      onMouseEnter={() => openCard(0)}
      onMouseLeave={() => closeCard(100)}
      {...props}
    >
      {children}
    </div>
  );
}
