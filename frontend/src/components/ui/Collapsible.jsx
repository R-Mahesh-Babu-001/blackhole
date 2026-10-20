import React, { createContext, useContext, useState } from "react";
import "./Collapsible.css";

const CollapsibleContext = createContext({
  isOpen: false,
  toggle: () => {},
  disabled: false,
});

/**
 * Collapsible Component conforming to shadcn/ui Collapsible specification
 */
export function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = () => {
    if (disabled) return;
    const next = !isOpen;
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle, disabled }}>
      <div
        data-state={isOpen ? "open" : "closed"}
        className={`ui-collapsible ${isOpen ? "collapsible-open" : "collapsible-closed"} ${className}`}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

/**
 * CollapsibleTrigger
 * Supports custom render prop (e.g. render={<Button .../>}) or standard button
 */
export function CollapsibleTrigger({
  render,
  children,
  className = "",
  onClick,
  ...props
}) {
  const { isOpen, toggle, disabled } = useContext(CollapsibleContext);

  const handleClick = (e) => {
    onClick?.(e);
    toggle();
  };

  if (render && React.isValidElement(render)) {
    return React.cloneElement(render, {
      ...props,
      "data-state": isOpen ? "open" : "closed",
      "data-panel-open": isOpen ? "open" : "closed",
      disabled: disabled || render.props.disabled,
      className: `${render.props.className || ""} ${className} ${isOpen ? "group-data-panel-open/button" : ""}`.trim(),
      onClick: (e) => {
        render.props.onClick?.(e);
        handleClick(e);
      },
      children: children || render.props.children,
    });
  }

  return (
    <button
      type="button"
      data-state={isOpen ? "open" : "closed"}
      data-panel-open={isOpen ? "open" : "closed"}
      disabled={disabled}
      className={`ui-collapsible-trigger ${isOpen ? "group-data-panel-open/button" : ""} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * CollapsibleContent
 * Shows children when open
 */
export function CollapsibleContent({
  keepMounted = false,
  className = "",
  children,
  ...props
}) {
  const { isOpen } = useContext(CollapsibleContext);

  if (!isOpen && !keepMounted) return null;

  return (
    <div
      data-state={isOpen ? "open" : "closed"}
      className={`ui-collapsible-content ${className}`}
      style={!isOpen && keepMounted ? { display: "none" } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
