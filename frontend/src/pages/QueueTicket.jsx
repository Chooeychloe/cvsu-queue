import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios.js';
import { socket } from '../api/socket.js';
import StatusBadge from '../components/StatusBadge.jsx';

const STATUS_MESSAGE = {
  COMPLETED: 'Your transaction is complete. Thank you.',
  CANCELLED: 'This ticket has been cancelled.',
  SKIPPED: 'You were called but missed. Please see staff at the office.',
};

export default function QueueTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await api.get(`/queues/${id}`);
      setData(res.data);
    } catch {
      toast.error('Could not load your ticket.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [id]);

  useEffect(() => {
    if (!data?.queue) return;
    socket.emit('join:public-display');
    const handler = () => refresh();
    socket.on('queue:update', handler);
    socket.on('queue:called', handler);
    return () => {
      socket.off('queue:update', handler);
      socket.off('queue:called', handler);
    };
  }, [data?.queue?.office_id]);

  async function handleCancel() {
    if (!confirm('Cancel this queue ticket?')) return;
    try {
      await api.post(`/queues/${id}/cancel`);
      toast.success('Ticket cancelled.');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel ticket.');
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading&hellip;</div>;
  }
  if (!data?.queue) {
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">Ticket not found.</div>;
  }

  const { queue, peopleAhead } = data;
  const isCalledOrServing = ['CALLED', 'SERVING'].includes(queue.status);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink-muted">{queue.office_name}</p>
      <p className="mt-3 text-7xl font-semibold tracking-tight text-ink">{queue.queue_code}</p>
      <div className="mt-4">
        <StatusBadge status={queue.status} />
      </div>

      <div className="mt-12 w-full border-t border-border pt-8">
        {queue.status === 'WAITING' && (
          <>
            <p className="text-sm text-ink-muted">People ahead of you</p>
            <p className="mt-1 text-4xl font-semibold text-ink">{peopleAhead}</p>
          </>
        )}
        {isCalledOrServing && (
          <>
            <p className="text-sm text-ink-muted">Please proceed to</p>
            <p className="mt-1 text-2xl font-semibold text-cvsu-blue">
              {queue.window_label || 'the assigned window'}
            </p>
          </>
        )}
        {STATUS_MESSAGE[queue.status] && (
          <p className="text-ink">{STATUS_MESSAGE[queue.status]}</p>
        )}
      </div>

      {queue.status === 'WAITING' && (
        <button onClick={handleCancel} className="mt-8 text-sm text-status-cancelled hover:underline">
          Cancel this ticket
        </button>
      )}

      <button
        onClick={() => navigate('/')}
        className="mt-10 w-full rounded-md bg-cvsu-blue py-3 text-sm font-medium text-white transition hover:bg-cvsu-blue-dark"
      >
        Get another queue number
      </button>
    </div>
  );
}
