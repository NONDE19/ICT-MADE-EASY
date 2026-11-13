import React, { useState } from 'react';
import { ArrowLeftRight, Calculator, CheckCircle2, Info } from 'lucide-react';

interface GenerationInfo {
  gen: number;
  title: string;
  period: string;
  technology: string;
  overview: string;
  characteristics: string[];
  examples: string[];
  advantages: string[];
  limitations: string[];
}

const GENERATIONS: GenerationInfo[] = [
  {
    gen: 1,
    title: 'First Generation — Vacuum Tubes',
    period: 'Approx. 1940s – mid 1950s',
    technology: 'Vacuum Tubes & Magnetic Drums',
    overview:
      'Early electronic computers relied on thousands of glass vacuum tubes to amplify and switch electrical signals, programmed via machine language and punched cards.',
    characteristics: [
      'Enormous room-sized physical footprint',
      'Consumed huge amounts of electricity and generated intense heat',
      'Programmed in binary machine code (0s and 1s)',
    ],
    examples: ['ENIAC', 'UNIVAC I', 'EDVAC'],
    advantages: [
      'Enabled electronic calculation thousands of times faster than mechanical gears',
      'Proved stored-program computing was practical',
    ],
    limitations: [
      'Vacuum tubes burned out frequently, causing constant downtime',
      'Very expensive and required heavy air-conditioning',
    ],
  },
  {
    gen: 2,
    title: 'Second Generation — Transistors',
    period: 'Approx. mid 1950s – mid 1960s',
    technology: 'Discrete Transistors & Magnetic Core Memory',
    overview:
      'Semiconductor transistors replaced fragile vacuum tubes, making computers dramatically smaller, cooler, faster, and reliable enough for universities and businesses.',
    characteristics: [
      'Assembly language and early high-level languages (COBOL, FORTRAN)',
      'Magnetic tape and early magnetic disks for storage',
      'Much lower heat output and power consumption than vacuum tubes',
    ],
    examples: ['IBM 1401', 'IBM 7094', 'CDC 1604'],
    advantages: [
      'Smaller, faster, and far more reliable than First Generation machines',
      'Allowed high-level programming languages',
    ],
    limitations: [
      'Thousands of individual transistors still had to be wired manually on boards',
      'Still too costly for homes or ordinary schools',
    ],
  },
  {
    gen: 3,
    title: 'Third Generation — Integrated Circuits (ICs)',
    period: 'Approx. mid 1960s – early 1970s',
    technology: 'Silicon Integrated Circuits (Chips)',
    overview:
      'Engineers placed dozens to hundreds of miniaturized transistors onto a single tiny silicon chip called an Integrated Circuit (IC), enabling keyboards, monitors, and multitasking operating systems.',
    characteristics: [
      'Introduction of keyboards and video monitors instead of punched cards only',
      'Early operating systems supporting multiprogramming',
      'Lower manufacturing cost per calculation',
    ],
    examples: ['IBM System/360', 'PDP-8', 'Honeywell-6000'],
    advantages: [
      'Higher reliability and speed with dramatically reduced physical size',
      'Easier user interaction via keyboards and terminals',
    ],
    limitations: [
      'Required specialized clean-room chip manufacturing',
      'Still mostly shared minicomputers and mainframes rather than personal desktops',
    ],
  },
  {
    gen: 4,
    title: 'Fourth Generation — Microprocessors',
    period: 'Approx. 1971 – Present (overlapping with 5th Gen)',
    technology: 'VLSI Microprocessors (Millions/Billions of Transistors on One Chip)',
    overview:
      'Very Large Scale Integration (VLSI) placed an entire CPU onto a single microprocessor chip. This launched personal computers (PCs), laptops, graphical user interfaces, and local networks.',
    characteristics: [
      'Single-chip CPUs (microprocessors) powering affordable PCs and laptops',
      'Graphical User Interfaces (GUIs), mice, and office applications',
      'Expansion of LANs, the Internet, and mobile smartphones',
    ],
    examples: ['Apple II', 'IBM PC', 'Modern School Desktops & Laptops'],
    advantages: [
      'Affordable enough for schools, small offices, and households',
      'High reliability, low power usage, and portable designs',
    ],
    limitations: [
      'Rapid hardware obsolescence and electronic waste challenges',
      'Cybersecurity and digital divide challenges where infrastructure is scarce',
    ],
  },
  {
    gen: 5,
    title: 'Fifth Generation — Parallel Processing & AI Systems',
    period: 'Emerging / Ongoing (No universally agreed dates)',
    technology: 'ULSI, Parallel Multi-Core Processing, Cloud & Artificial Intelligence',
    overview:
      'Fifth Generation computing focuses on parallel multi-core processors, natural language interaction, machine learning, and intelligent decision-support systems.',
    characteristics: [
      'Parallel processing across many cores and specialized neural accelerators',
      'Voice recognition, computer vision, and natural-language interfaces',
      'Cloud-connected and edge computing ecosystems',
    ],
    examples: ['Multi-core AI Workstations', 'Voice Assistants', 'Quantum & Neural Research Systems'],
    advantages: [
      'Capable of pattern recognition, translation, and complex scientific modeling',
      'Supports adaptive educational tools and automated accessibility aids',
    ],
    limitations: [
      'Requires substantial energy, data, and skilled oversight',
      'Raises ethical, privacy, and bias questions requiring digital literacy',
    ],
  },
];

