import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios.js';
import { useAuthStore } from '../store/useAuthStore.js';

export default function StaffLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.token, res.data.staff);
      toast.success(`Welcome, ${res.data.staff.fullName}`);
      navigate('/staff');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-8 flex h-9 w-9 items-center justify-center rounded-md bg-cvsu-blue text-xs font-bold text-cvsu-gold">
          CvSU
        </div>
        <h1 className="text-xl font-semibold text-ink">Staff Login</h1>
        <p className="mt-1 text-sm text-ink-muted">Sign in to manage your office&rsquo;s queue.</p>

        <label className="mt-8 block text-sm font-medium text-ink">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-2 w-full border-b border-border py-2 text-sm text-ink outline-none focus:border-cvsu-blue"
          placeholder="registrar1"
        />

        <label className="mt-6 block text-sm font-medium text-ink">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-2 w-full border-b border-border py-2 text-sm text-ink outline-none focus:border-cvsu-blue"
          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-10 w-full rounded-md bg-cvsu-blue py-3 text-sm font-medium text-white transition hover:bg-cvsu-blue-dark disabled:opacity-60"
        >
          {submitting ? 'Signing in\u2026' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
