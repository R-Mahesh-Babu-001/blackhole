import { createContext, useContext, useState, useRef } from "react";
import "./Tooltip.css";

const TooltipContext = createContext({
  open: false,
  setOpen: () => {},
  delayDuration: 200,
});

export function TooltipProvider({ delayDuration: _delayDuration = 200, children }) {
  return children;
}

export function Tooltip({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 180,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const timeoutRef = useRef(null);

  const setOpen = (nextOpen) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (nextOpen) {
      timeoutRef.current = setTimeout(() => {
        if (!isControlled) setUncontrolledOpen(true);
        if (onOpenChange) onOpenChange(true);
      }, delayDuration);
    } else {
      if (!isControlled) setUncontrolledOpen(false);
      if (onOpenChange) onOpenChange(false);
    }
  };

  return (
    <TooltipContext.Provider value={{ open, setOpen, delayDuration }}>
      <div
        className="ui-tooltip-root"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ asChild: _asChild, children, className = "", ...props }) {
  const { setOpen } = useContext(TooltipContext);

  return (
    <div
      className={`ui-tooltip-trigger ${className}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function TooltipContent({
  side = "top",
  align = "center",
  className = "",
  children,
  ...props
}) {
  const { open } = useContext(TooltipContext);

  if (!open) return null;

  return (
    <div
      role="tooltip"
      className={`ui-tooltip-content tooltip-side-${side} tooltip-align-${align} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Tooltip;
