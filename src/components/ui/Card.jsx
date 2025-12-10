export function Card({ children, className = '', variant = 'default', hover = true, ...props }) {
  const variants = {
    default: 'bg-white dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700/50',
    glass: 'bg-white/70 dark:bg-surface-800/50 border border-white/20 dark:border-surface-700/30 backdrop-blur-xl',
    gradient: 'bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 border border-surface-200 dark:border-surface-700/50',
    elevated: 'bg-white dark:bg-surface-800 shadow-bento border-0',
  };

  const hoverClass = hover
    ? 'hover:shadow-bento hover:border-surface-300 dark:hover:border-surface-600 hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${variants[variant]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', border = true }) {
  return (
    <div className={`px-6 py-4 ${border ? 'border-b border-surface-200 dark:border-surface-700/50' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', icon: Icon }) {
  return (
    <h3 className={`text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2 ${className}`}>
      {Icon && <Icon size={20} className="text-primary-500" />}
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-surface-500 dark:text-surface-400 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-surface-200 dark:border-surface-700/50 ${className}`}>
      {children}
    </div>
  );
}
