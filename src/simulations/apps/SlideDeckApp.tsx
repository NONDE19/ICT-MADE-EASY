import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  FolderOpen,
  Play,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { SimFile, SimFolder } from '../../types/index.ts';

interface SlideItem {
  id: string;
  title: string;
  body: string;
  layout: 'title' | 'content' | 'two-column';
  theme: 'navy' | 'teal' | 'light' | 'sand';
  transition?: 'none' | 'fade' | 'slide';
}

interface SlideDeckAppProps {
  initialFileId?: string | null;
  folders: SimFolder[];
  files: SimFile[];
  onSaveDeck: (params: {
    fileId?: string | null;
    name: string;
    folderId: string | null;
    contentJson: string;
  }) => Promise<SimFile>;
}

const DEFAULT_SLIDES: SlideItem[] = [
  {
    id: 's1',
    title: 'Computer Hardware Overview',
    body: 'Prepared in ICT Made Easy SlideDeck Simulator\nGrade 8 Computer Studies',
    layout: 'title',
    theme: 'navy',
  },
  {
    id: 's2',
    title: 'Input & Processing Devices',
    body: '• Keyboard & Mouse send user commands\n• CPU processes instructions inside the Motherboard\n• RAM stores active working data',
    layout: 'content',
    theme: 'light',
  },
];

const THEME_STYLES: Record<SlideItem['theme'], string> = {
  navy: 'bg-[#0F2744] text-white',
  teal: 'bg-teal-800 text-white',
  light: 'bg-white text-slate-900 border border-slate-300',
  sand: 'bg-amber-50 text-slate-900 border border-amber-200',
};

