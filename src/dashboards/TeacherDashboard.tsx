import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardPlus,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import { LearningModuleSummary } from '../types/index.ts';

interface TeacherDashboardData {
  stats: {
    assignedClassesCount: number;
    totalPupils: number;
    activeAssignments: number;
    completedAssignments: number;
    avgClassPerformance: number;
    pupilsRequiringAttention: number;
  };
  classes: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    schoolName: string;
    pupilCount: number;
    exerciseCount: number;
  }>;
  pupils: Array<{
    id: string;
    fullName: string;
    email: string;
    className: string;
    completedLessons: number;
    assessmentCount: number;
    averageScore: number;
    needsSupport: boolean;
    lastLoginAt: string | null;
  }>;
  exercises: Array<{
    id: string;
    title: string;
    level: number;
    totalMarks: number;
    deadline: string | null;
    module: { number: number; title: string };
    targetClass: { id: string; name: string } | null;
    _count: { attempts: number };
  }>;
  recentAssessmentActivities: Array<{
    id: string;
    awardedMarks: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    gradedAt: string;
    pupil: { id: string; fullName: string };
    attempt: {
      attemptType: string;
      exercise: { title: string; level: number } | null;
    };
  }>;
}

interface PupilDetailModalData {
  className: string;
  pupil: {
    id: string;
    fullName: string;
    email: string;
    learningProgress: Array<{
      id: string;
      status: string;
      percentComplete: number;
      module: { number: number; title: string };
      lesson: { title: string } | null;
    }>;
    assessmentResults: Array<{
      id: string;
      awardedMarks: number;
      totalMarks: number;
      percentage: number;
      passed: boolean;
      gradedAt: string;
      attempt: {
        attemptType: string;
        exercise: { title: string; level: number } | null;
      };
    }>;
  };
}

