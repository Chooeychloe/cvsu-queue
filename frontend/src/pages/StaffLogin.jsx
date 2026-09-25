import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import api from "../api/axios.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function StaffLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      const res = await api.post("/auth/login", {
        username,
        password,
      });

      login(res.data.token, res.data.staff);

      toast.success(`Welcome, ${res.data.staff.fullName}`);

      navigate(
        res.data.staff.role === "ADMIN"
          ? "/admin"
          : "/staff"
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* =====================================================
            LEFT BRAND PANEL
        ====================================================== */}
        <section className="relative hidden overflow-hidden bg-cvsu-blue lg:flex">

          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border-[70px] border-white/5" />

          <div className="pointer-events-none absolute -bottom-40 -left-32 h-[32rem] w-[32rem] rounded-full border-[80px] border-cvsu-gold/10" />

          <div className="pointer-events-none absolute right-20 top-1/3 h-3 w-3 rounded-full bg-cvsu-gold" />

          <div className="pointer-events-none absolute bottom-28 right-32 h-2 w-2 rounded-full bg-white/20" />

          <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">

            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-lg">
                <span className="text-base font-black text-cvsu-blue">
                  CvSU
                </span>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.15em] text-cvsu-gold">
                  Cavite State University
                </p>

                <p className="mt-0.5 text-sm text-white/70">
                  Bacoor City Campus
                </p>
              </div>
            </div>

            {/* Main message */}
            <div className="max-w-lg">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-cvsu-gold" />

                <span className="text-xs font-medium text-white/80">
                  Authorized Portal
                </span>
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Manage campus
                <span className="block text-cvsu-gold">
                  queues with ease.
                </span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-6 text-blue-100">
                Access your office queue, call the next client,
                manage transactions, and keep service moving
                efficiently through the CvSU Bacoor City Campus
                Queueing Management System.
              </p>

              <div className="mt-8 flex items-center gap-3 text-sm text-white/60">
                <Building2 className="h-4 w-4 text-cvsu-gold" />

                <span>
                  Cavite State University – Bacoor City Campus
                </span>
              </div>
            </div>

            {/* Footer */}
            <p className="text-xs text-white/40">
              Authorized personnel only
            </p>
          </div>
        </section>

        {/* =====================================================
            LOGIN PANEL
        ====================================================== */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">

            {/* Mobile brand */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cvsu-blue shadow-sm">
                <span className="text-sm font-black text-cvsu-gold">
                  CvSU
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-cvsu-blue">
                  Cavite State University
                </p>

                <p className="text-xs text-ink-muted">
                  Bacoor City Campus
                </p>
              </div>
            </div>

            {/* Heading */}
            <div>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-cvsu-blue">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cvsu-blue">
                Staff & Admin Access
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Sign in to access your queue management portal.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-9 space-y-5"
            >

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  Username
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="Enter your username"
                    className="
                      w-full rounded-lg
                      border border-border
                      bg-white
                      py-3 pl-10 pr-4
                      text-sm text-ink
                      outline-none
                      transition
                      placeholder:text-ink-faint
                      focus:border-cvsu-blue
                      focus:ring-2
                      focus:ring-cvsu-blue/10
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="
                      w-full rounded-lg
                      border border-border
                      bg-white
                      py-3 pl-10 pr-4
                      text-sm text-ink
                      outline-none
                      transition
                      placeholder:text-ink-faint
                      focus:border-cvsu-blue
                      focus:ring-2
                      focus:ring-cvsu-blue/10
                    "
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="
                  group mt-3 flex w-full
                  items-center justify-center gap-2
                  rounded-lg
                  bg-cvsu-blue
                  px-4 py-3
                  text-sm font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  hover:bg-cvsu-blue-dark
                  hover:shadow-md
                  focus:outline-none
                  focus:ring-2
                  focus:ring-cvsu-blue/30
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Security notice */}
            <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-white p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cvsu-blue" />

              <p className="text-xs leading-5 text-ink-muted">
                This portal is intended for authorized CvSU
                Bacoor City Campus personnel. Your access level
                will determine which management portal you can use.
              </p>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-ink-faint">
              CvSU Bacoor City Campus &middot; Queueing Management System
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}