import React, { useEffect, useState } from 'react';
import { Cloud, DownloadCloud, HardDrive, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { apiRequest } from '../services/api.ts';
import {
  cacheModulesOffline,
  getAllCachedModules,
  getPendingSyncItems,
  setCachedJson,
} from '../services/offlineDb.ts';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { PracticalExercise, VirtualDesktopStateData } from '../types/index.ts';

export const OfflineArchitecturePage: React.FC = () => {
  const { user, isOfflineGuest } = useAuth();
  const { isOnline, pendingCount, syncing, syncNow, refreshPending } = useOnlineStatus();
  const [cachedCount, setCachedCount] = useState(0);
  const [queuedList, setQueuedList] = useState<Array<{ id?: number; description: string; createdAt: string }>>([]);
  const [msg, setMsg] = useState('');

  const inspectLocalCache = async () => {
    const [mods, pending] = await Promise.all([getAllCachedModules(), getPendingSyncItems()]);
    setCachedCount(mods.length);
    setQueuedList(pending);
    await refreshPending();
  };

  useEffect(() => {
    inspectLocalCache();
  }, []);

  const downloadBundle = async () => {
    if (isOfflineGuest) {
      setMsg('Sign in online once to download curriculum modules for offline access.');
      return;
    }
    try {
      const [bundle, desktopRes, exercisesRes] = await Promise.all([
        apiRequest<{
          modules: Array<{
            slug: string;
            number: number;
            title: string;
            subtitle: string;
            lessons: Array<{
              id: string;
              slug: string;
              title: string;
              summary: string;
              contentJson: string;
              estimatedMins: number;
            }>;
            questions: Array<{
              id: string;
              questionText: string;
              optionsJson: string;
              correctIndex: number;
              explanation: string;
              marks: number;
            }>;
          }>;
        }>('/api/learning/offline-bundle'),
        apiRequest<{ state: VirtualDesktopStateData }>('/api/desktop/state').catch(() => null),
        apiRequest<{ exercises: PracticalExercise[] }>('/api/assessments/exercises').catch(() => null),
      ]);

      await cacheModulesOffline(bundle.modules);
      if (desktopRes?.state) {
        await setCachedJson(`desktopState:${user?.id || 'guest'}`, desktopRes.state);
      }
      if (exercisesRes?.exercises) {
        await setCachedJson(`exercises:${user?.id || 'guest'}`, exercisesRes.exercises);
      }
      setMsg(
        `Cached ${bundle.modules.length} modules, Virtual Desktop files, and practical exercises for offline use.`
      );
      await inspectLocalCache();
    } catch {
      setMsg('Cannot download new lessons while offline.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Connectivity & Sync Controls */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-teal-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-amber-600" />
              )}
              Offline Support &amp; Local Sync Status
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Current connection: <strong>{isOnline ? 'Online' : 'Offline Mode'}</strong> ·{' '}
              {cachedCount} modules cached locally · {pendingCount} queued updates
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadBundle}
              className="inline-flex items-center gap-2 rounded-lg bg-[#13315C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B437D] dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              <DownloadCloud className="h-4 w-4" />
              Download Offline Lesson Pack
            </button>
            <button
              type="button"
              disabled={!isOnline || syncing || pendingCount === 0}
              onClick={async () => {
                const count = await syncNow();
                setMsg(`Synchronized ${count} offline actions with the school database.`);
                await inspectLocalCache();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold disabled:opacity-50 dark:border-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              {syncing ? 'Syncing...' : 'Sync Pending Work'}
            </button>
          </div>
        </div>

        {msg && (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-medium text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
            {msg}
          </div>
        )}

        {queuedList.length > 0 && (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-xs font-semibold mb-2">Pending Sync Queue</p>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {queuedList.map((item, i) => (
                <li key={item.id ?? i}>
                  • {item.description} (queued {new Date(item.createdAt).toLocaleTimeString()})
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Three Deployment Models Explained Clearly */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <HardDrive className="h-6 w-6 text-teal-600" />
          <h3 className="mt-3 font-display text-lg font-bold">
            1. Offline Access on an Individual Device
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Using Progressive Web App (PWA) Service Workers and IndexedDB, a pupil’s smartphone,
            tablet, or shared laptop caches lessons and quizzes while connected. Pupils can read
            lessons and draft answers without internet, and queued progress syncs when connectivity
            returns.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <Server className="h-6 w-6 text-blue-700 dark:text-teal-400" />
          <h3 className="mt-3 font-display text-lg font-bold">
            2. School-Hosted Local Server (LAN / Wi-Fi)
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            ICT Made Easy runs on a single teacher laptop or desktop inside the school with its local
            SQLite database. Pupils connect via school Wi-Fi or Ethernet (e.g.,{' '}
            <code className="font-mono">http://192.168.1.10:3000</code>) using shared computers or
            smartphones—requiring zero external mobile data or internet bandwidth.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <Cloud className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          <h3 className="mt-3 font-display text-lg font-bold">
            3. Cloud-Hosted Online Access
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            When reliable national internet is available, multiple Zambian schools connect to a
            centralized deployment with school-level data isolation, allowing district administrators
            to monitor progress across institutions. Note: Interactive web learning still requires a
            capable client device (computer, tablet, or smartphone) to run the browser.
          </p>
        </div>
      </section>
    </div>
  );
};
