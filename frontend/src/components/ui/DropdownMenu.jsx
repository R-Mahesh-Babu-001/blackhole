import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  cloneElement,
} from "react";
import "./DropdownMenu.css";

const DropdownMenuContext = createContext({
  open: false,
  setOpen: () => {},
});

const DropdownMenuRadioContext = createContext({
  value: "",
  onValueChange: () => {},
});

/**
 * DropdownMenu
 * Conforms to shadcn/ui Dropdown Menu specification
 */
export function DropdownMenu({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (next) => {
    if (!isControlled) setUncontrolledOpen(next);
    if (onOpenChange) onOpenChange(next);
  };

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="ui-dropdown-menu-root">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

/**
 * DropdownMenuTrigger
 */
export function DropdownMenuTrigger({
  render,
  asChild = false,
  children,
  className = "",
  ...props
}) {
  const { open, setOpen } = useContext(DropdownMenuContext);

  const handleClick = (e) => {
    e.stopPropagation();
    setOpen(!open);
  };

  const triggerProps = {
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onClick: handleClick,
    className: `ui-dropdown-menu-trigger ${open ? "is-open" : ""} ${className}`.trim(),
    ...props,
  };

  if (render && React.isValidElement(render)) {
    return cloneElement(render, {
      ...triggerProps,
      onClick: (e) => {
        render.props.onClick?.(e);
        handleClick(e);
      },
      className: `${render.props.className || ""} ${triggerProps.className}`.trim(),
    });
  }

  if (asChild && React.isValidElement(children)) {
    return cloneElement(children, {
      ...triggerProps,
      onClick: (e) => {
        children.props.onClick?.(e);
        handleClick(e);
      },
      className: `${children.props.className || ""} ${triggerProps.className}`.trim(),
    });
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

/**
 * DropdownMenuContent
 */
export function DropdownMenuContent({
  align = "start",
  side = "bottom",
  sideOffset = 6,
  className = "",
  children,
  ...props
}) {
  const { open, setOpen } = useContext(DropdownMenuContext);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDownOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        // Also check if clicked on trigger
        const trigger = contentRef.current.parentElement?.querySelector(".ui-dropdown-menu-trigger");
        if (trigger && trigger.contains(event.target)) return;
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      tabIndex={-1}
      className={`ui-dropdown-menu-content align-${align} side-${side} ${className}`}
      style={{
        marginTop: side === "bottom" ? `${sideOffset}px` : undefined,
        marginBottom: side === "top" ? `${sideOffset}px` : undefined,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * DropdownMenuGroup
 */
export function DropdownMenuGroup({ className = "", children, ...props }) {
  return (
    <div role="group" className={`ui-dropdown-menu-group ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * DropdownMenuLabel
 */
export function DropdownMenuLabel({ className = "", children, ...props }) {
  return (
    <div className={`ui-dropdown-menu-label ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * DropdownMenuItem
 */
export function DropdownMenuItem({
  disabled = false,
  closeOnClick = true,
  onClick,
  className = "",
  children,
  ...props
}) {
  const { setOpen } = useContext(DropdownMenuContext);

  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
    if (closeOnClick) setOpen(false);
  };

  return (
    <div
      role="menuitem"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`ui-dropdown-menu-item ${disabled ? "is-disabled" : ""} ${className}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * DropdownMenuRadioGroup
 */
export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  className = "",
  children,
  ...props
}) {
  return (
    <DropdownMenuRadioContext.Provider value={{ value, onValueChange }}>
      <div
        role="radiogroup"
        className={`ui-dropdown-menu-radio-group ${className}`}
        {...props}
      >
        {children}
      </div>
    </DropdownMenuRadioContext.Provider>
  );
}

/**
 * DropdownMenuRadioItem
 */
export function DropdownMenuRadioItem({
  value,
  disabled = false,
  closeOnClick = true,
  className = "",
  children,
  ...props
}) {
  const { setOpen } = useContext(DropdownMenuContext);
  const radio = useContext(DropdownMenuRadioContext);
  const isSelected = radio.value === value;

  const handleClick = () => {
    if (disabled) return;
    if (radio.onValueChange) radio.onValueChange(value);
    if (closeOnClick) setOpen(false);
  };

  return (
    <div
      role="menuitemradio"
      aria-checked={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`ui-dropdown-menu-radio-item ${isSelected ? "is-selected" : ""} ${
        disabled ? "is-disabled" : ""
      } ${className}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      {...props}
    >
      <span className="ui-dropdown-menu-radio-indicator">
        {isSelected ? (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className="radio-dot-placeholder" />
        )}
      </span>
      <div className="ui-dropdown-menu-radio-content">{children}</div>
    </div>
  );
}

/**
 * DropdownMenuSeparator
 */
export function DropdownMenuSeparator({ className = "", ...props }) {
  return (
    <div
      role="separator"
      className={`ui-dropdown-menu-separator ${className}`}
      {...props}
    />
  );
}

/**
 * DropdownMenuShortcut
 */
export function DropdownMenuShortcut({ className = "", children, ...props }) {
  return (
    <span className={`ui-dropdown-menu-shortcut ${className}`} {...props}>
      {children}
    </span>
  );
}

export default DropdownMenu;
