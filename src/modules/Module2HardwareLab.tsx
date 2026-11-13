import React, { useState } from 'react';
import { CheckCircle2, Cpu, RotateCcw, Wind, Wrench } from 'lucide-react';
import { RealEquipmentPhotos } from '../components/RealEquipmentPhotos.tsx';

interface HardwareComponent {
  id: string;
  name: string;
  category: 'Internal' | 'Memory & Storage' | 'Power & Cooling' | 'Peripheral';
  role: string;
  interaction: string;
  slotId?: string;
}

const HARDWARE_ITEMS: HardwareComponent[] = [
  {
    id: 'cpu',
    name: 'Central Processing Unit (CPU)',
    category: 'Internal',
    role: 'Executes program instructions, performs arithmetic/logic calculations, and coordinates system operations.',
    interaction: 'Fetches instructions and active data from RAM across the motherboard buses and returns processed results.',
    slotId: 'socket-cpu',
  },
  {
    id: 'motherboard',
    name: 'Motherboard',
    category: 'Internal',
    role: 'The main printed circuit board that houses sockets, slots, buses, and chipsets connecting every component.',
    interaction: 'Distributes electrical power from the PSU and carries high-speed data between CPU, RAM, GPU, and storage.',
    slotId: 'chassis-board',
  },
  {
    id: 'ram',
    name: 'Random Access Memory (RAM)',
    category: 'Memory & Storage',
    role: 'High-speed volatile working memory holding open applications and active data while the computer is on.',
    interaction: 'Feeds instructions rapidly to the CPU; contents clear when power turns off.',
    slotId: 'slot-ram',
  },
  {
    id: 'rom',
    name: 'Read-Only Memory (ROM)',
    category: 'Memory & Storage',
    role: 'Non-volatile chip storing permanent startup firmware (BIOS/UEFI) that tests hardware when powered on.',
    interaction: 'Runs Power-On Self-Test (POST) and hands startup control to the Operating System on SSD/HDD.',
  },
  {
    id: 'hdd',
    name: 'Hard Disk Drive (HDD)',
    category: 'Memory & Storage',
    role: 'Non-volatile magnetic storage device using spinning platters for large-capacity long-term file storage.',
    interaction: 'Connects via SATA data cable to the motherboard and receives power from the PSU.',
  },
  {
    id: 'ssd',
    name: 'Solid-State Drive (SSD)',
    category: 'Memory & Storage',
    role: 'Fast non-volatile flash memory storage with no moving parts, ideal for booting the OS quickly.',
    interaction: 'Plugs into M.2 or SATA slots on the motherboard for rapid read/write transfers with RAM.',
    slotId: 'slot-storage',
  },
  {
    id: 'psu',
    name: 'Power Supply Unit (PSU)',
    category: 'Power & Cooling',
    role: 'Converts high-voltage AC wall power into safe, regulated low-voltage DC power for internal components.',
    interaction: 'Supplies dedicated power rails to the Motherboard, CPU, GPU, cooling fans, and drives.',
    slotId: 'bay-psu',
  },
  {
    id: 'gpu',
    name: 'Graphics Processing Unit (GPU)',
    category: 'Internal',
    role: 'Specialized processor rendering images, video, 3D graphics, and desktop windows to the monitor.',
    interaction: 'Sits in a PCIe expansion slot on the motherboard and outputs visual frames over HDMI/DisplayPort.',
    slotId: 'slot-pcie',
  },
  {
    id: 'cooling',
    name: 'Cooling System (Heatsink & Fans)',
    category: 'Power & Cooling',
    role: 'Draws heat away from the CPU and chassis to prevent overheating and thermal shutdown.',
    interaction: 'Mounts directly atop the CPU with thermal paste and draws power from motherboard fan headers.',
    slotId: 'mount-cooler',
  },
  {
    id: 'keyboard',
    name: 'Keyboard (Input Device)',
    category: 'Peripheral',
    role: 'Allows users to enter text, numbers, and keyboard shortcuts into the computer.',
    interaction: 'Sends keystroke signals via USB or wireless receiver to the OS input controller.',
  },
  {
    id: 'mouse',
    name: 'Mouse (Input Device)',
    category: 'Peripheral',
    role: 'Pointing device controlling the on-screen cursor for clicking, dragging, and selecting items.',
    interaction: 'Reports optical movement and button clicks to the GUI pointer manager.',
  },
  {
    id: 'monitor',
    name: 'Monitor (Output Device)',
    category: 'Peripheral',
    role: 'Displays visual feedback, desktop windows, documents, and educational simulations.',
    interaction: 'Receives video signals from the GPU or integrated motherboard display port.',
  },
  {
    id: 'printer',
    name: 'Printer (Output Device)',
    category: 'Peripheral',
    role: 'Produces physical paper hard copies of digital documents, reports, and mark sheets.',
    interaction: 'Receives formatted page data translated through an OS device driver.',
  },
  {
    id: 'scanner',
    name: 'Scanner (Input Device)',
    category: 'Peripheral',
    role: 'Captures paper documents and photographs as digital image files inside the computer.',
    interaction: 'Sends optical scan lines into imaging software over USB or network connection.',
  },
  {
    id: 'storage-external',
    name: 'Portable Storage Devices (USB / Optical)',
    category: 'Memory & Storage',
    role: 'Removable media such as USB flash drives and memory cards used to back up or transfer school files.',
    interaction: 'Mounts as a removable drive in the OS File Manager when inserted.',
  },
];

