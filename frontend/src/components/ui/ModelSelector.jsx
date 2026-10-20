import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "./DropdownMenu";
import "./ModelSelector.css";

/**
 * ModelSelector
 * Conforms to shadcn AI Elements Model Selector specification
 * Rebuilt on DropdownMenu while preserving all AI SDK Elements exports.
 */
export function ModelSelector({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}) {
  return (
    <DropdownMenu
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      {...props}
    >
      {children}
    </DropdownMenu>
  );
}

export function ModelSelectorTrigger({
  render,
  asChild,
  className = "",
  children,
  ...props
}) {
  return (
    <DropdownMenuTrigger
      render={render}
      asChild={asChild}
      className={`ui-model-selector-trigger ${className}`}
      {...props}
    >
      {children}
    </DropdownMenuTrigger>
  );
}

export function ModelSelectorContent({
  align = "start",
  side = "bottom",
  className = "",
  children,
  ...props
}) {
  return (
    <DropdownMenuContent
      align={align}
      side={side}
      className={`ui-model-selector-content ${className}`}
      {...props}
    >
      {children}
    </DropdownMenuContent>
  );
}

export function ModelSelectorList({
  value,
  onValueChange,
  className = "",
  children,
  ...props
}) {
  return (
    <DropdownMenuRadioGroup
      value={value}
      onValueChange={onValueChange}
      className={`ui-model-selector-list ${className}`}
      {...props}
    >
      {children}
    </DropdownMenuRadioGroup>
  );
}

export function ModelSelectorGroup({
  heading,
  label,
  className = "",
  children,
  ...props
}) {
  const title = heading || label;
  return (
    <DropdownMenuGroup className={`ui-model-selector-group ${className}`} {...props}>
      {title && <DropdownMenuLabel>{title}</DropdownMenuLabel>}
      {children}
    </DropdownMenuGroup>
  );
}

export function ModelSelectorItem({
  value,
  disabled = false,
  closeOnClick = true,
  className = "",
  children,
  ...props
}) {
  return (
    <DropdownMenuRadioItem
      value={value}
      disabled={disabled}
      closeOnClick={closeOnClick}
      className={`ui-model-selector-item ${className}`}
      {...props}
    >
      {children}
    </DropdownMenuRadioItem>
  );
}

export function ModelSelectorSeparator({ className = "", ...props }) {
  return (
    <DropdownMenuSeparator
      className={`ui-model-selector-separator ${className}`}
      {...props}
    />
  );
}

export function ModelSelectorShortcut({ className = "", children, ...props }) {
  return (
    <DropdownMenuShortcut
      className={`ui-model-selector-shortcut ${className}`}
      {...props}
    >
      {children}
    </DropdownMenuShortcut>
  );
}

export function ModelSelectorLogo({
  provider = "google",
  className = "",
  children,
  ...props
}) {
  return (
    <span
      className={`ui-model-selector-logo logo-${provider} ${className}`}
      {...props}
    >
      {children || getProviderIcon(provider)}
    </span>
  );
}

export function ModelSelectorLogoGroup({ className = "", children, ...props }) {
  return (
    <div className={`ui-model-selector-logo-group ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ModelSelectorName({
  name,
  description,
  className = "",
  children,
  ...props
}) {
  return (
    <div className={`ui-model-selector-name ${className}`} {...props}>
      {children ? (
        children
      ) : (
        <>
          <span className="model-name-title">{name}</span>
          {description && <span className="model-name-desc">{description}</span>}
        </>
      )}
    </div>
  );
}

export function ModelSelectorInput({
  value,
  onChange,
  placeholder = "Search models...",
  className = "",
  ...props
}) {
  return (
    <div className="ui-model-selector-input-wrap">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`ui-model-selector-input ${className}`}
        {...props}
      />
    </div>
  );
}

export function ModelSelectorEmpty({
  children = "No model found.",
  className = "",
  ...props
}) {
  return (
    <div className={`ui-model-selector-empty ${className}`} {...props}>
      {children}
    </div>
  );
}

function getProviderIcon(provider) {
  const p = (provider || "").toLowerCase();
  if (p.includes("anthropic") || p.includes("claude")) {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 22h5l2.5-5h5l2.5 5h5L12 2zm-1 12l2.5-5.5L16 14h-5z" />
      </svg>
    );
  }
  if (p.includes("openai") || p.includes("gpt")) {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  }
  if (p.includes("deepseek")) {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    );
  }
  // Google / Gemini default
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2z" />
    </svg>
  );
}

export default ModelSelector;
