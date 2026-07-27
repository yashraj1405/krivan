import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { User, Sliders, Sun, Moon, Shield, Save, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.full_name || 'System Admin');
  const [email, setEmail] = useState(user?.email || 'admin@fertilizer.com');
  const [profileSaved, setProfileSaved] = useState(false);

  const [scanLimit, setScanLimit] = useState(60);
  const [allowPublic, setAllowPublic] = useState(true);
  const [systemSaved, setSystemSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    setSystemSaved(true);
    setTimeout(() => setSystemSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          System Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage administrator account credentials, authentication policies, and theme settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Account Settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Administrator Profile</h2>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Update account preferences</span>
            </div>
          </div>

          {profileSaved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center space-x-2">
              <CheckCircle2 size={16} />
              <span>Profile credentials saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center space-x-2 w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              <Save size={14} />
              <span>Save Account Settings</span>
            </button>
          </form>
        </div>

        {/* System & Theme Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">System Preferences</h2>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Security & Theme Controls</span>
            </div>
          </div>

          {systemSaved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center space-x-2">
              <CheckCircle2 size={16} />
              <span>System preferences saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSystem} className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Theme Mode</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                  Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors"
              >
                {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                Verification Scan Rate Limit (req/min)
              </label>
              <input
                type="number"
                value={scanLimit}
                onChange={(e) => setScanLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Public Scan API</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Allow public verification checks</span>
              </div>
              <input
                type="checkbox"
                checked={allowPublic}
                onChange={(e) => setAllowPublic(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center space-x-2 w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-md shadow-brand-600/20"
            >
              <Shield size={14} />
              <span>Save System Preferences</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
