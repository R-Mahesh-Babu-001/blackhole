import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useContext,
} from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "./InputGroup";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "./Attachment";
import { PromptInputContext } from "./PromptInputContext";
import "./PromptInput.css";

/**
 * PromptInput
 * Root prompt composer component conforming to shadcn AI Elements Prompt Input specification.
 * Built on Input Group with attachments chip header and action bar.
 */
export const PromptInput = forwardRef(function PromptInput(
  {
    status = "idle", // "idle" | "streaming" | "submitting" | "error"
    canSend = true,
    formRef: externalFormRef,
    onSubmit,
    text,
    setText,
    attachments = [],
    onRemoveAttachment,
    onClearAttachments,
    fileInputRef,
    className = "",
    children,
    ...props
  },
  ref
) {
  const internalFormRef = useRef(null);
  const activeFormRef = externalFormRef || internalFormRef;

  useImperativeHandle(ref, () => activeFormRef.current);

  const openFilePicker = () => {
    fileInputRef?.current?.click();
  };

  const contextValue = {
    status,
    canSend,
    formRef: activeFormRef,
    text,
    setText,
    attachments,
    onRemoveAttachment,
    onClearAttachments,
    openFilePicker,
  };

  return (
    <PromptInputContext.Provider value={contextValue}>
      <form
        ref={activeFormRef}
        onSubmit={onSubmit}
        className={`ui-prompt-input-form ${className}`}
        {...props}
      >
        <InputGroup className="ui-prompt-input-group">
          {children}
        </InputGroup>
      </form>
    </PromptInputContext.Provider>
  );
});

/**
 * PromptInputHeader
 * Displays attachments inside an InputGroupAddon with align="block-start"
 */
