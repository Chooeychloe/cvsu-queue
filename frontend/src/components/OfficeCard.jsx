
import {
  ArrowRight,
  Building2,
  Users,
} from "lucide-react";

export default function OfficeCard({ office, onSelect }) {
  const windowCount = Number(office.window_count) || 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(office)}
      className="
        group relative w-full overflow-hidden rounded-xl
        border border-border bg-white p-5 text-left
        shadow-sm transition-all duration-200
        hover:-translate-y-0.5
        hover:border-cvsu-blue/30
        hover:shadow-md
        focus:outline-none
        focus:ring-2
        focus:ring-cvsu-blue/30
      "
    >
      {/* Gold accent */}
      <div
        className="
          absolute left-0 top-0 h-full w-1
          bg-cvsu-blue
          transition-colors
          group-hover:bg-cvsu-gold
        "
      />

      <div className="flex items-start justify-between gap-5">
        {/* Office information */}
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="
              flex h-12 w-12 shrink-0 items-center justify-center
              rounded-xl bg-blue-50
              text-cvsu-blue
              transition-colors
              group-hover:bg-cvsu-blue
              group-hover:text-white
            "
          >
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="
                  rounded-md bg-slate-100 px-2 py-1
                  text-[10px] font-bold
                  uppercase tracking-[0.15em]
                  text-ink-muted
                "
              >
                {office.code}
              </span>
            </div>

            <h3 className="mt-2 truncate text-base font-semibold text-ink sm:text-lg">
              {office.name}
            </h3>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
              <Users className="h-3.5 w-3.5" />

              <span>
                {windowCount}{" "}
                {windowCount === 1 ? "service window" : "service windows"}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div
          className="
            mt-1 flex h-9 w-9 shrink-0 items-center justify-center
            rounded-full border border-border
            text-ink-faint
            transition-all duration-200
            group-hover:border-cvsu-blue
            group-hover:bg-cvsu-blue
            group-hover:text-white
          "
        >
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* Bottom action hint */}
      <div className="mt-5 border-t border-border pt-3">
        <span className="text-xs font-medium text-cvsu-blue">
          Get queue number
        </span>
      </div>
    </button>
  );
}