export const TeacherDashboard: React.FC = () => {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [modules, setModules] = useState<LearningModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupport, setFilterSupport] = useState<'all' | 'support'>('all');
  const [selectedPupil, setSelectedPupil] = useState<PupilDetailModalData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Exercise Form state
  const [exTitle, setExTitle] = useState('');
  const [exDescription, setExDescription] = useState('');
  const [exInstructions, setExInstructions] = useState('');
  const [exModuleId, setExModuleId] = useState('');
  const [exClassId, setExClassId] = useState('');
  const [exLevel, setExLevel] = useState<1 | 2 | 3>(2);
  const [exDeadline, setExDeadline] = useState('');
  const [exCriteria, setExCriteria] = useState([
    {
      label: 'Create required folder',
      ruleType: 'FOLDER_EXISTS',
      targetValue: 'ICT Homework',
      marks: 10,
      hintText: 'Open File Manager and create the folder.',
    },
  ]);
  const [savingExercise, setSavingExercise] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, mods] = await Promise.all([
        apiRequest<TeacherDashboardData>('/api/teacher/dashboard'),
        apiRequest<{ modules: LearningModuleSummary[] }>('/api/learning/modules'),
      ]);
      setData(dash);
      setModules(mods.modules);
      if (mods.modules.length > 0 && !exModuleId) {
        setExModuleId(mods.modules[4]?.id || mods.modules[0].id);
      }
      if (dash.classes.length > 0 && !exClassId) {
        setExClassId(dash.classes[0].id);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load teacher dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPupilDetail = async (pupilId: string) => {
    try {
      const detail = await apiRequest<PupilDetailModalData>(`/api/teacher/pupils/${pupilId}`);
      setSelectedPupil(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load pupil record.');
    }
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    if (!exTitle.trim() || !exDescription.trim() || !exInstructions.trim() || !exModuleId) {
      setFormMsg('Please fill out all required exercise fields.');
      return;
    }
    setSavingExercise(true);
    try {
      const formattedCriteria = exCriteria.map((c) => {
        let rulePayload: Record<string, unknown> = {};
        if (c.ruleType === 'FOLDER_EXISTS') rulePayload = { name: c.targetValue };
        else if (c.ruleType === 'FILE_EXISTS') rulePayload = { fileType: c.targetValue || 'document' };
        else if (c.ruleType === 'FILE_IN_FOLDER')
          rulePayload = { folderName: c.targetValue || 'Assignments', fileType: 'document' };
        else if (c.ruleType === 'SHEET_HAS_FORMULA')
          rulePayload = { formulas: ['SUM', 'AVERAGE'], minDataRows: 3 };
        else if (c.ruleType === 'DECK_MIN_SLIDES') rulePayload = { minSlides: 3 };
        else rulePayload = { actionType: c.targetValue || 'CREATE_FOLDER' };

        return {
          label: c.label,
          ruleType: c.ruleType,
          rulePayload,
          marks: Number(c.marks) || 5,
          hintText: c.hintText,
        };
      });

      await apiRequest('/api/teacher/exercises', {
        method: 'POST',
        body: JSON.stringify({
          moduleId: exModuleId,
          title: exTitle.trim(),
          description: exDescription.trim(),
          instructions: exInstructions.trim(),
          level: exLevel,
          deadline: exDeadline ? new Date(exDeadline).toISOString() : null,
          classId: exClassId || null,
          criteria: formattedCriteria,
        }),
      });
      setShowCreateModal(false);
      setExTitle('');
      setExDescription('');
      setExInstructions('');
      await loadData();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : 'Failed to create exercise.');
    } finally {
      setSavingExercise(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700 dark:border-red-900 dark:bg-slate-900">
        {error || 'Teacher dashboard unavailable.'}
      </div>
    );
  }

  const filteredPupils = data.pupils.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.className.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterSupport === 'all' || p.needsSupport;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Teacher Class &amp; Assessment Overview
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Monitor assigned classes, assign practical exercises with deadlines, and identify pupils needing support.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F2744] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#193B66] dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap self-start sm:self-center"
        >
          <ClipboardPlus className="h-4 w-4" />
          Assign Practical Exercise
        </button>
      </section>

      {/* Metrics Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Assigned Classes', value: data.stats.assignedClassesCount },
          { label: 'Registered Pupils', value: data.stats.totalPupils },
          { label: 'Active Exercises', value: data.stats.activeAssignments },
          { label: 'Passed Submissions', value: data.stats.completedAssignments },
          { label: 'Avg Class Score', value: `${data.stats.avgClassPerformance}%` },
          { label: 'Needs Support', value: data.stats.pupilsRequiringAttention },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      {/* Pupil Roster & Performance Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Pupil Performance &amp; Support Monitoring
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pupil or class..."
                className="rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setFilterSupport('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  filterSupport === 'all'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                All Pupils
              </button>
              <button
                type="button"
                onClick={() => setFilterSupport('support')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  filterSupport === 'support'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Needs Support
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2.5 pr-4 font-medium">Pupil</th>
                <th className="py-2.5 pr-4 font-medium">Class</th>
                <th className="py-2.5 pr-4 font-medium text-right">Lessons Done</th>
                <th className="py-2.5 pr-4 font-medium text-right">Submissions</th>
                <th className="py-2.5 pr-4 font-medium text-right">Average Score</th>
                <th className="py-2.5 pr-4 font-medium">Status</th>
                <th className="py-2.5 font-medium text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPupils.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No pupils match the current filter.
                  </td>
                </tr>
              ) : (
                filteredPupils.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900 dark:text-white">{p.fullName}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{p.className}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums">{p.completedLessons}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums">{p.assessmentCount}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums font-semibold">
                      {p.averageScore}%
                    </td>
                    <td className="py-3 pr-4">
                      {p.needsSupport ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Needs Support
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          On Track
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openPupilDetail(p.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-teal-400"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assigned Exercises & Recent Assessment Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Practical Exercises &amp; Deadlines
          </h3>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {data.exercises.map((ex) => (
              <div key={ex.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Level {ex.level} · {ex.targetClass?.name || 'All Classes'} ·{' '}
                    {ex.deadline ? `Due ${new Date(ex.deadline).toLocaleDateString()}` : 'No deadline'}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                    {ex.title}
                  </p>
                </div>
                <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {ex._count.attempts} attempts · {ex.totalMarks} pts
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Recent Assessment Activity
          </h3>
          {data.recentAssessmentActivities.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No pupil assessments submitted yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentAssessmentActivities.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {act.pupil.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {act.attempt.exercise?.title || act.attempt.attemptType} ·{' '}
                      {new Date(act.gradedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                    {act.awardedMarks}/{act.totalMarks} ({act.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Individual Pupil Detail Modal */}
      {selectedPupil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500">{selectedPupil.className}</p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {selectedPupil.pupil.fullName}
                </h3>
                <p className="text-xs text-slate-500">{selectedPupil.pupil.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPupil(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Lesson Progress ({selectedPupil.pupil.learningProgress.length})
                </h4>
                {selectedPupil.pupil.learningProgress.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No lessons started yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {selectedPupil.pupil.learningProgress.map((lp) => (
                      <div key={lp.id} className="flex justify-between text-xs border-b border-slate-100 pb-1.5 dark:border-slate-800">
                        <span>
                          Module {lp.module.number}: {lp.lesson?.title || lp.module.title}
                        </span>
                        <span className="font-mono tabular-nums">{lp.status} ({lp.percentComplete}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Assessment Results ({selectedPupil.pupil.assessmentResults.length})
                </h4>
                {selectedPupil.pupil.assessmentResults.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No assessment submissions recorded yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {selectedPupil.pupil.assessmentResults.map((ar) => (
                      <div key={ar.id} className="flex justify-between text-xs border-b border-slate-100 pb-1.5 dark:border-slate-800">
                        <span>{ar.attempt.exercise?.title || ar.attempt.attemptType}</span>
                        <span className="font-mono tabular-nums font-semibold">
                          {ar.awardedMarks}/{ar.totalMarks} ({ar.percentage}%) ·{' '}
                          {ar.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Practical Exercise Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Assign New Practical Exercise
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formMsg && (
              <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/60 dark:text-red-300">
                {formMsg}
              </p>
            )}

            <form onSubmit={handleCreateExercise} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Module
                  </label>
                  <select
                    value={exModuleId}
                    onChange={(e) => setExModuleId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        Module {m.number}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Target Class
                  </label>
                  <select
                    value={exClassId}
                    onChange={(e) => setExClassId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    {data.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Exercise Title
                  </label>
                  <input
                    type="text"
                    value={exTitle}
                    onChange={(e) => setExTitle(e.target.value)}
                    placeholder="e.g., Grade 8 Folder Organization Task"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Assessment Level
                    </label>
                    <select
                      value={exLevel}
                      onChange={(e) => setExLevel(Number(e.target.value) as 1 | 2 | 3)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value={1}>Level 1 (Guided)</option>
                      <option value={2}>Level 2 (Independent)</option>
                      <option value={3}>Level 3 (Assessment)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={exDeadline}
                      onChange={(e) => setExDeadline(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Short Summary
                </label>
                <input
                  type="text"
                  value={exDescription}
                  onChange={(e) => setExDescription(e.target.value)}
                  placeholder="One-sentence objective for the pupil"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Pupil Instructions
                </label>
                <textarea
                  rows={3}
                  value={exInstructions}
                  onChange={(e) => setExInstructions(e.target.value)}
                  placeholder="Step-by-step instructions the pupil must complete in the Virtual Desktop..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Automated Grading Criteria
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setExCriteria((prev) => [
                        ...prev,
                        {
                          label: 'File saved inside target folder',
                          ruleType: 'FILE_IN_FOLDER',
                          targetValue: 'ICT Homework',
                          marks: 10,
                          hintText: '',
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-teal-400"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Criterion
                  </button>
                </div>

                <div className="space-y-2.5">
                  {exCriteria.map((c, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={c.label}
                        onChange={(e) =>
                          setExCriteria((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, label: e.target.value } : item))
                          )
                        }
                        placeholder="Criterion label"
                        className="col-span-4 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                      <select
                        value={c.ruleType}
                        onChange={(e) =>
                          setExCriteria((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, ruleType: e.target.value } : item))
                          )
                        }
                        className="col-span-3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="FOLDER_EXISTS">Folder Exists</option>
                        <option value="FILE_EXISTS">File Exists</option>
                        <option value="FILE_IN_FOLDER">File in Folder</option>
                        <option value="SHEET_HAS_FORMULA">Spreadsheet Formulas</option>
                        <option value="DECK_MIN_SLIDES">Presentation Slides</option>
                      </select>
                      <input
                        type="text"
                        value={c.targetValue}
                        onChange={(e) =>
                          setExCriteria((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, targetValue: e.target.value } : item
                            )
                          )
                        }
                        placeholder="Target folder/type"
                        className="col-span-3 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={c.marks}
                        onChange={(e) =>
                          setExCriteria((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, marks: Number(e.target.value) } : item
                            )
                          )
                        }
                        className="col-span-1 rounded-lg border border-slate-300 px-1.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExCriteria((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="col-span-1 p-1.5 text-slate-400 hover:text-red-600"
                        aria-label="Remove criterion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExercise}
                  className="rounded-lg bg-[#0F2744] px-4 py-2 text-sm font-semibold text-white hover:bg-[#193B66] dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  {savingExercise ? 'Saving...' : 'Create Exercise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
