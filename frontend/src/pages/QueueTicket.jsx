import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Monitor,
  PhoneCall,
  RotateCcw,
  Ticket,
  XCircle,
} from "lucide-react";

import api from "../api/axios.js";
import { socket } from "../api/socket.js";
import StatusBadge from "../components/StatusBadge.jsx";

const STATUS_MESSAGE = {
  COMPLETED: "Your transaction is complete. Thank you.",
  CANCELLED: "This ticket has been cancelled.",
  SKIPPED: "You were called but missed. Please see staff at the office.",
};

const STATUS_CONFIG = {
  WAITING: {
    icon: Clock3,
    label: "Please wait",
    description: "You are in the queue.",
    container: "border-cvsu-blue/20 bg-blue-50",
    iconBox: "bg-white text-cvsu-blue",
  },
  CALLED: {
    icon: PhoneCall,
    label: "You are being called",
    description: "Please proceed to your assigned window.",
    container: "border-status-called/30 bg-yellow-50",
    iconBox: "bg-white text-status-called",
  },
  SERVING: {
    icon: Monitor,
    label: "Now serving",
    description: "Please proceed to your assigned window.",
    container: "border-status-serving/30 bg-green-50",
    iconBox: "bg-white text-status-serving",
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: "Transaction complete",
    description: STATUS_MESSAGE.COMPLETED,
    container: "border-status-serving/20 bg-green-50",
    iconBox: "bg-white text-status-serving",
  },
  SKIPPED: {
    icon: RotateCcw,
    label: "Ticket skipped",
    description: STATUS_MESSAGE.SKIPPED,
    container: "border-status-skipped/20 bg-orange-50",
    iconBox: "bg-white text-status-skipped",
  },
  CANCELLED: {
    icon: XCircle,
    label: "Ticket cancelled",
    description: STATUS_MESSAGE.CANCELLED,
    container: "border-status-cancelled/20 bg-red-50",
    iconBox: "bg-white text-status-cancelled",
  },
};

