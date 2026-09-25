import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Building2, Clock3, ShieldCheck } from "lucide-react";

import api from "../api/axios.js";
import OfficeCard from "../components/OfficeCard.jsx";

export default function Home() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/offices")
      .then((res) => setOffices(res.data.offices))
      .catch(() => {
        toast.error("Could not load offices. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function handleSelect(office) {
    if (submitting) return;

    setSubmitting(true);

    try {
      const res = await api.post("/queues", {
        officeId: office.id,
      });

      navigate(`/ticket/${res.data.queue.id}`);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not get a queue number. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      {/* Top Brand Bar */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cvsu-blue shadow-sm">
              <span className="text-sm font-bold text-cvsu-gold">CvSU</span>
            </div>

            <div className="leading-tight">
              <p className="text-sm font-semibold text-cvsu-blue">
                Cavite State University
              </p>
              <p className="text-xs text-ink-muted">
                Bacoor City Campus
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs font-medium text-ink-muted sm:flex">
            <ShieldCheck className="h-4 w-4 text-cvsu-blue" />
            Official Queueing System
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-cvsu-blue px-7 py-10 shadow-sm sm:px-10 sm:py-12">
          {/* Decorative shapes */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cvsu-blue-dark/50" />
          <div className="pointer-events-none absolute -bottom-32 right-20 h-72 w-72 rounded-full border-[40px] border-cvsu-gold/10" />

          <div className="relative max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-cvsu-gold" />
              Bacoor City Campus
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Campus Queueing
              <span className="block text-cvsu-gold">Management System</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Get your queue number before visiting the office. Select the
              service office you need and wait for your number to be called.
            </p>
          </div>
        </section>

        {/* Quick Information */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-cvsu-blue">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-ink">
                Select an Office
              </p>
              <p className="text-xs text-ink-muted">
                Choose where you need assistance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-ink">
                Get Your Number
              </p>
              <p className="text-xs text-ink-muted">
                Receive your queue ticket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-ink">
                Wait Your Turn
              </p>
              <p className="text-xs text-ink-muted">
                Monitor your queue status
              </p>
            </div>
          </div>
        </section>

        {/* Offices */}
        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cvsu-blue">
                Available Services
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                Select an Office
              </h2>

              <p className="mt-1 text-sm text-ink-muted">
                Choose the office where you need assistance.
              </p>
            </div>

            {!loading && (
              <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-cvsu-blue sm:block">
                {offices.length}{" "}
                {offices.length === 1 ? "office" : "offices"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-xl border border-border bg-white"
                />
              ))}
            </div>
          ) : offices.length === 0 ? (
            <div className="rounded-xl border border-border bg-white px-6 py-12 text-center">
              <Building2 className="mx-auto h-8 w-8 text-ink-faint" />

              <h3 className="mt-3 font-semibold text-ink">
                No offices available
              </h3>

              <p className="mt-1 text-sm text-ink-muted">
                Please try again later.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {offices.map((office) => (
                <OfficeCard
                  key={office.id}
                  office={office}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-border pt-6 text-center">
          <p className="text-xs text-ink-muted">
            Cavite State University – Bacoor City Campus
          </p>

          <p className="mt-1 text-xs text-ink-faint">
            Campus Queueing Management System
          </p>
        </footer>
      </div>

      {/* Queue Generation Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-7 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-cvsu-blue/20 border-t-cvsu-blue" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-ink">
              Generating your queue number
            </h3>

            <p className="mt-2 text-sm leading-5 text-ink-muted">
              Please wait while we create your queue ticket.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
