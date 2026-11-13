import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, DownloadCloud, Image as ImageIcon, Monitor } from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import {
  cacheModulesOffline,
  getAllCachedModules,
  getCachedModuleBySlug,
  OFFLINE_FALLBACK_MODULES,
  queueOfflineAction,
} from '../services/offlineDb.ts';
import { useFormLevel } from '../contexts/FormLevelContext.tsx';
import { FormLevelFilter, LearningModuleSummary, LessonItem, QuizQuestion } from '../types/index.ts';
import { Module1Evolution } from './Module1Evolution.tsx';
import { Module2HardwareLab } from './Module2HardwareLab.tsx';
import { Module3SoftwareLab, Module4OSLab } from './Module3And4Systems.tsx';
import { Module9Networking } from './Module9Networking.tsx';
import { Module10Cybersecurity } from './Module10Cybersecurity.tsx';
import { NavRoute } from '../layouts/AppShell.tsx';

interface ModuleDetailData {
  module: LearningModuleSummary & {
    lessons: Array<LessonItem & { contentJson: string }>;
    questions: QuizQuestion[];
  };
  progress: Array<{
    lessonId: string | null;
    status: string;
    percentComplete: number;
  }>;
}

interface ModulesHubProps {
  initialSlug?: string | null;
  onNavigate: (route: NavRoute) => void;
}

