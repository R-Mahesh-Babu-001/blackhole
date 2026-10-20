import "./Progress.css";

/**
 * Progress component conforming to shadcn/ui Progress specification
 * Accessible with role="progressbar" and aria attributes
 */
export function Progress({
  value = 0,
  max = 100,
  className = "",
  indicatorClassName = "",
  "aria-label": ariaLabel = "Progress",
  ...props
}) {
  const safeMax = max > 0 ? max : 100;
  const clampedValue = Math.max(0, Math.min(safeMax, Number(value) || 0));
  const percentage = Math.round((clampedValue / safeMax) * 100);

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      className={`ui-progress-root ${className}`}
      {...props}
    >
      <div
        className={`ui-progress-indicator ${indicatorClassName}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
