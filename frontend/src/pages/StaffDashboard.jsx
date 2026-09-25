import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LogOut,
  Monitor,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Users,
} from "lucide-react";

import api from "../api/axios.js";
import { socket } from "../api/socket.js";
import { useAuthStore } from "../store/useAuthStore.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function StaffDashboard() {
  const { staff, logout } = useAuthStore();
  const navigate = useNavigate();

  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const res = await api.get("/queues/staff/state");
      setState(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/staff/login");
      }
    }
  }

  useEffect(() => {
    if (!staff) {
      navigate("/staff/login");
      return;
    }

    refresh();

    socket.emit("join:office", staff.officeId);
    socket.emit("join:public-display");

    const handler = () => refresh();

    socket.on("queue:update", handler);

    return () => {
      socket.off("queue:update", handler);
    };
  }, [staff?.officeId]);

  async function runAction(fn, successMsg) {
    if (busy) return;

    setBusy(true);

    try {
      await fn();

      if (successMsg) {
        toast.success(successMsg);
      }

      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const callNext = () =>
    runAction(
      () => api.post("/queues/staff/call-next"),
      "Next ticket called."
    );

  const serve = (id) =>
    runAction(
      () => api.post(`/queues/staff/${id}/serve`),
      "Now serving."
    );

  const complete = (id) =>
    runAction(
      () => api.post(`/queues/staff/${id}/complete`),
      "Ticket completed."
    );

  const skip = (id) =>
    runAction(
      () => api.post(`/queues/staff/${id}/skip`),
      "Ticket skipped."
    );

  const recall = (id) =>
    runAction(
      () => api.post(`/queues/staff/${id}/recall`),
      "Ticket recalled."
    );

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-cvsu-blue" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  const {
    office,
    windows,
    waiting,
    active,
    skipped,
    myWindowId,
  } = state;

  const myWindow = windows.find((w) => w.id === myWindowId);

  const canCallNext = myWindowId
    ? myWindow?.status === "AVAILABLE"
    : windows.some((w) => w.status === "AVAILABLE");

  const availableWindows = windows.filter(
    (w) => w.status === "AVAILABLE"
  ).length;

  const busyWindows = windows.filter(
    (w) => w.status === "BUSY"
  ).length;

  return (
    <div className="min-h-screen bg-surface">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cvsu-blue">
              <Building2 className="h-5 w-5 text-cvsu-gold" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cvsu-blue">
                  {office.code}
                </span>

                <span className="text-xs text-ink-faint">
                  Staff Portal
                </span>
              </div>

              <h1 className="mt-1 truncate text-base font-bold text-ink sm:text-lg">
                {office.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink">
                {staff.fullName}
              </p>

              <p className="text-xs text-ink-muted">
                {staff.role === "ADMIN"
                  ? "Administrator"
                  : "Authorized Staff"}
              </p>
            </div>

            {staff.role === "ADMIN" && (
              <button
                onClick={() => navigate("/admin")}
                className="
                  hidden items-center gap-2
                  rounded-lg
                  border border-border
                  bg-white
                  px-3 py-2
                  text-sm font-medium
                  text-ink-muted
                  transition
                  hover:bg-surface
                  hover:text-ink
                  md:inline-flex
                "
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </button>
            )}

            <button
              onClick={() => {
                logout();
                navigate("/staff/login");
              }}
              className="
                inline-flex items-center gap-2
                rounded-lg
                border border-border
                bg-white
                px-3 py-2
                text-sm font-medium
                text-ink-muted
                transition
                hover:border-red-200
                hover:bg-red-50
                hover:text-red-600
              "
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">

        {/* Heading */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cvsu-blue">
            Queue Management
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Queue Dashboard
              </h2>

              <p className="mt-1 text-sm text-ink-muted">
                Manage your assigned service window and office queue.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-status-serving" />
              Live queue updates
            </div>
          </div>
        </div>

        {/* =====================================================
            MY WINDOW
        ====================================================== */}
        <section className="mb-8">

          {myWindow ? (
            <div className="overflow-hidden rounded-2xl bg-cvsu-blue shadow-sm">
              <div className="relative p-6 sm:p-7">

                <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[40px] border-white/5" />

                <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full border-[30px] border-cvsu-gold/10" />

                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-cvsu-gold" />

                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                        Your Service Window
                      </span>
                    </div>

                    <h3 className="mt-2 text-2xl font-bold text-white">
                      {myWindow.label}
                    </h3>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`
                          h-2 w-2 rounded-full
                          ${
                            myWindow.status === "AVAILABLE"
                              ? "bg-status-serving"
                              : myWindow.status === "BUSY"
                              ? "bg-status-called"
                              : "bg-white/40"
                          }
                        `}
                      />

                      <span className="text-sm text-blue-100">
                        {myWindow.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
                      Current Ticket
                    </p>

                    <p className="mt-1 text-4xl font-black tracking-tight text-cvsu-gold">
                      {myWindow.queue_code || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
              <div className="flex items-start gap-3">
                <Monitor className="mt-0.5 h-5 w-5 text-status-called" />

                <div>
                  <p className="text-sm font-semibold text-ink">
                    No service window assigned
                  </p>

                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    Your account is not currently assigned to a
                    physical service window.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =====================================================
            SUMMARY
        ====================================================== */}
        <section className="mb-8 grid gap-4 sm:grid-cols-3">

          <SummaryCard
            icon={Users}
            label="Waiting"
            value={waiting.length}
            description="Clients in queue"
            iconClass="bg-blue-50 text-cvsu-blue"
          />

          <SummaryCard
            icon={Monitor}
            label="Busy Windows"
            value={`${busyWindows}/${windows.length}`}
            description="Currently occupied"
            iconClass="bg-yellow-50 text-status-called"
          />

          <SummaryCard
            icon={Clock3}
            label="Available"
            value={availableWindows}
            description="Ready for service"
            iconClass="bg-green-50 text-status-serving"
          />

        </section>

        {/* =====================================================
            WINDOWS OVERVIEW
        ====================================================== */}
        <section className="mb-8">

          <SectionHeader
            title="Service Windows"
            description="Current status of all office windows"
            count={windows.length}
          />

          <div
            className={`
              grid gap-4
              ${
                windows.length === 1
                  ? "grid-cols-1"
                  : windows.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-3"
              }
            `}
          >
            {windows.map((window) => (
              <WindowCard
                key={window.id}
                window={window}
                isMine={window.id === myWindowId}
              />
            ))}
          </div>
        </section>

        {/* =====================================================
            CALL NEXT
        ====================================================== */}
        <section className="mb-8">

          <div className="overflow-hidden rounded-2xl bg-cvsu-blue shadow-sm">
            <div className="relative p-6 sm:p-7">

              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[40px] border-white/5" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5 text-cvsu-gold" />

                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                      Next Client
                    </span>
                  </div>

                  <h3 className="mt-2 text-3xl font-black tracking-tight text-white">
                    {waiting.length > 0
                      ? waiting[0].queue_code
                      : "No clients waiting"}
                  </h3>

                  <p className="mt-1 text-sm text-blue-100">
                    {waiting.length > 0
                      ? `${waiting.length} client${
                          waiting.length === 1 ? "" : "s"
                        } currently waiting`
                      : "The queue is currently empty."}
                  </p>
                </div>

                <button
                  onClick={callNext}
                  disabled={
                    busy ||
                    !canCallNext ||
                    waiting.length === 0
                  }
                  className="
                    group
                    inline-flex min-h-14
                    items-center justify-center gap-3
                    rounded-xl
                    bg-cvsu-gold
                    px-7
                    text-sm font-bold
                    text-cvsu-blue-dark
                    shadow-sm
                    transition
                    hover:bg-yellow-300
                    hover:shadow-md
                    focus:outline-none
                    focus:ring-2
                    focus:ring-white/50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {busy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-cvsu-blue-dark/30 border-t-cvsu-blue-dark" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Call Next
                      <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>

              {!canCallNext && waiting.length > 0 && (
                <div className="relative mt-5 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-xs text-blue-100">
                  {myWindow
                    ? `${myWindow.label} is currently ${myWindow.status.toLowerCase()}. Complete the current transaction before calling another client.`
                    : "No available service window is assigned to your account."}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            ACTIVE TICKETS
        ====================================================== */}
        <section className="mb-8">

          <SectionHeader
            title="At the Windows"
            description="Tickets currently called or being served"
            count={active.length}
          />

          <div className="overflow-hidden rounded-xl border border-border bg-white">

            {active.length === 0 ? (
              <EmptyState
                icon={Monitor}
                title="No active tickets"
                description="Tickets called by your office will appear here."
              />
            ) : (
              <div className="divide-y divide-border">

                {active.map((q) => (
                  <ActiveTicket
                    key={q.id}
                    queue={q}
                    busy={busy}
                    onServe={serve}
                    onSkip={skip}
                    onComplete={complete}
                  />
                ))}

              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            SKIPPED
        ====================================================== */}
        {skipped?.length > 0 && (
          <section className="mb-8">

            <SectionHeader
              title="Awaiting Recall"
              description="Skipped tickets that can be recalled"
              count={skipped.length}
            />

            <div className="overflow-hidden rounded-xl border border-border bg-white">

              <div className="divide-y divide-border">

                {skipped.map((q) => (
                  <div
                    key={q.id}
                    className="
                      flex flex-col gap-4
                      px-5 py-4
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >
                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <SkipForward className="h-5 w-5 text-status-skipped" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-ink">
                            {q.queue_code}
                          </span>

                          <StatusBadge status="SKIPPED" />
                        </div>

                        {q.recall_count > 0 && (
                          <p className="mt-1 text-xs text-ink-muted">
                            Recalled {q.recall_count}x
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => recall(q.id)}
                      disabled={busy || !canCallNext}
                      className="
                        inline-flex items-center justify-center gap-2
                        rounded-lg
                        bg-cvsu-blue
                        px-4 py-2.5
                        text-sm font-semibold
                        text-white
                        transition
                        hover:bg-cvsu-blue-dark
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      <RotateCcw className="h-4 w-4" />
                      Recall
                    </button>
                  </div>
                ))}

              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            WAITING QUEUE
        ====================================================== */}
        <section>

          <SectionHeader
            title="Waiting Queue"
            description="Clients waiting to be served"
            count={waiting.length}
          />

          <div className="overflow-hidden rounded-xl border border-border bg-white">

            {waiting.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No one is waiting"
                description="The queue is currently clear."
              />
            ) : (
              <div className="p-5">

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {waiting.map((q, index) => (
                    <div
                      key={q.id}
                      className={`
                        flex items-center justify-between
                        rounded-lg
                        border
                        px-4 py-3
                        ${
                          index === 0
                            ? "border-cvsu-blue/20 bg-blue-50"
                            : "border-border bg-surface"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">

                        <span
                          className={`
                            flex h-7 w-7 items-center justify-center
                            rounded-full
                            text-xs font-bold
                            ${
                              index === 0
                                ? "bg-cvsu-blue text-white"
                                : "bg-white text-ink-muted"
                            }
                          `}
                        >
                          {index + 1}
                        </span>

                        <span
                          className={`
                            text-sm font-semibold
                            ${
                              index === 0
                                ? "text-cvsu-blue"
                                : "text-ink"
                            }
                          `}
                        >
                          {q.queue_code}
                        </span>
                      </div>

                      {index === 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cvsu-blue">
                          Next
                        </span>
                      )}
                    </div>
                  ))}

                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="mt-10 border-t border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>
            CvSU Bacoor City Campus · Queueing Management System
          </span>

          <span>
            Staff Portal
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ===============================================================
   SUMMARY CARD
================================================================ */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
            {value}
          </p>

          <p className="mt-1 text-xs text-ink-faint">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   WINDOW CARD
================================================================ */

function WindowCard({ window, isMine }) {
  const isAvailable = window.status === "AVAILABLE";
  const isBusy = window.status === "BUSY";

  return (
    <div
      className={`
        rounded-xl border bg-white p-5 transition
        ${
          isMine
            ? "border-cvsu-blue/40 ring-2 ring-cvsu-blue/10"
            : isBusy
            ? "border-status-called/30"
            : isAvailable
            ? "border-status-serving/30"
            : "border-border"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {window.label}
            </p>

            {isMine && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-cvsu-blue">
                YOU
              </span>
            )}
          </div>

          <p className="mt-3 text-2xl font-bold tracking-tight text-ink">
            {window.queue_code || "—"}
          </p>
        </div>

        <div
          className={`
            flex h-9 w-9 items-center justify-center rounded-lg
            ${
              isAvailable
                ? "bg-green-50 text-status-serving"
                : isBusy
                ? "bg-yellow-50 text-status-called"
                : "bg-surface text-ink-faint"
            }
          `}
        >
          <Monitor className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">

        <span
          className={`
            h-2 w-2 rounded-full
            ${
              isAvailable
                ? "bg-status-serving"
                : isBusy
                ? "bg-status-called"
                : "bg-ink-faint"
            }
          `}
        />

        <span
          className={`
            text-xs font-semibold
            ${
              isAvailable
                ? "text-status-serving"
                : isBusy
                ? "text-status-called"
                : "text-ink-muted"
            }
          `}
        >
          {window.status}
        </span>
      </div>
    </div>
  );
}

/* ===============================================================
   SECTION HEADER
================================================================ */

function SectionHeader({
  title,
  description,
  count,
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">

      <div>
        <h3 className="text-sm font-bold text-ink">
          {title}
        </h3>

        <p className="mt-0.5 text-xs text-ink-muted">
          {description}
        </p>
      </div>

      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink-muted ring-1 ring-border">
        {count}
      </span>
    </div>
  );
}

/* ===============================================================
   ACTIVE TICKET
================================================================ */

function ActiveTicket({
  queue,
  busy,
  onServe,
  onSkip,
  onComplete,
}) {
  return (
    <div className="px-5 py-5">

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <span className="text-sm font-black text-cvsu-blue">
              {queue.queue_code?.split("-")[0] || "Q"}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">

              <span className="text-xl font-bold tracking-tight text-ink">
                {queue.queue_code}
              </span>

              <StatusBadge status={queue.status} />

            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
              <Monitor className="h-3.5 w-3.5" />
              {queue.window_label}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">

          {queue.status === "CALLED" && (
            <>
              <button
                onClick={() => onServe(queue.id)}
                disabled={busy}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-lg
                  bg-status-serving
                  px-4 py-2.5
                  text-sm font-semibold
                  text-white
                  transition
                  hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <PhoneCall className="h-4 w-4" />
                Serve
              </button>

              <button
                onClick={() => onSkip(queue.id)}
                disabled={busy}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-lg
                  border border-border
                  bg-white
                  px-4 py-2.5
                  text-sm font-semibold
                  text-status-skipped
                  transition
                  hover:bg-orange-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </button>
            </>
          )}

          {queue.status === "SERVING" && (
            <button
              onClick={() => onComplete(queue.id)}
              disabled={busy}
              className="
                inline-flex items-center justify-center gap-2
                rounded-lg
                bg-cvsu-blue
                px-4 py-2.5
                text-sm font-semibold
                text-white
                transition
                hover:bg-cvsu-blue-dark
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   EMPTY STATE
================================================================ */

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink-faint">
        <Icon className="h-5 w-5" />
      </div>

      <h4 className="mt-4 text-sm font-semibold text-ink">
        {title}
      </h4>

      <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">
        {description}
      </p>
    </div>
  );
}