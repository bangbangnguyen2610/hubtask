import { Sun, Moon, Bell, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function Header() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="ml-3 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
          U
        </div>
      </div>
    </header>
  );
}
