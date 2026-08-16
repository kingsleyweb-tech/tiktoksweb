interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  accentColor?: string;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  accentColor = 'bg-blue-50 text-blue-600',
}: StatCardProps) {
  const changeColor =
    changeType === 'up'
      ? 'text-emerald-600'
      : changeType === 'down'
      ? 'text-red-500'
      : 'text-slate-400';

  const changeIcon =
    changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '–';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accentColor}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {change && (
          <p className={`text-xs mt-1 font-medium ${changeColor}`}>
            {changeIcon} {change}
          </p>
        )}
      </div>
    </div>
  );
}
