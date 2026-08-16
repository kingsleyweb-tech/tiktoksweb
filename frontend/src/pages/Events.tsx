import { useEffect, useState, useMemo } from 'react';
import { getAllEvents, deleteEvents } from '../services/eventService';
import type { SimulationEvent, SimulationEventType } from '../types/event';

const EVENT_TYPE_LABELS: Record<SimulationEventType, string> = {
  link_opened: 'Link Opened',
  simulation_viewed: 'Simulation Viewed',
  simulation_attempt: 'Credentials Submitted',
  simulation_completed: 'Simulation Completed',
  training_link_opened: 'Training Link Opened',
  training_viewed: 'Training Viewed',
  video_started: 'Video Started',
  video_completed: 'Video Completed',
};

const EVENT_TYPE_COLORS: Record<SimulationEventType, string> = {
  link_opened: 'text-violet-700 bg-violet-50 border-violet-200',
  simulation_viewed: 'text-amber-700 bg-amber-50 border-amber-200',
  simulation_attempt: 'text-rose-700 bg-rose-50 border-rose-200',
  simulation_completed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  training_link_opened: 'text-sky-700 bg-sky-50 border-sky-200',
  training_viewed: 'text-teal-700 bg-teal-50 border-teal-200',
  video_started: 'text-orange-700 bg-orange-50 border-orange-200',
  video_completed: 'text-green-700 bg-green-50 border-green-200',
};

const EVENT_TYPE_ICONS: Record<SimulationEventType, React.ReactNode> = {
  link_opened: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  simulation_viewed: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  simulation_attempt: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  simulation_completed: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  training_link_opened: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  training_viewed: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  video_started: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  video_completed: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
};

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  count,
  onConfirm,
  onCancel,
  busy,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-800">
            Delete {count} event{count !== 1 ? 's' : ''}?
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            This action cannot be undone. Selected events will be permanently removed from the audit log.
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Events() {
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SimulationEventType>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    getAllEvents().then((evts) => {
      setEvents(evts);
      setLoading(false);
    });
  };

  useEffect(() => { fetchEvents(); }, []);

  const filtered = useMemo(() => {
    return events.filter((evt) => {
      const matchesType = typeFilter === 'all' || evt.type === typeFilter;
      const q = search.toLowerCase();
      const matchesSearch = !q || evt.campaignId.includes(q) || evt.templateId.includes(q) || evt.anonymousSessionId.includes(q) || evt.type.includes(q);
      return matchesType && matchesSearch;
    });
  }, [events, search, typeFilter]);

  // Summary counts
  const counts = useMemo(() => ({
    total: events.length,
    link_opened: events.filter((e) => e.type === 'link_opened').length,
    simulation_attempt: events.filter((e) => e.type === 'simulation_attempt').length,
    simulation_completed: events.filter((e) => e.type === 'simulation_completed').length,
  }), [events]);

  // ── Selection helpers ─────────────────────────────────────────────
  const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  const someSelected = selected.size > 0;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((e) => next.delete(e.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((e) => next.add(e.id));
        return next;
      });
    }
  };

  // ── Delete flow ───────────────────────────────────────────────────
  const requestDelete = (ids: string[]) => setConfirmIds(ids);

  const confirmDelete = async () => {
    if (!confirmIds) return;
    setDeleting(true);
    try {
      await deleteEvents(confirmIds);
      setSelected((prev) => {
        const next = new Set(prev);
        confirmIds.forEach((id) => next.delete(id));
        return next;
      });
      fetchEvents();
    } finally {
      setDeleting(false);
      setConfirmIds(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Simulation Events</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Audit log of all safe telemetry events — no credentials are ever recorded here.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: counts.total, color: 'text-slate-700' },
          { label: 'Links Opened', value: counts.link_opened, color: 'text-violet-600' },
          { label: 'Attempts', value: counts.simulation_attempt, color: 'text-rose-600' },
          { label: 'Completed', value: counts.simulation_completed, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="events-search"
            type="text"
            placeholder="Search by campaign, template or session…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1 flex-wrap">
          {(['all', 'link_opened', 'simulation_viewed', 'simulation_attempt', 'simulation_completed'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                typeFilter === t ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t === 'all' ? 'All Types' : EVENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-rose-800">
            <span className="font-bold">{selected.size}</span> event{selected.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              onClick={() => requestDelete([...selected])}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-400 text-sm">No events match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Select all visible"
                    />
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Event Type</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Campaign</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Template</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Session</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((evt) => {
                  const isChecked = selected.has(evt.id);
                  return (
                    <tr key={evt.id} className={`hover:bg-slate-50 transition-colors ${isChecked ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(evt.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${EVENT_TYPE_COLORS[evt.type] ?? 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                          {EVENT_TYPE_ICONS[evt.type]}
                          {EVENT_TYPE_LABELS[evt.type] ?? evt.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-600">{evt.campaignId}</td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-600">{evt.templateId}</td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-400">{evt.anonymousSessionId}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 text-right whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleString()}
                      </td>
                      {/* Row delete */}
                      <td className="px-3 py-3.5">
                        <button
                          onClick={() => requestDelete([evt.id])}
                          title="Delete event"
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Showing {filtered.length} of {events.length} events — no passwords or credentials are ever logged.
            </span>
            {selected.size > 0 && (
              <span className="text-rose-600 font-medium">{selected.size} selected</span>
            )}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmIds && (
        <ConfirmModal
          count={confirmIds.length}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmIds(null)}
          busy={deleting}
        />
      )}
    </div>
  );
}