const ASSEMBLY_SLOTS = [
  { slotId: 'socket-cpu', label: 'CPU Socket (LGA)', expectedId: 'cpu' },
  { slotId: 'mount-cooler', label: 'CPU Cooling Mount', expectedId: 'cooling' },
  { slotId: 'slot-ram', label: 'DDR RAM DIMM Slot', expectedId: 'ram' },
  { slotId: 'slot-pcie', label: 'PCIe x16 Graphics Slot', expectedId: 'gpu' },
  { slotId: 'slot-storage', label: 'M.2 / SATA Storage Bay', expectedId: 'ssd' },
  { slotId: 'bay-psu', label: 'ATX Power Supply Bay', expectedId: 'psu' },
];

const TROUBLESHOOTING_CASES = [
  {
    id: 'case1',
    symptom: 'You press the desktop power button, but no lights turn on and no cooling fans spin at all.',
    options: [
      'Replace the mouse and keyboard',
      'Inspect wall socket, power cable, and Power Supply Unit (PSU) switch',
      'Clean the monitor screen',
    ],
    correctIndex: 1,
    explanation: 'Total absence of lights and fans indicates an electrical power fault before startup (outlet, cable, or PSU).',
  },
  {
    id: 'case2',
    symptom: 'The system unit fans spin and power LED is lit, but the screen shows "No Video Signal".',
    options: [
      'Check monitor power, HDMI/VGA cable seating, and GPU connection',
      'Uninstall the printer driver',
      'Replace the optical scanner',
    ],
    correctIndex: 0,
    explanation: 'When the PC powers up without display output, verify the monitor cable, monitor input source, or GPU/RAM seating.',
  },
  {
    id: 'case3',
    symptom: 'The computer turns off suddenly after 5 minutes of heavy work and feels very hot near the processor.',
    options: [
      'Check if the CPU cooling fan is spinning and clear dust from vents',
      'Change the desktop wallpaper',
      'Delete documents from the Recycle Bin',
    ],
    correctIndex: 0,
    explanation: 'Thermal shutdown protects the CPU from permanent heat damage when a heatsink or fan fails.',
  },
];

