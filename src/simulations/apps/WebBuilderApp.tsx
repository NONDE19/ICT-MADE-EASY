import React, { useEffect, useState } from 'react';
import { CheckCircle2, FolderOpen, Globe, Save } from 'lucide-react';
import { SimFile, SimFolder } from '../../types/index.ts';

interface WebBuilderAppProps {
  initialFileId?: string | null;
  folders: SimFolder[];
  files: SimFile[];
  onSaveWebsite: (params: {
    fileId?: string | null;
    name: string;
    folderId: string | null;
    contentJson: string;
  }) => Promise<SimFile>;
  onLogAction?: (type: string, target?: string, detail?: string) => void;
}

export const WebBuilderApp: React.FC<WebBuilderAppProps> = ({
  initialFileId,
  folders,
  files,
  onSaveWebsite,
  onLogAction,
}) => {
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFileId ?? null);
  const [siteName, setSiteName] = useState('Lusaka Secondary ICT Club Site');
  const [targetFolderId, setTargetFolderId] = useState<string | null>(
    folders.find((f) => !f.isDeleted && f.name === 'Documents')?.id ?? null
  );
  const [template, setTemplate] = useState<'school-portal' | 'ict-club' | 'community-library'>('school-portal');
  const [heroTitle, setHeroTitle] = useState('Welcome to Our School ICT Department');
  const [aboutText, setAboutText] = useState(
    'We empower Form 1 to Form 4 learners with hardware diagnostics, safe web design, and cloud collaboration.'
  );
  const [navLinks, setNavLinks] = useState('Home | Form 1–4 Notes | Practicals | Contact');
  const [published, setPublished] = useState(true);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const activeFolders = folders.filter((f) => !f.isDeleted);
  const webFiles = files.filter((f) => !f.isDeleted && f.fileType === 'website');

  useEffect(() => {
    if (!initialFileId) return;
    const found = files.find((f) => f.id === initialFileId);
    if (found) {
      setActiveFileId(found.id);
      setSiteName(found.name);
      setTargetFolderId(found.folderId);
      try {
        const p = JSON.parse(found.contentJson);
        if (p.template) setTemplate(p.template);
        if (p.heroTitle) setHeroTitle(p.heroTitle);
        if (p.aboutText) setAboutText(p.aboutText);
        if (p.navLinks) setNavLinks(p.navLinks);
        setPublished(Boolean(p.published));
      } catch {
        // ignore
      }
    }
  }, [initialFileId, files]);

  const handleSave = async () => {
    const saved = await onSaveWebsite({
      fileId: activeFileId,
      name: siteName.trim() || 'School Website',
      folderId: targetFolderId,
      contentJson: JSON.stringify({
        template,
        heroTitle,
        aboutText,
        navLinks,
        published,
      }),
    });
    setActiveFileId(saved.id);
    if (published) {
      onLogAction?.('PUBLISH_WEBSITE', saved.name);
    }
    setStatusMsg(
      published
        ? `Published & saved "${saved.name}.vweb"`
        : `Saved draft "${saved.name}.vweb"`
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-900 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Globe className="h-4 w-4 text-teal-600" />
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
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
            className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
          >
            <FolderOpen className="h-3.5 w-3.5" /> Open
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1 rounded bg-[#13315C] px-3 py-1 font-semibold text-white hover:bg-[#1B437D]"
          >
            <Save className="h-3.5 w-3.5" /> Save Website
          </button>
        </div>
      </div>

      {showOpenDialog && (
        <div className="border-b border-slate-300 bg-blue-50 px-3 py-2 flex flex-wrap items-center gap-2">
          <span className="font-semibold">Open Website Project:</span>
          {webFiles.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setActiveFileId(f.id);
                setSiteName(f.name);
                setTargetFolderId(f.folderId);
                try {
                  const p = JSON.parse(f.contentJson);
                  setTemplate(p.template || 'school-portal');
                  setHeroTitle(p.heroTitle || '');
                  setAboutText(p.aboutText || '');
                  setNavLinks(p.navLinks || '');
                  setPublished(Boolean(p.published));
                } catch {
                  // ignore
                }
                setShowOpenDialog(false);
              }}
              className="rounded border border-blue-300 bg-white px-2 py-1"
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-300 bg-white p-4 space-y-3">
          <div>
            <label className="block font-semibold mb-1">Choose Website Template (Form 3.1)</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as typeof template)}
              className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
            >
              <option value="school-portal">School Academic Portal (Google Sites style)</option>
              <option value="ict-club">Coding &amp; ICT Club Showcase (Canva style)</option>
              <option value="community-library">Community Learning Hub (WordPress style)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Navigation Menu Items</label>
            <input
              type="text"
              value={navLinks}
              onChange={(e) => setNavLinks(e.target.value)}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Hero Banner Heading</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Page Content Section</label>
            <textarea
              rows={4}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              className="w-full rounded border border-slate-300 p-2.5"
            />
          </div>
          <label className="flex items-center gap-2 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            <span>Publish Site to Local Intranet Preview</span>
          </label>
        </div>

        {/* Live Website Preview */}
        <div className="md:col-span-7 p-5 bg-slate-200 flex items-start justify-center">
          <div className="w-full rounded-xl border border-slate-300 bg-white shadow-md overflow-hidden">
            <div className="bg-slate-900 text-slate-300 px-3 py-1.5 font-mono text-[10px] flex items-center justify-between">
              <span>edu://{siteName.toLowerCase().replace(/\s+/g, '-')}.local</span>
              {published && (
                <span className="inline-flex items-center gap-1 text-teal-400">
                  <CheckCircle2 className="h-3 w-3" /> Published
                </span>
              )}
            </div>
            <div
              className={`px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 ${
                template === 'ict-club'
                  ? 'bg-teal-700'
                  : template === 'community-library'
                  ? 'bg-slate-800'
                  : 'bg-[#13315C]'
              }`}
            >
              <span className="font-display font-bold">{siteName}</span>
              <span className="text-[11px] opacity-90">{navLinks}</span>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-slate-900">{heroTitle}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{aboutText}</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold">Form 1–4 Study Notes</p>
                  <p className="text-[11px] text-slate-500 mt-1">Accessible offline across classrooms</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold">Contact Department</p>
                  <p className="text-[11px] text-slate-500 mt-1">ict@school.edu.zm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-300 bg-white px-3 py-1 text-[11px] text-slate-600 flex justify-between">
        <span>WebBuilder Studio (Form 3.1 Template Websites)</span>
        <span className="font-medium text-teal-700">{statusMsg}</span>
      </div>
    </div>
  );
};
