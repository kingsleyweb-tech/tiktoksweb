import type { SimulationTemplate } from '../types/template';
import FacebookSimulation from './templates/FacebookSimulation';
import TikTokSimulation from './templates/TikTokSimulation';
import SnapchatSimulation from './templates/SnapchatSimulation';

interface SimulationFormProps {
  template: SimulationTemplate;
  onSubmitAttempt: (username: string) => void;
  campaignId?: string;
  templateId?: string;
}

export default function SimulationForm({ template, onSubmitAttempt, campaignId, templateId }: SimulationFormProps) {
  // Dynamically render the custom simulation layout based on platform
  switch (template.platform) {
    case 'Facebook':
      return <FacebookSimulation onSubmitAttempt={onSubmitAttempt} campaignId={campaignId} templateId={templateId} />;
    case 'TikTok':
      return <TikTokSimulation onSubmitAttempt={onSubmitAttempt} campaignId={campaignId} templateId={templateId} />;
    case 'Snapchat':
      return <SnapchatSimulation onSubmitAttempt={onSubmitAttempt} campaignId={campaignId} templateId={templateId} />;
    default:
      // Safety fallback
      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 max-w-sm w-full text-center">
          <p className="text-sm font-semibold text-slate-800">Unsupported Simulation Platform</p>
        </div>
      );
  }
}
