export default function StatsCard({ icon: Icon, label, value, trend, color = 'purple' }) {
  const colorMap = {
    purple: {
      bg: 'from-accent-purple/15 to-accent-purple/5',
      iconBg: 'bg-accent-purple/20',
      iconColor: 'text-accent-purple-light',
      border: 'border-accent-purple/10',
    },
    teal: {
      bg: 'from-accent-teal/15 to-accent-teal/5',
      iconBg: 'bg-accent-teal/20',
      iconColor: 'text-accent-teal-light',
      border: 'border-accent-teal/10',
    },
    emerald: {
      bg: 'from-accent-emerald/15 to-accent-emerald/5',
      iconBg: 'bg-accent-emerald/20',
      iconColor: 'text-accent-emerald',
      border: 'border-accent-emerald/10',
    },
    amber: {
      bg: 'from-accent-amber/15 to-accent-amber/5',
      iconBg: 'bg-accent-amber/20',
      iconColor: 'text-accent-amber',
      border: 'border-accent-amber/10',
    },
  };

  const c = colorMap[color] || colorMap.purple;

  return (
    <div
      className={`glass-card p-6 bg-gradient-to-br ${c.bg} border ${c.border} group cursor-default interactive-element`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1 shadow-sm">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
          {trend && (
            <p className="text-[11px] text-accent-emerald mt-1 font-medium">{trend}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`w-5 h-5 ${c.iconColor}`} />
        </div>
      </div>
    </div>
  );
}
