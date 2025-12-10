import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Settings,
  Plug,
  ChevronLeft,
  ChevronRight,
  Zap,
  Share2,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/graph', icon: Share2, label: 'Knowledge Graph' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/integrations', icon: Plug, label: 'Integrations' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`
        fixed left-0 top-0 h-full
        bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl
        border-r border-surface-200/50 dark:border-surface-700/50
        transition-all duration-300 z-40
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-surface-200/50 dark:border-surface-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              HubTask
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto shadow-lg shadow-primary-500/25">
            <Zap size={18} className="text-white" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-surface-800
          border border-surface-200 dark:border-surface-700
          shadow-sm hover:shadow-md
          flex items-center justify-center
          text-surface-500 hover:text-surface-700 dark:hover:text-surface-300
          transition-all duration-200"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="p-3 space-y-1 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
              transition-all duration-200
              ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                {!collapsed && <span className="font-medium">{item.label}</span>}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-surface-900 dark:bg-surface-700 text-white text-sm font-medium
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-200/50 dark:border-surface-700/50">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10">
            <p className="text-xs font-medium text-primary-700 dark:text-primary-400">Connected to</p>
            <p className="text-sm font-semibold text-primary-900 dark:text-primary-300 mt-0.5">Lark Base</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Live sync</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
