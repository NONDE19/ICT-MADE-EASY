import { DBSchema, openDB, IDBPDatabase } from 'idb';
import { VirtualDesktopStateData } from '../types/index.ts';

interface VirtuoOfflineSchema extends DBSchema {
  cachedLessons: {
    key: string;
    value: {
      moduleSlug: string;
      moduleNumber: number;
      formLevel?: number;
      syllabusCode?: string;
      title: string;
      subtitle: string;
      description?: string;
      category?: string;
      lessons: Array<{
        id: string;
        slug: string;
        title: string;
        summary: string;
        contentJson: string;
        estimatedMins: number;
      }>;
      questions: Array<{
        id: string;
        questionText: string;
        optionsJson: string;
        correctIndex: number;
        explanation: string;
        marks: number;
      }>;
      cachedAt: string;
    };
  };
  pendingSync: {
    key: number;
    value: {
      id?: number;
      endpoint: string;
      method: string;
      body: string;
      description: string;
      createdAt: string;
    };
  };
  appCache: {
    key: string;
    value: {
      key: string;
      data: unknown;
      updatedAt: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VirtuoOfflineSchema>> | null = null;

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<VirtuoOfflineSchema>('virtuolab-offline-v1', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cachedLessons')) {
          db.createObjectStore('cachedLessons', { keyPath: 'moduleSlug' });
        }
        if (!db.objectStoreNames.contains('pendingSync')) {
          db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('appCache')) {
          db.createObjectStore('appCache', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheModulesOffline(
  modules: Array<{
    slug: string;
    number: number;
    formLevel?: number;
    syllabusCode?: string;
    title: string;
    subtitle: string;
    description?: string;
    category?: string;
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string;
      contentJson: string;
      estimatedMins: number;
    }>;
    questions: Array<{
      id: string;
      questionText: string;
      optionsJson: string;
      correctIndex: number;
      explanation: string;
      marks: number;
    }>;
  }>
) {
  if (!hasIndexedDb()) return;
  const db = await getDb();
  const tx = db.transaction('cachedLessons', 'readwrite');
  const now = new Date().toISOString();
  for (const mod of modules) {
    await tx.store.put({
      moduleSlug: mod.slug,
      moduleNumber: mod.number,
      formLevel: mod.formLevel,
      syllabusCode: mod.syllabusCode,
      title: mod.title,
      subtitle: mod.subtitle,
      description: mod.description,
      category: mod.category,
      lessons: mod.lessons,
      questions: mod.questions,
      cachedAt: now,
    });
  }
  await tx.done;
}

export async function getAllCachedModules() {
  if (!hasIndexedDb()) return [];
  const db = await getDb();
  return db.getAll('cachedLessons');
}

export async function getCachedModuleBySlug(slug: string) {
  if (!hasIndexedDb()) return undefined;
  const db = await getDb();
  return db.get('cachedLessons', slug);
}

export async function queueOfflineAction(
  endpoint: string,
  method: string,
  bodyObj: unknown,
  description: string
) {
  if (!hasIndexedDb()) return;
  const db = await getDb();
  await db.add('pendingSync', {
    endpoint,
    method,
    body: JSON.stringify(bodyObj),
    description,
    createdAt: new Date().toISOString(),
  });
}

export async function getPendingSyncItems() {
  if (!hasIndexedDb()) return [];
  const db = await getDb();
  return db.getAll('pendingSync');
}

export async function removePendingSyncItem(id: number) {
  if (!hasIndexedDb()) return;
  const db = await getDb();
  await db.delete('pendingSync', id);
}

export async function setCachedJson<T>(key: string, data: T): Promise<void> {
  if (!hasIndexedDb()) return;
  const db = await getDb();
  await db.put('appCache', {
    key,
    data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  if (!hasIndexedDb()) return null;
  const db = await getDb();
  const entry = await db.get('appCache', key);
  return entry ? (entry.data as T) : null;
}

export interface OfflineFallbackModule {
  moduleSlug: string;
  moduleNumber: number;
  formLevel: number;
  syllabusCode: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  lessons: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    contentJson: string;
    estimatedMins: number;
  }>;
  questions: Array<{
    id: string;
    questionText: string;
    optionsJson: string;
    correctIndex: number;
    explanation: string;
    marks: number;
  }>;
}

export const OFFLINE_FALLBACK_MODULES: OfflineFallbackModule[] = [
  {
    moduleSlug: 'ict-and-computer-evolution',
    moduleNumber: 1,
    formLevel: 1,
    syllabusCode: '1.1 & 1.6',
    title: 'Introduction to ICT, Evolution & Business',
    subtitle: 'Topic 1.1 & 1.6: History of Computers, ICT Tools & Impact in Zambia',
    description: 'Explore computer evolution from the Abacus to microprocessors and how ICT supports Zambian communities and businesses.',
    category: 'Form 1 · Foundations',
    lessons: [
      {
        id: 'off-l-1',
        slug: 'intro-to-ict-and-computers',
        title: '1.1.2 Basic ICT Concepts, Tools & Core Functions (IPOS)',
        summary: 'Understand ICT tools and the Input–Process–Output–Storage cycle.',
        estimatedMins: 12,
        contentJson: JSON.stringify({
          note: 'Loaded from built-in offline curriculum pack (works without internet).',
          sections: [
            {
              heading: 'ICT in Zambian Schools & Communities (1.1 & 1.6)',
              body: 'ICT combines hardware, software, and communication tools to handle information across schools, hospitals, agriculture, and ZRA/mobile money services.',
            },
            {
              heading: 'Input–Process–Output–Storage (IPOS)',
              body: 'Computers accept data via input devices, process instructions in the CPU, output information to monitors/printers, and store data on SSDs, HDDs, or USB flash drives.',
            },
          ],
        }),
      },
    ],
    questions: [
      {
        id: 'off-q-1',
        questionText: 'Which sequence shows the four core operations of every computer system?',
        optionsJson: JSON.stringify(['Input -> Process -> Output -> Storage', 'Output -> Input -> Print -> Delete', 'Storage -> Monitor -> Mouse -> Keyboard']),
        correctIndex: 0,
        explanation: 'All computers follow the IPOS cycle: Input, Process, Output, and Storage.',
        marks: 5,
      },
    ],
  },
  {
    moduleSlug: 'computer-hardware-laboratory',
    moduleNumber: 2,
    formLevel: 1,
    syllabusCode: '1.2.1',
    title: 'Components of Computer Systems: Hardware & Care',
    subtitle: 'Topic 1.2.1: CPU, RAM/ROM, Air Blower Care & System Specs',
    description: 'Inspect internal hardware parts, build a virtual desktop, and practice hardware maintenance using an industrial air blower.',
    category: 'Form 1 · Hardware',
    lessons: [
      {
        id: 'off-l-2',
        slug: 'internal-system-components',
        title: '1.2.1 System Unit, Air Blower Care & Minimum Specs',
        summary: 'Identify CPU, RAM, ROM, SSD, HDD, PSU and minimum specs (4-core 1.6GHz+, 8GB RAM, 120GB SSD).',
        estimatedMins: 15,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Maintenance with an Industrial Air Blower',
              body: 'Dust traps heat inside cooling fins and fans. Power off and unplug the computer, hold fan blades still, and use short dry air bursts from a safe distance.',
            },
            {
              heading: 'Minimum School PC Specifications',
              body: 'Zambian syllabus guidelines recommend at least a 4-core CPU (1.6 GHz+), 8 GB RAM, and a 120 GB SSD for responsive multitasking.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'computer-software',
    moduleNumber: 3,
    formLevel: 1,
    syllabusCode: '1.2.2 & 1.3',
    title: 'Software Types & File Management Basics',
    subtitle: 'Topics 1.2.2 & 1.3: System/Application/Utility Software, Folders & Backup',
    description: 'Distinguish system software, application software, and utility software, and manage folders and USB Flash Disk (E:) backups.',
    category: 'Form 1 · Software & Files',
    lessons: [
      {
        id: 'off-l-3',
        slug: 'file-management-and-backup',
        title: '1.3 Organizing Folders, Naming Files & USB Flash Backup',
        summary: 'Create folders, move/copy files, recover from Recycle Bin, and back up to USB Flash Disk (E:).',
        estimatedMins: 14,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Structured School Folders & USB Backups',
              body: 'Keep work inside clear folders such as Documents/ICT and back up important assignments onto USB Flash Disk (E:) in the File Manager.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'operating-systems',
    moduleNumber: 4,
    formLevel: 2,
    syllabusCode: '2.1 & OS',
    title: 'File Compression, Encryption & Operating Systems',
    subtitle: 'Topic 2.1: ZIP Archives, File Encryption & OS Controls',
    description: 'Compress files into .zip archives, protect confidential documents with .enc encryption passphrases, and explore OS process management.',
    category: 'Form 2 · Systems & Security',
    lessons: [
      {
        id: 'off-l-4',
        slug: 'compression-and-encryption',
        title: '2.1 File Compression (.zip) & Encryption (.enc)',
        summary: 'Reduce file size using .zip compression and scramble private files with a passphrase.',
        estimatedMins: 15,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Compression vs Encryption',
              body: 'Compression (.zip) shrinks file size for faster sharing; Encryption (.enc) protects confidential files with a password.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'word-processing-simulator',
    moduleNumber: 5,
    formLevel: 2,
    syllabusCode: '2.2.1',
    title: 'Word Processing & Document Layout',
    subtitle: 'Topic 2.2.1: Margins, Columns, Headers/Footers, Tables & Hyperlinks',
    description: 'Format formal letters and reports in Word Writer using Bold, Underline, Tables, Hyperlinks, Columns, Orientation, and Headers/Footers.',
    category: 'Form 2 · Productivity',
    lessons: [
      {
        id: 'off-l-5',
        slug: 'formatting-school-documents',
        title: '2.2.1 Page Setup, Headers/Footers, Tables & Columns',
        summary: 'Apply professional document layout tools in Word Writer.',
        estimatedMins: 15,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Document Layout Controls',
              body: 'Use Portrait/Landscape orientation, 1 or 2 columns, inserted tables, hyperlinks, headers, and numbered footers.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'spreadsheet-simulator',
    moduleNumber: 6,
    formLevel: 2,
    syllabusCode: '2.2.2–2.2.4',
    title: 'Spreadsheets, Presentations & Desktop Publishing',
    subtitle: 'Topics 2.2.2–2.2.4: SUM, AVERAGE, MIN/MAX/COUNT, Slides & Posters',
    description: 'Analyse budgets and term marks in CalcSheet, animate slide transitions in SlideDeck, and design posters/flyers in Publisher Studio.',
    category: 'Form 2 · Office & Design',
    lessons: [
      {
        id: 'off-l-6',
        slug: 'formulas-and-charts',
        title: '2.2.2–2.2.4 Spreadsheets, Slide Transitions & Publisher Flyers',
        summary: 'Combine CalcSheet formulas, SlideDeck transitions, and Publisher Studio templates.',
        estimatedMins: 16,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Essential Form 2 Tools',
              body: 'In CalcSheet use =SUM(), =AVERAGE(), =MIN(), =MAX(), and =COUNT(). In SlideDeck set per-slide transitions, and in Publisher Studio design event flyers and posters.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'virtual-computer-desktop',
    moduleNumber: 7,
    formLevel: 2,
    syllabusCode: '1.5, 2.3 & 2.4',
    title: 'Email (EduMail), Digital Literacy & E-Business',
    subtitle: 'Topics 1.5, 2.3 & 2.4: Attachments, Netiquette, ECZ Results & Mobile Money',
    description: 'Compose emails with attachments following netiquette rules, and practice Zambian ECZ result checking and mobile money safety.',
    category: 'Form 2 · Communication',
    lessons: [
      {
        id: 'off-l-7',
        slug: 'email-and-netiquette',
        title: '2.3–2.4 Email Attachments, Netiquette & E-Services',
        summary: 'Use Inbox, Drafts, Sent folders and inspect Zambian e-government & mobile finance portals.',
        estimatedMins: 14,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Email & Zambian Digital Services',
              body: 'Always include a polite greeting and clear Subject line in EduMail. Keep ECZ examination numbers private and verify merchant names before confirming mobile money PINs.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'website-design-templates',
    moduleNumber: 8,
    formLevel: 3,
    syllabusCode: '3.1',
    title: 'Website Design Using Templates',
    subtitle: 'Topic 3.1: Planning, Customizing & Publishing School Websites',
    description: 'Build structured websites using templates, customize navigation links and hero content, and publish .vweb sites in WebBuilder Studio.',
    category: 'Form 3 · Web Design',
    lessons: [
      {
        id: 'off-l-8',
        slug: 'designing-websites-with-templates',
        title: '3.1 Choosing Templates, Organizing Pages & Publishing',
        summary: 'Design and publish multi-link school portals in WebBuilder Studio.',
        estimatedMins: 15,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Template-Based Website Design',
              body: 'Templates provide responsive structure, navigation menus, and colour themes so clubs and schools can publish clean pages quickly.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'cloud-computing-storage',
    moduleNumber: 9,
    formLevel: 3,
    syllabusCode: '3.2 & 4.2',
    title: 'Cloud Storage & Online Collaboration',
    subtitle: 'Topics 3.2 & 4.2: Google Drive, OneDrive, Dropbox & Permissions',
    description: 'Upload documents to CloudDrive Sync, manage View vs Edit collaborator permissions, and compare offline vs cloud storage.',
    category: 'Form 3 · Cloud & Sync',
    lessons: [
      {
        id: 'off-l-9',
        slug: 'cloud-storage-collaboration',
        title: '3.2 Cloud Storage vs Local Storage & Permissions',
        summary: 'Share files with View or Edit permissions and synchronize when online.',
        estimatedMins: 14,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Shared Collaboration Safety',
              body: 'Grant View access when classmates should only read notes, and Edit access only to trusted group members.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'intermediate-spreadsheets',
    moduleNumber: 10,
    formLevel: 3,
    syllabusCode: '3.3',
    title: 'Intermediate Spreadsheets & Data Lookup',
    subtitle: 'Topic 3.3: VLOOKUP, CONCATENATE, SUMIF, COUNTA & Sheet Locking',
    description: 'Automate grading sheets with VLOOKUP, CONCATENATE, SUMIF, COUNTA, descending Sort Marks, and Lock Sheet protection.',
    category: 'Form 3 · Data Analysis',
    lessons: [
      {
        id: 'off-l-10',
        slug: 'vlookup-and-concatenate',
        title: '3.3 Using VLOOKUP, CONCATENATE & Sheet Protection',
        summary: 'Combine names, compute conditional sums, look up grade tables, and lock sheets.',
        estimatedMins: 18,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Intermediate CalcSheet Functions',
              body: 'Use =CONCATENATE(A2," ",B2) to join names, =SUMIF(C2:C6,">70") for conditional totals, =VLOOKUP(C2,E2:F6,2,TRUE) for grade lookup, and Lock Sheet to prevent accidental edits.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'internet-and-networking',
    moduleNumber: 11,
    formLevel: 4,
    syllabusCode: '1.4 & 4.1–4.2',
    title: 'Computer Networking, Tethering & Cloud Comparison',
    subtitle: 'Topics 1.4, 4.1 & 4.2: PAN, LAN, WAN, Fiber, Hotspot, Tethering & Casting',
    description: 'Compare PAN, LAN, and WAN networks, Fiber Optic vs Wi-Fi/Ethernet, mobile hotspots, Bluetooth/USB tethering, and screen casting.',
    category: 'Form 4 · Networks',
    lessons: [
      {
        id: 'off-l-11',
        slug: 'networks-and-browsers',
        title: '4.1 PAN, LAN, WAN, Fiber Optic & Mobile Tethering',
        summary: 'Understand how devices connect across classrooms, hotspots, and national networks.',
        estimatedMins: 16,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'PAN, LAN, WAN & Mobile Tethering',
              body: 'PAN connects personal Bluetooth devices (~10m); LAN connects a school lab via switch/Wi-Fi; WAN spans cities via Fiber Optic and cellular links.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
  {
    moduleSlug: 'cybersecurity-and-digital-safety',
    moduleNumber: 12,
    formLevel: 4,
    syllabusCode: '3.4, 4.3 & 4.4',
    title: 'Cybersecurity, Malware & Digital Citizenship',
    subtitle: 'Topics 3.4, 4.3 & 4.4: Antivirus, Malware Types, Lab Policy & Fact vs Bias',
    description: 'Detect viruses, worms, trojans, spyware, and phishing scams, practice Antivirus scans, and distinguish fact, opinion, and bias online.',
    category: 'Form 4 · Cyber Safety',
    lessons: [
      {
        id: 'off-l-12',
        slug: 'digital-citizenship-fact-bias',
        title: '3.4, 4.3 & 4.4 Antivirus Protection & Digital Citizenship',
        summary: 'Defend against malware, follow computer lab policies, and evaluate digital media critically.',
        estimatedMins: 16,
        contentJson: JSON.stringify({
          sections: [
            {
              heading: 'Malware Defense & Critical Media Literacy',
              body: 'Always keep antivirus scanning active against Viruses, Worms, Trojans, and Spyware. Verify facts with credible sources before sharing information online.',
            },
          ],
        }),
      },
    ],
    questions: [],
  },
];

export function createDefaultOfflineDesktopState(): VirtualDesktopStateData {
  const now = new Date().toISOString();
  return {
    id: 'offline-desktop-state',
    pupilId: 'offline-guest',
    wallpaper: 'zambia-dawn',
    themeMode: 'dark',
    iconSize: 'medium',
    showClock: true,
    settingsJson: '{}',
    folders: [
      {
        id: 'offline-folder-docs',
        desktopStateId: 'offline-desktop-state',
        name: 'Documents',
        parentId: null,
        isDeleted: false,
        deletedAt: null,
      },
      {
        id: 'offline-folder-pics',
        desktopStateId: 'offline-desktop-state',
        name: 'Pictures',
        parentId: null,
        isDeleted: false,
        deletedAt: null,
      },
      {
        id: 'offline-folder-school',
        desktopStateId: 'offline-desktop-state',
        name: 'Schoolwork',
        parentId: null,
        isDeleted: false,
        deletedAt: null,
      },
    ],
    files: [
      {
        id: 'offline-file-welcome',
        desktopStateId: 'offline-desktop-state',
        folderId: 'offline-folder-docs',
        name: 'Welcome to ICT Made Easy',
        fileType: 'document',
        extension: '.vdoc',
        contentJson: JSON.stringify({
          title: 'Welcome to ICT Made Easy',
          html: '<p><b>Welcome to your Virtual Computer Desktop!</b></p><p>You are running in offline storage mode. Folders, documents, spreadsheets, slides, posters, emails, and websites are saved locally in your browser.</p>',
          plainText:
            'Welcome to your Virtual Computer Desktop! You are running in offline storage mode. Folders, documents, spreadsheets, slides, posters, emails, and websites are saved locally in your browser.',
          fontFamily: 'DM Sans',
          fontSize: 16,
        }),
        sizeBytes: 360,
        isDeleted: false,
        deletedAt: null,
        updatedAt: now,
      },
      {
        id: 'offline-file-marks',
        desktopStateId: 'offline-desktop-state',
        folderId: 'offline-folder-school',
        name: 'Term1_ICT_Marks',
        fileType: 'spreadsheet',
        extension: '.vsheet',
        contentJson: JSON.stringify({
          cells: {
            A1: { raw: 'Student' },
            B1: { raw: 'Marks' },
            A2: { raw: 'Lombe' },
            B2: { raw: '84' },
            A3: { raw: 'Thandiwe' },
            B3: { raw: '92' },
            A4: { raw: 'Kelvin' },
            B4: { raw: '76' },
            A5: { raw: 'Total' },
            B5: { raw: '=SUM(B2:B4)' },
            A6: { raw: 'Average' },
            B6: { raw: '=AVERAGE(B2:B4)' },
          },
          locked: false,
        }),
        sizeBytes: 240,
        isDeleted: false,
        deletedAt: null,
        updatedAt: now,
      },
    ],
  };
}