export const SlideDeckApp: React.FC<SlideDeckAppProps> = ({
  initialFileId,
  folders,
  files,
  onSaveDeck,
}) => {
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFileId ?? null);
  const [deckName, setDeckName] = useState('Computer Hardware Slides');
  const [targetFolderId, setTargetFolderId] = useState<string | null>(
    folders.find((f) => !f.isDeleted && f.name === 'Documents')?.id ?? null
  );
  const [slides, setSlides] = useState<SlideItem[]>(DEFAULT_SLIDES);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [presentMode, setPresentMode] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const activeFolders = folders.filter((f) => !f.isDeleted);
  const deckFiles = files.filter((f) => !f.isDeleted && f.fileType === 'presentation');

  useEffect(() => {
    if (!initialFileId) return;
    const found = files.find((f) => f.id === initialFileId);
    if (found) {
      setActiveFileId(found.id);
      setDeckName(found.name);
      setTargetFolderId(found.folderId);
      try {
        const parsed = JSON.parse(found.contentJson);
        if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          setSlides(parsed.slides);
        }
      } catch {
        setSlides(DEFAULT_SLIDES);
      }
    }
  }, [initialFileId, files]);

  const activeSlide = slides[activeSlideIdx] || slides[0];

  const updateActiveSlide = (patch: Partial<SlideItem>) => {
    setSlides((prev) => prev.map((s, idx) => (idx === activeSlideIdx ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    const newSlide: SlideItem = {
      id: `s-${Date.now()}`,
      title: `Slide ${slides.length + 1} Title`,
      body: 'Add key points here...',
      layout: 'content',
      theme: 'light',
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIdx(slides.length);
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
    setActiveSlideIdx(target);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActiveSlideIdx(Math.max(0, idx - 1));
  };

  const handleSave = async () => {
    const saved = await onSaveDeck({
      fileId: activeFileId,
      name: deckName.trim() || 'Untitled Presentation',
      folderId: targetFolderId,
      contentJson: JSON.stringify({ slides }),
    });
    setActiveFileId(saved.id);
    setStatusMsg(`Saved "${saved.name}.vdeck"`);
  };

  if (presentMode && activeSlide) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 sm:p-12">
        <div className="flex justify-between items-center text-white text-xs">
          <span>
            {deckName} — Slide {activeSlideIdx + 1} of {slides.length}
          </span>
          <button
            type="button"
            onClick={() => setPresentMode(false)}
            className="inline-flex items-center gap-1 rounded bg-white/15 px-3 py-1.5 hover:bg-white/25"
          >
            <X className="h-4 w-4" /> Exit Slideshow
          </button>
        </div>

        <div
          key={`${activeSlide.id}-${activeSlideIdx}`}
          className={`mx-auto w-full max-w-4xl aspect-video rounded-2xl p-10 sm:p-14 flex flex-col justify-center shadow-2xl transition-all duration-500 ${
            THEME_STYLES[activeSlide.theme]
          } ${activeSlide.layout === 'title' ? 'items-center text-center' : ''} ${
            activeSlide.transition === 'fade'
              ? 'animate-pulse'
              : activeSlide.transition === 'slide'
              ? 'translate-x-0'
              : ''
          }`}
        >
          <h2 className="font-display text-3xl sm:text-5xl font-bold">{activeSlide.title}</h2>
          <p className="mt-6 text-lg sm:text-2xl whitespace-pre-line leading-relaxed opacity-90">
            {activeSlide.body}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            disabled={activeSlideIdx === 0}
            onClick={() => setActiveSlideIdx((i) => Math.max(0, i - 1))}
            className="rounded-lg bg-white/15 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Previous Slide
          </button>
          <button
            type="button"
            disabled={activeSlideIdx >= slides.length - 1}
            onClick={() => setActiveSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Next Slide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-900 text-xs">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1 font-medium w-44"
          />
          <select
            value={targetFolderId || ''}
            onChange={(e) => setTargetFolderId(e.target.value || null)}
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            <option value="">Virtual Drive (Root)</option>
            {activeFolders.map((f) => (
              <option key={f.id} value={f.id}>
                Folder: {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={addSlide}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-medium hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" /> New Slide
          </button>
          <button
            type="button"
            onClick={() => setPresentMode(true)}
            className="inline-flex items-center gap-1 rounded bg-teal-600 px-2.5 py-1 font-semibold text-white hover:bg-teal-500"
          >
            <Play className="h-3.5 w-3.5" /> Present
          </button>
          <button
            type="button"
            onClick={() => setShowOpenDialog((v) => !v)}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50"
          >
            <FolderOpen className="h-3.5 w-3.5" /> Open
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1 rounded bg-[#0F2744] px-3 py-1 font-semibold text-white hover:bg-[#193B66]"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      {showOpenDialog && (
        <div className="border-b border-slate-300 bg-blue-50 px-3 py-2 flex flex-wrap items-center gap-2">
          <span className="font-semibold">Open Presentation:</span>
          {deckFiles.length === 0 ? (
            <span>No saved presentations yet.</span>
          ) : (
            deckFiles.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setActiveFileId(f.id);
                  setDeckName(f.name);
                  setTargetFolderId(f.folderId);
                  try {
                    setSlides(JSON.parse(f.contentJson).slides || DEFAULT_SLIDES);
                    setActiveSlideIdx(0);
                  } catch {
                    setSlides(DEFAULT_SLIDES);
                  }
                  setShowOpenDialog(false);
                }}
                className="rounded border border-blue-300 bg-white px-2 py-1"
              >
                {f.name}
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Slide List Strip */}
        <div className="w-44 border-r border-slate-300 bg-slate-50 overflow-y-auto p-2 space-y-2 shrink-0">
          {slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setActiveSlideIdx(idx)}
              className={`rounded-lg border p-2 cursor-pointer ${
                idx === activeSlideIdx
                  ? 'border-blue-600 bg-white ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>Slide {idx + 1}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(idx, -1);
                    }}
                    title="Move Up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(idx, 1);
                    }}
                    title="Move Down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(idx);
                      }}
                      title="Delete Slide"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
              <p className="font-semibold truncate">{s.title || 'Untitled'}</p>
            </div>
          ))}
        </div>

        {/* Active Slide Editor + Live Preview */}
        {activeSlide && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <label className="flex items-center gap-1.5">
                <span className="font-medium">Layout:</span>
                <select
                  value={activeSlide.layout}
                  onChange={(e) => updateActiveSlide({ layout: e.target.value as SlideItem['layout'] })}
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                >
                  <option value="title">Title Slide</option>
                  <option value="content">Title &amp; Content</option>
                  <option value="two-column">Two Column</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5">
                <span className="font-medium">Background:</span>
                <select
                  value={activeSlide.theme}
                  onChange={(e) => updateActiveSlide({ theme: e.target.value as SlideItem['theme'] })}
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                >
                  <option value="navy">Deep Navy</option>
                  <option value="teal">Teal Academic</option>
                  <option value="light">Crisp White</option>
                  <option value="sand">Warm Sand</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5">
                <span className="font-medium">Transition:</span>
                <select
                  value={activeSlide.transition || 'none'}
                  onChange={(e) =>
                    updateActiveSlide({
                      transition: e.target.value as SlideItem['transition'],
                    })
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                >
                  <option value="none">None</option>
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                </select>
              </label>
            </div>

            <div
              className={`rounded-xl p-6 min-h-[220px] flex flex-col justify-center shadow-sm ${
                THEME_STYLES[activeSlide.theme]
              } ${activeSlide.layout === 'title' ? 'items-center text-center' : ''}`}
            >
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => updateActiveSlide({ title: e.target.value })}
                className={`w-full bg-transparent font-display text-xl font-bold focus:outline-none border-b border-current/20 pb-2 ${
                  activeSlide.layout === 'title' ? 'text-center' : ''
                }`}
                placeholder="Slide Title"
              />
              <textarea
                rows={4}
                value={activeSlide.body}
                onChange={(e) => updateActiveSlide({ body: e.target.value })}
                className={`mt-3 w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-none ${
                  activeSlide.layout === 'title' ? 'text-center' : ''
                }`}
                placeholder="Add slide text or bullet points..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-300 bg-white px-3 py-1 text-[11px] text-slate-600 flex justify-between">
        <span>SlideDeck Simulator · {slides.length} slides</span>
        <span className="font-medium text-teal-700">{statusMsg}</span>
      </div>
    </div>
  );
};
