import { forwardRef } from "react";
import { Marker, MarkerContent, MarkerIcon } from "./Marker";
import "./Checkpoint.css";

/**
 * CheckpointIcon component
 * Renders MarkerIcon with bookmark/checkpoint SVG
 */
export const CheckpointIcon = forwardRef(function CheckpointIcon(
  { className = "", children, ...props },
  ref
) {
  return (
    <MarkerIcon ref={ref} className={`checkpoint-icon ${className}`} {...props}>
      {children || (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </MarkerIcon>
  );
});

/**
 * CheckpointTrigger button
 * Renders button with size="xs" and variant="outline"
 */
export const CheckpointTrigger = forwardRef(function CheckpointTrigger(
  {
    className = "",
    size = "xs",
    variant = "outline",
    type = "button",
    onClick,
    children = "Restore",
    tooltip = "Restore thread to this turn",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`checkpoint-trigger trigger-size-${size} trigger-${variant} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      title={tooltip}
      {...props}
    >
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
      <span>{children}</span>
    </button>
  );
});

/**
 * Checkpoint root component
 * Renders a Marker with variant="separator" and MarkerContent
 */
export const Checkpoint = forwardRef(function Checkpoint(
  {
    label,
    onRestore,
    onClick,
    className = "",
    children,
    ...props
  },
  ref
) {
  const handleRestore = onRestore || onClick;

  return (
    <Marker ref={ref} variant="separator" className={`checkpoint-root ${className}`} {...props}>
      <MarkerContent className="checkpoint-marker-content">
        <CheckpointIcon />
        {label && <span className="checkpoint-label">{label}</span>}
        {children}
        {handleRestore && (
          <CheckpointTrigger onClick={handleRestore}>
            Restore
          </CheckpointTrigger>
        )}
      </MarkerContent>
    </Marker>
  );
});

export default Checkpoint;
