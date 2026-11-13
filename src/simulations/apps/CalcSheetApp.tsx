import React, { useEffect, useState } from 'react';
import { ArrowDownUp, BarChart3, Bold, FolderOpen, Lock, Save, Table, Unlock } from 'lucide-react';
import { SimFile, SimFolder } from '../../types/index.ts';
import { COLS, evaluateCellDisplay, ROWS, SheetGrid } from '../spreadsheetEngine.ts';

interface CalcSheetAppProps {
  initialFileId?: string | null;
  folders: SimFolder[];
  files: SimFile[];
  onSaveSheet: (params: {
    fileId?: string | null;
    name: string;
    folderId: string | null;
    contentJson: string;
  }) => Promise<SimFile>;
}

const SAMPLE_PUPIL_MARKS: SheetGrid = {
  A1: { raw: 'Pupil Name', bold: true },
  B1: { raw: 'ICT Marks', bold: true },
  A2: { raw: 'Lombe Kabwe' },
  B2: { raw: '78' },
  A3: { raw: 'Thandiwe Phiri' },
  B3: { raw: '86' },
  A4: { raw: 'Kelvin Zulu' },
  B4: { raw: '64' },
  A5: { raw: 'Mutinta Banda' },
  B5: { raw: '91' },
  A6: { raw: 'Chileshe Tembo' },
  B6: { raw: '72' },
  A7: { raw: 'Total Marks', bold: true },
  B7: { raw: '=SUM(B2:B6)', bold: true },
  A8: { raw: 'Class Average', bold: true },
  B8: { raw: '=AVERAGE(B2:B6)', bold: true },
};

