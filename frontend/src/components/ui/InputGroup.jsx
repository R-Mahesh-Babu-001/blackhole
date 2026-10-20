import { forwardRef } from "react";
import "./InputGroup.css";

/**
 * InputGroup
 * Conforms to shadcn/ui Input Group specification
 */
export const InputGroup = forwardRef(function InputGroup(
  { className = "", children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`ui-input-group ${className}`} {...props}>
      {children}
    </div>
  );
});

/**
 * InputGroupAddon
 * Holds controls, buttons, dropdowns, and triggers attached to input/textarea
 */
export const InputGroupAddon = forwardRef(function InputGroupAddon(
  { align = "block-end", className = "", children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`ui-input-group-addon addon-align-${align} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * InputGroupButton
 * Button sized and styled specifically for InputGroup bar
 */
export const InputGroupButton = forwardRef(function InputGroupButton(
  {
    variant = "ghost",
    size = "sm",
    type = "button",
    disabled = false,
    className = "",
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`ui-input-group-btn btn-variant-${variant} btn-size-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

/**
 * InputGroupTextarea
 */
export const InputGroupTextarea = forwardRef(function InputGroupTextarea(
  { className = "", rows = 2, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`ui-input-group-textarea ${className}`}
      {...props}
    />
  );
});

/**
 * InputGroupInput
 */
export const InputGroupInput = forwardRef(function InputGroupInput(
  { className = "", type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={`ui-input-group-input ${className}`}
      {...props}
    />
  );
});

export default InputGroup;
