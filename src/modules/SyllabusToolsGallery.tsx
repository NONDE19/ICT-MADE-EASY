import React, { useState } from 'react';
import { ArrowRight, BookOpen, Image as ImageIcon, Layers } from 'lucide-react';
import { SYLLABUS_TOOL_CATEGORIES } from '../data/syllabusTools.ts';
import { useFormLevel } from '../contexts/FormLevelContext.tsx';
import { NavRoute } from '../layouts/AppShell.tsx';
import { FormLevelFilter } from '../types/index.ts';
import { RealEquipmentPhotos } from '../components/RealEquipmentPhotos.tsx';

interface SyllabusToolsGalleryProps {
  onNavigate: (route: NavRoute) => void;
}

const FORM_OPTIONS: Array<{ val: FormLevelFilter; label: string }> = [
  { val: 'all', label: 'All Forms (1–4)' },
  { val: 1, label: 'Form 1' },
  { val: 2, label: 'Form 2' },
  { val: 3, label: 'Form 3' },
  { val: 4, label: 'Form 4' },
];

export const SyllabusToolsGallery: React.FC<SyllabusToolsGalleryProps> = ({ onNavigate }) => {
  const { formLevel, setFormLevel } = useFormLevel();
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const visibleCategories = SYLLABUS_TOOL_CATEGORIES.filter((cat) =>
    formLevel === 'all' ? true : cat.formLevels.includes(formLevel)
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-teal-600" />
            Zambian Form 1–4 ICT Tools Visual Guide
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Visual demonstrations of every hardware, file security, productivity, networking, and cybersecurity tool in the 2024 Ordinary Level ICT Syllabus—available offline once cached.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 shrink-0 self-start">
          {FORM_OPTIONS.map((opt) => (
            <button
              key={String(opt.val)}
              type="button"
              onClick={() => setFormLevel(opt.val)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                formLevel === opt.val
                  ? 'bg-[#13315C] text-white dark:bg-teal-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        {visibleCategories.map((cat) => {
          const matchingTools =
            formLevel === 'all'
              ? cat.tools
              : cat.tools.filter((t) => t.formLevel === formLevel);
          const toolsToShow = matchingTools.length > 0 ? matchingTools : cat.tools;

          return (
            <section
              key={cat.id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Visual Diagram Container */}
                <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex items-center justify-center p-4">
                  {brokenImages[cat.id] ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <Layers className="h-10 w-10 mb-2 text-teal-600" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {cat.title}
                      </p>
                      <p className="text-xs mt-1">{cat.syllabusScope}</p>
                    </div>
                  ) : (
                    <img
                      src={cat.imageUrl}
                      alt={cat.imageAlt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [cat.id]: true }))
                      }
                      className="w-full max-h-72 object-contain rounded-lg"
                    />
                  )}
                </div>

                {/* Syllabus Tools & Practical Launch */}
                <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                        {cat.syllabusScope}
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate(cat.practiceRoute)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#13315C] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1B437D] dark:bg-teal-600 dark:hover:bg-teal-500"
                      >
                        {cat.practiceLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <h3 className="mt-1.5 font-display text-xl font-bold text-slate-900 dark:text-white">
                      {cat.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {cat.summary}
                    </p>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {toolsToShow.map((tool) => (
                        <div
                          key={tool.name}
                          className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60"
                        >
                          <p className="text-[11px] font-medium text-slate-500">
                            Form {tool.formLevel} · {tool.syllabusTopic}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                            {tool.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {tool.whatItDoes}
                          </p>
                          <p className="mt-1.5 text-[11px] font-mono text-teal-700 dark:text-teal-400">
                            Examples: {tool.realWorldExamples}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <RealEquipmentPhotos />

      <section className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <BookOpen className="h-4 w-4 text-teal-600 shrink-0" />
          <span>
            Ready to test what you saw in these diagrams? Complete guided and graded tasks in the Practical Assessment Centre.
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('assessments')}
          className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Open Practical Assessment Centre
        </button>
      </section>
    </div>
  );
};