export const Module1Evolution: React.FC = () => {
  const [abacusCols, setAbacusCols] = useState([0, 2, 4, 3]); // Thousands, Hundreds, Tens, Units
  const [selectedGen, setSelectedGen] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [babbageStep, setBabbageStep] = useState<'input' | 'mill' | 'store' | 'output'>('input');

  const abacusValue =
    abacusCols[0] * 1000 + abacusCols[1] * 100 + abacusCols[2] * 10 + abacusCols[3];

  const activeGen = GENERATIONS.find((g) => g.gen === selectedGen) || GENERATIONS[0];

  const adjustRod = (idx: number, delta: number) => {
    setAbacusCols((prev) =>
      prev.map((val, i) => (i === idx ? Math.max(0, Math.min(9, val + delta)) : val))
    );
  };

  return (
    <div className="space-y-8">
      {/* Interactive Abacus & Babbage Mechanical Calculators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="h-4 w-4 text-teal-600" />
                Interactive Abacus Simulator
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Click + or - on each place-value rod to explore how early human calculators represented numbers.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Current Value</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-[#0F2744] dark:text-teal-400">
                {abacusValue}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="grid grid-cols-4 gap-3 text-center">
              {['Thousands', 'Hundreds', 'Tens', 'Units'].map((label, colIdx) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {label}
                  </span>
                  <div className="relative h-36 w-12 flex flex-col justify-end items-center rounded-md border border-amber-300 bg-amber-100/60 py-2 dark:border-slate-700 dark:bg-slate-900">
                    <div className="absolute inset-y-2 w-1 bg-amber-700/40 dark:bg-slate-600" />
                    <div className="relative z-10 flex flex-col gap-1 items-center">
                      {Array.from({ length: abacusCols[colIdx] }).map((_, bIdx) => (
                        <div
                          key={bIdx}
                          className="h-2.5 w-7 rounded-full bg-[#0F2744] dark:bg-teal-500 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustRod(colIdx, -1)}
                      className="h-7 w-7 rounded border border-slate-300 bg-white text-xs font-bold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                    >
                      -
                    </button>
                    <span className="w-5 font-mono text-xs font-semibold tabular-nums">
                      {abacusCols[colIdx]}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustRod(colIdx, 1)}
                      className="h-7 w-7 rounded border border-slate-300 bg-white text-xs font-bold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Babbage Analytical Engine Interactive Architecture */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Charles Babbage’s Analytical Engine (1837 Concept)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Click each mechanical stage to see how Babbage’s design foreshadowed the modern computer.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              {
                id: 'input',
                title: 'Punched Cards (Input)',
                modern: 'Modern Equivalent: Keyboard & Program Files',
                desc: 'Operation cards and variable cards fed instructions and numbers mechanically into the engine.',
              },
              {
                id: 'mill',
                title: 'The Mill (Processor)',
                modern: 'Modern Equivalent: Central Processing Unit (CPU)',
                desc: 'Interlocking brass gears performed addition, subtraction, multiplication, and division.',
              },
              {
                id: 'store',
                title: 'The Store (Memory)',
                modern: 'Modern Equivalent: RAM / Memory',
                desc: 'Columns of numbered wheels held up to 1,000 numbers while calculations ran.',
              },
              {
                id: 'output',
                title: 'Printer / Bell (Output)',
                modern: 'Modern Equivalent: Monitor & Printer',
                desc: 'Stamped computed mathematical tables onto metal plates or paper automatically.',
              },
            ].map((part) => (
              <button
                key={part.id}
                type="button"
                onClick={() => setBabbageStep(part.id as typeof babbageStep)}
                className={`rounded-lg border p-3.5 text-left transition-colors ${
                  babbageStep === part.id
                    ? 'border-[#0F2744] bg-slate-50 dark:border-teal-500 dark:bg-slate-800'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                }`}
              >
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{part.title}</p>
                <p className="mt-1 text-xs text-teal-700 dark:text-teal-400">{part.modern}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {babbageStep === 'input' &&
              'Punched Cards: Inspired by Jacquard weaving looms, Ada Lovelace recognized that programmable cards could instruct the Analytical Engine to solve complex sequences beyond simple arithmetic.'}
            {babbageStep === 'mill' &&
              'The Mill: Acted as the mechanical arithmetic and logic unit, executing sequences of gear rotations controlled by punched operation cards.'}
            {babbageStep === 'store' &&
              'The Store: Separated working memory from the processor—a breakthrough architectural idea still used in every modern computer today.'}
            {babbageStep === 'output' &&
              'Output Unit: Eliminated human copying mistakes when publishing navigation, astronomy, and engineering tables.'}
          </div>
        </section>
      </div>

      {/* Educational Classification Note */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3 text-xs leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <Info className="h-4 w-4 text-blue-700 dark:text-teal-400 mt-0.5 shrink-0" />
        <div>
          <strong>Educational Classification Note:</strong> The five computer generations are a widely
          used educational framework. Their historical periods overlap in real adoption, and the
          Fifth Generation does not have universally agreed start or end dates.
        </div>
      </div>

      {/* 5 Computer Generations Interactive Explorer */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Five Generations of Electronic Computers
            </h3>
            <p className="text-xs text-slate-500">
              Select a generation to inspect its hardware schematic, or compare all five side by side.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCompareMode((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 self-start sm:self-center"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {compareMode ? 'Single Generation View' : 'Compare All Generations'}
          </button>
        </div>

        {!compareMode ? (
          <>
            <div className="mt-4 flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {GENERATIONS.map((g) => (
                <button
                  key={g.gen}
                  type="button"
                  onClick={() => setSelectedGen(g.gen)}
                  className={`flex-1 min-w-[110px] rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    selectedGen === g.gen
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                  }`}
                >
                  Gen {g.gen}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Schematic SVG Illustration */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-950 p-5 text-white">
                <p className="text-xs font-mono text-teal-400">{activeGen.period}</p>
                <p className="mt-1 font-display text-base font-semibold">{activeGen.technology}</p>

                <svg viewBox="0 0 320 180" className="mt-4 w-full h-44" role="img" aria-label={activeGen.title}>
                  <rect width="320" height="180" rx="10" fill="#0B192C" />
                  {activeGen.gen === 1 && (
                    <g>
                      {[65, 160, 255].map((cx) => (
                        <g key={cx}>
                          <rect x={cx - 22} y="34" width="44" height="92" rx="22" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
                          <path d={`M${cx - 8} 96 L${cx} 58 L${cx + 8} 96`} stroke="#FBBF24" strokeWidth="3" fill="none" />
                          <rect x={cx - 18} y="124" width="36" height="16" rx="3" fill="#475569" />
                        </g>
                      ))}
                      <text x="160" y="164" textAnchor="middle" fill="#94A3B8" fontSize="11">
                        Glass Vacuum Tubes (High Heat, Large Size)
                      </text>
                    </g>
                  )}
                  {activeGen.gen === 2 && (
                    <g>
                      {[75, 160, 245].map((cx) => (
                        <g key={cx}>
                          <circle cx={cx} cy="72" r="24" fill="#1E293B" stroke="#38BDF8" strokeWidth="2.5" />
                          <line x1={cx - 10} y1="96" x2={cx - 14} y2="132" stroke="#94A3B8" strokeWidth="3" />
                          <line x1={cx} y1="96" x2={cx} y2="132" stroke="#94A3B8" strokeWidth="3" />
                          <line x1={cx + 10} y1="96" x2={cx + 14} y2="132" stroke="#94A3B8" strokeWidth="3" />
                        </g>
                      ))}
                      <text x="160" y="164" textAnchor="middle" fill="#94A3B8" fontSize="11">
                        Discrete Semiconductor Transistors
                      </text>
                    </g>
                  )}
                  {activeGen.gen === 3 && (
                    <g>
                      <rect x="85" y="45" width="150" height="72" rx="6" fill="#1E293B" stroke="#2DD4BF" strokeWidth="2.5" />
                      {[100, 125, 150, 175, 200, 220].map((px) => (
                        <g key={px}>
                          <rect x={px - 4} y="34" width="8" height="11" fill="#CBD5E1" />
                          <rect x={px - 4} y="117" width="8" height="11" fill="#CBD5E1" />
                        </g>
                      ))}
                      <rect x="118" y="65" width="84" height="32" rx="3" fill="#0F2744" stroke="#38BDF8" />
                      <text x="160" y="85" textAnchor="middle" fill="#2DD4BF" fontSize="11" fontWeight="bold">
                        SILICON IC
                      </text>
                      <text x="160" y="164" textAnchor="middle" fill="#94A3B8" fontSize="11">
                        Integrated Circuit Chip (Multiple Transistors)
                      </text>
                    </g>
                  )}
                  {activeGen.gen === 4 && (
                    <g>
                      <rect x="95" y="34" width="130" height="100" rx="8" fill="#163A63" stroke="#38BDF8" strokeWidth="2.5" />
                      <rect x="122" y="56" width="76" height="56" rx="4" fill="#0F2744" stroke="#2DD4BF" strokeWidth="2" />
                      <text x="160" y="88" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">
                        CPU VLSI
                      </text>
                      <text x="160" y="164" textAnchor="middle" fill="#94A3B8" fontSize="11">
                        Single-Chip Microprocessor (PCs &amp; Laptops)
                      </text>
                    </g>
                  )}
                  {activeGen.gen === 5 && (
                    <g>
                      {[70, 160, 250].map((cx) => (
                        <g key={cx}>
                          <circle cx={cx} cy="54" r="14" fill="#14B8A6" />
                          <circle cx={cx} cy="112" r="14" fill="#38BDF8" />
                          <line x1={cx} y1="68" x2={cx} y2="98" stroke="#94A3B8" strokeWidth="2" />
                        </g>
                      ))}
                      <line x1="70" y1="54" x2="250" y2="112" stroke="#2DD4BF" strokeWidth="1.5" strokeDasharray="4 3" />
                      <line x1="250" y1="54" x2="70" y2="112" stroke="#2DD4BF" strokeWidth="1.5" strokeDasharray="4 3" />
                      <text x="160" y="164" textAnchor="middle" fill="#94A3B8" fontSize="11">
                        Parallel Multi-Core &amp; AI Neural Architectures
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Details */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <h4 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    {activeGen.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {activeGen.overview}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
                      Key Characteristics
                    </h5>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {activeGen.characteristics.map((c) => (
                        <li key={c} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 mt-0.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
                      Notable Examples
                    </h5>
                    <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {activeGen.examples.join(' · ')}
                    </p>

                    <h5 className="mt-4 text-xs font-semibold text-slate-900 dark:text-white">
                      Advantages vs Limitations
                    </h5>
                    <p className="mt-1 text-xs text-teal-700 dark:text-teal-400">
                      + {activeGen.advantages[0]}
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      - {activeGen.limitations[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="py-2 pr-3">Generation</th>
                  <th className="py-2 pr-3">Approx. Period</th>
                  <th className="py-2 pr-3">Core Technology</th>
                  <th className="py-2 pr-3">Examples</th>
                  <th className="py-2">Key Trade-off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {GENERATIONS.map((g) => (
                  <tr key={g.gen}>
                    <td className="py-3 pr-3 font-semibold">Gen {g.gen}</td>
                    <td className="py-3 pr-3 font-mono">{g.period}</td>
                    <td className="py-3 pr-3">{g.technology}</td>
                    <td className="py-3 pr-3">{g.examples.join(', ')}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {g.advantages[0]} / {g.limitations[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
