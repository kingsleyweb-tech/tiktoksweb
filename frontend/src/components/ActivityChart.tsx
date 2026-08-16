interface ActivityChartProps {
  type: 'activity' | 'events' | 'rate';
  data?: any;
}

export default function ActivityChart({ type }: ActivityChartProps) {
  if (type === 'activity') {
    // Campaign activity bar chart (Simulated Click vs Attempt counts per Campaign)
    const mockCampaignActivity = [
      { name: 'Q3 Awareness', opens: 214, attempts: 97 },
      { name: 'IT Dept Test', opens: 38, attempts: 22 },
      { name: 'Finance Drill', opens: 71, attempts: 49 },
      { name: 'HR Phish Aug', opens: 64, attempts: 31 },
    ];

    const maxVal = Math.max(...mockCampaignActivity.map((c) => Math.max(c.opens, c.attempts)), 1);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Campaign Activity Breakdown</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Opens
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Attempts
            </span>
          </div>
        </div>

        <div className="space-y-3.5 pt-2">
          {mockCampaignActivity.map((camp) => {
            const openPct = (camp.opens / maxVal) * 100;
            const attemptPct = (camp.attempts / maxVal) * 100;

            return (
              <div key={camp.name} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{camp.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {camp.opens} opens / {camp.attempts} attempts
                  </span>
                </div>
                <div className="h-6 w-full bg-slate-100 rounded-md overflow-hidden relative flex flex-col justify-center gap-0.5 p-0.5">
                  {/* Opens bar */}
                  <div
                    style={{ width: `${openPct}%` }}
                    className="h-2 bg-blue-500 rounded transition-all duration-500"
                  />
                  {/* Attempts bar */}
                  <div
                    style={{ width: `${attemptPct}%` }}
                    className="h-2 bg-rose-500 rounded transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'events') {
    // Event types breakdown horizontal distribution
    const eventStats = [
      { name: 'Links Opened', count: 1248, color: 'bg-violet-500' },
      { name: 'Simulation Views', count: 834, color: 'bg-amber-500' },
      { name: 'Simulation Attempts', count: 391, color: 'bg-rose-500' },
      { name: 'Simulation Completed', count: 391, color: 'bg-emerald-500' },
    ];
    const total = eventStats.reduce((sum, e) => sum + e.count, 0);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">Logged Events Distribution</span>
          <span className="text-slate-500">Total: {total.toLocaleString()}</span>
        </div>

        {/* Stacked bar line */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {eventStats.map((ev) => {
            const pct = (ev.count / total) * 100;
            return (
              <div
                key={ev.name}
                style={{ width: `${pct}%` }}
                className={`${ev.color} transition-all`}
                title={`${ev.name}: ${ev.count}`}
              />
            );
          })}
        </div>

        {/* Legend checklist */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {eventStats.map((ev) => {
            const pct = ((ev.count / total) * 100).toFixed(1);
            return (
              <div key={ev.name} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className={`w-2.5 h-2.5 rounded-full ${ev.color} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-700">{ev.name}</p>
                  <p className="text-[10px] text-slate-400 font-normal">
                    {ev.count} ({pct}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Radial / gauge interaction rate
  const openRate = 66.8;
  const clickRate = 47.0;

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-slate-700">Conversion Ratios</div>
      <div className="space-y-4 pt-1">
        {/* Opens Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>Link Open Rate</span>
            <span>{openRate}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${openRate}%` }}
              className="h-full bg-blue-500 rounded-full transition-all"
            />
          </div>
          <p className="text-[10px] text-slate-400">Percentage of target emails/SMS opened</p>
        </div>

        {/* Click Attempts Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>Credentials Submission Rate</span>
            <span>{clickRate}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${clickRate}%` }}
              className="h-full bg-rose-500 rounded-full transition-all"
            />
          </div>
          <p className="text-[10px] text-slate-400">Percentage of views that submitted login inputs</p>
        </div>
      </div>
    </div>
  );
}