export const PromptInputHeader = forwardRef(function PromptInputHeader(
  {
    attachments: directAttachments,
    onRemoveAttachment: directOnRemove,
    className = "",
    children,
    ...props
  },
  ref
) {
  const context = useContext(PromptInputContext);
  const list = directAttachments || context.attachments || [];
  const handleRemove = directOnRemove || context.onRemoveAttachment;

  if (list.length === 0 && !children) {
    return null;
  }

  return (
    <InputGroupAddon
      ref={ref}
      align="block-start"
      className={`ui-prompt-input-header ${className}`}
      {...props}
    >
      {children || (
        <div className="ui-prompt-input-attachments-list">
          {list.map((file) => (
            <Attachment
              key={file.id || file.name}
              size="sm"
              state={file.state || "done"}
              orientation="horizontal"
              className="ui-prompt-input-attachment-chip"
            >
              <AttachmentMedia variant={file.variant || (file.type?.startsWith("image/") ? "image" : "icon")}>
                {file.previewUrl ? (
                  <img src={file.previewUrl} alt={file.name} />
                ) : (
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{file.name}</AttachmentTitle>
                <AttachmentDescription>
                  {file.state === "uploading"
                    ? "Uploading…"
                    : file.state === "processing"
                    ? "Processing…"
                    : file.sizeStr || file.description || ""}
                </AttachmentDescription>
              </AttachmentContent>
              {handleRemove && (
                <AttachmentActions>
                  <AttachmentAction
                    size="icon-xs"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => handleRemove(file.id || file.name)}
                  >
                    <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </AttachmentAction>
                </AttachmentActions>
              )}
            </Attachment>
          ))}
        </div>
      )}
    </InputGroupAddon>
  );
});

/**
 * PromptInputTextarea
 * Renders an InputGroupTextarea with className="p-3" and Enter sends / Shift+Enter newline
 */
export const PromptInputTextarea = forwardRef(function PromptInputTextarea(
  {
    value,
    onChange,
    onKeyDown,
    placeholder = "Ask the agent to change your code...",
    className = "",
    rows = 2,
    ...props
  },
  ref
) {
  const context = useContext(PromptInputContext);

  const activeValue = value !== undefined ? value : context.text;
  const handleChange = (e) => {
    if (onChange) onChange(e);
    if (context.setText && value === undefined) context.setText(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form || context.formRef?.current;
      if (form) {
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      }
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <InputGroupTextarea
      ref={ref}
      value={activeValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={rows}
      className={`p-3 ui-prompt-input-textarea ${className}`}
      {...props}
    />
  );
});

/**
 * PromptInputActionMenuTrigger
 * Attach button rendering an InputGroupButton with size="icon-sm", variant="outline", and rounded-full
 */
export const PromptInputActionMenuTrigger = forwardRef(function PromptInputActionMenuTrigger(
  {
    className = "",
    onClick,
    children,
    "aria-label": ariaLabel = "Attach files",
    ...props
  },
  ref
) {
  const context = useContext(PromptInputContext);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (context.openFilePicker) {
      context.openFilePicker();
    }
  };

  return (
    <InputGroupButton
      ref={ref}
      type="button"
      size="icon-sm"
      variant="outline"
      className={`rounded-full ui-prompt-input-attach-btn ${className}`}
      aria-label={ariaLabel}
      onClick={handleClick}
      {...props}
    >
      {children || <PlusIcon />}
    </InputGroupButton>
  );
});

/**
 * PromptInputSubmit
 * Send / stop button rendering an InputGroupButton with size="icon-sm", variant="default", and rounded-full
 */
export const PromptInputSubmit = forwardRef(function PromptInputSubmit(
  {
    status: directStatus,
    disabled: directDisabled,
    onStop,
    className = "",
    children,
    "aria-label": ariaLabel = "Send",
    ...props
  },
  ref
) {
  const context = useContext(PromptInputContext);
  const status = directStatus || context.status || "idle";
  const isStreaming = status === "streaming";
  const canSend = context.canSend;

  const isDisabled = directDisabled !== undefined
    ? directDisabled
    : (!isStreaming && !canSend);

  return (
    <InputGroupButton
      ref={ref}
      type={isStreaming ? "button" : "submit"}
      size="icon-sm"
      variant="default"
      className={`rounded-full ui-prompt-input-submit-btn ${className}`}
      disabled={isDisabled}
      aria-label={isStreaming ? "Stop generation" : ariaLabel}
      onClick={isStreaming ? onStop : undefined}
      {...props}
    >
      {children || (isStreaming ? <SquareIcon /> : <ArrowUpIcon />)}
    </InputGroupButton>
  );
});

/**
 * PromptInputActions
 * Addon bar container (align="block-end") holding attach button, model/effort menus, and send button
 */
export const PromptInputActions = forwardRef(function PromptInputActions(
  { className = "", children, ...props },
  ref
) {
  return (
    <InputGroupAddon
      ref={ref}
      align="block-end"
      className={`ui-prompt-input-actions ${className}`}
      {...props}
    >
      {children}
    </InputGroupAddon>
  );
});

/**
 * Pass-through wrappers for compatibility with AI SDK Elements
 */
export const PromptInputAction = forwardRef(function PromptInputAction(
  { className = "", children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`ui-prompt-input-action ${className}`} {...props}>
      {children}
    </div>
  );
});

export const PromptInputSelect = forwardRef(function PromptInputSelect(
  { className = "", children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`ui-prompt-input-select ${className}`} {...props}>
      {children}
    </div>
  );
});

export const PromptInputHoverCard = forwardRef(function PromptInputHoverCard(
  { className = "", children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`ui-prompt-input-hover-card ${className}`} {...props}>
      {children}
    </div>
  );
});

/* ==================================================
   Prompt Input Standard Monochrome Icons
================================================== */

export function PlusIcon({ width = 14, height = 14, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ArrowUpIcon({ width = 14, height = 14, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export function SquareIcon({ width = 11, height = 11, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="currentColor"
      className={className}
    >
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}

export function PaperclipIcon({ width = 14, height = 14, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export default PromptInput;
