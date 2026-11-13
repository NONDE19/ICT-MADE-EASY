import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Columns2,
  FolderOpen,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Save,
  Table2,
  Underline,
  Undo2,
} from 'lucide-react';
import { SimFile, SimFolder } from '../../types/index.ts';

interface WordWriterAppProps {
  initialFileId?: string | null;
  folders: SimFolder[];
  files: SimFile[];
  onSaveDocument: (params: {
    fileId?: string | null;
    name: string;
    folderId: string | null;
    contentJson: string;
  }) => Promise<SimFile>;
}

export const WordWriterApp: React.FC<WordWriterAppProps> = ({
  initialFileId,
  folders,
  files,
  onSaveDocument,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFileId ?? null);
  const [docName, setDocName] = useState('My First ICT Assignment');
  const [targetFolderId, setTargetFolderId] = useState<string | null>(
    folders.find((f) => !f.isDeleted && f.name === 'Assignments')?.id ?? null
  );
  const [fontFamily, setFontFamily] = useState('DM Sans');
  const [fontSize, setFontSize] = useState('16px');
  const [textColor, setTextColor] = useState('#0F172A');
  const [pageMargins, setPageMargins] = useState<'normal' | 'narrow'>('normal');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [columnsCount, setColumnsCount] = useState<1 | 2>(1);
  const [headerText, setHeaderText] = useState('');
  const [showPageNumber, setShowPageNumber] = useState(true);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const activeFolders = folders.filter((f) => !f.isDeleted);
  const docFiles = files.filter((f) => !f.isDeleted && f.fileType === 'document');

  useEffect(() => {
    if (!initialFileId) return;
    const found = files.find((f) => f.id === initialFileId);
    if (found && editorRef.current) {
      setActiveFileId(found.id);
      setDocName(found.name);
      setTargetFolderId(found.folderId);
      try {
        const parsed = JSON.parse(found.contentJson);
        editorRef.current.innerHTML = parsed.html || `<p>${parsed.plainText || ''}</p>`;
        if (parsed.headerText !== undefined) setHeaderText(parsed.headerText);
        if (parsed.orientation === 'landscape') setOrientation('landscape');
        if (parsed.columnsCount === 2) setColumnsCount(2);
      } catch {
        editorRef.current.innerText = '';
      }
    }
  }, [initialFileId, files]);

  const execFormat = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const insertSampleTable = () => {
    const html =
      '<table border="1" style="width:100%;border-collapse:collapse;margin:8px 0;"><tr><th style="padding:4px;border:1px solid #cbd5e1;">Subject</th><th style="padding:4px;border:1px solid #cbd5e1;">Marks</th></tr><tr><td style="padding:4px;border:1px solid #cbd5e1;">ICT</td><td style="padding:4px;border:1px solid #cbd5e1;">88</td></tr></table>';
    execFormat('insertHTML', html);
  };

  const insertSampleHyperlink = () => {
    const link = '<a href="edu://zambia-ict.local/home" style="color:#0d9488;text-decoration:underline;">Zambia ICT Portal</a>';
    execFormat('insertHTML', link);
  };

  const handleSave = async () => {
    const html = editorRef.current?.innerHTML || '';
    const plainText = editorRef.current?.innerText || '';
    const contentJson = JSON.stringify({
      title: docName,
      html,
      plainText,
      fontFamily,
      fontSize,
      pageMargins,
      orientation,
      columnsCount,
      headerText,
      showPageNumber,
    });

    const saved = await onSaveDocument({
      fileId: activeFileId,
      name: docName.trim() || 'Untitled Document',
      folderId: targetFolderId,
      contentJson,
    });
    setActiveFileId(saved.id);
    const folderLabel = activeFolders.find((f) => f.id === targetFolderId)?.name || 'Virtual Drive';
    setStatusMsg(`Saved "${saved.name}.vdoc" in ${folderLabel}`);
  };

  const loadExistingDoc = (f: SimFile) => {
    setActiveFileId(f.id);
    setDocName(f.name);
    setTargetFolderId(f.folderId);
    if (editorRef.current) {
      try {
        const parsed = JSON.parse(f.contentJson);
        editorRef.current.innerHTML = parsed.html || `<p>${parsed.plainText || ''}</p>`;
      } catch {
        editorRef.current.innerText = '';
      }
    }
    setShowOpenDialog(false);
    setStatusMsg(`Opened "${f.name}"`);
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-900 text-xs">
      {/* Top Document Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            aria-label="Document title"
            className="rounded border border-slate-300 px-2.5 py-1 font-medium text-slate-900 w-44"
          />
          <select
            value={targetFolderId || ''}
            onChange={(e) => setTargetFolderId(e.target.value || null)}
            aria-label="Save folder"
            className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
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
            className="inline-flex items-center gap-1 rounded border border-slate-300 px-2.5 py-1 font-medium hover:bg-slate-50"
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

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-1.5">
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            execFormat('fontName', e.target.value);
          }}
          className="rounded border border-slate-300 bg-white px-1.5 py-1"
        >
          <option value="DM Sans">DM Sans</option>
          <option value="Georgia">Georgia Serif</option>
          <option value="JetBrains Mono">Monospace</option>
        </select>

        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="rounded border border-slate-300 bg-white px-1.5 py-1"
        >
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="22px">22px</option>
        </select>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button type="button" onClick={() => execFormat('bold')} className="p-1.5 rounded hover:bg-slate-200" title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => execFormat('italic')} className="p-1.5 rounded hover:bg-slate-200" title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => execFormat('underline')} className="p-1.5 rounded hover:bg-slate-200" title="Underline">
          <Underline className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button type="button" onClick={() => execFormat('justifyLeft')} className="p-1.5 rounded hover:bg-slate-200" title="Align Left">
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => execFormat('justifyCenter')} className="p-1.5 rounded hover:bg-slate-200" title="Align Center">
          <AlignCenter className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => execFormat('justifyRight')} className="p-1.5 rounded hover:bg-slate-200" title="Align Right">
          <AlignRight className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button type="button" onClick={() => execFormat('insertUnorderedList')} className="p-1.5 rounded hover:bg-slate-200" title="Bullets">
          <List className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => execFormat('insertOrderedList')} className="p-1.5 rounded hover:bg-slate-200" title="Numbering">
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <input
          type="color"
          value={textColor}
          onChange={(e) => {
            setTextColor(e.target.value);
            execFormat('foreColor', e.target.value);
          }}
          title="Text colour"
          className="h-6 w-6 rounded border border-slate-300 cursor-pointer"
        />
        <button
          type="button"
          onClick={() => execFormat('hiliteColor', '#FEF08A')}
          className="p-1.5 rounded hover:bg-slate-200"
          title="Highlight text"
        >
          <Highlighter className="h-3.5 w-3.5 text-amber-600" />
        </button>

        <button type="button" onClick={insertSampleTable} className="p-1.5 rounded hover:bg-slate-200 inline-flex items-center gap-1" title="Insert Table">
          <Table2 className="h-3.5 w-3.5 text-slate-700" />
          <span className="hidden sm:inline">Table</span>
        </button>
        <button type="button" onClick={insertSampleHyperlink} className="p-1.5 rounded hover:bg-slate-200 inline-flex items-center gap-1" title="Insert Hyperlink">
          <Link2 className="h-3.5 w-3.5 text-teal-700" />
          <span className="hidden sm:inline">Link</span>
        </button>
        <button
          type="button"
          onClick={() => setColumnsCount((c) => (c === 1 ? 2 : 1))}
          className={`p-1.5 rounded inline-flex items-center gap-1 ${columnsCount === 2 ? 'bg-slate-200' : 'hover:bg-slate-200'}`}
          title="Toggle 1 or 2 Columns"
        >
          <Columns2 className="h-3.5 w-3.5" />
          <span>{columnsCount} Col</span>
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button type="button" onClick={() => execFormat('undo')} className="p-1.5 rounded hover:bg-slate-200" title="Undo">
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => execFormat('redo')} className="p-1.5 rounded hover:bg-slate-200" title="Redo">
          <Redo2 className="h-3.5 w-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'))}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] capitalize"
          >
            {orientation}
          </button>
          <button
            type="button"
            onClick={() => setPageMargins((m) => (m === 'normal' ? 'narrow' : 'normal'))}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] capitalize"
          >
            Margins: {pageMargins}
          </button>
        </div>
      </div>

      {/* Header & Page Footer Bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-3 py-1.5 text-[11px]">
        <label className="flex items-center gap-1.5">
          <span className="text-slate-500">Header:</span>
          <input
            type="text"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            placeholder="e.g. Lusaka Central Secondary · Form 2 ICT"
            className="rounded border border-slate-300 px-2 py-0.5 w-60"
          />
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showPageNumber}
            onChange={(e) => setShowPageNumber(e.target.checked)}
          />
          <span>Show Page Number in Footer</span>
        </label>
      </div>

      {showOpenDialog && (
        <div className="border-b border-slate-300 bg-blue-50 px-3 py-2 flex flex-wrap items-center gap-2">
          <span className="font-semibold">Open Saved Document:</span>
          {docFiles.length === 0 ? (
            <span className="text-slate-600">No saved documents yet.</span>
          ) : (
            docFiles.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => loadExistingDoc(f)}
                className="rounded border border-blue-300 bg-white px-2 py-1 hover:bg-blue-100"
              >
                {f.name}
              </button>
            ))
          )}
        </div>
      )}

      {/* Document Page Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-200">
        <div
          className={`w-full min-h-[340px] bg-white shadow-sm border border-slate-300 flex flex-col justify-between ${
            orientation === 'landscape' ? 'max-w-4xl' : 'max-w-2xl'
          }`}
        >
          {headerText && (
            <div className="border-b border-slate-200 px-6 py-2 text-[11px] text-slate-400 flex justify-between">
              <span>{headerText}</span>
              <span>ICT Made Easy Writer</span>
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSave();
              }
            }}
            style={{
              fontFamily,
              fontSize,
              columnCount: columnsCount,
              columnGap: '2rem',
              padding: pageMargins === 'normal' ? '2rem 2.5rem' : '1rem 1.25rem',
            }}
            className="flex-1 text-slate-900 focus:outline-none leading-relaxed"
          >
            <p>
              <b>My First ICT Assignment</b>
            </p>
            <p>
              Computers help pupils in Zambia practise word processing, spreadsheets, and safe digital communication.
            </p>
          </div>
          {showPageNumber && (
            <div className="border-t border-slate-100 px-6 py-1.5 text-center text-[10px] text-slate-400">
              Page 1 of 1
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-300 bg-white px-3 py-1 text-[11px] text-slate-600 flex justify-between">
        <span>Word Writer Simulator · Ctrl+S to save</span>
        <span className="font-medium text-teal-700">{statusMsg}</span>
      </div>
    </div>
  );
};
