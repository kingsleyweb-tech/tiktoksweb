import type { ReactNode } from 'react';

interface SimulationShellProps {
  children: ReactNode;
  platformName: string;
  campaignId?: string;
  templateId?: string;
}

export default function SimulationShell({ children }: SimulationShellProps) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}