export const Module2HardwareLab: React.FC = () => {
  const [labTab, setLabTab] = useState<
    'explorer' | 'assembly' | 'matching' | 'troubleshoot' | 'specs-care' | 'real-photos'
  >('explorer');
  const [specCpuGhz, setSpecCpuGhz] = useState(2.0);
  const [specCores, setSpecCores] = useState(4);
  const [specRamGb, setSpecRamGb] = useState(8);
  const [specSsdGb, setSpecSsdGb] = useState(128);
  const [blowerDoneSteps, setBlowerDoneSteps] = useState<string[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('cpu');
  const [signalPath, setSignalPath] = useState<'data' | 'power' | 'display'>('data');

  // Virtual PC Assembly state
  const [heldPartId, setHeldPartId] = useState<string | null>(null);
  const [placedSlots, setPlacedSlots] = useState<Record<string, string>>({});
  const [assemblyFeedback, setAssemblyFeedback] = useState('');

  // Matching Exercise state
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({});
  const [matchChecked, setMatchChecked] = useState(false);

  // Troubleshooting state
  const [troubleAnswers, setTroubleAnswers] = useState<Record<string, number>>({});
  const [troubleChecked, setTroubleChecked] = useState(false);

  const selectedComp = HARDWARE_ITEMS.find((h) => h.id === selectedCompId) || HARDWARE_ITEMS[0];

  const handlePlaceInSlot = (slotId: string, expectedId: string) => {
    if (!heldPartId) {
      setAssemblyFeedback('Select a hardware part from the tray first, then click its matching motherboard slot.');
      return;
    }
    if (heldPartId === expectedId) {
      setPlacedSlots((prev) => ({ ...prev, [slotId]: heldPartId }));
      setHeldPartId(null);
      setAssemblyFeedback(`Installed ${HARDWARE_ITEMS.find((h) => h.id === heldPartId)?.name} correctly!`);
    } else {
      const partName = HARDWARE_ITEMS.find((h) => h.id === heldPartId)?.name;
      setAssemblyFeedback(
        `${partName} does not fit into ${ASSEMBLY_SLOTS.find((s) => s.slotId === slotId)?.label}. Check the connector shape and role.`
      );
    }
  };

  const completedAssemblyCount = ASSEMBLY_SLOTS.filter(
    (s) => placedSlots[s.slotId] === s.expectedId
  ).length;

  const matchingPairs = [
    { id: 'cpu', prompt: 'Executes program instructions and calculations' },
    { id: 'ram', prompt: 'Temporary volatile memory for active programs' },
    { id: 'ssd', prompt: 'Fast non-volatile flash storage for OS & files' },
    { id: 'psu', prompt: 'Converts AC mains power into regulated DC power' },
    { id: 'scanner', prompt: 'Converts paper documents into digital images' },
  ];

  return (
    <div className="space-y-6">
      {/* Lab Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-900">
          {[
            { id: 'explorer', label: '1. Interactive System Explorer' },
            { id: 'assembly', label: '2. Virtual PC Assembly' },
            { id: 'matching', label: '3. Component Matching' },
            { id: 'troubleshoot', label: '4. Hardware Troubleshooting' },
            { id: 'specs-care', label: '5. Specs & Air Blower Care' },
            { id: 'real-photos', label: '6. Real Equipment Photos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLabTab(tab.id as typeof labTab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                labTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {labTab === 'explorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive SVG Computer Diagram */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Click Any Component to Inspect
              </h3>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs dark:bg-slate-800">
                {(['data', 'power', 'display'] as const).map((path) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => setSignalPath(path)}
                    className={`rounded px-2.5 py-1 font-medium capitalize ${
                      signalPath === path
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {path} Flow
                  </button>
                ))}
              </div>
            </div>

            <svg
              viewBox="0 0 640 390"
              className="w-full rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800"
              role="img"
              aria-label="Interactive Computer Hardware System Diagram"
            >
              {/* System Case / Motherboard */}
              <rect
                x="20"
                y="20"
                width="360"
                height="350"
                rx="12"
                fill="#0B192C"
                stroke={selectedCompId === 'motherboard' ? '#2DD4BF' : '#334155'}
                strokeWidth={selectedCompId === 'motherboard' ? 3 : 2}
                className="cursor-pointer"
                onClick={() => setSelectedCompId('motherboard')}
              />
              <text x="36" y="42" fill="#94A3B8" fontSize="11" fontWeight="bold">
                SYSTEM UNIT &amp; MOTHERBOARD (Click border)
              </text>

              {/* Signal Flow Lines */}
              {signalPath === 'data' && (
                <g stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="5 4" fill="none">
                  <path d="M135 125 L220 125" />
                  <path d="M105 160 L105 220 L215 220" />
                  <path d="M275 160 L275 265" />
                </g>
              )}
              {signalPath === 'power' && (
                <g stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="5 4" fill="none">
                  <path d="M100 300 L100 160" />
                  <path d="M160 320 L260 320 L260 160" />
                </g>
              )}
              {signalPath === 'display' && (
                <g stroke="#2DD4BF" strokeWidth="3" strokeDasharray="6 4" fill="none">
                  <path d="M150 125 L150 225 L410 120" />
                </g>
              )}

              {/* CPU */}
              <g className="cursor-pointer" onClick={() => setSelectedCompId('cpu')}>
                <rect
                  x="60"
                  y="75"
                  width="85"
                  height="85"
                  rx="8"
                  fill="#163A63"
                  stroke={selectedCompId === 'cpu' ? '#2DD4BF' : '#38BDF8'}
                  strokeWidth={selectedCompId === 'cpu' ? 3 : 1.5}
                />
                <text x="102" y="114" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold">
                  CPU
                </text>
                <text x="102" y="132" textAnchor="middle" fill="#93C5FD" fontSize="9">
                  Processor
                </text>
              </g>

              {/* Cooling Fan */}
              <g className="cursor-pointer" onClick={() => setSelectedCompId('cooling')}>
                <circle
                  cx="165"
                  cy="75"
                  r="24"
                  fill="#1E293B"
                  stroke={selectedCompId === 'cooling' ? '#2DD4BF' : '#64748B'}
                  strokeWidth="2"
                />
                <text x="165" y="79" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontWeight="bold">
                  COOLER
                </text>
              </g>

              {/* RAM & ROM */}
              <g className="cursor-pointer" onClick={() => setSelectedCompId('ram')}>
                <rect
                  x="220"
                  y="70"
                  width="125"
                  height="42"
                  rx="6"
                  fill="#0F766E"
                  stroke={selectedCompId === 'ram' ? '#5EEAD4' : '#14B8A6'}
                  strokeWidth={selectedCompId === 'ram' ? 3 : 1.5}
                />
                <text x="282" y="95" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                  RAM (Volatile)
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => setSelectedCompId('rom')}>
                <rect
                  x="220"
                  y="122"
                  width="125"
                  height="36"
                  rx="6"
                  fill="#334155"
                  stroke={selectedCompId === 'rom' ? '#2DD4BF' : '#64748B'}
                  strokeWidth="1.5"
                />
                <text x="282" y="144" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="bold">
                  ROM (BIOS/UEFI)
                </text>
              </g>

              {/* GPU */}
              <g className="cursor-pointer" onClick={() => setSelectedCompId('gpu')}>
                <rect
                  x="60"
                  y="195"
                  width="145"
                  height="55"
                  rx="6"
                  fill="#1E3A8A"
                  stroke={selectedCompId === 'gpu' ? '#2DD4BF' : '#60A5FA'}
                  strokeWidth={selectedCompId === 'gpu' ? 3 : 1.5}
                />
                <text x="132" y="220" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                  GPU (Graphics Card)
                </text>
                <text x="132" y="236" textAnchor="middle" fill="#BFDBFE" fontSize="9">
                  PCIe Slot
                </text>
              </g>

              {/* SSD & HDD */}
              <g className="cursor-pointer" onClick={() => setSelectedCompId('ssd')}>
                <rect
                  x="225"
                  y="190"
                  width="120"
                  height="40"
                  rx="6"
                  fill="#1E293B"
                  stroke={selectedCompId === 'ssd' ? '#2DD4BF' : '#475569'}
                  strokeWidth="2"
                />
                <text x="285" y="214" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                  SSD (Flash)
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => setSelectedCompId('hdd')}>
                <rect
                  x="225"
                  y="242"
                  width="120"
                  height="42"
                  rx="6"
                  fill="#1E293B"
                  stroke={selectedCompId === 'hdd' ? '#2DD4BF' : '#475569'}
                  strokeWidth="2"
                />
                <text x="285" y="267" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="bold">
                  HDD (Magnetic)
                </text>
              </g>

              {/* PSU */}
              <g className="cursor-pointer" onClick={() => setSelectedCompId('psu')}>
                <rect
                  x="50"
                  y="285"
                  width="130"
                  height="62"
                  rx="6"
                  fill="#78350F"
                  stroke={selectedCompId === 'psu' ? '#FBBF24' : '#D97706'}
                  strokeWidth={selectedCompId === 'psu' ? 3 : 1.5}
                />
                <text x="115" y="314" textAnchor="middle" fill="#FEF3C7" fontSize="11" fontWeight="bold">
                  PSU (Power Supply)
                </text>
                <text x="115" y="330" textAnchor="middle" fill="#FDE68A" fontSize="9">
                  AC to DC Power
                </text>
              </g>

              {/* External Peripherals */}
              <g className="cursor-pointer" onClick={() => setSelectedCompId('monitor')}>
                <rect
                  x="410"
                  y="40"
                  width="200"
                  height="115"
                  rx="8"
                  fill="#163A63"
                  stroke={selectedCompId === 'monitor' ? '#2DD4BF' : '#64748B'}
                  strokeWidth={selectedCompId === 'monitor' ? 3 : 2}
                />
                <rect x="424" y="54" width="172" height="82" rx="4" fill="#0B192C" />
                <text x="510" y="98" textAnchor="middle" fill="#2DD4BF" fontSize="12" fontWeight="bold">
                  MONITOR (Output)
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => setSelectedCompId('keyboard')}>
                <rect
                  x="410"
                  y="185"
                  width="130"
                  height="48"
                  rx="6"
                  fill="#1E293B"
                  stroke={selectedCompId === 'keyboard' ? '#2DD4BF' : '#64748B'}
                  strokeWidth="2"
                />
                <text x="475" y="213" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                  KEYBOARD
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => setSelectedCompId('mouse')}>
                <rect
                  x="555"
                  y="185"
                  width="55"
                  height="48"
                  rx="18"
                  fill="#1E293B"
                  stroke={selectedCompId === 'mouse' ? '#2DD4BF' : '#64748B'}
                  strokeWidth="2"
                />
                <text x="582" y="213" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                  MOUSE
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => setSelectedCompId('printer')}>
                <rect
                  x="410"
                  y="255"
                  width="95"
                  height="52"
                  rx="6"
                  fill="#1E293B"
                  stroke={selectedCompId === 'printer' ? '#2DD4BF' : '#64748B'}
                  strokeWidth="2"
                />
                <text x="457" y="285" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                  PRINTER
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => setSelectedCompId('scanner')}>
                <rect
                  x="515"
                  y="255"
                  width="95"
                  height="52"
                  rx="6"
                  fill="#1E293B"
                  stroke={selectedCompId === 'scanner' ? '#2DD4BF' : '#64748B'}
                  strokeWidth="2"
                />
                <text x="562" y="285" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                  SCANNER
                </text>
              </g>

              <g className="cursor-pointer" onClick={() => setSelectedCompId('storage-external')}>
                <rect
                  x="410"
                  y="322"
                  width="200"
                  height="40"
                  rx="6"
                  fill="#0F2744"
                  stroke={selectedCompId === 'storage-external' ? '#2DD4BF' : '#475569'}
                  strokeWidth="2"
                />
                <text x="510" y="346" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontWeight="bold">
                  USB FLASH / EXTERNAL STORAGE
                </text>
              </g>
            </svg>
          </div>

          {/* Component Detail Panel + Quick Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
                {selectedComp.category}
              </p>
              <h4 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-700 dark:text-teal-400" />
                {selectedComp.name}
              </h4>

              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Primary Function</p>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300">{selectedComp.role}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">How It Interacts</p>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300">{selectedComp.interaction}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                All 15 Hardware Components
              </p>
              <div className="flex flex-wrap gap-1.5">
                {HARDWARE_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCompId(item.id)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      selectedCompId === item.id
                        ? 'border-[#0F2744] bg-[#0F2744] text-white dark:border-teal-500 dark:bg-teal-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {labTab === 'assembly' && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Virtual Computer Assembly Bench
              </h3>
              <p className="text-xs text-slate-500">
                Select a component from the parts tray (or drag it) and place it into the correct motherboard/chassis slot.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold tabular-nums">
                {completedAssemblyCount}/{ASSEMBLY_SLOTS.length} Installed
              </span>
              <button
                type="button"
                onClick={() => {
                  setPlacedSlots({});
                  setHeldPartId(null);
                  setAssemblyFeedback('Assembly bench reset.');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>

          {assemblyFeedback && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {assemblyFeedback}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Parts Tray (Click or Drag)
              </p>
              {ASSEMBLY_SLOTS.map((slot) => {
                const part = HARDWARE_ITEMS.find((h) => h.id === slot.expectedId)!;
                const alreadyInstalled = placedSlots[slot.slotId] === slot.expectedId;
                return (
                  <button
                    key={part.id}
                    type="button"
                    draggable={!alreadyInstalled}
                    onDragStart={() => setHeldPartId(part.id)}
                    disabled={alreadyInstalled}
                    onClick={() => setHeldPartId(part.id)}
                    className={`w-full rounded-lg border p-3 text-left text-xs transition-colors ${
                      alreadyInstalled
                        ? 'border-teal-300 bg-teal-50/70 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                        : heldPartId === part.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 dark:border-teal-400 dark:bg-slate-800 dark:text-white'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="font-semibold">{part.name}</p>
                    <p className="mt-0.5 text-slate-500">
                      {alreadyInstalled ? 'Installed in chassis' : heldPartId === part.id ? 'Selected — click target slot' : 'Click or drag to slot'}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ASSEMBLY_SLOTS.map((slot) => {
                const installedId = placedSlots[slot.slotId];
                const installedPart = HARDWARE_ITEMS.find((h) => h.id === installedId);
                return (
                  <div
                    key={slot.slotId}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handlePlaceInSlot(slot.slotId, slot.expectedId)}
                    onClick={() => !installedPart && handlePlaceInSlot(slot.slotId, slot.expectedId)}
                    className={`rounded-xl border-2 border-dashed p-5 transition-colors cursor-pointer flex flex-col justify-between min-h-[120px] ${
                      installedPart
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                        : 'border-slate-300 bg-slate-50/70 hover:border-blue-500 dark:border-slate-700 dark:bg-slate-950'
                    }`}
                  >
                    <p className="text-xs font-mono text-slate-500">{slot.label}</p>
                    {installedPart ? (
                      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-teal-800 dark:text-teal-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{installedPart.name}</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        {heldPartId ? 'Click here to install selected part' : 'Empty motherboard slot'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {labTab === 'matching' && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Hardware Component Matching</h3>
              <p className="text-xs text-slate-500">Match each function description to the correct hardware device.</p>
            </div>
            <button
              type="button"
              onClick={() => setMatchChecked(true)}
              className="rounded-lg bg-[#0F2744] px-4 py-2 text-xs font-semibold text-white dark:bg-teal-600"
            >
              Check Answers
            </button>
          </div>

          <div className="space-y-3">
            {matchingPairs.map((pair) => {
              const selected = matchAnswers[pair.id] || '';
              const isCorrect = selected === pair.id;
              return (
                <div
                  key={pair.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 p-3.5 dark:border-slate-800"
                >
                  <p className="text-sm font-medium">{pair.prompt}</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={selected}
                      onChange={(e) => {
                        setMatchChecked(false);
                        setMatchAnswers((prev) => ({ ...prev, [pair.id]: e.target.value }));
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">Select Component...</option>
                      <option value="cpu">CPU</option>
                      <option value="ram">RAM</option>
                      <option value="ssd">SSD</option>
                      <option value="psu">Power Supply Unit (PSU)</option>
                      <option value="scanner">Scanner</option>
                    </select>
                    {matchChecked && (
                      <span className={`text-xs font-semibold ${isCorrect ? 'text-teal-600' : 'text-red-600'}`}>
                        {isCorrect ? 'Correct' : 'Try again'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {labTab === 'troubleshoot' && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-teal-600" />
                Hardware Fault Diagnosis Lab
              </h3>
              <p className="text-xs text-slate-500">Diagnose realistic school computer lab hardware faults.</p>
            </div>
            <button
              type="button"
              onClick={() => setTroubleChecked(true)}
              className="rounded-lg bg-[#0F2744] px-4 py-2 text-xs font-semibold text-white dark:bg-teal-600"
            >
              Verify Diagnostics
            </button>
          </div>

          {TROUBLESHOOTING_CASES.map((tc, idx) => (
            <div key={tc.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm font-semibold">
                Case {idx + 1}: {tc.symptom}
              </p>
              <div className="mt-3 space-y-2">
                {tc.options.map((opt, optIdx) => (
                  <label key={opt} className="flex items-center gap-2.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name={tc.id}
                      checked={troubleAnswers[tc.id] === optIdx}
                      onChange={() => {
                        setTroubleChecked(false);
                        setTroubleAnswers((prev) => ({ ...prev, [tc.id]: optIdx }));
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {troubleChecked && (
                <p
                  className={`mt-3 text-xs font-medium ${
                    troubleAnswers[tc.id] === tc.correctIndex ? 'text-teal-700 dark:text-teal-400' : 'text-red-600'
                  }`}
                >
                  {troubleAnswers[tc.id] === tc.correctIndex ? 'Correct Diagnosis: ' : 'Review: '}
                  {tc.explanation}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {labTab === 'specs-care' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <Wind className="h-4 w-4 text-teal-600" />
              Form 1.2.1: Industrial Air Blower PC Maintenance
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Dust blocks CPU heatsinks and causes overheating in Zambian school labs. Tick each safe cleaning step in order before blowing dust out of the system unit:
            </p>
            <div className="space-y-2">
              {[
                { id: 'power', label: '1. Shut down Windows/OS completely and unplug mains power cable' },
                { id: 'ground', label: '2. Touch unpainted metal case to discharge static electricity' },
                { id: 'hold-fan', label: '3. Hold cooling fan blades gently so compressed air does not overspin bearings' },
                { id: 'bursts', label: '4. Use short dry bursts with the industrial air blower from 15 cm away' },
                { id: 'cover', label: '5. Reattach side panel cleanly and verify all fans spin on boot' },
              ].map((step) => {
                const checked = blowerDoneSteps.includes(step.id);
                return (
                  <label
                    key={step.id}
                    className={`flex items-center gap-2.5 rounded-lg border p-3 text-xs cursor-pointer ${
                      checked
                        ? 'border-teal-400 bg-teal-50/70 dark:border-teal-700 dark:bg-teal-950/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setBlowerDoneSteps((prev) =>
                          prev.includes(step.id) ? prev.filter((x) => x !== step.id) : [...prev, step.id]
                        )
                      }
                    />
                    <span>{step.label}</span>
                  </label>
                );
              })}
            </div>
            {blowerDoneSteps.length === 5 && (
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                All 5 air blower maintenance safety steps verified! Never use wet cloths or vacuum nozzles on exposed circuit boards.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <Cpu className="h-4 w-4 text-blue-700 dark:text-teal-400" />
              Minimum Computer Specs Checker (Syllabus 1.2.1)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Test whether a candidate desktop/laptop meets the Zambian ICT Syllabus baseline: 4-core CPU (1.6 GHz+), 8 GB RAM, and 120 GB SSD.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">CPU Cores</span>
                <select
                  value={specCores}
                  onChange={(e) => setSpecCores(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value={2}>2 Cores (Dual-Core)</option>
                  <option value={4}>4 Cores (Quad-Core)</option>
                  <option value={8}>8 Cores</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">Clock Speed (GHz)</span>
                <select
                  value={specCpuGhz}
                  onChange={(e) => setSpecCpuGhz(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value={1.1}>1.1 GHz</option>
                  <option value={1.6}>1.6 GHz</option>
                  <option value={2.0}>2.0 GHz</option>
                  <option value={3.2}>3.2 GHz</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">RAM Capacity</span>
                <select
                  value={specRamGb}
                  onChange={(e) => setSpecRamGb(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value={4}>4 GB RAM</option>
                  <option value={8}>8 GB RAM</option>
                  <option value={16}>16 GB RAM</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">SSD Storage</span>
                <select
                  value={specSsdGb}
                  onChange={(e) => setSpecSsdGb(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value={64}>64 GB eMMC</option>
                  <option value={128}>128 GB SSD</option>
                  <option value={256}>256 GB SSD</option>
                  <option value={512}>512 GB NVMe SSD</option>
                </select>
              </label>
            </div>
            {(() => {
              const meets = specCores >= 4 && specCpuGhz >= 1.6 && specRamGb >= 8 && specSsdGb >= 120;
              return (
                <div
                  className={`rounded-lg border p-3.5 text-xs ${
                    meets
                      ? 'border-teal-300 bg-teal-50/70 text-teal-900 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200'
                      : 'border-amber-300 bg-amber-50/70 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                  }`}
                >
                  <p className="font-semibold">
                    {meets
                      ? 'Meets Syllabus Recommended Baseline'
                      : 'Below Syllabus Baseline — Upgrade Required'}
                  </p>
                  <p className="mt-1">
                    {specCores >= 4 ? '✓' : '✗'} 4+ CPU Cores · {specCpuGhz >= 1.6 ? '✓' : '✗'} 1.6 GHz+ ·{' '}
                    {specRamGb >= 8 ? '✓' : '✗'} 8 GB+ RAM · {specSsdGb >= 120 ? '✓' : '✗'} 120 GB+ SSD
                  </p>
                </div>
              );
            })()}
          </section>
        </div>
      )}

      {labTab === 'real-photos' && <RealEquipmentPhotos />}
    </div>
  );
};
