import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, HelpCircle, Send, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useFormLevel } from '../contexts/FormLevelContext.tsx';
import { apiRequest, isNetworkError } from '../services/api.ts';
import { getCachedJson, queueOfflineAction, setCachedJson } from '../services/offlineDb.ts';
import { FormLevelFilter, PracticalExercise, SimActionLog, SimFile, SimFolder } from '../types/index.ts';
import { checkCriterionLivePreview } from '../simulations/desktopEngine.ts';
import { VirtualDesktop } from '../simulations/VirtualDesktop.tsx';

interface EvaluationResponse {
  evaluation: {
    awardedMarks: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    criteriaResults: Array<{
      criterionId: string;
      label: string;
      passed: boolean;
      awardedMarks: number;
      maxMarks: number;
      feedback: string;
    }>;
  };
}

const OFFLINE_FALLBACK_EXERCISES: PracticalExercise[] = [
  {
    id: 'offline-ex-form1',
    moduleId: 'offline-mod-3',
    formLevel: 1,
    syllabusCode: '1.3',
    title: 'Form 1 (1.3): Organize Schoolwork Folders & Word Document',
    description: 'Guided file management and Word Writer practice available completely offline.',
    instructions:
      'Open File Manager, create a folder named "Assignments", then open Word Writer and save a document inside "Assignments".',
    level: 1,
    totalMarks: 20,
    deadline: null,
    module: { number: 3, title: 'Software Types & File Management Basics', slug: 'computer-software' },
    criteria: [
      {
        id: 'off-c1',
        label: 'Create an Assignments folder',
        ruleType: 'FOLDER_EXISTS',
        rulePayload: JSON.stringify({ name: 'Assignments' }),
        marks: 10,
        orderIndex: 1,
        hintText: 'Open File Manager and click New Folder, then name it Assignments.',
      },
      {
        id: 'off-c2',
        label: 'Save a Word Writer document inside Assignments',
        ruleType: 'FILE_IN_FOLDER',
        rulePayload: JSON.stringify({ folderName: 'Assignments', fileType: 'document' }),
        marks: 10,
        orderIndex: 2,
        hintText: 'Open Word Writer, write your text, choose the Assignments folder, and click Save.',
      },
    ],
  },
  {
    id: 'offline-ex-form2',
    moduleId: 'offline-mod-4',
    formLevel: 2,
    syllabusCode: '2.1 & 2.3',
    title: 'Form 2 (2.1 & 2.3): Compress File, Encrypt & Send EduMail',
    description: 'Practice Form 2 file compression (.zip), encryption (.enc), and email sending offline.',
    instructions:
      'In File Manager, select a document and click Compress (.zip) and Encrypt, then open EduMail and send an email with an attachment.',
    level: 2,
    totalMarks: 30,
    deadline: null,
    module: { number: 4, title: 'File Compression, Encryption & Operating Systems', slug: 'operating-systems' },
    criteria: [
      {
        id: 'off-f2-c1',
        label: 'Create a compressed .zip archive',
        ruleType: 'FILE_COMPRESSED',
        rulePayload: JSON.stringify({}),
        marks: 10,
        orderIndex: 1,
        hintText: 'Select a file in File Manager and click Compress (.zip).',
      },
      {
        id: 'off-f2-c2',
        label: 'Encrypt a sensitive file (.enc)',
        ruleType: 'FILE_ENCRYPTED',
        rulePayload: JSON.stringify({}),
        marks: 10,
        orderIndex: 2,
        hintText: 'Select a document and click Encrypt.',
      },
      {
        id: 'off-f2-c3',
        label: 'Send an email with an attachment via EduMail',
        ruleType: 'EMAIL_SENT',
        rulePayload: JSON.stringify({ requireAttachment: true }),
        marks: 10,
        orderIndex: 3,
        hintText: 'Open EduMail, attach a file from your Virtual Drive, and click Send Email.',
      },
    ],
  },
  {
    id: 'offline-ex-form3',
    moduleId: 'offline-mod-8',
    formLevel: 3,
    syllabusCode: '3.1 & 3.2',
    title: 'Form 3 (3.1 & 3.2): Publish Template Website & Cloud Share',
    description: 'Practice Form 3 template website creation and CloudDrive collaboration offline.',
    instructions:
      'Open WebBuilder Studio, customize a template and save it as Published (.vweb), then open CloudDrive Sync and share a file.',
    level: 2,
    totalMarks: 20,
    deadline: null,
    module: { number: 8, title: 'Website Design Using Templates', slug: 'website-design-templates' },
    criteria: [
      {
        id: 'off-f3-c1',
        label: 'Save and publish a website in WebBuilder Studio',
        ruleType: 'WEBSITE_CREATED',
        rulePayload: JSON.stringify({ requirePublished: true }),
        marks: 10,
        orderIndex: 1,
        hintText: 'Open WebBuilder, customize the template, and click Save Site while Published is checked.',
      },
      {
        id: 'off-f3-c2',
        label: 'Upload and share a file in CloudDrive Sync',
        ruleType: 'CLOUD_SHARED',
        rulePayload: JSON.stringify({}),
        marks: 10,
        orderIndex: 2,
        hintText: 'Open CloudDrive, choose a local file, set collaborator permissions, and click Upload & Share.',
      },
    ],
  },
  {
    id: 'offline-ex-form4',
    moduleId: 'offline-mod-12',
    formLevel: 4,
    syllabusCode: '4.1–4.4',
    title: 'Form 4 Capstone: Poster, Slideshow & Encrypted Report',
    description: 'Comprehensive offline Form 4 practical assessment combining desktop apps and security.',
    instructions:
      'Design a school poster in Publisher Studio, create at least 2 slides in SlideDeck, and encrypt a report file in File Manager.',
    level: 3,
    totalMarks: 30,
    deadline: null,
    module: { number: 12, title: 'Cybersecurity, Malware & Digital Citizenship', slug: 'cybersecurity-and-digital-safety' },
    criteria: [
      {
        id: 'off-f4-c1',
        label: 'Save a publication in Publisher Studio',
        ruleType: 'PUBLICATION_CREATED',
        rulePayload: JSON.stringify({}),
        marks: 10,
        orderIndex: 1,
        hintText: '',
      },
      {
        id: 'off-f4-c2',
        label: 'Create at least 2 slides in SlideDeck',
        ruleType: 'DECK_MIN_SLIDES',
        rulePayload: JSON.stringify({ minSlides: 2 }),
        marks: 10,
        orderIndex: 2,
        hintText: '',
      },
      {
        id: 'off-f4-c3',
        label: 'Encrypt a project file in File Manager',
        ruleType: 'FILE_ENCRYPTED',
        rulePayload: JSON.stringify({}),
        marks: 10,
        orderIndex: 3,
        hintText: '',
      },
    ],
  },
];