export default function QueueTicket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  async function refresh() {
    try {
      const res = await api.get(`/queues/${id}`);
      setData(res.data);
    } catch {
      toast.error("Could not load your ticket.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [id]);

  useEffect(() => {
    if (!data?.queue) return;

    socket.emit("join:public-display");

    const handler = () => refresh();

    socket.on("queue:update", handler);
    socket.on("queue:called", handler);

    return () => {
      socket.off("queue:update", handler);
      socket.off("queue:called", handler);
    };
  }, [data?.queue?.office_id]);

  async function handleCancel() {
    if (!confirm("Cancel this queue ticket?")) return;

    setCancelling(true);

    try {
      await api.post(`/queues/${id}/cancel`);

      toast.success("Ticket cancelled.");

      await refresh();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not cancel ticket."
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-cvsu-blue" />
          Loading your ticket...
        </div>
      </div>
    );
  }

  if (!data?.queue) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-status-cancelled">
            <Ticket className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-lg font-bold text-ink">
            Ticket not found
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            This queue ticket could not be loaded.
          </p>

          <button
            onClick={() => navigate("/")}
            className="
              mt-6 rounded-lg
              bg-cvsu-blue
              px-5 py-2.5
              text-sm font-semibold
              text-white
              transition
              hover:bg-cvsu-blue-dark
            "
          >
            Return to Queue
          </button>
        </div>
      </div>
    );
  }

  const { queue, peopleAhead } = data;

  const statusConfig =
    STATUS_CONFIG[queue.status] || STATUS_CONFIG.WAITING;

  const StatusIcon = statusConfig.icon;

  const isCalledOrServing = [
    "CALLED",
    "SERVING",
  ].includes(queue.status);

  return (
    <div className="min-h-screen bg-surface">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cvsu-blue">
              <span className="text-xs font-black text-cvsu-gold">
                CvSU
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-cvsu-blue">
                Cavite State University
              </p>

              <p className="text-[11px] text-ink-muted">
                Bacoor City Campus
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 text-xs text-ink-faint sm:flex">
            <Ticket className="h-3.5 w-3.5" />
            Queue Ticket
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <main className="mx-auto w-full max-w-xl px-5 py-8 sm:py-12">

        {/* Office */}
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-cvsu-blue">
            <Building2 className="h-5 w-5" />
          </div>

          <p className="mt-3 text-sm font-semibold text-ink">
            {queue.office_name}
          </p>

          <p className="mt-1 text-xs text-ink-muted">
            Your Queue Ticket
          </p>
        </div>

        {/* ===================================================
            TICKET CARD
        ==================================================== */}
        <section className="relative mt-7 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">

          {/* Top blue strip */}
          <div className="h-2 bg-cvsu-blue" />

          <div className="px-6 py-8 text-center sm:px-10 sm:py-10">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">
              Queue Number
            </p>

            <p className="mt-3 text-6xl font-black tracking-tight text-cvsu-blue sm:text-7xl">
              {queue.queue_code}
            </p>

            <div className="mt-5 flex justify-center">
              <StatusBadge status={queue.status} />
            </div>

            {/* Status information */}
            <div
              className={`
                mt-8 rounded-xl border p-5
                ${statusConfig.container}
              `}
            >
              <div className="flex items-start gap-4 text-left">

                <div
                  className={`
                    flex h-10 w-10 shrink-0
                    items-center justify-center
                    rounded-lg
                    ${statusConfig.iconBox}
                  `}
                >
                  <StatusIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">
                    {statusConfig.label}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    {statusConfig.description}
                  </p>
                </div>

              </div>
            </div>

            {/* Waiting information */}
            {queue.status === "WAITING" && (
              <div className="mt-8 border-t border-border pt-8">

                <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
                  <UsersIcon />
                  People ahead of you
                </div>

                <p className="mt-2 text-5xl font-black tracking-tight text-ink">
                  {peopleAhead}
                </p>

                <p className="mt-2 text-xs text-ink-faint">
                  {peopleAhead === 0
                    ? "You are next in line."
                    : "Please wait for your number to be called."}
                </p>
              </div>
            )}

            {/* Window information */}
            {isCalledOrServing && (
              <div className="mt-8 border-t border-border pt-8">

                <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
                  <MapPin className="h-4 w-4" />
                  Please proceed to
                </div>

                <p className="mt-2 text-2xl font-bold text-cvsu-blue">
                  {queue.window_label || "the assigned window"}
                </p>

                <p className="mt-2 text-xs text-ink-faint">
                  Your queue number has been called.
                </p>
              </div>
            )}

            {/* Completed / skipped / cancelled */}
            {STATUS_MESSAGE[queue.status] &&
              !isCalledOrServing &&
              queue.status !== "WAITING" && (
                <div className="mt-8 border-t border-border pt-8">
                  <p className="text-sm leading-6 text-ink">
                    {STATUS_MESSAGE[queue.status]}
                  </p>
                </div>
              )}

          </div>
        </section>

        {/* ===================================================
            ACTIONS
        ==================================================== */}
        <div className="mt-6">

          {queue.status === "WAITING" && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="
                w-full
                rounded-lg
                border border-status-cancelled/20
                bg-white
                px-4 py-3
                text-sm font-semibold
                text-status-cancelled
                transition
                hover:bg-red-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {cancelling
                ? "Cancelling..."
                : "Cancel this ticket"}
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            className="
              mt-3
              flex w-full
              items-center justify-center gap-2
              rounded-lg
              bg-cvsu-blue
              px-4 py-3
              text-sm font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-cvsu-blue-dark
              hover:shadow-md
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Get another queue number
          </button>
        </div>

        {/* ===================================================
            LIVE NOTICE
        ==================================================== */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-white p-4">

          <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-status-serving" />

          <p className="text-xs leading-5 text-ink-muted">
            This ticket updates automatically when your queue
            status changes. Keep this page open while waiting.
          </p>

        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-ink-faint">
          CvSU Bacoor City Campus · Queueing Management System
        </p>

      </main>
    </div>
  );
}

/* ===============================================================
   SMALL ICON
================================================================ */

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />

      <circle cx="9" cy="7" r="4" />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      />
    </svg>
  );
}