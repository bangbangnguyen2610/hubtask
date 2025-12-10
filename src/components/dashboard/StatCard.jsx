import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export function StatCard({ title, value, change, changeType, icon: Icon, color = 'primary', subtitle, onClick }) {
  const colorStyles = {
    primary: {
      bg: 'bg-primary-50 dark:bg-primary-950/30',
      icon: 'text-primary-600 dark:text-primary-400',
      gradient: 'from-primary-500 to-primary-600',
      glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-500 to-emerald-600',
      glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    },
    yellow: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      icon: 'text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-500 to-amber-600',
      glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    },
    red: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      icon: 'text-rose-600 dark:text-rose-400',
      gradient: 'from-rose-500 to-rose-600',
      glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]',
    },
    purple: {
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      icon: 'text-violet-600 dark:text-violet-400',
      gradient: 'from-violet-500 to-violet-600',
      glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      icon: 'text-cyan-600 dark:text-cyan-400',
      gradient: 'from-cyan-500 to-cyan-600',
      glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]',
    },
  };

  const style = colorStyles[color] || colorStyles.primary;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white dark:bg-surface-800/80 rounded-2xl p-6
        border border-surface-200 dark:border-surface-700/50
        transition-all duration-300
        hover:shadow-bento hover:border-surface-300 dark:hover:border-surface-600
        hover:-translate-y-1 ${style.glow}
        ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Background gradient decoration */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${style.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-white mt-2 tabular-nums tracking-tight">
            {value}
          </p>

          {subtitle && (
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{subtitle}</p>
          )}

          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-3">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                ${changeType === 'increase'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                }`}>
                {changeType === 'increase' ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {change}%
              </div>
              <span className="text-xs text-surface-400 dark:text-surface-500">vs last week</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${style.bg} ${style.icon} transition-transform group-hover:scale-110`}>
            <Icon size={24} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {onClick && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={16} className="text-surface-400" />
        </div>
      )}
    </div>
  );
}

export function StatCardMini({ title, value, icon: Icon, color = 'primary' }) {
  const colorStyles = {
    primary: 'text-primary-600 dark:text-primary-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    yellow: 'text-amber-600 dark:text-amber-400',
    red: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
      {Icon && <Icon size={18} className={colorStyles[color]} />}
      <div>
        <p className="text-xs text-surface-500 dark:text-surface-400">{title}</p>
        <p className="text-lg font-semibold text-surface-900 dark:text-white tabular-nums">{value}</p>
      </div>
    </div>
  );
}
