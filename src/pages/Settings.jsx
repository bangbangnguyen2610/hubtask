import { useState } from 'react';
import { User, Bell, Palette, Shield, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

export function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useLocalStorage('settings', {
    notifications: true,
    emailDigest: false,
    autoSync: true,
    compactMode: false,
  });

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User size={20} className="text-gray-500" />
            <CardTitle>Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
              U
            </div>
            <Button variant="outline" size="sm">Change Avatar</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Display Name" defaultValue="User" />
            <Input label="Email" type="email" defaultValue="user@example.com" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette size={20} className="text-gray-500" />
            <CardTitle>Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use dark theme for better viewing at night
              </p>
            </div>
            <ToggleSwitch checked={isDark} onChange={toggleTheme} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Compact Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reduce spacing for more content
              </p>
            </div>
            <ToggleSwitch
              checked={settings.compactMode}
              onChange={(v) => updateSetting('compactMode', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-gray-500" />
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get notified about task updates
              </p>
            </div>
            <ToggleSwitch
              checked={settings.notifications}
              onChange={(v) => updateSetting('notifications', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Email Digest</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Weekly summary of your tasks
              </p>
            </div>
            <ToggleSwitch
              checked={settings.emailDigest}
              onChange={(v) => updateSetting('emailDigest', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sync */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-gray-500" />
            <CardTitle>Data & Sync</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Auto Sync</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically sync with connected integrations
              </p>
            </div>
            <ToggleSwitch
              checked={settings.autoSync}
              onChange={(v) => updateSetting('autoSync', v)}
            />
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline">
              <Download size={18} className="mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
