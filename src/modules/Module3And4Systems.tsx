import React, { useState } from 'react';
import { Cpu, Layers, Terminal } from 'lucide-react';

const SOFTWARE_ITEMS = [
  { name: 'ICT Made Easy OS / Linux / Windows', expected: 'System Software' },
  { name: 'Word Writer / Spreadsheet App', expected: 'Application Software' },
  { name: 'Antivirus & Disk Cleanup', expected: 'Utility Software' },
  { name: 'HP LaserJet Printer Driver', expected: 'Device Driver' },
  { name: 'Python / TypeScript Compiler', expected: 'Programming Software' },
];

export const Module3SoftwareLab: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-teal-600" />
            Interactive Software Classification Lab
          </h3>
          <p className="text-xs text-slate-500">
            Classify each real-world software example into its correct architectural category.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="rounded-lg bg-[#13315C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B437D] dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          Check Classification
        </button>
      </div>

      <div className="space-y-3">
        {SOFTWARE_ITEMS.map((item) => {
          const picked = answers[item.name] || '';
          const ok = picked === item.expected;
          return (
            <div
              key={item.name}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 p-3.5 dark:border-slate-800"
            >
              <span className="text-sm font-medium">{item.name}</span>
              <div className="flex items-center gap-3">
                <select
                  value={picked}
                  onChange={(e) => {
                    setChecked(false);
                    setAnswers((p) => ({ ...p, [item.name]: e.target.value }));
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">Select Category...</option>
                  <option value="System Software">System Software</option>
                  <option value="Application Software">Application Software</option>
                  <option value="Utility Software">Utility Software</option>
                  <option value="Device Driver">Device Driver</option>
                  <option value="Programming Software">Programming Software</option>
                </select>
                {checked && (
                  <span className={`text-xs font-semibold ${ok ? 'text-teal-600' : 'text-red-600'}`}>
                    {ok ? 'Correct' : `Expected: ${item.expected}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const Module4OSLab: React.FC = () => {
  const [processes, setProcesses] = useState([
    { id: 'P1', name: 'Word Writer', remaining: 60 },
    { id: 'P2', name: 'EduBrowser', remaining: 40 },
    { id: 'P3', name: 'Antivirus Scan', remaining: 80 },
  ]);
  const [ramBlocks, setRamBlocks] = useState<Array<string | null>>([
    'OS Kernel',
    'Word Writer',
    null,
    null,
    'EduBrowser',
    null,
  ]);
  const [cliInput, setCliInput] = useState('');
  const [cliOutput, setCliOutput] = useState<string[]>([
    'ICT Made Easy Simulated OS Shell (Safe Educational Sandbox)',
    'Type "help", "ls", "mem", "whoami", or "clear".',
  ]);

  const runCpuSlice = () => {
    setProcesses((prev) =>
      prev
        .map((p, idx) => (idx === 0 ? { ...p, remaining: Math.max(0, p.remaining - 20) } : p))
        .filter((p) => p.remaining > 0)
        .sort((a, b) => (a === prev[0] ? 1 : b === prev[0] ? -1 : 0))
    );
  };

  const resetProcesses = () => {
    setProcesses([
      { id: 'P1', name: 'Word Writer', remaining: 60 },
      { id: 'P2', name: 'EduBrowser', remaining: 40 },
      { id: 'P3', name: 'Antivirus Scan', remaining: 80 },
    ]);
  };

  const toggleRamBlock = (idx: number) => {
    if (idx === 0) return; // OS Kernel reserved
    setRamBlocks((prev) =>
      prev.map((val, i) => (i === idx ? (val ? null : `App Slot ${idx}`) : val))
    );
  };

  const handleCliCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = cliInput.trim().toLowerCase();
    if (!cmd) return;
    let reply = `Unknown command "${cmd}". Try "help".`;
    if (cmd === 'help') reply = 'Available commands: help, ls, mem, whoami, clear';
    else if (cmd === 'ls') reply = 'Documents/   Assignments/   Pictures/';
    else if (cmd === 'mem') {
      const used = ramBlocks.filter(Boolean).length;
      reply = `RAM Blocks Used: ${used} / ${ramBlocks.length} (${Math.round((used / ramBlocks.length) * 100)}%)`;
    } else if (cmd === 'whoami') reply = 'virtuolab-pupil (Sandbox Mode)';
    else if (cmd === 'clear') {
      setCliOutput([]);
      setCliInput('');
      return;
    }
    setCliOutput((prev) => [...prev, `> ${cliInput}`, reply]);
    setCliInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Process & Memory Management Simulator */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-teal-600" />
              OS Process &amp; Memory Management
            </h3>
            <p className="text-xs text-slate-500">
              Step through Round-Robin CPU scheduling and click RAM blocks to allocate/free memory.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={runCpuSlice}
              disabled={processes.length === 0}
              className="rounded-lg bg-[#0F2744] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-teal-600"
            >
              Step CPU Slice
            </button>
            <button
              type="button"
              onClick={resetProcesses}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-700"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {processes.length === 0 ? (
            <p className="text-xs text-teal-700 dark:text-teal-400">
              All queued processes finished executing!
            </p>
          ) : (
            processes.map((p, idx) => (
              <div key={p.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span>
                    {p.id}: {p.name} {idx === 0 ? '(Running on CPU)' : '(Waiting)'}
                  </span>
                  <span className="font-mono tabular-nums">{p.remaining}ms left</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-2 rounded-full ${idx === 0 ? 'bg-teal-600' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, p.remaining)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-xs font-semibold mb-2">RAM Page Allocation (Click free/app blocks to toggle)</p>
          <div className="grid grid-cols-3 gap-2">
            {ramBlocks.map((block, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleRamBlock(i)}
                className={`rounded-lg border p-2.5 text-xs font-medium text-center ${
                  i === 0
                    ? 'border-slate-400 bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white cursor-not-allowed'
                    : block
                    ? 'border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200'
                    : 'border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-700'
                }`}
              >
                {block || 'Free RAM'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Safe Simulated CLI vs GUI Comparison */}
      <section className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-slate-100 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-base font-semibold flex items-center gap-2 text-white">
            <Terminal className="h-4 w-4 text-teal-400" />
            Command-Line Interface (CLI) Sandbox
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Safe educational simulation — executes only simulated OS lesson commands, never host system commands.
          </p>

          <div className="mt-4 h-56 overflow-y-auto rounded-lg bg-black/50 p-3 font-mono text-xs space-y-1.5 border border-slate-800">
            {cliOutput.map((line, i) => (
              <div key={i} className={line.startsWith('>') ? 'text-teal-400' : 'text-slate-300'}>
                {line}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleCliCommand} className="mt-4 flex gap-2">
          <input
            type="text"
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            placeholder="Enter command (e.g., ls, mem, help)..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white focus:border-teal-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500"
          >
            Run
          </button>
        </form>
      </section>
    </div>
  );
};
