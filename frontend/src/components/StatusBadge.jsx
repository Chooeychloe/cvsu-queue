const STATUS_CONFIG = {
  WAITING: {
    text: 'text-status-waiting',
    dot: 'bg-status-waiting',
    bg: 'bg-status-waiting/10',
  },
  CALLED: {
    text: 'text-status-called',
    dot: 'bg-status-called',
    bg: 'bg-status-called/10',
  },
  SERVING: {
    text: 'text-status-serving',
    dot: 'bg-status-serving',
    bg: 'bg-status-serving/10',
  },
  COMPLETED: {
    text: 'text-status-completed',
    dot: 'bg-status-completed',
    bg: 'bg-status-completed/10',
  },
  SKIPPED: {
    text: 'text-status-skipped',
    dot: 'bg-status-skipped',
    bg: 'bg-status-skipped/10',
  },
  CANCELLED: {
    text: 'text-status-cancelled',
    dot: 'bg-status-cancelled',
    bg: 'bg-status-cancelled/10',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`
        inline-flex items-center gap-2
        rounded-full
        px-2.5 py-1
        text-xs font-semibold
        tracking-wide
        ${config?.text || 'text-ink-muted'}
        ${config?.bg || 'bg-ink-faint/10'}
      `}
    >
      <span
        className={`
          h-1.5 w-1.5 shrink-0 rounded-full
          ${config?.dot || 'bg-ink-faint'}
        `}
      />

      {status || 'UNKNOWN'}
    </span>
  );
}