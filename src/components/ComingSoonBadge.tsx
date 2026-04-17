/**
 * Small text-only badge — no icon — used to mark features that are not yet live.
 * Per project rules: no icons (avoid AI-generated look) and not clickable.
 */
interface ComingSoonBadgeProps {
  label?: string;
  className?: string;
}

export function ComingSoonBadge({ label = 'Kommer snart', className = '' }: ComingSoonBadgeProps) {
  return (
    <span
      aria-disabled
      className={`inline-flex items-center rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80 select-none ${className}`}
    >
      {label}
    </span>
  );
}
