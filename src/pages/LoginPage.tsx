import React, { useState } from 'react';
import { AlertCircle, BookOpen, Cpu, HardDrive, Lock, Monitor, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

const DEMO_ACCOUNTS = [
  {
    roleLabel: 'Pupil (Grade 8A)',
    identifier: 'pupil@virtuolab.edu.zm',
    pass: 'Pupil@2026!',
  },
  {
    roleLabel: 'Teacher (Lusaka Central)',
    identifier: 'teacher@virtuolab.edu.zm',
    pass: 'Teacher@2026!',
  },
  {
    roleLabel: 'Administrator',
    identifier: 'admin@virtuolab.edu.zm',
    pass: 'Admin@2026!',
  },
];

export const LoginPage: React.FC = () => {
  const { login, enterOfflineMode } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Please enter your school email/username and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const applyDemo = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Educational Overview */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl bg-[#13315C] p-8 sm:p-10 text-white">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  <Monitor className="h-5 w-5" />
                </div>
                <span className="font-display text-xl font-bold tracking-tight">ICT Made Easy</span>
              </div>

              <h1 className="mt-8 font-display text-3xl sm:text-4xl font-bold leading-tight text-white">
                Virtual ICT Learning and Computer Simulation System
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-200 max-w-2xl">
                Designed for Zambian schools with limited computer laboratory infrastructure. Practise
                operating systems, file management, word processing, spreadsheets, hardware assembly,
                and digital safety directly in the browser.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-white/15 pt-8">
                <div>
                  <BookOpen className="h-5 w-5 text-teal-300" />
                  <h2 className="mt-3 text-sm font-semibold text-white">11 ICT Modules</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    Structured lessons from computer evolution to cybersecurity.
                  </p>
                </div>
                <div>
                  <Cpu className="h-5 w-5 text-teal-300" />
                  <h2 className="mt-3 text-sm font-semibold text-white">Hardware &amp; OS Lab</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    Interactive PC assembly, virtual desktop, and office simulators.
                  </p>
                </div>
                <div>
                  <ShieldCheck className="h-5 w-5 text-teal-300" />
                  <h2 className="mt-3 text-sm font-semibold text-white">Offline Ready</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    PWA caching and local school server support for low connectivity.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-8 border-t border-white/15 pt-4 text-xs text-slate-300">
              Educational Simulation Platform · Recreates core computing workflows safely inside your browser without altering host device files.
            </p>
          </div>

          {/* Right Sign-In Form */}
          <div className="lg:col-span-5 flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Sign in to ICT Made Easy
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Enter your school account credentials to access your dashboard.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Email or Username
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="pupil@virtuolab.edu.zm"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#13315C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B437D] disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                <Lock className="h-4 w-4" />
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Development Mode Demo Accounts */}
            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Development Mode Demonstration Accounts
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Quick-fill credentials for academic evaluation. Change all passwords before school deployment.
              </p>
              <div className="mt-3 space-y-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.identifier}
                    type="button"
                    onClick={() => applyDemo(acc.identifier, acc.pass)}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {acc.roleLabel}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {acc.identifier}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={enterOfflineMode}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <HardDrive className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                Continue in Offline Practice Mode (Local Browser Storage)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
