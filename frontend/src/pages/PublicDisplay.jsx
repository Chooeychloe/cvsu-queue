import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Clock3,
  Monitor,
  Users,
  Volume2,
} from "lucide-react";

import api from "../api/axios.js";
import { socket } from "../api/socket.js";

function playChime() {
  try {
    const ctx = new (
      window.AudioContext || window.webkitAudioContext
    )();

    [880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.001, ctx.currentTime);

      gain.gain.exponentialRampToValueAtTime(
        0.2,
        ctx.currentTime + i * 0.25 + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.25 + 0.4
      );

      osc.connect(gain).connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.4);
    });
  } catch {
    /* Audio is not available in this browser context */
  }
}

export default function PublicDisplay() {
  const [offices, setOffices] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [now, setNow] = useState(new Date());

  const announceTimeout = useRef(null);

  async function refresh() {
    try {
      const res = await api.get("/queues/display");
      setOffices(res.data.offices);
    } catch {
      // Keep the existing display if refresh fails.
    }
  }

  useEffect(() => {
    refresh();

    socket.emit("join:public-display");

    socket.on("queue:update", refresh);

    socket.on("queue:called", (payload) => {
      setAnnouncement(payload);

      playChime();

      clearTimeout(announceTimeout.current);

      announceTimeout.current = setTimeout(() => {
        setAnnouncement(null);
      }, 8000);
    });

    const clock = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      socket.off("queue:update", refresh);
      socket.off("queue:called");

      clearInterval(clock);
      clearTimeout(announceTimeout.current);
    };
  }, []);

  const totalWaiting = offices.reduce(
    (total, item) => total + item.waiting.length,
    0
  );

  return (
    <main className="min-h-screen bg-ink text-white">
      {/* =========================================================
          HEADER
      ========================================================== */}
      <header className="border-b border-white/10 bg-cvsu-blue-dark">
        <div className="flex items-center justify-between px-6 py-5 lg:px-10">
          {/* Branding */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
              <span className="text-sm font-black text-cvsu-blue">
                CvSU
              </span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cvsu-gold">
                Cavite State University
              </p>

              <h1 className="mt-0.5 text-lg font-semibold text-white">
                Bacoor City Campus
              </h1>
            </div>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                Campus Queueing System
              </p>

              <p className="mt-1 text-sm text-white/70">
                Public Information Display
              </p>
            </div>

            <div className="hidden h-10 w-px bg-white/10 sm:block" />

            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Clock3 className="h-4 w-4 text-cvsu-gold" />

                <p className="text-2xl font-bold tabular-nums tracking-tight lg:text-3xl">
                  {now.toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>

              <p className="mt-0.5 text-xs text-white/50">
                {now.toLocaleDateString("en-PH", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          ANNOUNCEMENT
      ========================================================== */}
      {announcement && (
        <section className="relative overflow-hidden bg-cvsu-gold text-ink">
          {/* Decorative circle */}
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/20" />

          <div className="relative flex items-center justify-center gap-4 px-6 py-5 text-center lg:py-6">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/10 sm:flex">
              <Volume2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/60">
                Now Calling
              </p>

              <p className="mt-1 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">
                {announcement.queueCode}
              </p>

              <p className="mt-1 text-sm font-medium text-ink/70 sm:text-base">
                Please proceed to{" "}
                <span className="font-bold text-ink">
                  {announcement.windowLabel}
                </span>{" "}
                — {announcement.officeName}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          SUMMARY BAR
      ========================================================== */}
      <section className="border-b border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cvsu-blue">
              <Monitor className="h-4 w-4 text-white" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Now Serving
              </p>

              <p className="text-xs text-white/40">
                Please monitor the display for your queue number.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-cvsu-gold" />
              <span className="text-white/60">
                {offices.length} offices
              </span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-cvsu-gold" />
              <span className="text-white/60">
                {totalWaiting} waiting
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          OFFICE DISPLAY
      ========================================================== */}
      <section className="p-4 sm:p-6 lg:p-8">
        {offices.length === 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <Building2 className="mx-auto h-10 w-10 text-white/20" />

              <h2 className="mt-4 text-lg font-semibold text-white/70">
                No office information available
              </h2>

              <p className="mt-1 text-sm text-white/30">
                Please wait while the queue display is updated.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="
              grid gap-5
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            {offices.map(({ office, windows, waiting }) => (
              <OfficeDisplayCard
                key={office.id}
                office={office}
                windows={windows}
                waiting={waiting}
              />
            ))}
          </div>
        )}
      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="border-t border-white/10 px-6 py-4 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-white/30">
            Cavite State University – Bacoor City Campus
          </p>

          <p className="text-xs text-white/20">
            Please wait for your queue number to be called.
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ===============================================================
   OFFICE DISPLAY CARD
================================================================ */

function OfficeDisplayCard({ office, windows, waiting }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-lg">
      {/* Office Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cvsu-blue/20">
            <Building2 className="h-4 w-4 text-cvsu-gold" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {office.name}
            </p>

            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
              {office.code}
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-white/5 px-2.5 py-1">
          <span className="text-[11px] font-medium text-white/40">
            {waiting.length} waiting
          </span>
        </div>
      </div>

      {/* Windows */}
      <div className="divide-y divide-white/10">
        {windows.map((window) => (
          <div
            key={window.id}
            className="flex items-center justify-between px-5 py-5"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                Window
              </p>

              <p className="mt-1 text-sm font-semibold text-white/70">
                {window.label}
              </p>
            </div>

            <div className="text-right">
              <p
                className={`
                  text-3xl font-black
                  tracking-tight
                  tabular-nums
                  sm:text-4xl
                  ${
                    window.queue_code
                      ? "text-cvsu-gold"
                      : "text-white/10"
                  }
                `}
              >
                {window.queue_code || "—"}
              </p>

              {window.queue_code && (
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  Serving
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Waiting Queue */}
      {waiting.length > 0 && (
        <div className="border-t border-white/10 bg-black/10 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
              Waiting Queue
            </p>

            {waiting.length > 6 && (
              <span className="text-[10px] text-white/25">
                +{waiting.length - 6} more
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {waiting.slice(0, 6).map((queue) => (
              <span
                key={queue.id}
                className="
                  rounded-md
                  border border-white/10
                  bg-white/5
                  px-2.5 py-1.5
                  text-xs
                  font-semibold
                  tabular-nums
                  text-white/50
                "
              >
                {queue.queue_code}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No waiting */}
      {waiting.length === 0 && (
        <div className="border-t border-white/10 bg-black/10 px-5 py-3">
          <p className="text-center text-xs text-white/20">
            No customers currently waiting
          </p>
        </div>
      )}
    </section>
  );
}
