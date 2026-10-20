import { createContext, useContext, forwardRef } from "react";
import "./Attachment.css";

// Context to share state, size, and orientation
const AttachmentContext = createContext({
  state: "done", // "idle" | "uploading" | "processing" | "error" | "done"
  size: "default", // "default" | "sm" | "xs"
  orientation: "horizontal", // "horizontal" | "vertical"
});

/**
 * Root Attachment component
 */
export const Attachment = forwardRef(function Attachment(
  {
    state = "done",
    size = "default",
    orientation = "horizontal",
    className = "",
    children,
    ...props
  },
  ref
) {
  return (
    <AttachmentContext.Provider value={{ state, size, orientation }}>
      <div
        ref={ref}
        className={`attachment-root attachment-${orientation} attachment-size-${size} attachment-state-${state} ${className}`}
        data-state={state}
        data-size={size}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </AttachmentContext.Provider>
  );
});

/**
 * Media container for icon or image thumbnail
 */
export const AttachmentMedia = forwardRef(function AttachmentMedia(
  { variant = "icon", className = "", children, ...props },
  ref
) {
  const { state, orientation, size } = useContext(AttachmentContext);

  return (
    <div
      ref={ref}
      className={`attachment-media media-${variant} media-${orientation} media-size-${size} ${className}`}
      {...props}
    >
      {children}
      {(state === "uploading" || state === "processing") && (
        <span className="attachment-media-shimmer" />
      )}
    </div>
  );
});

/**
 * Content container for title and description
 */
export const AttachmentContent = forwardRef(function AttachmentContent(
  { className = "", children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`attachment-content ${className}`} {...props}>
      {children}
    </div>
  );
});

/**
 * Attachment title (shimmers when uploading or processing)
 */
export const AttachmentTitle = forwardRef(function AttachmentTitle(
  { className = "", children, ...props },
  ref
) {
  const { state } = useContext(AttachmentContext);
  const isShimmering = state === "uploading" || state === "processing";

  return (
    <span
      ref={ref}
      className={`attachment-title ${isShimmering ? "attachment-title-shimmer" : ""} ${className}`}
      title={typeof children === "string" ? children : undefined}
      {...props}
    >
      {children}
    </span>
  );
});

/**
 * Secondary metadata (file size, format, upload progress, error)
 */
export const AttachmentDescription = forwardRef(function AttachmentDescription(
  { className = "", children, ...props },
  ref
) {
  const { state } = useContext(AttachmentContext);

  return (
    <span
      ref={ref}
      className={`attachment-description ${state === "error" ? "description-error" : ""} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
});

/**
 * Container for actions aligned to the end
 */
export const AttachmentActions = forwardRef(function AttachmentActions(
  { className = "", children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`attachment-actions ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * Individual action button
 */
export const AttachmentAction = forwardRef(function AttachmentAction(
  {
    size = "icon-xs",
    className = "",
    children,
    onClick,
    type = "button",
    "aria-label": ariaLabel,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      className={`attachment-action action-size-${size} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});

/**
 * Full card interactive trigger (link or button) behind actions
 */
export const AttachmentTrigger = forwardRef(function AttachmentTrigger(
  {
    render,
    className = "",
    onClick,
    type = "button",
    "aria-label": ariaLabel,
    children,
    ...props
  },
  ref
) {
  if (typeof render === "function") {
    return render({ ref, className: `attachment-trigger ${className}`, ...props });
  }

  if (render) {
    const CustomEl = render;
    return (
      <span className={`attachment-trigger-wrapper ${className}`}>
        {CustomEl}
      </span>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      className={`attachment-trigger ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
});

/**
 * Horizontally scrollable row with edge fade and scroll snapping
 */
export const AttachmentGroup = forwardRef(function AttachmentGroup(
  { className = "", children, "aria-label": ariaLabel = "Attachments", ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      tabIndex={0}
      className={`attachment-group ${className}`}
      {...props}
    >
      <div className="attachment-group-inner">{children}</div>
    </div>
  );
});
