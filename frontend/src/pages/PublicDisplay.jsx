import { useEffect, useRef, useState } from 'react';
import api from '../api/axios.js';
import { socket } from '../api/socket.js';

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.25 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.4);
    });
  } catch {
    /* audio not available in this browser context */
  }
}

export default function PublicDisplay() {
  const [offices, setOffices] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [now, setNow] = useState(new Date());
  const announceTimeout = useRef(null);

  async function refresh() {
    const res = await api.get('/queues/display');
    setOffices(res.data.offices);
  }

  useEffect(() => {
    refresh();
    socket.emit('join:public-display');

    socket.on('queue:update', refresh);
    socket.on('queue:called', (payload) => {
      setAnnouncement(payload);
      playChime();
      clearTimeout(announceTimeout.current);
      announceTimeout.current = setTimeout(() => setAnnouncement(null), 8000);
    });

    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => {
      socket.off('queue:update', refresh);
      socket.off('queue:called');
      clearInterval(clock);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="flex items-center justify-between px-12 py-8">
        <div>
          <p className="text-xs font-medium tracking-widest text-cvsu-gold">CVSU &middot; BACOOR CITY CAMPUS</p>
          <h1 className="mt-1 text-2xl font-semibold">Now Serving</h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold tabular-nums">
            {now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-sm text-white/50">
            {now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {announcement && (
        <div className="border-y border-white/10 bg-cvsu-gold px-12 py-4 text-center">
          <p className="text-xl font-semibold text-ink">
            {announcement.queueCode} &mdash; please proceed to {announcement.windowLabel} ({announcement.officeName})
          </p>
        </div>
      )}

      <main className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-2 xl:grid-cols-3">
        {offices.map(({ office, windows, waiting }) => (
          <div key={office.id} className="bg-ink p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{office.name}</h2>
              <span className="text-sm text-white/50">{waiting.length} waiting</span>
            </div>

            <div className="space-y-4">
              {windows.map((w) => (
                <div key={w.id} className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-sm text-white/50">{w.label}</span>
                  <span className={`text-3xl font-semibold ${w.queue_code ? 'text-cvsu-gold' : 'text-white/20'}`}>
                    {w.queue_code || '\u2014'}
                  </span>
                </div>
              ))}
            </div>

            {waiting.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
                {waiting.slice(0, 6).map((q) => (
                  <span key={q.id} className="text-sm text-white/40">
                    {q.queue_code}
                  </span>
                ))}
                {waiting.length > 6 && (
                  <span className="text-sm text-white/30">+{waiting.length - 6} more</span>
                )}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
