import hardwareImg from '../assets/images/hardware_tools_kit_1794603403531.jpg';
import productivityImg from '../assets/images/productivity_publishing_tools_1794603403567.jpg';
import fileSecurityImg from '../assets/images/file_security_tools_1794603404414.jpg';
import networkingImg from '../assets/images/networking_devices_kit_1794603404697.jpg';
import digitalSafetyImg from '../assets/images/digital_safety_tools_1794603405701.jpg';

export interface SyllabusToolCategory {
  id: string;
  title: string;
  syllabusScope: string;
  formLevels: number[];
  imageUrl: string;
  imageAlt: string;
  summary: string;
  practiceRoute: 'hardware-lab' | 'virtual-desktop' | 'networking' | 'cybersecurity' | 'assessments';
  practiceLabel: string;
  tools: Array<{
    name: string;
    syllabusTopic: string;
    formLevel: 1 | 2 | 3 | 4;
    realWorldExamples: string;
    whatItDoes: string;
  }>;
}

export const SYLLABUS_TOOL_CATEGORIES: SyllabusToolCategory[] = [
  {
    id: 'hardware-maintenance',
    title: 'Computer Hardware, Peripherals & Maintenance Kit',
    syllabusScope: 'Form 1 · Topics 1.2.1 & 1.2.2',
    formLevels: [1],
    imageUrl: hardwareImg,
    imageAlt:
      'Educational kit showing motherboard, CPU processor chip, RAM module, SSD, monitor, keyboard, mouse, USB flash drive, and industrial air blower',
    summary:
      'Covers core input, processing, memory, storage, output hardware, and preventive lab cleaning recommended in the 2024 Zambian ICT syllabus (including minimum 4-core CPU, 8GB RAM, 120GB SSD specs).',
    practiceRoute: 'hardware-lab',
    practiceLabel: 'Open Hardware Assembly Lab',
    tools: [
      {
        name: 'Motherboard, CPU & RAM',
        syllabusTopic: '1.2.1 Hardware',
        formLevel: 1,
        realWorldExamples: '64-bit 4-core 1.6 GHz+ CPU, 8 GB DDR RAM',
        whatItDoes: 'Executes program instructions and holds active running data while powered on.',
      },
      {
        name: 'Solid-State Drive (SSD) & USB Flash Drive',
        syllabusTopic: '1.2.1 & 1.3 Storage',
        formLevel: 1,
        realWorldExamples: '120 GB+ SSD, USB 3.0 Flash Disk, External HDD',
        whatItDoes: 'Stores the operating system, school projects, and portable offline backups.',
      },
      {
        name: 'Input & Output Peripherals',
        syllabusTopic: '1.2.1 Peripherals',
        formLevel: 1,
        realWorldExamples: 'Keyboard, Mouse, Monitor, Printer, Scanner',
        whatItDoes: 'Captures commands/documents into the PC and displays or prints finished work.',
      },
      {
        name: 'Industrial Air Blower',
        syllabusTopic: '1.2.1 Lab Care',
        formLevel: 1,
        realWorldExamples: 'Dust Blower (unplugged maintenance)',
        whatItDoes: 'Safely clears dust from motherboard heatsinks and power vents without moisture.',
      },
    ],
  },
  {
    id: 'file-compression-encryption',
    title: 'File Management, Compression, Encryption & Backup Tools',
    syllabusScope: 'Form 1 & Form 2 · Topics 1.3 & 2.1',
    formLevels: [1, 2],
    imageUrl: fileSecurityImg,
    imageAlt:
      'Visual illustration of nested Schoolwork folders, compressed ZIP archive, encryption padlock shield, USB backup drive, and cloud sync arrows',
    summary:
      'Teaches structured folder trees (Schoolwork → Math/Science/ICT), descriptive file naming, shrinking files into .zip archives, and password-encrypting confidential records.',
    practiceRoute: 'virtual-desktop',
    practiceLabel: 'Practise in Virtual File Manager',
    tools: [
      {
        name: 'File Explorer & Recycle Bin',
        syllabusTopic: '1.3 File Management',
        formLevel: 1,
        realWorldExamples: 'Windows Explorer, Virtual File Manager',
        whatItDoes: 'Creates nested folders, renames, sorts, searches, copies to USB (E:), and restores deleted files.',
      },
      {
        name: 'File Compression Utilities (.zip)',
        syllabusTopic: '2.1 Compression',
        formLevel: 2,
        realWorldExamples: 'WinRAR, 7-Zip, PowerISO, Built-in ZIP',
        whatItDoes: 'Bundles multiple files into a smaller .zip archive for low-bandwidth sharing and backup.',
      },
      {
        name: 'File & Drive Encryption (.enc)',
        syllabusTopic: '2.1 Encryption',
        formLevel: 2,
        realWorldExamples: 'BitLocker, Password-Protected Archives',
        whatItDoes: 'Scrambles confidential school files with a secret passphrase so only authorized users can decrypt.',
      },
      {
        name: 'USB Flash & Cloud Backup',
        syllabusTopic: '1.3 & 3.2 Backup',
        formLevel: 1,
        realWorldExamples: 'USB Flash Disk, Google Drive, OneDrive, Dropbox, iCloud',
        whatItDoes: 'Protects assignments from accidental deletion or hardware loss.',
      },
    ],
  },
  {
    id: 'productivity-publishing-web',
    title: 'Word Processing, Spreadsheets, Slides, Publishing & Web Design',
    syllabusScope: 'Form 2 & Form 3 · Topics 2.2.1–2.2.4, 3.1 & 3.3',
    formLevels: [2, 3],
    imageUrl: productivityImg,
    imageAlt:
      'Illustrated workspace showing word processing report, spreadsheet formulas with bar chart, presentation slides, and desktop publishing poster layout',
    summary:
      'Demonstrates the complete productivity suite simulated inside the ICT Made Easy Virtual Desktop: formatting reports, writing Form 2–3 formulas, designing posters, and publishing template websites.',
    practiceRoute: 'virtual-desktop',
    practiceLabel: 'Launch Productivity Apps',
    tools: [
      {
        name: 'Word Writer (Word Processing)',
        syllabusTopic: '2.2.1 Word Processing',
        formLevel: 2,
        realWorldExamples: 'Microsoft Word, LibreOffice Writer',
        whatItDoes: 'Formats essays with custom margins, columns, headers/footers, page numbers, tables, and hyperlinks.',
      },
      {
        name: 'CalcSheet (Form 2 & 3 Spreadsheets)',
        syllabusTopic: '2.2.2 & 3.3 Spreadsheets',
        formLevel: 3,
        realWorldExamples: 'Excel, Calc (=SUM, =MIN, =MAX, =COUNT, =SUMIF, =VLOOKUP, =CONCATENATE)',
        whatItDoes: 'Automates mark sheets, school budgets, lookups, row sorting, sheet locking, and visual charts.',
      },
      {
        name: 'SlideDeck & Publisher',
        syllabusTopic: '2.2.3 Slides & 2.2.4 Publishing',
        formLevel: 2,
        realWorldExamples: 'PowerPoint, Microsoft Publisher, Canva',
        whatItDoes: 'Builds animated slideshows and printed flyers, posters, calendars, and business cards.',
      },
      {
        name: 'WebBuilder & CloudDrive',
        syllabusTopic: '3.1 Web Design & 3.2 Cloud',
        formLevel: 3,
        realWorldExamples: 'Google Sites, WordPress, Canva Sites, Google Drive, OneDrive',
        whatItDoes: 'Customizes template school websites and shares documents with View/Edit permissions.',
      },
    ],
  },
  {
    id: 'networking-and-online-services',
    title: 'Networking, Hotspots, Tethering & E-Business Portals',
    syllabusScope: 'Form 1, Form 2 & Form 4 · Topics 1.4, 2.3, 2.4 & 4.1',
    formLevels: [1, 2, 4],
    imageUrl: networkingImg,
    imageAlt:
      'Educational networking diagram showing Wi-Fi router, fiber optic modem, Ethernet RJ45 cable, laptop, and smartphone tethering hotspot',
    summary:
      'Illustrates modems, routers, Ethernet cabling, fiber optic WAN links, mobile hotspots, Bluetooth/USB tethering, screen casting, email clients, mobile money, and ECZ result portals.',
    practiceRoute: 'networking',
    practiceLabel: 'Open Internet & Networking Lab',
    tools: [
      {
        name: 'PAN, LAN & WAN Hardware',
        syllabusTopic: '1.4 & 4.1 Networking',
        formLevel: 4,
        realWorldExamples: 'Modem, Wi-Fi Router, Switch, RJ45 Ethernet, Fiber Optic',
        whatItDoes: 'Links personal devices (PAN), school classrooms (LAN), and regional internet links (WAN).',
      },
      {
        name: 'Hot-spotting, Tethering & Casting',
        syllabusTopic: '4.1 Wireless Sharing',
        formLevel: 4,
        realWorldExamples: 'Wi-Fi Hotspot, USB/Bluetooth Tethering, Screen Cast',
        whatItDoes: 'Shares cellular internet to laptops and mirrors lessons to classroom projectors.',
      },
      {
        name: 'EduMail & Virtual Classrooms',
        syllabusTopic: '1.4, 1.5 & 2.3 Communication',
        formLevel: 2,
        realWorldExamples: 'Gmail, Outlook, Yahoo Mail, Google Classroom, Zoom',
        whatItDoes: 'Sends structured emails with attachments, sorts Inbox/Drafts/Sent, and supports online study.',
      },
      {
        name: 'ECZ Results Portal & Mobile Finance',
        syllabusTopic: '1.6 & 2.4 ICT in Business',
        formLevel: 2,
        realWorldExamples: 'ECZ Exam Results Lookup, Mobile Money, Online Banking',
        whatItDoes: 'Demonstrates digital payments and checking national examination results safely offline.',
      },
    ],
  },
  {
    id: 'cybersecurity-digital-citizenship',
    title: 'Cybersecurity, Antivirus, Malware Defence & Digital Citizenship',
    syllabusScope: 'Form 3 & Form 4 · Topics 3.4, 4.3 & 4.4',
    formLevels: [3, 4],
    imageUrl: digitalSafetyImg,
    imageAlt:
      'Cybersecurity illustration depicting antivirus scanning shield, password manager vault, phishing email warning filter, and responsible digital citizenship',
    summary:
      'Equips Form 3 and Form 4 learners to defend against viruses, worms, trojans, spyware, phishing/pharming, guard IP identity, and distinguish facts from opinions and bias.',
    practiceRoute: 'cybersecurity',
    practiceLabel: 'Open Cyber Safety & Malware Lab',
    tools: [
      {
        name: 'Antivirus & Malware Scanner',
        syllabusTopic: '3.4 & 4.3 Malware Analysis',
        formLevel: 4,
        realWorldExamples: 'Antivirus Quarantine (Virus, Worm, Trojan, Spyware)',
        whatItDoes: 'Detects suspicious downloads/USB threats and quarantines malicious software.',
      },
      {
        name: 'Password Vault & Strong Passphrases',
        syllabusTopic: '3.4 Security Hygiene',
        formLevel: 3,
        realWorldExamples: 'Bitwarden, 10+ char mixed-symbol passphrases',
        whatItDoes: 'Prevents account hijacking using unique complex passwords per service.',
      },
      {
        name: 'Phishing & Pharming Detector',
        syllabusTopic: '3.4 Threat Awareness',
        formLevel: 3,
        realWorldExamples: 'Email header & URL domain inspection',
        whatItDoes: 'Identifies fake urgent emails and look-alike web addresses targeting passwords.',
      },
      {
        name: 'Digital Identity & Fact vs Bias Checker',
        syllabusTopic: '4.4 Digital Citizenship',
        formLevel: 4,
        realWorldExamples: 'IP privacy, respectful communication, screen-time balance',
        whatItDoes: 'Helps learners verify facts against biased claims and maintain healthy digital habits.',
      },
    ],
  },
];
