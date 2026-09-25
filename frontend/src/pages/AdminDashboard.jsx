import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Monitor,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  XCircle,
} from "lucide-react";

import api from "../api/axios.js";
import { useAuthStore } from "../store/useAuthStore.js";

const TABS = ["Offices", "Windows", "Staff"];

export default function AdminDashboard() {
  const { staff, logout } = useAuthStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState("Offices");
  const [offices, setOffices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [officesRes, staffRes] = await Promise.all([
        api.get("/admin/offices"),
        api.get("/admin/staff"),
      ]);

      setOffices(officesRes.data.offices);
      setStaffList(staffRes.data.staff);
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        navigate("/staff/login");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!staff || staff.role !== "ADMIN") {
      navigate("/staff/login");
      return;
    }

    refresh();
  }, [staff?.id]);

  function handleLogout() {
    logout();
    navigate("/staff/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-cvsu-blue" />
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  const activeOffices = offices.filter((office) => office.is_active).length;
  const activeStaff = staffList.filter((member) => member.is_active).length;
  const adminCount = staffList.filter(
    (member) => member.role === "ADMIN"
  ).length;

  return (
    <div className="min-h-screen bg-surface">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cvsu-blue shadow-sm">
              <span className="text-sm font-black text-cvsu-gold">
                CvSU
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-ink">
                  Cavite State University
                </p>

                <span className="hidden rounded-full bg-cvsu-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cvsu-blue sm:inline-flex">
                  Admin
                </span>
              </div>

              <p className="text-xs text-ink-muted">
                Bacoor City Campus · Queueing Management System
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cvsu-blue/10 text-cvsu-blue">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-semibold text-ink">
                  {staff.fullName}
                </p>

                <p className="text-[10px] text-ink-muted">
                  Administrator
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2
                rounded-lg
                border border-border
                bg-white
                px-3 py-2
                text-sm font-medium
                text-ink-muted
                transition
                hover:border-red-200
                hover:bg-red-50
                hover:text-status-cancelled
              "
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>

          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">

        {/* Page heading */}
        <section className="mb-8">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cvsu-blue">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Administration
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                System Administration
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                Manage offices, service windows, and staff accounts
                for the CvSU–Bacoor queueing system.
              </p>
            </div>

            <button
              onClick={refresh}
              className="
                flex w-fit items-center gap-2
                rounded-lg
                border border-border
                bg-white
                px-4 py-2.5
                text-sm font-semibold
                text-ink-muted
                shadow-sm
                transition
                hover:border-cvsu-blue/30
                hover:text-cvsu-blue
              "
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

          </div>
        </section>

        {/* ===================================================
            SUMMARY
        ==================================================== */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            icon={Building2}
            label="Total Offices"
            value={offices.length}
            description={`${activeOffices} active`}
          />

          <SummaryCard
            icon={Monitor}
            label="Service Windows"
            value={offices.reduce(
              (total, office) =>
                total + Number(office.actual_window_count || 0),
              0
            )}
            description="Across all offices"
          />

          <SummaryCard
            icon={Users}
            label="Staff Accounts"
            value={staffList.length}
            description={`${activeStaff} active`}
          />

          <SummaryCard
            icon={ShieldCheck}
            label="Administrators"
            value={adminCount}
            description="System administrators"
          />

        </section>

        {/* ===================================================
            TABS
        ==================================================== */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">

          <div className="border-b border-border bg-white px-4 sm:px-6">

            <div className="flex gap-1 overflow-x-auto">

              {TABS.map((item) => {
                const isActive = tab === item;

                const Icon =
                  item === "Offices"
                    ? Building2
                    : item === "Windows"
                    ? Monitor
                    : Users;

                return (
                  <button
                    key={item}
                    onClick={() => setTab(item)}
                    className={`
                      relative
                      flex shrink-0 items-center gap-2
                      px-4 py-4
                      text-sm font-semibold
                      transition
                      ${
                        isActive
                          ? "text-cvsu-blue"
                          : "text-ink-muted hover:text-ink"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />

                    {item}

                    {isActive && (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-cvsu-blue" />
                    )}
                  </button>
                );
              })}

            </div>
          </div>

          <div className="p-5 sm:p-7">

            {tab === "Offices" && (
              <OfficesTab
                offices={offices}
                onChange={refresh}
              />
            )}

            {tab === "Windows" && (
              <WindowsTab
                offices={offices}
                onChange={refresh}
              />
            )}

            {tab === "Staff" && (
              <StaffTab
                offices={offices}
                staffList={staffList}
                onChange={refresh}
              />
            )}

          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 flex flex-col justify-between gap-2 text-xs text-ink-faint sm:flex-row">
          <span>
            CvSU–Bacoor City Campus
          </span>

          <span>
            Queueing Management System · Administration
          </span>
        </footer>

      </main>
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
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {value}
          </p>

          <p className="mt-1 text-xs text-ink-muted">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cvsu-blue/10 text-cvsu-blue">
          <Icon className="h-5 w-5" />
        </div>

      </div>
    </div>
  );
}

/* ===============================================================
   OFFICES TAB
================================================================ */

function OfficesTab({ offices, onChange }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    prefix: "",
    initialWindowCount: 1,
  });

  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();

    setSubmitting(true);

    try {
      await api.post("/admin/offices", form);

      toast.success("Office created.");

      setForm({
        code: "",
        name: "",
        prefix: "",
        initialWindowCount: 1,
      });

      onChange();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not create office."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(office) {
    try {
      await api.patch(`/admin/offices/${office.id}`, {
        is_active: office.is_active ? 0 : 1,
      });

      toast.success(
        office.is_active
          ? "Office deactivated."
          : "Office activated."
      );

      onChange();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not update office."
      );
    }
  }

  return (
    <div>

      <SectionHeading
        icon={Building2}
        title="Offices"
        description="Manage the offices available to clients."
      />

      {/* Office list */}
      <div className="mt-6">

        {offices.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No offices yet"
            description="Create your first office below."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">

            {offices.map((office) => (
              <div
                key={office.id}
                className="
                  rounded-xl
                  border border-border
                  bg-surface/50
                  p-5
                  transition
                  hover:border-cvsu-blue/20
                  hover:bg-white
                "
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-cvsu-blue/10 px-2 py-1 text-[10px] font-bold tracking-wider text-cvsu-blue">
                        {office.code}
                      </span>

                      <StatusPill
                        active={office.is_active}
                      />
                    </div>

                    <h3 className="mt-3 truncate font-bold text-ink">
                      {office.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">

                      <span className="flex items-center gap-1.5">
                        <TicketIcon />
                        Prefix: {office.prefix}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5" />
                        {office.actual_window_count}{" "}
                        {office.actual_window_count == 1
                          ? "window"
                          : "windows"}
                      </span>

                    </div>
                  </div>

                  <button
                    onClick={() => toggleActive(office)}
                    className={`
                      shrink-0 rounded-lg
                      px-3 py-2
                      text-xs font-semibold
                      transition
                      ${
                        office.is_active
                          ? "border border-red-200 bg-white text-status-cancelled hover:bg-red-50"
                          : "bg-cvsu-blue text-white hover:bg-cvsu-blue-dark"
                      }
                    `}
                  >
                    {office.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* Add office */}
      <div className="mt-8 border-t border-border pt-8">

        <FormSectionHeading
          icon={Plus}
          title="Add Office"
          description="Create a new office and its initial service windows."
        />

        <form
          onSubmit={handleCreate}
          className="mt-5 grid gap-5 sm:grid-cols-2"
        >

          <Field
            label="Office Code"
            placeholder="e.g. GUI"
            value={form.code}
            onChange={(v) =>
              setForm({ ...form, code: v.toUpperCase() })
            }
            required
          />

          <Field
            label="Office Name"
            placeholder="e.g. Guidance Office"
            value={form.name}
            onChange={(v) =>
              setForm({ ...form, name: v })
            }
            required
          />

          <Field
            label="Queue Prefix"
            placeholder="e.g. GUI-"
            value={form.prefix}
            onChange={(v) =>
              setForm({ ...form, prefix: v.toUpperCase() })
            }
            required
          />

          <Field
            label="Initial Windows"
            type="number"
            min={1}
            value={form.initialWindowCount}
            onChange={(v) =>
              setForm({
                ...form,
                initialWindowCount: Number(v),
              })
            }
          />

          <div className="sm:col-span-2">
            <SubmitButton
              loading={submitting}
              label="Create Office"
            />
          </div>

        </form>
      </div>
    </div>
  );
}

/* ===============================================================
   WINDOWS TAB
================================================================ */

function WindowsTab({ offices, onChange }) {
  const [officeId, setOfficeId] = useState("");
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadWindows(id) {
    if (!id) {
      setWindows([]);
      return;
    }

    setLoading(true);

    try {
      const res = await api.get(`/offices/${id}/windows`);
      setWindows(res.data.windows);
    } catch {
      toast.error("Could not load windows.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (offices.length && !officeId) {
      setOfficeId(String(offices[0].id));
    }
  }, [offices]);

  useEffect(() => {
    loadWindows(officeId);
  }, [officeId]);

  async function toggleStatus(win) {
    const nextStatus =
      win.status === "OFFLINE"
        ? "AVAILABLE"
        : "OFFLINE";

    try {
      await api.patch(
        `/admin/windows/${win.id}/status`,
        { status: nextStatus }
      );

      toast.success(
        `${win.label} set to ${nextStatus}.`
      );

      loadWindows(officeId);
      onChange();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not update window."
      );
    }
  }

  async function addWindow() {
    try {
      await api.post(
        `/admin/offices/${officeId}/windows`
      );

      toast.success("Window added.");

      loadWindows(officeId);
      onChange();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not add window."
      );
    }
  }

  const selectedOffice = offices.find(
    (office) => String(office.id) === String(officeId)
  );

  return (
    <div>

      <SectionHeading
        icon={Monitor}
        title="Service Windows"
        description="Manage physical service windows for each office."
      />

      {/* Office selector */}
      <div className="mt-6 rounded-xl border border-border bg-surface/50 p-4">

        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Manage windows for
        </label>

        <div className="relative mt-2">
          <select
            value={officeId}
            onChange={(e) =>
              setOfficeId(e.target.value)
            }
            className="
              w-full appearance-none
              rounded-lg
              border border-border
              bg-white
              px-4 py-3 pr-10
              text-sm font-medium
              text-ink
              outline-none
              transition
              focus:border-cvsu-blue
              focus:ring-2
              focus:ring-cvsu-blue/10
            "
          >
            {offices.map((office) => (
              <option
                key={office.id}
                value={office.id}
              >
                {office.name}
              </option>
            ))}
          </select>

          <ChevronRight
            className="
              pointer-events-none
              absolute right-3 top-1/2
              h-4 w-4
              -translate-y-1/2
              rotate-90
              text-ink-faint
            "
          />
        </div>

        {selectedOffice && (
          <p className="mt-2 text-xs text-ink-muted">
            {selectedOffice.code} ·{" "}
            {selectedOffice.actual_window_count}{" "}
            {selectedOffice.actual_window_count == 1
              ? "window"
              : "windows"}
          </p>
        )}

      </div>

      {/* Windows */}
      <div className="mt-6">

        {loading ? (
          <LoadingState text="Loading windows..." />
        ) : windows.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="No windows"
            description="Add a service window for this office."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {windows.map((win) => (
              <WindowCard
                key={win.id}
                window={win}
                onToggle={() => toggleStatus(win)}
              />
            ))}

          </div>
        )}

      </div>

      <button
        onClick={addWindow}
        disabled={!officeId}
        className="
          mt-6
          flex items-center gap-2
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
        <Plus className="h-4 w-4" />
        Add another window
      </button>

    </div>
  );
}

/* ===============================================================
   STAFF TAB
================================================================ */

function StaffTab({ offices, staffList, onChange }) {
  const [form, setForm] = useState({
    officeId: "",
    windowId: "",
    fullName: "",
    username: "",
    password: "",
    role: "STAFF",
  });

  const [windowOptions, setWindowOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (offices.length && !form.officeId) {
      setForm((current) => ({
        ...current,
        officeId: String(offices[0].id),
      }));
    }
  }, [offices]);

  useEffect(() => {
    if (!form.officeId) {
      setWindowOptions([]);
      return;
    }

    api
      .get(`/offices/${form.officeId}/windows`)
      .then((res) =>
        setWindowOptions(res.data.windows)
      )
      .catch(() =>
        toast.error("Could not load windows.")
      );
  }, [form.officeId]);

  async function handleCreate(e) {
    e.preventDefault();

    setSubmitting(true);

    try {
      await api.post("/admin/staff", {
        officeId: Number(form.officeId),
        windowId: form.windowId
          ? Number(form.windowId)
          : null,
        fullName: form.fullName,
        username: form.username,
        password: form.password,
        role: form.role,
      });

      toast.success("Staff account created.");

      setForm((current) => ({
        ...current,
        windowId: "",
        fullName: "",
        username: "",
        password: "",
      }));

      onChange();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not create staff account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(member) {
    try {
      await api.patch(`/admin/staff/${member.id}`, {
        is_active: member.is_active ? 0 : 1,
      });

      toast.success(
        member.is_active
          ? "Account deactivated."
          : "Account activated."
      );

      onChange();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not update account."
      );
    }
  }

  async function resetPassword(member) {
    const password = prompt(
      `New password for ${member.username} (min 8 characters):`
    );

    if (!password) return;

    try {
      await api.post(
        `/admin/staff/${member.id}/reset-password`,
        { password }
      );

      toast.success("Password reset.");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not reset password."
      );
    }
  }

  return (
    <div>

      <SectionHeading
        icon={Users}
        title="Staff Accounts"
        description="Manage staff access and physical window assignments."
      />

      {/* Staff list */}
      <div className="mt-6">

        {staffList.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff accounts"
            description="Create a staff account below."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">

            {staffList.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                onResetPassword={() =>
                  resetPassword(member)
                }
                onToggle={() =>
                  toggleActive(member)
                }
              />
            ))}

          </div>
        )}

      </div>

      {/* Add staff */}
      <div className="mt-8 border-t border-border pt-8">

        <FormSectionHeading
          icon={UserRoundCheck}
          title="Add Staff Account"
          description="Create login credentials and assign an office and service window."
        />

        <form
          onSubmit={handleCreate}
          className="mt-5 grid gap-5 sm:grid-cols-2"
        >

          {/* Office */}
          <SelectField
            label="Office"
            value={form.officeId}
            onChange={(value) =>
              setForm({
                ...form,
                officeId: value,
                windowId: "",
              })
            }
          >
            {offices.map((office) => (
              <option
                key={office.id}
                value={office.id}
              >
                {office.name}
              </option>
            ))}
          </SelectField>

          {/* Window */}
          <SelectField
            label="Window"
            value={form.windowId}
            onChange={(value) =>
              setForm({
                ...form,
                windowId: value,
              })
            }
          >
            <option value="">
              Auto-assign (not bound)
            </option>

            {windowOptions.map((window) => (
              <option
                key={window.id}
                value={window.id}
              >
                {window.label}
              </option>
            ))}
          </SelectField>

          <Field
            label="Full Name"
            placeholder="e.g. Juan Dela Cruz"
            value={form.fullName}
            onChange={(value) =>
              setForm({
                ...form,
                fullName: value,
              })
            }
            required
          />

          <Field
            label="Username"
            placeholder="e.g. juan.delacruz"
            value={form.username}
            onChange={(value) =>
              setForm({
                ...form,
                username: value,
              })
            }
            required
          />

          <Field
            label="Password"
            placeholder="Minimum 8 characters"
            type="password"
            value={form.password}
            onChange={(value) =>
              setForm({
                ...form,
                password: value,
              })
            }
            required
          />

          <SelectField
            label="Role"
            value={form.role}
            onChange={(value) =>
              setForm({
                ...form,
                role: value,
              })
            }
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </SelectField>

          <div className="sm:col-span-2">
            <SubmitButton
              loading={submitting}
              label="Create Staff Account"
            />
          </div>

        </form>
      </div>
    </div>
  );
}

/* ===============================================================
   WINDOW CARD
================================================================ */

function WindowCard({ window, onToggle }) {
  const isAvailable = window.status === "AVAILABLE";
  const isBusy = window.status === "BUSY";
  const isOffline = window.status === "OFFLINE";

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-5">

      <div className="flex items-start justify-between gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cvsu-blue/10 text-cvsu-blue">
          <Monitor className="h-5 w-5" />
        </div>

        <StatusPill
          status={window.status}
          type="window"
        />

      </div>

      <h3 className="mt-4 font-bold text-ink">
        {window.label}
      </h3>

      <p className="mt-1 text-xs text-ink-muted">
        {window.queue_code
          ? `Current queue: ${window.queue_code}`
          : window.current_queue_code
          ? `Serving ${window.current_queue_code}`
          : "No active ticket"}
      </p>

      <button
        onClick={onToggle}
        disabled={isBusy}
        className="
          mt-5
          w-full
          rounded-lg
          border border-border
          bg-white
          px-3 py-2
          text-xs font-semibold
          text-ink-muted
          transition
          hover:border-cvsu-blue/30
          hover:text-cvsu-blue
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        {isOffline
          ? "Activate Window"
          : isBusy
          ? "Window Busy"
          : isAvailable
          ? "Take Offline"
          : "Take Offline"}
      </button>

    </div>
  );
}

/* ===============================================================
   STAFF CARD
================================================================ */

function StaffCard({
  member,
  onResetPassword,
  onToggle,
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-5">

      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cvsu-blue/10 text-cvsu-blue">
            <UserRound className="h-5 w-5" />
          </div>

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="truncate font-bold text-ink">
                {member.full_name}
              </h3>

              {member.role === "ADMIN" && (
                <span className="rounded-full bg-cvsu-blue/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cvsu-blue">
                  ADMIN
                </span>
              )}

            </div>

            <p className="mt-0.5 truncate text-xs text-ink-muted">
              @{member.username}
            </p>

          </div>
        </div>

        <StatusPill
          active={member.is_active}
        />

      </div>

      <div className="mt-4 space-y-2 rounded-lg border border-border bg-white p-3">

        <InfoRow
          icon={Building2}
          label="Office"
          value={member.office_name}
        />

        <InfoRow
          icon={Monitor}
          label="Window"
          value={member.window_label || "Not assigned"}
        />

      </div>

      <div className="mt-4 flex gap-2">

        <button
          onClick={onResetPassword}
          className="
            flex flex-1 items-center
            justify-center gap-2
            rounded-lg
            border border-border
            bg-white
            px-3 py-2
            text-xs font-semibold
            text-ink-muted
            transition
            hover:border-cvsu-blue/30
            hover:text-cvsu-blue
          "
        >
          <KeyRound className="h-3.5 w-3.5" />
          Reset Password
        </button>

        <button
          onClick={onToggle}
          className={`
            rounded-lg
            px-3 py-2
            text-xs font-semibold
            transition
            ${
              member.is_active
                ? "border border-red-200 bg-white text-status-cancelled hover:bg-red-50"
                : "bg-cvsu-blue text-white hover:bg-cvsu-blue-dark"
            }
          `}
        >
          {member.is_active
            ? "Deactivate"
            : "Activate"}
        </button>

      </div>

    </div>
  );
}

/* ===============================================================
   SECTION HEADINGS
================================================================ */

function SectionHeading({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cvsu-blue/10 text-cvsu-blue">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-ink">
          {title}
        </h2>

        <p className="mt-1 text-sm text-ink-muted">
          {description}
        </p>
      </div>

    </div>
  );
}

function FormSectionHeading({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cvsu-gold/20 text-amber-700">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink">
          {title}
        </h3>

        <p className="mt-0.5 text-xs text-ink-muted">
          {description}
        </p>
      </div>

    </div>
  );
}

/* ===============================================================
   FORM COMPONENTS
================================================================ */

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  min,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </label>

      <input
        type={type}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required={required}
        className="
          mt-2
          w-full
          rounded-lg
          border border-border
          bg-white
          px-3.5 py-2.5
          text-sm
          text-ink
          outline-none
          placeholder:text-ink-faint
          transition
          focus:border-cvsu-blue
          focus:ring-2
          focus:ring-cvsu-blue/10
        "
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </label>

      <div className="relative mt-2">

        <select
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="
            w-full appearance-none
            rounded-lg
            border border-border
            bg-white
            px-3.5 py-2.5 pr-9
            text-sm
            text-ink
            outline-none
            transition
            focus:border-cvsu-blue
            focus:ring-2
            focus:ring-cvsu-blue/10
          "
        >
          {children}
        </select>

        <ChevronRight
          className="
            pointer-events-none
            absolute right-3 top-1/2
            h-4 w-4
            -translate-y-1/2
            rotate-90
            text-ink-faint
          "
        />

      </div>
    </div>
  );
}

function SubmitButton({
  loading,
  label,
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="
        flex items-center justify-center gap-2
        rounded-lg
        bg-cvsu-blue
        px-5 py-2.5
        text-sm font-semibold
        text-white
        shadow-sm
        transition
        hover:bg-cvsu-blue-dark
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}

      {!loading && <Plus className="h-4 w-4" />}

      {loading ? "Creating..." : label}
    </button>
  );
}

/* ===============================================================
   STATUS
================================================================ */

function StatusPill({
  active,
  status,
  type,
}) {
  if (status) {
    const config = {
      AVAILABLE: {
        text: "text-status-serving",
        bg: "bg-status-serving/10",
        dot: "bg-status-serving",
      },
      BUSY: {
        text: "text-status-called",
        bg: "bg-status-called/10",
        dot: "bg-status-called",
      },
      OFFLINE: {
        text: "text-ink-muted",
        bg: "bg-ink-faint/10",
        dot: "bg-ink-faint",
      },
    };

    const current = config[status] || config.OFFLINE;

    return (
      <span
        className={`
          inline-flex items-center gap-1.5
          rounded-full
          px-2.5 py-1
          text-[10px] font-bold uppercase tracking-wide
          ${current.text}
          ${current.bg}
        `}
      >
        <span
          className={`
            h-1.5 w-1.5 rounded-full
            ${current.dot}
          `}
        />

        {status}
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        px-2.5 py-1
        text-[10px] font-bold uppercase tracking-wide
        ${
          active
            ? "bg-status-serving/10 text-status-serving"
            : "bg-ink-faint/10 text-ink-muted"
        }
      `}
    >
      <span
        className={`
          h-1.5 w-1.5 rounded-full
          ${active ? "bg-status-serving" : "bg-ink-faint"}
        `}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* ===============================================================
   INFO ROW
================================================================ */

function InfoRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">

      <span className="flex items-center gap-2 text-ink-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>

      <span className="truncate font-medium text-ink">
        {value}
      </span>

    </div>
  );
}

/* ===============================================================
   EMPTY / LOADING
================================================================ */

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center">

      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink-faint/10 text-ink-muted">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-sm font-bold text-ink">
        {title}
      </h3>

      <p className="mt-1 text-xs text-ink-muted">
        {description}
      </p>

    </div>
  );
}

function LoadingState({ text }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-border bg-surface/50 py-12">

      <div className="flex items-center gap-3 text-sm text-ink-muted">

        <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-cvsu-blue" />

        {text}

      </div>

    </div>
  );
}

function TicketIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-3.5 w-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V4Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 8h6M9 16h4"
      />
    </svg>
  );
}