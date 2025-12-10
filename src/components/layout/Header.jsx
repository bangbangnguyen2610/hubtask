import { Sun, Moon, Bell, Search, Command } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function Header() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-700/50 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 w-full group focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
          <Search size={18} className="text-surface-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search tasks, projects..."
            className="w-full bg-transparent border-none outline-none text-surface-900 dark:text-white placeholder-surface-400 text-sm"
          />
          <div className="hidden sm:flex items-center gap-1 text-xs text-surface-400">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-700 font-mono">
              <Command size={10} className="inline" />
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-700 font-mono">K</kbd>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 dark:text-surface-400
            transition-all duration-200 hover:text-surface-700 dark:hover:text-surface-200"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 dark:text-surface-400
          transition-all duration-200 hover:text-surface-700 dark:hover:text-surface-200"
          title="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-surface-900"></span>
        </button>

        <div className="ml-2 pl-3 border-l border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary-500/25">
              G
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-surface-900 dark:text-white">GearVN</p>
              <p className="text-xs text-surface-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
