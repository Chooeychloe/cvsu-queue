import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios.js';
import { socket } from '../api/socket.js';
import { useAuthStore } from '../store/useAuthStore.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function StaffDashboard() {
  const { staff, logout } = useAuthStore();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const res = await api.get('/queues/staff/state');
      setState(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/staff/login');
    }
  }

  useEffect(() => {
    if (!staff) {
      navigate('/staff/login');
      return;
    }
    refresh();
    socket.emit('join:office', staff.officeId);
    socket.emit('join:public-display');
    const handler = () => refresh();
    socket.on('queue:update', handler);
    return () => socket.off('queue:update', handler);
  }, [staff?.officeId]);

  async function runAction(fn, successMsg) {
    setBusy(true);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  const callNext = () => runAction(() => api.post('/queues/staff/call-next'), 'Next ticket called.');
  const serve = (id) => runAction(() => api.post(`/queues/staff/${id}/serve`), 'Now serving.');
  const complete = (id) => runAction(() => api.post(`/queues/staff/${id}/complete`), 'Ticket completed.');
  const skip = (id) => runAction(() => api.post(`/queues/staff/${id}/skip`), 'Ticket skipped.');
  const recall = (id) => runAction(() => api.post(`/queues/staff/${id}/recall`), 'Ticket recalled.');

  if (!state) {
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading&hellip;</div>;
  }

  const { office, windows, waiting, active, skipped } = state;
  const hasAvailableWindow = windows.some((w) => w.status === 'AVAILABLE');

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-8 py-5">
        <div>
          <p className="text-xs font-medium tracking-widest text-ink-faint">{office.code}</p>
          <h1 className="text-lg font-semibold text-ink">{office.name}</h1>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-sm text-ink-muted">{staff.fullName}</span>
          <button
            onClick={() => {
              logout();
              navigate('/staff/login');
            }}
            className="text-sm font-medium text-ink-muted hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-10">
        {/* Windows overview */}
        <section className="mb-10 grid grid-cols-3 gap-8 border-b border-border pb-8">
          {windows.map((w) => (
            <div key={w.id}>
              <p className="text-xs font-medium text-ink-muted">{w.label}</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{w.queue_code || '\u2014'}</p>
              <p
                className={`mt-1 text-xs font-medium ${
                  w.status === 'AVAILABLE'
                    ? 'text-status-serving'
                    : w.status === 'BUSY'
                    ? 'text-status-called'
                    : 'text-ink-faint'
                }`}
              >
                {w.status}
              </p>
            </div>
          ))}
        </section>

        {/* Call Next button */}
        <button
          onClick={callNext}
          disabled={busy || !hasAvailableWindow || waiting.length === 0}
          className="mb-10 w-full rounded-md bg-cvsu-blue py-4 text-sm font-medium text-white transition hover:bg-cvsu-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Call Next {waiting.length > 0 ? `\u00b7 ${waiting.length} waiting` : ''}
        </button>

        {/* Active tickets */}
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-medium tracking-widest text-ink-faint">AT THE WINDOWS</h2>
          {active.length === 0 ? (
            <p className="text-sm text-ink-muted">No active tickets right now.</p>
          ) : (
            <div className="flex flex-col">
              {active.map((q) => (
                <div key={q.id} className="flex items-center justify-between border-t border-border py-4 first:border-t-0">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-ink">{q.queue_code}</span>
                    <span className="text-sm text-ink-muted">{q.window_label}</span>
                    <StatusBadge status={q.status} />
                  </div>
                  <div className="flex gap-2">
                    {q.status === 'CALLED' && (
                      <>
                        <button
                          onClick={() => serve(q.id)}
                          disabled={busy}
                          className="rounded-md bg-status-serving px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                        >
                          Serve
                        </button>
                        <button
                          onClick={() => skip(q.id)}
                          disabled={busy}
                          className="rounded-md px-3 py-1.5 text-sm font-medium text-status-skipped hover:bg-surface"
                        >
                          Skip
                        </button>
                      </>
                    )}
                    {q.status === 'SERVING' && (
                      <button
                        onClick={() => complete(q.id)}
                        disabled={busy}
                        className="rounded-md bg-cvsu-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-cvsu-blue-dark"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Skipped tickets awaiting recall */}
        {skipped?.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-medium tracking-widest text-ink-faint">SKIPPED &mdash; AWAITING RECALL</h2>
            <div className="flex flex-col">
              {skipped.map((q) => (
                <div key={q.id} className="flex items-center justify-between border-t border-border py-4 first:border-t-0">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-ink">{q.queue_code}</span>
                    <StatusBadge status="SKIPPED" />
                    {q.recall_count > 0 && (
                      <span className="text-xs text-ink-muted">recalled {q.recall_count}x</span>
                    )}
                  </div>
                  <button
                    onClick={() => recall(q.id)}
                    disabled={busy || !hasAvailableWindow}
                    className="rounded-md bg-cvsu-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-cvsu-blue-dark disabled:opacity-40"
                  >
                    Recall
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Waiting list */}
        <section>
          <h2 className="mb-4 text-xs font-medium tracking-widest text-ink-faint">
            WAITING &middot; {waiting.length}
          </h2>
          {waiting.length === 0 ? (
            <p className="text-sm text-ink-muted">No one is waiting.</p>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {waiting.map((q, i) => (
                <span key={q.id} className={`text-sm ${i === 0 ? 'font-semibold text-cvsu-blue' : 'text-ink-muted'}`}>
                  {q.queue_code}
                </span>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