export const CalcSheetApp: React.FC<CalcSheetAppProps> = ({
  initialFileId,
  folders,
  files,
  onSaveSheet,
}) => {
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFileId ?? null);
  const [sheetName, setSheetName] = useState('ICT Class Marks');
  const [targetFolderId, setTargetFolderId] = useState<string | null>(
    folders.find((f) => !f.isDeleted && f.name === 'Documents')?.id ?? null
  );
  const [cells, setCells] = useState<SheetGrid>(SAMPLE_PUPIL_MARKS);
  const [selectedCell, setSelectedCell] = useState<string>('B7');
  const [showChart, setShowChart] = useState(true);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [sheetLocked, setSheetLocked] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const activeFolders = folders.filter((f) => !f.isDeleted);
  const sheetFiles = files.filter((f) => !f.isDeleted && f.fileType === 'spreadsheet');

  useEffect(() => {
    if (!initialFileId) return;
    const found = files.find((f) => f.id === initialFileId);
    if (found) {
      setActiveFileId(found.id);
      setSheetName(found.name);
      setTargetFolderId(found.folderId);
      try {
        const parsed = JSON.parse(found.contentJson);
        setCells(parsed.cells || {});
        setSheetLocked(Boolean(parsed.locked));
      } catch {
        setCells({});
      }
    }
  }, [initialFileId, files]);

  const updateCellRaw = (coord: string, raw: string) => {
    if (sheetLocked) {
      setStatusMsg('Sheet is locked. Click Unlock Sheet to edit cells.');
      return;
    }
    setCells((prev) => ({
      ...prev,
      [coord]: { ...prev[coord], raw },
    }));
  };

  const toggleBold = () => {
    if (sheetLocked) return;
    setCells((prev) => ({
      ...prev,
      [selectedCell]: {
        ...prev[selectedCell],
        raw: prev[selectedCell]?.raw || '',
        bold: !prev[selectedCell]?.bold,
      },
    }));
  };

  const sortRowsDescending = () => {
    if (sheetLocked) return;
    const dataRows = [2, 3, 4, 5, 6].map((r) => ({
      a: cells[`A${r}`] || { raw: '' },
      b: cells[`B${r}`] || { raw: '' },
      c: cells[`C${r}`] || { raw: '' },
      numVal: Number(evaluateCellDisplay(`B${r}`, cells)) || 0,
    }));
    dataRows.sort((x, y) => y.numVal - x.numVal);
    setCells((prev) => {
      const next = { ...prev };
      dataRows.forEach((item, idx) => {
        const rowNum = idx + 2;
        next[`A${rowNum}`] = item.a;
        next[`B${rowNum}`] = item.b;
        if (item.c.raw) next[`C${rowNum}`] = item.c;
      });
      return next;
    });
    setStatusMsg('Sorted pupil rows (rows 2–6) highest to lowest.');
  };

  const handleSave = async () => {
    const saved = await onSaveSheet({
      fileId: activeFileId,
      name: sheetName.trim() || 'Untitled Spreadsheet',
      folderId: targetFolderId,
      contentJson: JSON.stringify({ cells, locked: sheetLocked }),
    });
    setActiveFileId(saved.id);
    setStatusMsg(`Saved "${saved.name}.vsheet"`);
  };

  // Extract chart data from rows 2..6 (A label, B numeric value)
  const chartData = [2, 3, 4, 5, 6]
    .map((r) => {
      const label = evaluateCellDisplay(`A${r}`, cells);
      const val = Number(evaluateCellDisplay(`B${r}`, cells));
      return { label, val: Number.isNaN(val) ? 0 : val };
    })
    .filter((d) => d.label && d.val > 0);
  const maxChartVal = Math.max(100, ...chartData.map((d) => d.val));

  return (
    <div className="h-full flex flex-col bg-white text-slate-900 text-xs">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-50 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium w-40"
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
            onClick={sortRowsDescending}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
            title="Sort rows 2-6 by column B descending"
          >
            <ArrowDownUp className="h-3.5 w-3.5 text-blue-700" />
            Sort Marks
          </button>
          <button
            type="button"
            onClick={() => setSheetLocked((l) => !l)}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${
              sheetLocked ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-300 bg-white hover:bg-slate-100'
            }`}
          >
            {sheetLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {sheetLocked ? 'Locked' : 'Lock Sheet'}
          </button>
          <button
            type="button"
            onClick={() => setCells({})}
            className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
          >
            Blank Sheet
          </button>
          <button
            type="button"
            onClick={() => setShowChart((c) => !c)}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
          >
            <BarChart3 className="h-3.5 w-3.5 text-teal-600" />
            {showChart ? 'Hide Chart' : 'Chart'}
          </button>
          <button
            type="button"
            onClick={() => setShowOpenDialog((v) => !v)}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
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

      {/* Formula Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1.5 bg-white">
        <span className="font-mono font-bold text-slate-700 w-10 text-center rounded bg-slate-100 py-0.5">
          {selectedCell}
        </span>
        <button
          type="button"
          onClick={toggleBold}
          className={`p-1 rounded border ${
            cells[selectedCell]?.bold ? 'bg-slate-200 border-slate-400' : 'border-slate-200'
          }`}
          title="Bold cell"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <span className="font-mono text-slate-400">fx</span>
        <input
          type="text"
          value={cells[selectedCell]?.raw || ''}
          onChange={(e) => updateCellRaw(selectedCell, e.target.value)}
          placeholder="Enter number, text, or formula e.g. =SUM(B2:B6), =AVERAGE(B2:B6), =MIN(B2:B6), =MAX(B2:B6)"
          className="flex-1 rounded border border-slate-300 px-2.5 py-1 font-mono text-xs focus:border-blue-600 focus:outline-none"
        />
      </div>

      {showOpenDialog && (
        <div className="border-b border-slate-200 bg-blue-50 px-3 py-2 flex flex-wrap items-center gap-2">
          <span className="font-semibold">Open Spreadsheet:</span>
          {sheetFiles.length === 0 ? (
            <span>No saved spreadsheets yet.</span>
          ) : (
            sheetFiles.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setActiveFileId(f.id);
                  setSheetName(f.name);
                  setTargetFolderId(f.folderId);
                  try {
                    setCells(JSON.parse(f.contentJson).cells || {});
                  } catch {
                    setCells({});
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

      {/* Grid + Live Chart */}
      <div className="flex-1 overflow-auto flex flex-col lg:flex-row">
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="w-9 border border-slate-300 py-1 text-center font-mono">#</th>
                {COLS.map((c) => (
                  <th key={c} className="min-w-[88px] border border-slate-300 py-1 text-center font-mono">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r}>
                  <td className="border border-slate-300 bg-slate-100 text-center font-mono text-slate-500 py-1">
                    {r}
                  </td>
                  {COLS.map((c) => {
                    const coord = `${c}${r}`;
                    const isSelected = selectedCell === coord;
                    const display = evaluateCellDisplay(coord, cells);
                    const isBold = cells[coord]?.bold;
                    const isNumeric = display !== '' && !Number.isNaN(Number(display));
                    return (
                      <td
                        key={coord}
                        onClick={() => setSelectedCell(coord)}
                        className={`border border-slate-200 p-0 ${
                          isSelected ? 'ring-2 ring-inset ring-blue-600 bg-blue-50/40' : ''
                        }`}
                      >
                        <input
                          type="text"
                          value={isSelected ? cells[coord]?.raw || '' : display}
                          onFocus={() => setSelectedCell(coord)}
                          onChange={(e) => updateCellRaw(coord, e.target.value)}
                          className={`w-full px-2 py-1 bg-transparent focus:outline-none tabular-nums ${
                            isBold ? 'font-bold' : ''
                          } ${isNumeric ? 'text-right font-mono' : 'text-left'}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showChart && chartData.length > 0 && (
          <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 p-3 shrink-0">
            <p className="font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Table className="h-3.5 w-3.5 text-teal-600" />
              Live Marks Chart (A2:B6)
            </p>
            <div className="space-y-2.5">
              {chartData.map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="truncate pr-2">{d.label}</span>
                    <span className="font-mono tabular-nums font-semibold">{d.val}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200">
                    <div
                      className="h-2.5 rounded-full bg-teal-600"
                      style={{ width: `${Math.min(100, (d.val / maxChartVal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600 flex justify-between">
        <span>Formulas: =SUM(), =AVERAGE(), =MIN(), =MAX(), =COUNT(), =COUNTA(), =SUMIF(), =VLOOKUP(), =CONCATENATE()</span>
        <span className="font-medium text-teal-700">{statusMsg}</span>
      </div>
    </div>
  );
};