export const Module11AssessmentCenter: React.FC = () => {
  const { user, isOfflineGuest } = useAuth();
  const { formLevel, setFormLevel } = useFormLevel();
  const cacheKey = `exercises:${user?.id || 'guest'}`;

  const [exercises, setExercises] = useState<PracticalExercise[]>([]);
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<0 | 1 | 2 | 3>(0);
  const [actionsLog, setActionsLog] = useState<SimActionLog[]>([]);
  const [liveFolders, setLiveFolders] = useState<SimFolder[]>([]);
  const [liveFiles, setLiveFiles] = useState<SimFile[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResponse['evaluation'] | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offlineNotice, setOfflineNotice] = useState('');
  const [error, setError] = useState('');

  const handleDesktopStateChange = useCallback((folders: SimFolder[], files: SimFile[]) => {
    setLiveFolders(folders);
    setLiveFiles(files);
  }, []);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      if (isOfflineGuest) {
        const cached =
          (await getCachedJson<PracticalExercise[]>(cacheKey)) || OFFLINE_FALLBACK_EXERCISES;
        setExercises(cached);
        setSelectedExId((prev) => prev || cached[0]?.id || '');
        setOfflineNotice('Offline practice mode: evaluations run locally in your browser.');
        setError('');
        return;
      }

      const res = await apiRequest<{ exercises: PracticalExercise[] }>('/api/assessments/exercises');
      setExercises(res.exercises);
      setSelectedExId((prev) => prev || res.exercises[0]?.id || '');
      await setCachedJson(cacheKey, res.exercises);
      setOfflineNotice('');
      setError('');
    } catch (err) {
      if (isNetworkError(err)) {
        const cached =
          (await getCachedJson<PracticalExercise[]>(cacheKey)) || OFFLINE_FALLBACK_EXERCISES;
        setExercises(cached);
        setSelectedExId((prev) => prev || cached[0]?.id || '');
        setOfflineNotice('Offline mode: showing cached practical tasks. Submissions will sync when online.');
        setError('');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load practical exercises.');
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, isOfflineGuest]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const filteredExercises = exercises.filter((e) => {
    const levelOk = levelFilter === 0 ? true : e.level === levelFilter;
    const formOk = formLevel === 'all' ? true : (e.formLevel || 1) === formLevel;
    return levelOk && formOk;
  });
  const activeExercise =
    filteredExercises.find((e) => e.id === selectedExId) || filteredExercises[0] || null;

  const evaluateLocally = (exercise: PracticalExercise): EvaluationResponse['evaluation'] => {
    const criteriaResults = exercise.criteria.map((c) => {
      const passed = checkCriterionLivePreview(c, liveFolders, liveFiles, actionsLog);
      return {
        criterionId: c.id,
        label: c.label,
        passed,
        awardedMarks: passed ? c.marks : 0,
        maxMarks: c.marks,
        feedback: passed
          ? 'Requirement verified locally.'
          : c.hintText || 'Requirement not yet satisfied in your Virtual Desktop.',
      };
    });
    const awardedMarks = criteriaResults.reduce((acc, r) => acc + r.awardedMarks, 0);
    const totalMarks = criteriaResults.reduce((acc, r) => acc + r.maxMarks, 0) || exercise.totalMarks;
    const percentage = totalMarks > 0 ? Math.round((awardedMarks / totalMarks) * 100) : 0;
    return {
      awardedMarks,
      totalMarks,
      percentage,
      passed: percentage >= 50,
      criteriaResults,
    };
  };

  const handleSubmitAttempt = async () => {
    if (!activeExercise) return;
    setSubmitting(true);
    setError('');
    const payload = {
      exerciseId: activeExercise.id,
      actionsLog,
      snapshot: {
        folders: liveFolders,
        files: liveFiles,
      },
    };

    try {
      if (isOfflineGuest || activeExercise.id.startsWith('offline-')) {
        setEvaluationResult(evaluateLocally(activeExercise));
        return;
      }

      const res = await apiRequest<EvaluationResponse>('/api/assessments/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setEvaluationResult(res.evaluation);
      await loadExercises();
    } catch (err) {
      if (isNetworkError(err)) {
        setEvaluationResult(evaluateLocally(activeExercise));
        await queueOfflineAction(
          '/api/assessments/submit',
          'POST',
          payload,
          `Practical assessment: ${activeExercise.title}`
        );
        setOfflineNotice('Evaluated locally while offline and queued for school database sync.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to grade practical submission.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Level Filter & Exercise Selector */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-teal-600" />
              Practical Assessment Centre
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Complete Zambian Form 1–4 practical tasks inside the Virtual Desktop below and submit for automated criteria evaluation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {(
                [
                  { val: 'all', label: 'All Forms' },
                  { val: 1, label: 'Form 1' },
                  { val: 2, label: 'Form 2' },
                  { val: 3, label: 'Form 3' },
                  { val: 4, label: 'Form 4' },
                ] as Array<{ val: FormLevelFilter; label: string }>
              ).map((f) => (
                <button
                  key={String(f.val)}
                  type="button"
                  onClick={() => {
                    setFormLevel(f.val);
                    setEvaluationResult(null);
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                    formLevel === f.val
                      ? 'bg-[#13315C] text-white dark:bg-teal-600'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {[
                { val: 0, label: 'All Levels' },
                { val: 1, label: 'Level 1: Guided' },
                { val: 2, label: 'Level 2: Independent' },
                { val: 3, label: 'Level 3: Assessment' },
              ].map((lvl) => (
                <button
                  key={lvl.val}
                  type="button"
                  onClick={() => {
                    setLevelFilter(lvl.val as 0 | 1 | 2 | 3);
                    setEvaluationResult(null);
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                    levelFilter === lvl.val
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredExercises.map((ex) => {
            const bestResult = ex.attempts?.[0]?.result;
            const active = activeExercise?.id === ex.id;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setSelectedExId(ex.id);
                  setEvaluationResult(null);
                }}
                className={`rounded-lg border p-3.5 text-left transition-colors ${
                  active
                    ? 'border-[#13315C] bg-slate-50 dark:border-teal-500 dark:bg-slate-800'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800'
                }`}
              >
                <p className="text-[11px] font-medium text-teal-700 dark:text-teal-400">
                  Form {ex.formLevel || 1} · Topic {ex.syllabusCode || '1.3'} · L{ex.level} ({ex.totalMarks}m)
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                  {ex.title}
                </p>
                <p className="mt-2 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  {bestResult
                    ? `Last: ${bestResult.awardedMarks}/${bestResult.totalMarks} (${bestResult.percentage}%)`
                    : 'Not attempted yet'}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {offlineNotice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          {offlineNotice}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </div>
      )}

      {activeExercise && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 4 cols: Instructions + Level-specific Hints/Checklist + Results */}
          <div className="xl:col-span-4 space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div>
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {activeExercise.level === 1
                    ? 'Level 1 — Guided Learning (Live Checklist & Hints)'
                    : activeExercise.level === 2
                    ? 'Level 2 — Independent Practice (Feedback After Submission)'
                    : 'Level 3 — Practical Assessment (Unassisted Evaluation)'}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                  {activeExercise.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {activeExercise.instructions}
                </p>
              </div>

              {/* Level 1 shows live progress checklist and hints */}
              {activeExercise.level === 1 && (
                <div className="border-t border-slate-200 pt-4 dark:border-slate-800 space-y-2.5">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Guided Step-by-Step Checklist
                  </p>
                  {activeExercise.criteria.map((c) => {
                    const done = checkCriterionLivePreview(c, liveFolders, liveFiles, actionsLog);
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg border border-slate-200 p-2.5 text-xs dark:border-slate-800"
                      >
                        <div className="flex items-start gap-2">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                          ) : (
                            <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{c.label}</p>
                            {!done && c.hintText && (
                              <p className="mt-1 text-slate-500">Hint: {c.hintText}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeExercise.level > 1 && (
                <div className="border-t border-slate-200 pt-3 dark:border-slate-800 text-xs text-slate-500">
                  {activeExercise.criteria.length} automated criteria ({activeExercise.totalMarks} total marks).
                  {activeExercise.level === 3
                    ? ' Step-by-step hints are disabled in Practical Assessment mode.'
                    : ' Complete the task on the Virtual Desktop and click Submit.'}
                </div>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitAttempt}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#13315C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1B437D] disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Evaluating Work...' : 'Submit Practical Attempt'}
              </button>
            </section>

            {/* Evaluation Feedback Card */}
            {evaluationResult && (
              <section
                className={`rounded-xl border p-5 space-y-3 ${
                  evaluationResult.passed
                    ? 'border-teal-300 bg-teal-50/70 dark:border-teal-800 dark:bg-teal-950/30'
                    : 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base font-bold">Assessment Result</h4>
                  <span className="font-mono text-base font-bold tabular-nums">
                    {evaluationResult.awardedMarks}/{evaluationResult.totalMarks} (
                    {evaluationResult.percentage}%)
                  </span>
                </div>
                <div className="space-y-2">
                  {evaluationResult.criteriaResults.map((cr) => (
                    <div key={cr.criterionId} className="flex items-start gap-2 text-xs">
                      {cr.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {cr.label} ({cr.awardedMarks}/{cr.maxMarks})
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">{cr.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right 8 cols: Live Integrated Virtual Desktop */}
          <div className="xl:col-span-8">
            <VirtualDesktop
              compact
              onActionsChange={setActionsLog}
              onDesktopStateChange={handleDesktopStateChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};
