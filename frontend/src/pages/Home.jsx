import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios.js';
import OfficeCard from '../components/OfficeCard.jsx';

export default function Home() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/offices')
      .then((res) => setOffices(res.data.offices))
      .catch(() => toast.error('Could not load offices. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(office) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post('/queues', { officeId: office.id });
      navigate(`/ticket/${res.data.queue.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not get a queue number.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-20">
      <div className="mb-14">
        <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-md bg-cvsu-blue text-xs font-bold text-cvsu-gold">
          CvSU
        </div>
        <p className="text-sm font-medium text-ink-muted">Bacoor City Campus</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Queueing System</h1>
        <p className="mt-3 text-ink-muted">Select the office you need to visit.</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading offices&hellip;</p>
      ) : (
        <div className="flex flex-col">
          {offices.map((office) => (
            <OfficeCard key={office.id} office={office} onSelect={handleSelect} />
          ))}
        </div>
      )}

      {submitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <p className="text-sm font-medium text-ink">Generating your queue number&hellip;</p>
        </div>
      )}
    </div>
  );
}
