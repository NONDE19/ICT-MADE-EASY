import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Image as ImageIcon,
  Monitor,
  Play,
} from 'lucide-react';
import { apiRequest, isNetworkError } from '../services/api.ts';
import { getCachedJson, OFFLINE_FALLBACK_MODULES, setCachedJson } from '../services/offlineDb.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useFormLevel } from '../contexts/FormLevelContext.tsx';
import { NavRoute } from '../layouts/AppShell.tsx';
import { FormLevelFilter } from '../types/index.ts';

interface PupilDashboardData {
  classes: Array<{ name: string; gradeLevel: string }>;
  summary: {
    overallProgressPercent: number;
    completedModulesCount: number;
    totalModulesCount: number;
    completedLessonsCount: number;
    totalLessonsCount: number;
    averageScore: number;
    achievementsCount: number;
  };
  modules: Array<{
    id: string;
    slug: string;
    number: number;
    formLevel?: number;
    syllabusCode?: string;
    title: string;
    subtitle: string;
    completedLessons: number;
    totalLessons: number;
    percentComplete: number;
  }>;
  assignedExercises: Array<{
    id: string;
    title: string;
    formLevel?: number;
    syllabusCode?: string;
    level: number;
    totalMarks: number;
    deadline: string | null;
    module: { number: number; title: string; slug: string };
  }>;
  recentResults: Array<{
    id: string;
    awardedMarks: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    gradedAt: string;
    attempt: {
      attemptType: string;
      exercise?: { title: string; level: number } | null;
    };
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    points: number;
    earnedAt: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>;
  recommendedLessons: Array<{
    moduleId: string;
    moduleNumber: number;
    moduleTitle: string;
    moduleSlug: string;
    lessonId: string;
    lessonTitle: string;
    estimatedMins: number;
  }>;
  unfinishedActivity: {
    module: { slug: string; title: string };
    lesson?: { title: string } | null;
    percentComplete: number;
  } | null;
}

interface PupilDashboardProps {
  onNavigate: (route: NavRoute) => void;
  onOpenModule: (slug: string) => void;
}

export const PupilDashboard: React.FC<PupilDashboardProps> = ({
  onNavigate,
  onOpenModule,
}) => {
  const { user, isOfflineGuest } = useAuth();
  const { formLevel, setFormLevel } = useFormLevel();
  const cacheKey = `pupilDashboard:${user?.id || 'guest'}`;
  const [data, setData] = useState<PupilDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buildOfflineFallbackDashboard = (): PupilDashboardData => ({
    classes: [{ name: 'Offline Practice Workspace', gradeLevel: 'Form 1–4' }],
    summary: {
      overallProgressPercent: 0,
      completedModulesCount: 0,
      totalModulesCount: 12,
      completedLessonsCount: 0,
      totalLessonsCount: OFFLINE_FALLBACK_MODULES.reduce((s, m) => s + m.lessons.length, 0),
      averageScore: 0,
      achievementsCount: 0,
    },
    modules: OFFLINE_FALLBACK_MODULES.map((m) => ({
      id: m.moduleSlug,
      slug: m.moduleSlug,
      number: m.moduleNumber,
      formLevel: m.formLevel,
      syllabusCode: m.syllabusCode,
      title: m.title,
      subtitle: m.subtitle,
      completedLessons: 0,
      totalLessons: m.lessons.length,
      percentComplete: 0,
    })),
    assignedExercises: [],
    recentResults: [],
    achievements: [],
    notifications: [],
    recommendedLessons: OFFLINE_FALLBACK_MODULES.slice(0, 4).map((m) => ({
      moduleId: m.moduleSlug,
      moduleNumber: m.moduleNumber,
      moduleTitle: m.title,
      moduleSlug: m.moduleSlug,
      lessonId: m.lessons[0]?.id || m.moduleSlug,
      lessonTitle: m.lessons[0]?.title || m.title,
      estimatedMins: m.lessons[0]?.estimatedMins || 15,
    })),
    unfinishedActivity: null,
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      if (isOfflineGuest) {
        const cached = (await getCachedJson<PupilDashboardData>(cacheKey)) || buildOfflineFallbackDashboard();
        setData(cached);
        setError('');
        return;
      }

      const res = await apiRequest<PupilDashboardData>('/api/learning/pupil-dashboard');
      setData(res);
      await setCachedJson(cacheKey, res);
      setError('');
    } catch (err) {
      if (isNetworkError(err)) {
        const cached = (await getCachedJson<PupilDashboardData>(cacheKey)) || buildOfflineFallbackDashboard();
        setData(cached);
        setError('');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [isOfflineGuest]);

  const markRead = async (id: string) => {
    try {
      await apiRequest(`/api/learning/notifications/${id}/read`, { method: 'PATCH' });
      loadDashboard();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700 dark:border-red-900 dark:bg-slate-900 dark:text-red-300">
        {error || 'Dashboard data unavailable.'}
      </div>
    );
  }

  const filteredModules =
    formLevel === 'all'
      ? data.modules
      : data.modules.filter((m) => (m.formLevel || 1) === formLevel);

  const visibleModuleSlugs = new Set(filteredModules.map((m) => m.slug));
  const filteredRecommendations =
    formLevel === 'all'
      ? data.recommendedLessons
      : data.recommendedLessons.filter((r) => visibleModuleSlugs.has(r.moduleSlug));

  const filteredExercises =
    formLevel === 'all'
      ? data.assignedExercises
      : data.assignedExercises.filter((ex) => (ex.formLevel || 1) === formLevel);

  return (
    <div className="space-y-8">
      {/* Welcome Banner + Form Level Switcher */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {user?.school?.name || 'ICT Made Easy School'} ·{' '}
              {data.classes.map((c) => c.name).join(', ') || 'Zambian Form 1–4 Learner'}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
              Welcome back, {user?.fullName}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Choose your Form level below to focus on Form 1–4 Zambian ICT Syllabus lessons, illustrated tools, and simulations—online or offline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {data.unfinishedActivity && (
              <button
                type="button"
                onClick={() => onOpenModule(data.unfinishedActivity!.module.slug)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <Play className="h-4 w-4 text-teal-600" />
                Resume Lesson
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('virtual-desktop')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#13315C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B437D] dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
            >
              <Monitor className="h-4 w-4" />
              Launch Virtual Desktop
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Active Syllabus Level Filter:
          </span>
          <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                { val: 'all', label: 'All Forms (1–4)' },
                { val: 1, label: 'Form 1' },
                { val: 2, label: 'Form 2' },
                { val: 3, label: 'Form 3' },
                { val: 4, label: 'Form 4' },
              ] as Array<{ val: FormLevelFilter; label: string }>
            ).map((opt) => (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => setFormLevel(opt.val)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  formLevel === opt.val
                    ? 'bg-[#13315C] text-white dark:bg-teal-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Navigation Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('modules')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-teal-500 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500"
        >
          <BookOpen className="h-5 w-5 text-[#13315C] dark:text-teal-400" />
          <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
            Form 1–4 Modules (12)
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Zambian syllabus lessons &amp; quizzes
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tools-gallery')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-teal-500 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500"
        >
          <ImageIcon className="h-5 w-5 text-[#13315C] dark:text-teal-400" />
          <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
            ICT Tools Visual Guide
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Illustrated diagrams of all syllabus tools
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('virtual-desktop')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-teal-500 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500"
        >
          <Monitor className="h-5 w-5 text-[#13315C] dark:text-teal-400" />
          <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
            Virtual Desktop
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Writer, CalcSheet, Publisher, EduMail, Web &amp; Cloud
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('assessments')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-teal-500 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500"
        >
          <ClipboardCheck className="h-5 w-5 text-[#13315C] dark:text-teal-400" />
          <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
            Practical Centre
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Form 1–4 graded hands-on tasks
          </p>
        </button>
      </section>

      {/* KPI Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Learning Progress</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {data.summary.overallProgressPercent}%
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-1.5 rounded-full bg-teal-600"
              style={{ width: `${data.summary.overallProgressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {data.summary.completedLessonsCount} of {data.summary.totalLessonsCount} lessons completed
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Modules</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {data.summary.completedModulesCount} / {data.summary.totalModulesCount}
          </p>
          <p className="mt-2 text-xs text-slate-500">Zambian Form 1–4 syllabus units available</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Assessment Score</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {data.summary.averageScore}%
          </p>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            Across {data.recentResults.length} graded submissions
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Achievements Earned</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {data.summary.achievementsCount}
          </p>
          <p className="mt-2 text-xs text-slate-500">Earned from lessons, quizzes, and labs</p>
        </div>
      </section>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Recommended Lessons + Assigned Exercises */}
        <div className="lg:col-span-8 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Recommended Next Lessons
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('modules')}
                className="text-xs font-semibold text-blue-700 hover:underline dark:text-teal-400 whitespace-nowrap"
              >
                Browse all modules
              </button>
            </div>

            {filteredRecommendations.length === 0 ? (
              <div className="mt-4 py-6 text-center text-sm text-slate-500">
                No remaining lessons in this Form filter. Switch Forms or practise inside the Virtual Desktop!
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecommendations.map((rec) => (
                  <div
                    key={rec.lessonId}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Module {rec.moduleNumber} · {rec.moduleTitle} · {rec.estimatedMins} min
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {rec.lessonTitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenModule(rec.moduleSlug)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 shrink-0"
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Assigned Practical Exercises
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('assessments')}
                className="text-xs font-semibold text-blue-700 hover:underline dark:text-teal-400 whitespace-nowrap"
              >
                Open Practical Centre
              </button>
            </div>

            {filteredExercises.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No practical exercises matching the current Form filter.</p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Form {ex.formLevel || 1} {ex.syllabusCode ? `· Topic ${ex.syllabusCode}` : ''} · Level {ex.level}{' '}
                        {ex.level === 1
                          ? 'Guided Learning'
                          : ex.level === 2
                          ? 'Independent Practice'
                          : 'Practical Assessment'}{' '}
                        · {ex.totalMarks} marks
                        {ex.deadline
                          ? ` · Due ${new Date(ex.deadline).toLocaleDateString()}`
                          : ''}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                        {ex.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('assessments')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#13315C] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1B437D] dark:bg-teal-600 dark:hover:bg-teal-500 shrink-0 self-start sm:self-center"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Start Task
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right 4 cols: Recent Scores, Achievements, Notifications */}
        <div className="lg:col-span-4 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Recent Assessment Scores
            </h3>
            {data.recentResults.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                Complete a module quiz or practical assessment to view your recorded scores here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.recentResults.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0 last:pb-0 dark:border-slate-800"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {res.attempt.exercise?.title || `${res.attempt.attemptType} Assessment`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(res.gradedAt).toLocaleDateString()} ·{' '}
                        {res.passed ? 'Passed' : 'Needs Review'}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                      {res.awardedMarks}/{res.totalMarks} ({res.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-teal-600" />
              Achievements
            </h3>
            {data.achievements.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                Complete your first lesson or quiz to unlock learning milestones.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.achievements.map((ach) => (
                  <div key={ach.id} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {ach.title} · {ach.points} pts
                      </p>
                      <p className="text-xs text-slate-500">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-700 dark:text-teal-400" />
              Class Notifications
            </h3>
            {data.notifications.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">No new notifications.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-3 text-xs ${
                      n.isRead
                        ? 'border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40'
                        : 'border-blue-200 bg-blue-50/50 dark:border-teal-900 dark:bg-teal-950/30'
                    }`}
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{n.message}</p>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="mt-2 font-medium text-blue-700 hover:underline dark:text-teal-400"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Quick Module Progress Strip */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-700 dark:text-teal-400" />
            Curriculum Modules Progress
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => onOpenModule(mod.slug)}
              className="text-left rounded-lg border border-slate-200 p-4 hover:border-teal-500 transition-colors dark:border-slate-800 dark:hover:border-teal-500"
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Form {mod.formLevel || 1} {mod.syllabusCode ? `· Topic ${mod.syllabusCode}` : ''} · {mod.completedLessons}/{mod.totalLessons} lessons
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                {mod.title}
              </p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-[#13315C] dark:bg-teal-500"
                  style={{ width: `${mod.percentComplete}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
