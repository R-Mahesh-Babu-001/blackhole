import { forwardRef } from "react";
import "./Marker.css";

/**
 * Marker component
 * Variants: "separator" (default), "line", "dot"
 */
export const Marker = forwardRef(function Marker(
  { variant = "separator", className = "", children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`marker-root marker-variant-${variant} ${className}`}
      data-variant={variant}
      {...props}
    >
      <div className="marker-line-before" />
      {children}
      <div className="marker-line-after" />
    </div>
  );
});

/**
 * MarkerContent container for badges, labels, and action buttons
 */
export const MarkerContent = forwardRef(function MarkerContent(
  { className = "", children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`marker-content ${className}`} {...props}>
      {children}
    </div>
  );
});

/**
 * MarkerIcon for bookmark, flag, or restore symbol
 */
export const MarkerIcon = forwardRef(function MarkerIcon(
  { className = "", children, ...props },
  ref
) {
  return (
    <span ref={ref} className={`marker-icon ${className}`} {...props}>
      {children || (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </span>
  );
});

export default Marker;
