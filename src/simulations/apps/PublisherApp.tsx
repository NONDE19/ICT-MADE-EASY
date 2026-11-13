import React, { useEffect, useState } from 'react';
import { FolderOpen, Layout, Save } from 'lucide-react';
import { SimFile, SimFolder } from '../../types/index.ts';

interface PublisherAppProps {
  initialFileId?: string | null;
  folders: SimFolder[];
  files: SimFile[];
  onSavePublication: (params: {
    fileId?: string | null;
    name: string;
    folderId: string | null;
    contentJson: string;
  }) => Promise<SimFile>;
}

type PubTemplate = 'poster' | 'flyer' | 'business-card' | 'calendar';

export const PublisherApp: React.FC<PublisherAppProps> = ({
  initialFileId,
  folders,
  files,
  onSavePublication,
}) => {
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFileId ?? null);
  const [pubName, setPubName] = useState('ICT Week School Poster');
  const [targetFolderId, setTargetFolderId] = useState<string | null>(
    folders.find((f) => !f.isDeleted && f.name === 'Documents')?.id ?? null
  );
  const [pubType, setPubType] = useState<PubTemplate>('poster');
  const [headline, setHeadline] = useState('Zambia Secondary ICT Fair 2026');
  const [subtext, setSubtext] = useState(
    'Demonstrating Computer Hardware, File Encryption & Cloud Skills.\nVenue: School Hall · Time: 09:00 hrs'
  );
  const [caption, setCaption] = useState('All Form 1–4 learners welcome!');
  const [accentColor, setAccentColor] = useState('#13315C');
  const [shapeStyle, setShapeStyle] = useState<'banner' | 'framed' | 'split'>('banner');
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const activeFolders = folders.filter((f) => !f.isDeleted);
  const pubFiles = files.filter((f) => !f.isDeleted && f.fileType === 'publication');

  useEffect(() => {
    if (!initialFileId) return;
    const found = files.find((f) => f.id === initialFileId);
    if (found) {
      setActiveFileId(found.id);
      setPubName(found.name);
      setTargetFolderId(found.folderId);
      try {
        const parsed = JSON.parse(found.contentJson);
        if (parsed.pubType) setPubType(parsed.pubType);
        if (parsed.headline) setHeadline(parsed.headline);
        if (parsed.subtext) setSubtext(parsed.subtext);
        if (parsed.caption) setCaption(parsed.caption);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
      } catch {
        // ignore parse fallback
      }
    }
  }, [initialFileId, files]);

  const handleSave = async () => {
    const saved = await onSavePublication({
      fileId: activeFileId,
      name: pubName.trim() || 'School Publication',
      folderId: targetFolderId,
      contentJson: JSON.stringify({
        pubType,
        headline,
        subtext,
        caption,
        accentColor,
        shapeStyle,
      }),
    });
    setActiveFileId(saved.id);
    setStatusMsg(`Saved "${saved.name}.vpub"`);
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-900 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Layout className="h-4 w-4 text-teal-600" />
          <input
            type="text"
            value={pubName}
            onChange={(e) => setPubName(e.target.value)}
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOpenDialog((v) => !v)}
            className="inline-flex items-center gap-1 rounded border border-slate-300 px-2.5 py-1 hover:bg-slate-50"
          >
            <FolderOpen className="h-3.5 w-3.5" /> Open
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1 rounded bg-[#13315C] px-3 py-1 font-semibold text-white hover:bg-[#1B437D]"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      {showOpenDialog && (
        <div className="border-b border-slate-300 bg-blue-50 px-3 py-2 flex flex-wrap items-center gap-2">
          <span className="font-semibold">Saved Publications:</span>
          {pubFiles.length === 0 ? (
            <span>No saved publications yet.</span>
          ) : (
            pubFiles.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setActiveFileId(f.id);
                  setPubName(f.name);
                  setTargetFolderId(f.folderId);
                  try {
                    const p = JSON.parse(f.contentJson);
                    setPubType(p.pubType || 'poster');
                    setHeadline(p.headline || '');
                    setSubtext(p.subtext || '');
                    setCaption(p.caption || '');
                  } catch {
                    // ignore
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

      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
        {/* Controls */}
        <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-300 bg-white p-4 space-y-3">
          <div>
            <label className="block font-semibold mb-1">Publication Type (Form 2.2.4)</label>
            <select
              value={pubType}
              onChange={(e) => setPubType(e.target.value as PubTemplate)}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5 bg-white"
            >
              <option value="poster">School Event Poster</option>
              <option value="flyer">Community Information Flyer</option>
              <option value="business-card">Business Card</option>
              <option value="calendar">Term Calendar Card</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Headline / Title Box</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Body Text Box</label>
            <textarea
              rows={3}
              value={subtext}
              onChange={(e) => setSubtext(e.target.value)}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Caption / Callout Shape</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">Theme Colour</label>
              <select
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1 bg-white"
              >
                <option value="#13315C">Zambia Navy</option>
                <option value="#0D9488">Teal Green</option>
                <option value="#991B1B">Crimson Banner</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Shape Frame</label>
              <select
                value={shapeStyle}
                onChange={(e) => setShapeStyle(e.target.value as typeof shapeStyle)}
                className="w-full rounded border border-slate-300 px-2 py-1 bg-white"
              >
                <option value="banner">Top Header Banner</option>
                <option value="framed">Double Border Frame</option>
                <option value="split">Two-Tone Split</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Publication Canvas */}
        <div className="md:col-span-7 p-6 flex items-center justify-center bg-slate-200">
          <div
            style={{ borderColor: accentColor }}
            className={`w-full bg-white shadow-lg overflow-hidden ${
              pubType === 'business-card' ? 'max-w-sm rounded-xl' : 'max-w-md rounded-lg'
            } ${shapeStyle === 'framed' ? 'border-4' : 'border'}`}
          >
            <div style={{ backgroundColor: accentColor }} className="p-5 text-white">
              <p className="text-[10px] uppercase tracking-wider opacity-80">
                {pubType.replace('-', ' ')}
              </p>
              <h3 className="mt-1 font-display text-xl font-bold leading-snug">{headline}</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm whitespace-pre-line leading-relaxed text-slate-700">{subtext}</p>
              {pubType === 'calendar' && (
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] border border-slate-200 p-2 rounded">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={i} className="font-bold text-slate-500">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: 14 }, (_, i) => (
                    <span key={i} className="py-0.5 rounded bg-slate-100">
                      {i + 1}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{ borderColor: accentColor, color: accentColor }}
                className="rounded-lg border-2 border-dashed px-3 py-2 text-center font-semibold"
              >
                {caption}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-300 bg-white px-3 py-1 text-[11px] text-slate-600 flex justify-between">
        <span>Publisher Studio (Form 2.2.4) · Save creates a .vpub publication</span>
        <span className="font-medium text-teal-700">{statusMsg}</span>
      </div>
    </div>
  );
};
