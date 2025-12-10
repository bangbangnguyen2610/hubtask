const variants = {
  primary: `
    bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600
    text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40
  `,
  secondary: `
    bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600
    text-surface-900 dark:text-white
  `,
  outline: `
    border border-surface-300 dark:border-surface-600
    hover:bg-surface-100 dark:hover:bg-surface-800
    text-surface-700 dark:text-surface-300
    hover:border-surface-400 dark:hover:border-surface-500
  `,
  ghost: `
    hover:bg-surface-100 dark:hover:bg-surface-800
    text-surface-700 dark:text-surface-300
  `,
  danger: `
    bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600
    text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40
  `,
  success: `
    bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600
    text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
  `,
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  xl: 'px-6 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
        dark:focus:ring-offset-surface-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        active:scale-[0.98]
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {Icon && iconPosition === 'left' && !loading && <Icon size={16} className="mr-2" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={16} className="ml-2" />}
    </button>
  );
}

export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-xl
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.95]
        ${variants[variant]} ${iconSizes[size]} ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
