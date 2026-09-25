const STATUS_COLOR = {
  WAITING: 'text-status-waiting',
  CALLED: 'text-status-called',
  SERVING: 'text-status-serving',
  COMPLETED: 'text-status-completed',
  SKIPPED: 'text-status-skipped',
  CANCELLED: 'text-status-cancelled',
};

const STATUS_DOT = {
  WAITING: 'bg-status-waiting',
  CALLED: 'bg-status-called',
  SERVING: 'bg-status-serving',
  COMPLETED: 'bg-status-completed',
  SKIPPED: 'bg-status-skipped',
  CANCELLED: 'bg-status-cancelled',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wide ${STATUS_COLOR[status] || 'text-ink-muted'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || 'bg-ink-faint'}`} />
      {status}
    </span>
  );
}
