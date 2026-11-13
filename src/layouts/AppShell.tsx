import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  Globe,
  HardDrive,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { PWAInstallButton } from '../components/PWAInstallButton.tsx';

export type NavRoute =
  | 'dashboard'
  | 'modules'
  | 'tools-gallery'
  | 'hardware-lab'
  | 'virtual-desktop'
  | 'assessments'
  | 'cybersecurity'
  | 'networking'
  | 'offline-guide'
  | 'admin-panel'
  | 'teacher-panel';

interface AppShellProps {
  activeRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  pageTitle: string;
  children: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: Array<{ id: NavRoute; label: string; icon: React.FC<{ className?: string }> }>;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeRoute,
  onNavigate,
  pageTitle,
  children,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOnline, pendingCount, syncing, syncNow } = useOnlineStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const overviewItems: NavGroup['items'] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  if (user?.role === 'TEACHER') {
    overviewItems.push({ id: 'teacher-panel', label: 'Class Reports', icon: Users });
  }
  if (user?.role === 'ADMIN') {
    overviewItems.push({ id: 'admin-panel', label: 'School Admin', icon: Award });
  }

  const navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: overviewItems,
    },
    {
      label: 'Learn & Labs',
      items: [
        { id: 'modules', label: 'Form 1–4 Modules', icon: BookOpen },
        { id: 'tools-gallery', label: 'ICT Tools Guide', icon: ImageIcon },
        { id: 'hardware-lab', label: 'Hardware Lab', icon: Cpu },
        { id: 'networking', label: 'Internet & Network', icon: Globe },
        { id: 'cybersecurity', label: 'Cyber Safety', icon: ShieldCheck },
      ],
    },
    {
      label: 'Practice & Simulate',
      items: [
        { id: 'virtual-desktop', label: 'Virtual Desktop', icon: Monitor },
        { id: 'assessments', label: 'Practical Centre', icon: ClipboardCheck },
      ],
    },
    {
      label: 'Offline & Sync',
      items: [{ id: 'offline-guide', label: 'Offline & LAN Sync', icon: HardDrive }],
    },
  ];

  const handleSelect = (id: NavRoute) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const renderNavGroups = () => (
    <div className="space-y-5">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left ${
                    active
                      ? 'bg-[#13315C] text-white dark:bg-teal-600 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-teal-300 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shrink-0">
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 text-left hover:bg-slate-50/70 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#13315C] text-teal-300 shrink-0">
            <Monitor className="h-5 w-5" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-[#13315C] dark:text-white whitespace-nowrap">
            ICT Made Easy
          </span>
        </button>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary Navigation">
          {renderNavGroups()}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800 space-y-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user?.fullName}
            </p>
            <p className="mt-0.5 truncate">
              {user?.role} · {user?.school?.name || 'Platform Administration'}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#13315C] text-teal-300">
                  <Monitor className="h-4 w-4" />
                </div>
                <span className="font-display text-base font-bold text-[#13315C] dark:text-white">
                  ICT Made Easy
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">{renderNavGroups()}</nav>
            <div className="border-t border-slate-200 p-4 dark:border-slate-800 space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.fullName}
                </p>
                <p className="truncate">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              {activeRoute !== 'dashboard' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelect('dashboard')}
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#13315C] dark:text-slate-400 dark:hover:text-teal-400 whitespace-nowrap"
                  >
                    <Home className="h-3.5 w-3.5" />
                    Dashboard
                  </button>
                  <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-slate-400 shrink-0" />
                </>
              )}
              <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => (pendingCount > 0 && isOnline ? syncNow() : handleSelect('offline-guide'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              title="Connectivity and offline sync status"
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="hidden sm:inline">
                    {syncing ? 'Syncing...' : pendingCount > 0 ? `Sync (${pendingCount})` : 'Online'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Offline Mode</span>
                </>
              )}
            </button>

            <PWAInstallButton />

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle light and dark theme"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {!isOnline && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/50 dark:border-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
            <span>
              You are currently offline. Cached lessons remain accessible and completed work will sync automatically when connectivity returns.
            </span>
            {pendingCount > 0 && (
              <span className="font-mono tabular-nums font-semibold whitespace-nowrap">
                {pendingCount} queued
              </span>
            )}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
