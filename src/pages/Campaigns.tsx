import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { getCampaigns, deleteCampaigns } from '../services/campaignService';
import type { Campaign, CampaignStatus } from '../types/campaign';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const statusStyles: Record<CampaignStatus, string> = {
  draft:     'bg-slate-100 text-slate-600 border border-slate-200',
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'active' ? 'bg-emerald-500' : status === 'completed' ? 'bg-blue-500' : 'bg-slate-400'
      }`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Mini stat card ───────────────────────────────────────────────────────────
function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white border rounded-xl px-4 py-3 border-slate-200 shadow-sm">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────
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
            Delete {count} campaign{count !== 1 ? 's' : ''}?
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            This action cannot be undone. All campaign data will be permanently removed.
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
export default function Campaigns() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | CampaignStatus>('All');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCampaigns = () => {
    setLoading(true);
    getCampaigns().then((data) => {
      setCampaigns(data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const filtered = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.templateId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ── Selection helpers ─────────────────────────────────────────────
  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
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
        filtered.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.add(c.id));
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
      await deleteCampaigns(confirmIds);
      setSelected((prev) => {
        const next = new Set(prev);
        confirmIds.forEach((id) => next.delete(id));
        return next;
      });
      fetchCampaigns();
    } finally {
      setDeleting(false);
      setConfirmIds(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────
  const totalCampaigns    = campaigns.length;
  const activeCampaigns   = campaigns.filter((c) => c.status === 'active').length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed').length;
  const totalParticipants = campaigns.reduce((sum, c) => sum + (c.participants ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Campaigns</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Controlled cybersecurity awareness simulations for your organisation.
          </p>
        </div>
        <Button
          id="create-campaign-btn"
          variant="primary"
          onClick={() => navigate('/campaigns/create')}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Create Campaign
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniStat label="Total Campaigns"    value={totalCampaigns}    color="text-slate-800" />
        <MiniStat label="Active Campaigns"   value={activeCampaigns}   color="text-emerald-600" />
        <MiniStat label="Completed"          value={completedCampaigns} color="text-blue-600" />
        <MiniStat label="Total Participants" value={totalParticipants.toLocaleString()} color="text-slate-800" />
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="search-campaigns"
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
          {(['All', 'draft', 'active', 'completed'] as const).map((s) => (
            <button
              key={s}
              id={`filter-${s}`}
              onClick={() => setFilterStatus(s === 'All' ? 'All' : s as CampaignStatus)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk action bar (visible when items are selected) ── */}
      {someSelected && (
        <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-rose-800">
            <span className="font-bold">{selected.size}</span> campaign{selected.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              onClick={() => requestDelete(Array.from(selected))}
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

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {/* Select-all checkbox */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select all"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Campaign</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Template</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Links Gen.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isChecked = selected.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${isChecked ? 'bg-blue-50/50' : ''}`}
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(c.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 md:hidden">{c.templateId}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-slate-600 text-xs">{c.templateId}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                        <span className="text-slate-700 font-medium">{(c.participants ?? 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="text-slate-500 text-xs">
                          {new Date(c.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`view-campaign-${c.id}`}
                            onClick={() => navigate(`/campaigns/${c.id}`)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
                          >
                            View →
                          </button>
                          <button
                            id={`delete-campaign-${c.id}`}
                            onClick={() => requestDelete([c.id])}
                            title="Delete campaign"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing {filtered.length} of {campaigns.length} campaigns
              {selected.size > 0 && ` · ${selected.size} selected`}
            </p>
          </div>
        )}
      </div>

      {/* ── Confirm modal ── */}
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
