import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getVideoGateById, recordVideoClick, recordVideoAttempt } from '../services/videoService';
import type { VideoGateEntry } from '../types/video';
import FacebookSimulation from '../components/templates/FacebookSimulation';
import TikTokSimulation from '../components/templates/TikTokSimulation';
import SnapchatSimulation from '../components/templates/SnapchatSimulation';

// ── Post-attempt awareness screen ───────────────────────────────
function AwarenessScreen({ video, platform }: { video: VideoGateEntry; platform: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f2f5] p-6">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8 text-center space-y-6">
        {/* Warning icon */}
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">This was a Phishing Simulation</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            You entered your <strong>{platform}</strong> credentials on a simulated page in order
            to watch <em>"{video.title}"</em>. If this were a real attack, your account could have
            been compromised.
          </p>
        </div>

        {/* Tips */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-600 space-y-3">
          <p className="font-bold text-slate-700 text-sm">How to Spot This Attack:</p>
          <ul className="space-y-2 list-disc pl-4 leading-normal">
            <li>
              <strong className="text-slate-700">Suspicious share links:</strong> Real platforms
              don't ask you to log in via a link someone sent you on WhatsApp or SMS.
            </li>
            <li>
              <strong className="text-slate-700">Check the URL:</strong> This page wasn't on{' '}
              <em>{platform.toLowerCase()}.com</em> — phishing pages mimic the look but use
              different domains.
            </li>
            <li>
              <strong className="text-slate-700">Login-gated content:</strong> Be very suspicious of
              any shared link that requires a social media login before you can view it.
            </li>
          </ul>
        </div>

        {/* Safety notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
          <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-left font-medium">
            <strong>Your password was NOT stored.</strong> This was a safe awareness exercise.
            Your input was discarded immediately.
          </p>
        </div>

        <p className="text-xs text-slate-400">
          Security awareness drill powered by CyberMonitor GH. You may close this tab.
        </p>
      </div>
    </div>
  );
}

// ── 404 state ───────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f2f5] p-6">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-700 mb-2">Video Not Found</h2>
        <p className="text-sm text-slate-500">
          This video link has expired or is no longer available.
        </p>
      </div>
    </div>
  );
}

// ── Main VideoGate page ──────────────────────────────────────────
export default function VideoGate() {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<VideoGateEntry | null | undefined>(undefined);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!videoId) { setVideo(null); return; }
    
    let isMounted = true;
    getVideoGateById(videoId).then((entry) => {
      if (!isMounted) return;
      if (!entry) {
        setVideo(null);
      } else {
        setVideo(entry);
        recordVideoClick(videoId);
      }
    }).catch((err) => {
      console.error('Error fetching video gate:', err);
      if (isMounted) setVideo(null);
    });

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const handleLoginAttempt = (_username: string) => {
    if (videoId) {
      recordVideoAttempt(videoId);
    }
    // TikTok manages its own post-submit UI (infinite spinner).
    // Do NOT transition to AwarenessScreen for TikTok.
    if (video?.platform !== 'TikTok') {
      setAttempted(true);
    }
  };

  // Loading
  if (video === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not found
  if (video === null) return <NotFound />;

  // After login attempt — show awareness screen
  if (attempted) return <AwarenessScreen video={video} platform={video.platform} />;

  // Show the gate (platform login page)
  // videoId is used as campaignId so keystrokes are tagged to this video campaign.
  // platform name is used as templateId for display in the admin dashboard.
  const gateProps = {
    onSubmitAttempt: handleLoginAttempt,
    campaignId: videoId ?? 'video-gate',
    templateId: video.platform.toLowerCase(),
  };

  switch (video.platform) {
    case 'Facebook':
      return <FacebookSimulation {...gateProps} />;
    case 'TikTok':
      return <TikTokSimulation {...gateProps} />;
    case 'Snapchat':
      return <SnapchatSimulation {...gateProps} />;
    default:
      return <FacebookSimulation {...gateProps} />;
  }
}
