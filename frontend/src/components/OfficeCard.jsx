export default function OfficeCard({ office, onSelect }) {
  return (
    <button
      onClick={() => onSelect(office)}
      className="group flex items-center justify-between border-b border-border py-6 text-left transition first:border-t hover:px-2"
    >
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-medium tracking-widest text-ink-faint">{office.code}</span>
          <span className="text-lg font-medium text-ink">{office.name}</span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          {office.window_count} {office.window_count > 1 ? 'windows' : 'window'}
        </p>
      </div>
      <span className="text-ink-faint transition group-hover:translate-x-1 group-hover:text-cvsu-blue">
        &rarr;
      </span>
    </button>
  );
}