export const ModulesHub: React.FC<ModulesHubProps> = ({ initialSlug, onNavigate }) => {
  const { formLevel, setFormLevel } = useFormLevel();
  const [modules, setModules] = useState<LearningModuleSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug ?? null);
  const [detail, setDetail] = useState<ModuleDetailData | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    awardedMarks: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    breakdown: Array<{ questionId: string; isCorrect: boolean; explanation: string }>;
  } | null>(null);
  const [knowledgeChecks, setKnowledgeChecks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [offlineSavedCount, setOfflineSavedCount] = useState(0);
  const [statusBanner, setStatusBanner] = useState('');

  useEffect(() => {
    if (initialSlug) setSelectedSlug(initialSlug);
  }, [initialSlug]);

  const loadModuleList = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ modules: LearningModuleSummary[] }>('/api/learning/modules');
      setModules(res.modules);
    } catch {
      const cached = await getAllCachedModules();
      const source = cached.length > 0 ? cached : OFFLINE_FALLBACK_MODULES;
      setModules(
        [...source]
          .sort((a, b) => a.moduleNumber - b.moduleNumber)
          .map((c) => ({
            id: c.moduleSlug,
            slug: c.moduleSlug,
            number: c.moduleNumber,
            formLevel: c.formLevel || 1,
            syllabusCode: c.syllabusCode || `${c.formLevel || 1}.1`,
            title: c.title,
            subtitle: c.subtitle,
            description: c.description || 'Available offline without internet connectivity.',
            category: c.category || 'Offline Curriculum',
            isPublished: true,
            lessons: c.lessons.map((l, idx) => ({
              ...l,
              moduleId: c.moduleSlug,
              orderIndex: idx + 1,
              offlineReady: true,
            })),
          }))
      );
    } finally {
      const cached = await getAllCachedModules();
      setOfflineSavedCount(cached.length);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModuleList();
  }, []);

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null);
      return;
    }
    setQuizResult(null);
    setQuizAnswers({});

    apiRequest<ModuleDetailData>(`/api/learning/modules/${selectedSlug}`)
      .then((res) => {
        setDetail(res);
        setActiveLessonId(res.module.lessons[0]?.id ?? null);
      })
      .catch(async () => {
        const cached =
          (await getCachedModuleBySlug(selectedSlug)) ||
          OFFLINE_FALLBACK_MODULES.find((m) => m.moduleSlug === selectedSlug);
        if (cached) {
          setDetail({
            module: {
              id: cached.moduleSlug,
              slug: cached.moduleSlug,
              number: cached.moduleNumber,
              formLevel: cached.formLevel || 1,
              syllabusCode: cached.syllabusCode || '1.1',
              title: cached.title,
              subtitle: cached.subtitle,
              description: cached.description || 'Loaded from local browser offline curriculum pack.',
              category: cached.category || 'Offline',
              isPublished: true,
              lessons: cached.lessons.map((l, idx) => ({
                ...l,
                moduleId: cached.moduleSlug,
                orderIndex: idx + 1,
                offlineReady: true,
              })),
              questions: cached.questions.map((q) => ({ ...q, difficulty: 'STANDARD' })),
            },
            progress: [],
          });
          setActiveLessonId(cached.lessons[0]?.id ?? null);
        }
      });
  }, [selectedSlug]);

  const handleSaveOfflinePack = async () => {
    try {
      const bundle = await apiRequest<{
        modules: Array<{
          slug: string;
          number: number;
          formLevel?: number;
          syllabusCode?: string;
          title: string;
          subtitle: string;
          description?: string;
          category?: string;
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
      }>('/api/learning/offline-bundle');
      await cacheModulesOffline(bundle.modules);
      setOfflineSavedCount(bundle.modules.length);
      setStatusBanner(`Cached ${bundle.modules.length} curriculum modules for offline reading.`);
    } catch {
      setStatusBanner('Cannot download offline bundle while disconnected.');
    }
  };

  const markLessonComplete = async (moduleId: string, lessonId: string) => {
    const payload = { moduleId, lessonId, status: 'COMPLETED', percentComplete: 100 };
    try {
      await apiRequest('/api/learning/progress', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStatusBanner('Lesson marked as completed and saved to your progress.');
      if (selectedSlug) {
        const refreshed = await apiRequest<ModuleDetailData>(`/api/learning/modules/${selectedSlug}`);
        setDetail(refreshed);
      }
    } catch {
      await queueOfflineAction('/api/learning/progress', 'POST', payload, 'Lesson completion');
      setStatusBanner('Saved offline! Lesson completion will sync automatically when online.');
    }
  };

  const handleQuizSubmit = async (moduleId: string) => {
    const answers = Object.entries(quizAnswers).map(([questionId, selectedIndex]) => ({
      questionId,
      selectedIndex,
    }));
    try {
      const res = await apiRequest<{
        awardedMarks: number;
        totalMarks: number;
        percentage: number;
        passed: boolean;
        breakdown: Array<{ questionId: string; isCorrect: boolean; explanation: string }>;
      }>('/api/learning/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ moduleId, answers }),
      });
      setQuizResult(res);
    } catch {
      await queueOfflineAction('/api/learning/quiz/submit', 'POST', { moduleId, answers }, 'Quiz attempt');
      setStatusBanner('You are offline. Your quiz attempt has been queued for automatic grading when reconnected.');
    }
  };

  if (loading) {
    return <div className="h-64 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />;
  }

  // Module Detail View
  if (selectedSlug && detail) {
    const mod = detail.module;
    const activeLesson = mod.lessons.find((l) => l.id === activeLessonId) || mod.lessons[0];
    let parsedContent: {
      note?: string;
      sections?: Array<{ heading: string; body: string }>;
      knowledgeCheck?: {
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
      };
    } = {};
    try {
      parsedContent = activeLesson?.contentJson ? JSON.parse(activeLesson.contentJson) : {};
    } catch {
      parsedContent = {};
    }

    const completedSet = new Set(
      detail.progress.filter((p) => p.status === 'COMPLETED' && p.lessonId).map((p) => p.lessonId!)
    );

    const currentIndex = modules.findIndex((m) => m.slug === selectedSlug);
    const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
    const nextModule =
      currentIndex >= 0 && currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedSlug(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Form 1–4 Modules
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {prevModule && (
              <button
                type="button"
                onClick={() => setSelectedSlug(prevModule.slug)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Module {prevModule.number}
              </button>
            )}
            {nextModule && (
              <button
                type="button"
                onClick={() => setSelectedSlug(nextModule.slug)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Module {nextModule.number}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('tools-gallery')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ImageIcon className="h-3.5 w-3.5 text-teal-600" />
              Tools Visual Guide
            </button>
            {mod.number >= 3 && mod.number <= 10 && (
              <button
                type="button"
                onClick={() => onNavigate('virtual-desktop')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#13315C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B437D] dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                <Monitor className="h-4 w-4" />
                Practise in Virtual Desktop
              </button>
            )}
          </div>
        </div>

        {statusBanner && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-medium text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
            {statusBanner}
          </div>
        )}

        {/* Module Header */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
            Form {mod.formLevel || 1} · Syllabus Topic {mod.syllabusCode || `${mod.number}`} · {mod.category}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
            {mod.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{mod.description}</p>
        </section>

        {/* Lessons List + Reader */}
        {mod.lessons.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-500 px-2">Module Lessons</p>
              {mod.lessons.map((lesson) => {
                const isDone = completedSet.has(lesson.id);
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={`w-full rounded-lg p-3 text-left transition-colors ${
                      isActive
                        ? 'bg-[#13315C] text-white dark:bg-teal-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium">
                        {lesson.orderIndex}. {lesson.title}
                      </span>
                      {isDone && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-400" />}
                    </div>
                    <p
                      className={`mt-1 text-xs flex items-center gap-1 ${
                        isActive ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      <Clock className="h-3 w-3" /> {lesson.estimatedMins} mins
                    </p>
                  </button>
                );
              })}
            </div>

            {activeLesson && (
              <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 space-y-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                      {activeLesson.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {activeLesson.summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => markLessonComplete(mod.id, activeLesson.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-500 whitespace-nowrap"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {completedSet.has(activeLesson.id) ? 'Completed' : 'Mark Lesson Complete'}
                  </button>
                </div>

                {parsedContent.note && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3.5 text-xs leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {parsedContent.note}
                  </div>
                )}

                <div className="space-y-4">
                  {(parsedContent.sections || []).map((sec) => (
                    <div key={sec.heading}>
                      <h4 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                        {sec.heading}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {sec.body}
                      </p>
                    </div>
                  ))}
                </div>

                {parsedContent.knowledgeCheck && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs font-semibold text-slate-500">Quick Knowledge Check</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {parsedContent.knowledgeCheck.question}
                    </p>
                    <div className="mt-3 space-y-2">
                      {parsedContent.knowledgeCheck.options.map((opt, idx) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setKnowledgeChecks((prev) => ({ ...prev, [activeLesson.id]: idx }))
                          }
                          className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                            knowledgeChecks[activeLesson.id] === idx
                              ? idx === parsedContent.knowledgeCheck!.correctIndex
                                ? 'border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200'
                                : 'border-red-400 bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200'
                              : 'border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {knowledgeChecks[activeLesson.id] !== undefined && (
                      <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300">
                        {parsedContent.knowledgeCheck.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Embedded Interactive Labs per Module */}
        {mod.number === 1 && <Module1Evolution />}
        {mod.number === 2 && <Module2HardwareLab />}
        {mod.number === 3 && <Module3SoftwareLab />}
        {mod.number === 4 && <Module4OSLab />}
        {mod.number === 11 && <Module9Networking />}
        {mod.number === 12 && <Module10Cybersecurity />}

        {/* End-of-Topic Quiz */}
        {mod.questions.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  End-of-Topic Assessment Quiz
                </h3>
                <p className="text-xs text-slate-500">
                  Answer all questions and submit to record your score in your pupil profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleQuizSubmit(mod.id)}
                className="rounded-lg bg-[#13315C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B437D] dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                Submit Quiz Answers
              </button>
            </div>

            {quizResult && (
              <div
                className={`rounded-lg border p-4 text-sm ${
                  quizResult.passed
                    ? 'border-teal-300 bg-teal-50 text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200'
                    : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                }`}
              >
                <p className="font-semibold font-mono tabular-nums">
                  Score: {quizResult.awardedMarks} / {quizResult.totalMarks} ({quizResult.percentage}%) —{' '}
                  {quizResult.passed ? 'Passed' : 'Keep Reviewing'}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {mod.questions.map((q, qIdx) => {
                const options = JSON.parse(q.optionsJson) as string[];
                const reviewItem = quizResult?.breakdown.find((b) => b.questionId === q.id);
                return (
                  <div
                    key={q.id}
                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {qIdx + 1}. {q.questionText}{' '}
                      <span className="text-xs text-slate-500 font-mono">({q.marks} marks)</span>
                    </p>
                    <div className="mt-3 space-y-2">
                      {options.map((opt, optIdx) => (
                        <label
                          key={opt}
                          className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={quizAnswers[q.id] === optIdx}
                            onChange={() =>
                              setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                    {reviewItem && (
                      <p
                        className={`mt-3 text-xs font-medium ${
                          reviewItem.isCorrect ? 'text-teal-700 dark:text-teal-400' : 'text-red-600'
                        }`}
                      >
                        {reviewItem.isCorrect ? 'Correct: ' : 'Incorrect: '}
                        {reviewItem.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  // All Modules Grid View
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Zambian Form 1–4 ICT Learning Modules
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Select your secondary level (Form 1 to Form 4) to explore all 12 Ordinary Level ICT Syllabus modules—accessible even offline without internet.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveOfflinePack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap self-start sm:self-center"
        >
          <DownloadCloud className="h-4 w-4 text-teal-600" />
          Cache Lessons Offline ({offlineSavedCount} saved)
        </button>
      </section>

      {statusBanner && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-medium text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
          {statusBanner}
        </div>
      )}

      {/* Form 1–4 Level Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 w-fit dark:border-slate-800 dark:bg-slate-900">
          {(
            [
              { id: 'all', label: 'All Forms (1–4)' },
              { id: 1, label: 'Form 1 (Topics 1.1–1.6)' },
              { id: 2, label: 'Form 2 (Topics 2.1–2.4)' },
              { id: 3, label: 'Form 3 (Topics 3.1–3.4)' },
              { id: 4, label: 'Form 4 (Topics 4.1–4.4)' },
            ] as Array<{ id: FormLevelFilter; label: string }>
          ).map((tab) => (
            <button
              key={String(tab.id)}
              type="button"
              onClick={() => setFormLevel(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                formLevel === tab.id
                  ? 'bg-[#13315C] text-white dark:bg-teal-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('tools-gallery')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <ImageIcon className="h-4 w-4 text-teal-600" />
          Open Illustrated Tools Guide
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 space-y-3">
          <p className="font-semibold text-slate-900 dark:text-white">
            No modules match the current filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules
            .filter((m) => (formLevel === 'all' ? true : (m.formLevel || 1) === formLevel))
            .map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
                  Form {m.formLevel || 1} · Topic {m.syllabusCode || `${m.number}`} · Module {m.number}
                </p>
                <h3 className="mt-1.5 font-display text-lg font-bold text-slate-900 dark:text-white">
                  {m.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {m.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 tabular-nums">
                  {m.completedLessons || 0}/{m.totalLessons || m.lessons.length} lessons
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(m.slug)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#13315C] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1B437D] dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Open Module
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
