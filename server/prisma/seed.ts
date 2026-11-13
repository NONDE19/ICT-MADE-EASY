import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding ICT Made Easy (Zambian Form 1–4 ICT Curriculum) database...');

  // 1. Schools
  const schoolLusaka = await prisma.school.upsert({
    where: { code: 'LCSS-01' },
    update: {},
    create: {
      name: 'Lusaka Central Secondary School',
      code: 'LCSS-01',
      province: 'Lusaka',
      district: 'Lusaka',
      isActive: true,
    },
  });

  const schoolNdola = await prisma.school.upsert({
    where: { code: 'NTHS-02' },
    update: {},
    create: {
      name: 'Ndola Technical High School',
      code: 'NTHS-02',
      province: 'Copperbelt',
      district: 'Ndola',
      isActive: true,
    },
  });

  // 2. Demo Accounts (Development Mode Only)
  const adminHash = await bcrypt.hash('Admin@2026!', 10);
  const teacherHash = await bcrypt.hash('Teacher@2026!', 10);
  const pupilHash = await bcrypt.hash('Pupil@2026!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@virtuolab.edu.zm' },
    update: {},
    create: {
      email: 'admin@virtuolab.edu.zm',
      username: 'admin',
      passwordHash: adminHash,
      fullName: 'Chanda Mulenga (System Admin)',
      role: 'ADMIN',
      schoolId: schoolLusaka.id,
    },
  });

  const teacherLusaka = await prisma.user.upsert({
    where: { email: 'teacher@virtuolab.edu.zm' },
    update: {},
    create: {
      email: 'teacher@virtuolab.edu.zm',
      username: 'teacher.mwamba',
      passwordHash: teacherHash,
      fullName: 'Mutale Mwamba',
      role: 'TEACHER',
      schoolId: schoolLusaka.id,
    },
  });

  const teacherNdola = await prisma.user.upsert({
    where: { email: 'ndola.teacher@virtuolab.edu.zm' },
    update: {},
    create: {
      email: 'ndola.teacher@virtuolab.edu.zm',
      username: 'teacher.banda',
      passwordHash: teacherHash,
      fullName: 'Grace Banda',
      role: 'TEACHER',
      schoolId: schoolNdola.id,
    },
  });

  const pupil1 = await prisma.user.upsert({
    where: { email: 'pupil@virtuolab.edu.zm' },
    update: {},
    create: {
      email: 'pupil@virtuolab.edu.zm',
      username: 'pupil.kabwe',
      passwordHash: pupilHash,
      fullName: 'Lombe Kabwe',
      role: 'PUPIL',
      schoolId: schoolLusaka.id,
    },
  });

  const pupil2 = await prisma.user.upsert({
    where: { email: 'thandiwe@virtuolab.edu.zm' },
    update: {},
    create: {
      email: 'thandiwe@virtuolab.edu.zm',
      username: 'pupil.phiri',
      passwordHash: pupilHash,
      fullName: 'Thandiwe Phiri',
      role: 'PUPIL',
      schoolId: schoolLusaka.id,
    },
  });

  const pupilNdola = await prisma.user.upsert({
    where: { email: 'kelvin@virtuolab.edu.zm' },
    update: {},
    create: {
      email: 'kelvin@virtuolab.edu.zm',
      username: 'pupil.zulu',
      passwordHash: pupilHash,
      fullName: 'Kelvin Zulu',
      role: 'PUPIL',
      schoolId: schoolNdola.id,
    },
  });

  // 3. Classes, Assignments, Memberships (Form 1 - Form 4 aligned)
  const classForm1 = await prisma.class.upsert({
    where: {
      schoolId_name_academicYear: {
        schoolId: schoolLusaka.id,
        name: 'Form 1A ICT Foundations',
        academicYear: '2026',
      },
    },
    update: {},
    create: {
      name: 'Form 1A ICT Foundations',
      gradeLevel: 'Form 1',
      academicYear: '2026',
      schoolId: schoolLusaka.id,
    },
  });

  const classForm3 = await prisma.class.upsert({
    where: {
      schoolId_name_academicYear: {
        schoolId: schoolNdola.id,
        name: 'Form 3B ICT Practical',
        academicYear: '2026',
      },
    },
    update: {},
    create: {
      name: 'Form 3B ICT Practical',
      gradeLevel: 'Form 3',
      academicYear: '2026',
      schoolId: schoolNdola.id,
    },
  });

  await prisma.teacherAssignment.upsert({
    where: { classId_teacherId: { classId: classForm1.id, teacherId: teacherLusaka.id } },
    update: {},
    create: { classId: classForm1.id, teacherId: teacherLusaka.id },
  });

  await prisma.teacherAssignment.upsert({
    where: { classId_teacherId: { classId: classForm3.id, teacherId: teacherNdola.id } },
    update: {},
    create: { classId: classForm3.id, teacherId: teacherNdola.id },
  });

  await prisma.classMembership.upsert({
    where: { classId_pupilId: { classId: classForm1.id, pupilId: pupil1.id } },
    update: {},
    create: { classId: classForm1.id, pupilId: pupil1.id },
  });

  await prisma.classMembership.upsert({
    where: { classId_pupilId: { classId: classForm1.id, pupilId: pupil2.id } },
    update: {},
    create: { classId: classForm1.id, pupilId: pupil2.id },
  });

  await prisma.classMembership.upsert({
    where: { classId_pupilId: { classId: classForm3.id, pupilId: pupilNdola.id } },
    update: {},
    create: { classId: classForm3.id, pupilId: pupilNdola.id },
  });

  // 4. Achievements
  const achievementsData = [
    {
      code: 'FIRST_LESSON',
      title: 'First Step in ICT',
      description: 'Completed your first interactive Zambian syllabus ICT lesson.',
      iconName: 'BookOpen',
      points: 50,
    },
    {
      code: 'QUIZ_MASTER',
      title: 'Knowledge Explorer',
      description: 'Passed a module end-of-topic quiz with 60% or higher.',
      iconName: 'Award',
      points: 100,
    },
    {
      code: 'PRACTICAL_PRO',
      title: 'Hands-On Achiever',
      description: 'Completed and passed a simulated practical assessment.',
      iconName: 'MonitorCheck',
      points: 150,
    },
  ];

  for (const ach of achievementsData) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach,
    });
  }

  // 5. Zambian 2024 Ordinary Level Syllabus Modules (Form 1 – Form 4, Topics 1.1 – 4.4)
  const modulesSeed = [
    // ================= FORM 1 =================
    {
      slug: 'ict-and-computer-evolution',
      number: 1,
      formLevel: 1,
      syllabusCode: '1.1 & 1.6',
      title: 'Introduction to ICT, Evolution & Business',
      subtitle: 'Topic 1.1 & 1.6: History of Computers, ICT Tools & Impact in Zambia',
      description:
        'Explore the evolution of computers from the Abacus to modern microprocessors, identify hardware/software ICT tools, and understand how ICT supports Zambian businesses and communities.',
      category: 'Form 1 · Foundations',
      lessons: [
        {
          slug: 'intro-to-ict-and-computers',
          orderIndex: 1,
          title: '1.1.2 Basic ICT Concepts, Tools & Core Functions (IPOS)',
          summary: 'Understand ICT, positive/negative impacts of ICT in Zambia, and Input-Process-Output-Storage.',
          estimatedMins: 14,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'ICT in Zambian Schools, Hospitals & Business (1.1 & 1.6)',
                body: 'Information and Communication Technology (ICT) combines computers, smartphones, networks, and software to create, store, process, and communicate information. In Zambia, ICT powers ZRA tax portals, mobile money transfers, hospital records, and classroom digital learning.',
              },
              {
                heading: 'The Input–Process–Output–Storage (IPOS) Cycle',
                body: 'Every computer accepts raw data (Input), transforms it in the CPU (Process), displays useful information (Output), and saves work for future use (Storage).',
              },
            ],
            knowledgeCheck: {
              question: 'Which sequence accurately describes how every computer processes information?',
              options: [
                'Output -> Storage -> Input -> Process',
                'Input -> Process -> Output -> Storage',
                'Storage -> Output -> Process -> Input',
              ],
              correctIndex: 1,
              explanation: 'A computer receives Input, Processes it in the CPU, produces Output, and saves data in Storage.',
            },
          }),
        },
        {
          slug: 'early-and-mechanical-calculators',
          orderIndex: 2,
          title: '1.1.1 History of Computers: Abacus to Babbage Engines',
          summary: 'Trace counting tools from early beads and Pascaline gears to Charles Babbage’s Analytical Engine.',
          estimatedMins: 15,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'From Abacus to Mechanical Computing',
                body: 'Early humans counted with stones and the Abacus. Blaise Pascal built the gear-driven Pascaline, and Charles Babbage designed the Difference Engine and Analytical Engine—introducing separate memory ("store") and processing ("mill").',
              },
            ],
            knowledgeCheck: {
              question: 'Why is Charles Babbage’s Analytical Engine considered the ancestor of modern computers?',
              options: [
                'It used Wi-Fi routers',
                'It separated memory storage, processing, and programmable punched-card input',
                'It ran Windows 11',
              ],
              correctIndex: 1,
              explanation: 'The Analytical Engine separated memory, processor, and input instructions.',
            },
          }),
        },
        {
          slug: 'five-computer-generations',
          orderIndex: 3,
          title: '1.1.1 The Five Generations of Electronic Computers',
          summary: 'Compare Vacuum Tubes, Transistors, Integrated Circuits, Microprocessors, and AI systems.',
          estimatedMins: 18,
          contentJson: JSON.stringify({
            note: 'Educational Note: Computer generation dates overlap across regions; Fifth Generation computing continues to evolve.',
            sections: [
              {
                heading: 'Switching Technology Across Generations',
                body: '1st Gen: Vacuum Tubes; 2nd Gen: Transistors; 3rd Gen: Integrated Circuits (IC); 4th Gen: VLSI Microprocessors (desktops, laptops, phones); 5th Gen: Parallel & AI-assisted computing.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'Which electronic component defined First Generation computers such as ENIAC?',
          optionsJson: JSON.stringify(['Microprocessors', 'Vacuum tubes', 'Integrated circuits', 'Transistors']),
          correctIndex: 1,
          explanation: 'First Generation computers used large, heat-generating vacuum tubes.',
          marks: 2,
          difficulty: 'BASIC',
        },
        {
          questionText: 'How does ICT benefit small businesses in Zambia (Topic 1.6)?',
          optionsJson: JSON.stringify([
            'Digital bookkeeping, mobile money payments, and fast supplier communication',
            'Removing electricity requirements',
            'Preventing any record keeping',
            'Eliminating customer receipts',
          ]),
          correctIndex: 0,
          explanation: 'ICT improves record keeping, financial transactions, and customer reach.',
          marks: 2,
          difficulty: 'BASIC',
        },
      ],
    },
    {
      slug: 'computer-hardware-laboratory',
      number: 2,
      formLevel: 1,
      syllabusCode: '1.2.1',
      title: 'Components of Computer Systems: Hardware & Care',
      subtitle: 'Topic 1.2.1: Input/Output, CPU, RAM/ROM, Air Blower Care & System Specs',
      description:
        'Explore internal and external hardware, practise virtual PC assembly, learn dust cleaning with an industrial air blower, and review Zambian Ministry minimum hardware specifications.',
      category: 'Form 1 · Hardware',
      lessons: [
        {
          slug: 'internal-system-components',
          orderIndex: 1,
          title: '1.2.1 System Unit: CPU, Motherboard, RAM, ROM & PSU',
          summary: 'Identify hardware parts, inspect RAM vs ROM, and meet minimum school PC specs.',
          estimatedMins: 18,
          contentJson: JSON.stringify({
            note: 'Zambia 2024 Syllabus Minimum PC Recommendation (p. 35): 4-core 64-bit 1.6 GHz CPU, 8 GB RAM (2 GB for smartphones), and 120 GB SSD (16 GB for phones).',
            sections: [
              {
                heading: 'Inside the Motherboard & Memory',
                body: 'The CPU executes instructions. RAM is fast, volatile working memory cleared on power-off, while ROM stores permanent BIOS/UEFI firmware.',
              },
              {
                heading: 'Cleaning Computers with an Industrial Air Blower',
                body: 'In dusty classrooms, technicians unplug power first, hold fan blades still so bearings are not overspun, and use an industrial air blower from a safe distance to clear dust from heatsinks and vents.',
              },
            ],
          }),
        },
        {
          slug: 'storage-and-peripherals',
          orderIndex: 2,
          title: '1.2.1 Input, Output & Storage Devices (HDD vs SSD vs USB)',
          summary: 'Compare SSDs, HDDs, USB flash drives, keyboards, mice, monitors, printers, and scanners.',
          estimatedMins: 15,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Choosing Storage & Peripherals',
                body: 'SSDs store files on silent flash chips and boot systems fast. USB flash drives and external hard drives provide portable backup for schoolwork.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'What is the recommended tool for safely blowing dust out of a computer system unit interior?',
          optionsJson: JSON.stringify(['Wet cloth', 'Industrial air blower (while unplugged)', 'Hammer', 'Cooking oil']),
          correctIndex: 1,
          explanation: 'An industrial air blower safely removes dust without introducing moisture.',
          marks: 2,
          difficulty: 'BASIC',
        },
        {
          questionText: 'According to the 2024 Zambian ICT syllabus, what minimum RAM is recommended for desktop/laptop school use?',
          optionsJson: JSON.stringify(['512 MB', '8 GB', '128 KB', '64 MB']),
          correctIndex: 1,
          explanation: 'The syllabus recommends at least 8 GB RAM and 120 GB SSD for computers.',
          marks: 2,
          difficulty: 'STANDARD',
        },
      ],
    },
    {
      slug: 'computer-software',
      number: 3,
      formLevel: 1,
      syllabusCode: '1.2.2 & 1.3',
      title: 'Software Types & File Management Basics',
      subtitle: 'Topics 1.2.2 & 1.3: System/Application/Utility Software, Folders & Backup',
      description:
        'Classify System, Application, and Utility software; organize Schoolwork folders and subfolders; apply clear file naming conventions; back up to USB flash disks; and restore from Recycle Bin.',
      category: 'Form 1 · Systems & Files',
      lessons: [
        {
          slug: 'software-categories-and-roles',
          orderIndex: 1,
          title: '1.2.2 System, Application & Utility Software',
          summary: 'Understand Operating Systems, device drivers, productivity apps, and utilities.',
          estimatedMins: 15,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Three Core Software Families',
                body: 'System Software (Windows, Linux, macOS, Android, device drivers) runs hardware. Application Software (Word, CalcSheet, SlideDeck) serves users. Utility Software (antivirus, disk cleanup, backup, compression) maintains system health.',
              },
            ],
          }),
        },
        {
          slug: 'file-management-and-backup',
          orderIndex: 2,
          title: '1.3 Organizing Folders, Naming Files & USB Flash Backup',
          summary: 'Create Schoolwork subfolders (Math, Science, ICT), use clean names, and back up to USB.',
          estimatedMins: 16,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Folder Hierarchy & Naming Conventions',
                body: 'Organize a parent "Schoolwork" folder with subject subfolders ("Math", "Science", "ICT"). Name files descriptively without spaces clutter, e.g., ICT_Class_Notes_2025.',
              },
              {
                heading: 'USB Flash Disk & Cloud Backup',
                body: 'Back up important assignments to a removable USB flash drive (E:) and restore accidentally deleted files from the Recycle Bin.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'Which file name follows best Form 1 ICT naming conventions for school notes?',
          optionsJson: JSON.stringify(['asdf123', 'ICT_Class_Notes_2026', 'new file (1)(2)', 'untitled']),
          correctIndex: 1,
          explanation: 'Descriptive names with underscores and year make files easy to find.',
          marks: 2,
          difficulty: 'BASIC',
        },
      ],
    },

    // ================= FORM 2 =================
    {
      slug: 'operating-systems',
      number: 4,
      formLevel: 2,
      syllabusCode: '2.1 & OS',
      title: 'File Compression, Encryption & Operating Systems',
      subtitle: 'Topic 2.1: WinRAR/7-Zip Archives, File Encryption & OS Resource Management',
      description:
        'Compress and extract .zip archives (WinRAR / 7-Zip concepts), encrypt sensitive files with passwords (BitLocker concepts), and inspect OS process, memory, and CLI controls.',
      category: 'Form 2 · File Security',
      lessons: [
        {
          slug: 'compression-and-encryption',
          orderIndex: 1,
          title: '2.1 File Compression (.zip) & Encryption (.enc)',
          summary: 'Shrink files for faster sharing and protect private documents with password encryption.',
          estimatedMins: 18,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Compressing & Extracting Files (WinRAR, 7-Zip, PowerISO)',
                body: 'File compression bundles one or more files into a smaller .zip archive so they consume less disk space and upload faster over low-bandwidth school connections.',
              },
              {
                heading: 'Encrypting Files for Privacy (BitLocker / Password Protection)',
                body: 'Encryption scrambles readable file data using a secret key or password so unauthorized users cannot read confidential mark sheets or personal records without decrypting them first.',
              },
            ],
            knowledgeCheck: {
              question: 'Why do learners compress a large folder into a .zip archive before emailing it?',
              options: [
                'To make the file size smaller and bundle multiple items into one file',
                'To delete the contents permanently',
                'To turn off the CPU cooling fan',
              ],
              correctIndex: 0,
              explanation: 'Compression reduces total file size and groups multiple files cleanly.',
            },
          }),
        },
        {
          slug: 'os-core-functions',
          orderIndex: 2,
          title: 'Operating System Process, Memory & CLI Controls',
          summary: 'Explore CPU process scheduling, RAM block allocation, and safe CLI commands.',
          estimatedMins: 15,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'GUI vs CLI',
                body: 'Graphical User Interfaces use windows and icons; Command-Line Interfaces execute typed commands for rapid system control.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'What is the main purpose of encrypting a confidential file?',
          optionsJson: JSON.stringify([
            'To make the text readable to everyone',
            'To scramble contents so only authorized users with the password/key can read it',
            'To increase monitor brightness',
            'To print double-sided pages',
          ]),
          correctIndex: 1,
          explanation: 'Encryption protects confidentiality by requiring the right key/password to decrypt.',
          marks: 2,
          difficulty: 'BASIC',
        },
      ],
    },
    {
      slug: 'word-processing-simulator',
      number: 5,
      formLevel: 2,
      syllabusCode: '2.2.1',
      title: 'Word Processing & Document Layout',
      subtitle: 'Topic 2.2.1: Margins, Columns, Headers/Footers, Tables & Hyperlinks',
      description:
        'Practise custom page margins, portrait/landscape orientation, two-column layouts, headers & footers, page numbering, structured tables, hyperlinks, and mail merge concepts.',
      category: 'Form 2 · Productivity',
      lessons: [
        {
          slug: 'formatting-school-documents',
          orderIndex: 1,
          title: '2.2.1 Page Setup, Headers/Footers, Tables & Columns',
          summary: 'Configure page margins, orientation, multi-column newsletters, tables, and links.',
          estimatedMins: 18,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Professional School Reports & Newsletters',
                body: 'Use Custom Margins, Headers & Footers (with page numbers), Insert Table for timetables/mark summaries, and 2-Column mode for school newsletters in Word Writer.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'Which Word Writer feature repeats your name and page number at the top or bottom of every page?',
          optionsJson: JSON.stringify(['Header & Footer', 'Font Highlight', 'Spell Check', 'Cut & Paste']),
          correctIndex: 0,
          explanation: 'Headers and footers appear consistently across document pages.',
          marks: 2,
          difficulty: 'BASIC',
        },
      ],
    },
    {
      slug: 'spreadsheet-simulator',
      number: 6,
      formLevel: 2,
      syllabusCode: '2.2.2–2.2.4',
      title: 'Spreadsheets, Presentations & Desktop Publishing',
      subtitle: 'Topics 2.2.2–2.2.4: MIN/MAX/COUNT/SUMIF, Slide Transitions & Posters/Flyers',
      description:
        'Build budgets and mark sheets with SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, and SUMIF; add slide transitions in SlideDeck; and design school flyers, posters, calendars, and business cards in Publisher.',
      category: 'Form 2 · Productivity',
      lessons: [
        {
          slug: 'formulas-and-charts',
          orderIndex: 1,
          title: '2.2.2 Spreadsheets: Budgeting, Sorting & Essential Functions',
          summary: 'Use =SUM(), =AVERAGE(), =MIN(), =MAX(), =COUNT(), =COUNTA(), and =SUMIF().',
          estimatedMins: 20,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Form 2 Spreadsheet Functions',
                body: 'Use =MIN() for lowest mark, =MAX() for highest, =COUNT() to count numeric scores, =COUNTA() to count non-empty entries, and =SUMIF(range, criteria, sum_range) for conditional totals.',
              },
            ],
          }),
        },
        {
          slug: 'presentations-and-publishing',
          orderIndex: 2,
          title: '2.2.3–2.2.4 Slide Transitions & Desktop Publishing',
          summary: 'Apply slide transitions in SlideDeck and create flyers, posters, or business cards in Publisher.',
          estimatedMins: 18,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Presentations vs Publishing',
                body: 'SlideDeck delivers visual talks on screen with smooth transitions. Publisher arranges shapes, borders, captions, and text boxes for printed flyers, posters, calendars, and business cards.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'Which spreadsheet function counts only cells containing numbers inside range B2:B6?',
          optionsJson: JSON.stringify(['=SUM(B2:B6)', '=COUNT(B2:B6)', '=MAX(B2:B6)', '=MIN(B2:B6)']),
          correctIndex: 1,
          explanation: 'COUNT counts numeric cells; COUNTA counts all non-empty cells.',
          marks: 2,
          difficulty: 'STANDARD',
        },
      ],
    },
    {
      slug: 'virtual-computer-desktop',
      number: 7,
      formLevel: 2,
      syllabusCode: '1.5, 2.3 & 2.4',
      title: 'Email (EduMail), Digital Literacy & E-Business',
      subtitle: 'Topics 1.5, 2.3 & 2.4: Email Attachments, Netiquette, ECZ Results & Mobile Money',
      description:
        'Practise composing emails with attachments and managing Inbox/Drafts/Sent folders in EduMail, apply netiquette rules, check simulated ECZ exam results, and budget digital finances.',
      category: 'Form 2 · Communication',
      lessons: [
        {
          slug: 'email-and-netiquette',
          orderIndex: 1,
          title: '2.3 Email Architecture (Inbox, Drafts, Sent, Attachments) & Netiquette',
          summary: 'Compose polite formal emails (username@domain) and attach compressed files.',
          estimatedMins: 16,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Structure of an Email Address & Folders',
                body: 'An email address like pupil.kabwe@virtuolab.edu.zm has a username before @ and a mail domain after @. Unfinished messages stay in Drafts; outgoing messages queue in Outbox and move to Sent.',
              },
            ],
          }),
        },
        {
          slug: 'ecz-results-and-mobile-finance',
          orderIndex: 2,
          title: '2.4 Electronic Business, Mobile Money & Checking ECZ Results',
          summary: 'Explore digital finance evolution and safely check simulated ECZ Grade 9/12 results online.',
          estimatedMins: 15,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'From Barter to Mobile Money & Online Portals',
                body: 'ICT transformed trade from barter and cash to mobile money wallets and online banking. Learners can also verify official ECZ examination results through secure portals in EduBrowser.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'Where are unfinished emails saved before you click Send?',
          optionsJson: JSON.stringify(['Drafts', 'Recycle Bin', 'Sent', 'Spreadsheet']),
          correctIndex: 0,
          explanation: 'Drafts stores saved emails that have not been sent yet.',
          marks: 2,
          difficulty: 'BASIC',
        },
      ],
    },

    // ================= FORM 3 =================
    {
      slug: 'website-design-templates',
      number: 8,
      formLevel: 3,
      syllabusCode: '3.1',
      title: 'Website Design Using Templates',
      subtitle: 'Topic 3.1: Planning, Customizing & Publishing School Websites',
      description:
        'Design and publish multi-section educational websites using customizable templates in WebBuilder—covering Canva, WordPress, and Google Sites workflows.',
      category: 'Form 3 · Web Design',
      lessons: [
        {
          slug: 'designing-websites-with-templates',
          orderIndex: 1,
          title: '3.1 Choosing Templates, Organizing Pages & Publishing',
          summary: 'Customize hero banners, navigation links, school announcements, and publish locally.',
          estimatedMins: 20,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Template-Based Website Creation',
                body: 'Tools like Google Sites, WordPress, and Canva offer structured website templates. Good school sites organize content clearly (Home, Academics, Clubs, Contact) with readable contrast and fast images.',
              },
            ],
            knowledgeCheck: {
              question: 'Why do beginners often start website creation with a template?',
              options: [
                'It provides pre-built responsive layout, colour contrast, and navigation structure',
                'Templates eliminate the need for any text',
                'Websites work without browsers',
              ],
              correctIndex: 0,
              explanation: 'Templates speed up design while ensuring consistent layout and navigation.',
            },
          }),
        },
      ],
      questions: [
        {
          questionText: 'Which element helps website visitors move quickly between Home, Lessons, and Contact sections?',
          optionsJson: JSON.stringify(['Navigation Menu', 'Disk Defragmenter', 'Air Blower', 'Recycle Bin']),
          correctIndex: 0,
          explanation: 'Clear navigation links organize multi-page or multi-section websites.',
          marks: 2,
          difficulty: 'BASIC',
        },
      ],
    },
    {
      slug: 'cloud-computing-storage',
      number: 9,
      formLevel: 3,
      syllabusCode: '3.2 & 4.2',
      title: 'Cloud Storage & Online Collaboration',
      subtitle: 'Topics 3.2 & 4.2: Google Drive, OneDrive, Dropbox & Shared Editing',
      description:
        'Upload virtual documents to CloudDrive, manage View vs Edit sharing permissions, collaborate with classmates, and compare cloud storage providers vs physical drives.',
      category: 'Form 3 · Cloud',
      lessons: [
        {
          slug: 'cloud-storage-collaboration',
          orderIndex: 1,
          title: '3.2 Cloud Storage vs Local Storage & Permissions',
          summary: 'Understand Google Drive, OneDrive, Dropbox, iCloud, and real-time co-editing.',
          estimatedMins: 18,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Physical USB vs Cloud Storage',
                body: 'Physical storage (USB flash disks, SSDs) requires no internet but can be lost or damaged. Cloud storage (Google Drive, OneDrive, Dropbox, iCloud) backs up files off-site and lets classmates co-edit documents with View or Edit permissions.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'Which sharing permission allows a teacher to read your cloud report without accidentally changing your sentences?',
          optionsJson: JSON.stringify(['Can View (Read-only)', 'Can Delete All', 'Full Admin Root', 'Disable Password']),
          correctIndex: 0,
          explanation: 'View-only permission lets reviewers read or comment without editing content.',
          marks: 2,
          difficulty: 'BASIC',
        },
      ],
    },
    {
      slug: 'intermediate-spreadsheets',
      number: 10,
      formLevel: 3,
      syllabusCode: '3.3',
      title: 'Intermediate Spreadsheets & Data Lookup',
      subtitle: 'Topic 3.3: VLOOKUP, CONCATENATE, Conditional Rules & Sheet Locking',
      description:
        'Master Form 3 spreadsheet formulas including VLOOKUP, CONCATENATE, COUNT/SUMIF, conditional highlighting, row sorting, and protecting sheets against accidental edits.',
      category: 'Form 3 · Data',
      lessons: [
        {
          slug: 'vlookup-and-concatenate',
          orderIndex: 1,
          title: '3.3 Using VLOOKUP, CONCATENATE & Sheet Protection',
          summary: 'Look up values from tables, join text strings, sort records, and lock sheets.',
          estimatedMins: 22,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Lookup & Text Functions in CalcSheet',
                body: 'Use =VLOOKUP(lookup_value, A2:C6, 2) to retrieve a pupil mark or grade from a table, and =CONCATENATE(A2, " ", B2) to combine text fields cleanly.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'Which function combines First Name (A2) and Surname (B2) into a single text string?',
          optionsJson: JSON.stringify(['=MIN(A2,B2)', '=CONCATENATE(A2, " ", B2)', '=SUM(A2:B2)', '=AVERAGE(A2:B2)']),
          correctIndex: 1,
          explanation: 'CONCATENATE joins multiple text cells or strings together.',
          marks: 2,
          difficulty: 'STANDARD',
        },
      ],
    },

    // ================= FORM 4 =================
    {
      slug: 'internet-and-networking',
      number: 11,
      formLevel: 4,
      syllabusCode: '1.4 & 4.1–4.2',
      title: 'Computer Networking, Tethering & Cloud Comparison',
      subtitle: 'Topics 1.4, 4.1 & 4.2: PAN, LAN, WAN, Fiber, Hotspot, Tethering & Casting',
      description:
        'Compare PAN, LAN, and WAN topologies; test wired Ethernet, Fiber Optic, Wi-Fi, Mobile Hotspot, Bluetooth/USB Tethering, and Screen Casting; and compare Google Drive vs OneDrive.',
      category: 'Form 4 · Networking',
      lessons: [
        {
          slug: 'networks-and-browsers',
          orderIndex: 1,
          title: '4.1 PAN, LAN, WAN, Fiber Optic & Mobile Tethering',
          summary: 'Explore network scopes, switches/routers, hot-spotting, tethering, and screen casting.',
          estimatedMins: 20,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'PAN, LAN & WAN Scopes',
                body: 'A Personal Area Network (PAN) links nearby devices via Bluetooth or USB tethering. A Local Area Network (LAN) connects computers inside one school building. A Wide Area Network (WAN) spans cities and countries across fiber optic and satellite links.',
              },
              {
                heading: 'Hot-Spotting, Tethering & Screen Casting',
                body: 'A smartphone hotspot shares cellular data over Wi-Fi; USB or Bluetooth tethering bridges internet over cable or PAN; screen casting mirrors a phone/laptop screen wirelessly to a classroom projector.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'Connecting your wireless earphones or tethering a phone via Bluetooth over 2 metres is an example of which network?',
          optionsJson: JSON.stringify(['PAN (Personal Area Network)', 'WAN (Wide Area Network)', 'Satellite Backbone', 'Submarine Fiber']),
          correctIndex: 0,
          explanation: 'A PAN connects personal devices within a few metres around one user.',
          marks: 2,
          difficulty: 'BASIC',
        },
      ],
    },
    {
      slug: 'cybersecurity-and-digital-safety',
      number: 12,
      formLevel: 4,
      syllabusCode: '3.4, 4.3 & 4.4',
      title: 'Cybersecurity, Malware & Digital Citizenship',
      subtitle: 'Topics 3.4, 4.3 & 4.4: Antivirus, Malware Types, Lab Policy & Fact vs Bias',
      description:
        'Run simulated antivirus scans, distinguish Viruses, Worms, Trojans, and Spyware, spot phishing/pharming, check digital identity/IP privacy, and evaluate fact vs opinion vs bias.',
      category: 'Form 4 · Security & Ethics',
      lessons: [
        {
          slug: 'staying-safe-online',
          orderIndex: 1,
          title: '3.4 & 4.3 Phishing, Antivirus & Malware Types',
          summary: 'Identify Viruses, Worms, Trojans, Spyware, Phishing/Pharming and school lab security policies.',
          estimatedMins: 18,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Four Common Malware Threats (Form 4.3)',
                body: 'A Virus attaches to host files and spreads when opened. A Worm self-replicates across networks without human help. A Trojan disguises itself as useful software. Spyware secretly records keystrokes or browsing habits.',
              },
            ],
          }),
        },
        {
          slug: 'digital-citizenship-fact-bias',
          orderIndex: 2,
          title: '4.4 Digital Identity, Fact vs Opinion vs Bias & Screen Balance',
          summary: 'Verify online claims, protect IP/location traces, and maintain healthy offline balance.',
          estimatedMins: 16,
          contentJson: JSON.stringify({
            sections: [
              {
                heading: 'Evaluating Online Information',
                body: 'Facts can be verified with evidence; opinions express personal beliefs; biased articles selectively omit facts to push one agenda. Always cross-check sources and balance screen study time with rest.',
              },
            ],
          }),
        },
      ],
      questions: [
        {
          questionText: 'Which type of malware pretends to be a harmless free game or utility while hiding malicious code inside?',
          optionsJson: JSON.stringify(['Trojan Horse', 'Word Processor', 'RAM Stick', 'Ethernet Switch']),
          correctIndex: 0,
          explanation: 'A Trojan disguises itself as legitimate software to trick users into installing it.',
          marks: 2,
          difficulty: 'BASIC',
        },
      ],
    },
  ];

  const moduleMap = new Map<string, string>();

  for (const mod of modulesSeed) {
    // Reconcile existing module if number changed
    const existingByNumber = await prisma.learningModule.findUnique({ where: { number: mod.number } });
    if (existingByNumber && existingByNumber.slug !== mod.slug) {
      await prisma.learningModule.update({
        where: { id: existingByNumber.id },
        data: { number: 100 + mod.number },
      });
    }

    const upsertedMod = await prisma.learningModule.upsert({
      where: { slug: mod.slug },
      update: {
        number: mod.number,
        formLevel: mod.formLevel,
        syllabusCode: mod.syllabusCode,
        title: mod.title,
        subtitle: mod.subtitle,
        description: mod.description,
        category: mod.category,
      },
      create: {
        slug: mod.slug,
        number: mod.number,
        formLevel: mod.formLevel,
        syllabusCode: mod.syllabusCode,
        title: mod.title,
        subtitle: mod.subtitle,
        description: mod.description,
        category: mod.category,
      },
    });
    moduleMap.set(mod.slug, upsertedMod.id);

    for (const lesson of mod.lessons) {
      await prisma.lesson.upsert({
        where: { slug: lesson.slug },
        update: {
          moduleId: upsertedMod.id,
          orderIndex: lesson.orderIndex,
          title: lesson.title,
          summary: lesson.summary,
          contentJson: lesson.contentJson,
          estimatedMins: lesson.estimatedMins,
        },
        create: {
          moduleId: upsertedMod.id,
          slug: lesson.slug,
          orderIndex: lesson.orderIndex,
          title: lesson.title,
          summary: lesson.summary,
          contentJson: lesson.contentJson,
          estimatedMins: lesson.estimatedMins,
          offlineReady: true,
        },
      });
    }

    // Ensure quiz questions are populated per module
    const existingQs = await prisma.assessmentQuestion.findMany({
      where: { moduleId: upsertedMod.id },
      select: { questionText: true },
    });
    const existingTextSet = new Set(existingQs.map((q) => q.questionText));
    const missingQs = mod.questions.filter((q) => !existingTextSet.has(q.questionText));
    if (missingQs.length > 0) {
      await prisma.assessmentQuestion.createMany({
        data: missingQs.map((q) => ({
          moduleId: upsertedMod.id,
          ...q,
        })),
      });
    }
  }

  // Remove obsolete legacy module slugs from prior builds so only the 12 Form 1–4 modules remain
  await prisma.learningModule.deleteMany({
    where: { slug: { notIn: modulesSeed.map((m) => m.slug) } },
  });

  // 6. Seed Form 1 – Form 4 Practical Exercises (upsert by deterministic id)
  const exercisesSeed = [
    // Form 1 — Level 1
    {
      id: 'seed-ex-form1-folders',
      moduleSlug: 'computer-software',
      formLevel: 1,
      syllabusCode: '1.3',
      title: 'Form 1 (1.3): Organize Schoolwork Subfolders & Notes',
      description: 'Create the Schoolwork folder hierarchy recommended in the Zambian Form 1 ICT syllabus.',
      instructions:
        'Open File Manager, create a main folder named "Schoolwork", open it and create a subfolder named "ICT", then save a Word Writer note inside "ICT" and back up a file to USB (E:).',
      level: 1,
      totalMarks: 20,
      criteria: [
        {
          orderIndex: 1,
          label: 'Create "Schoolwork" folder',
          ruleType: 'FOLDER_EXISTS',
          rulePayload: JSON.stringify({ name: 'Schoolwork' }),
          marks: 5,
          hintText: 'Open File Manager and click New Folder, then name it Schoolwork.',
        },
        {
          orderIndex: 2,
          label: 'Create "ICT" subfolder inside "Schoolwork"',
          ruleType: 'SUBFOLDER_EXISTS',
          rulePayload: JSON.stringify({ parentName: 'Schoolwork', name: 'ICT' }),
          marks: 7,
          hintText: 'Double-click Schoolwork in File Manager, then click New Folder and name it ICT.',
        },
        {
          orderIndex: 3,
          label: 'Save a Word Writer document inside "ICT"',
          ruleType: 'FILE_IN_FOLDER',
          rulePayload: JSON.stringify({ folderName: 'ICT', fileType: 'document' }),
          marks: 8,
          hintText: 'Open Word Writer, choose Folder: ICT, and click Save.',
        },
      ],
    },
    // Form 1 — Level 1
    {
      id: 'seed-ex-form1-word',
      moduleSlug: 'word-processing-simulator',
      formLevel: 1,
      syllabusCode: '1.3 & 2.2.1',
      title: 'Form 1–2: My First ICT Assignment (Guided Word)',
      description: 'Practise creating a formatted document and saving it in your Assignments folder.',
      instructions:
        'Open Word Writer, create a document mentioning "ICT", write at least 8 words, apply Bold and Underline formatting, and save it inside the "Assignments" folder.',
      level: 1,
      totalMarks: 20,
      criteria: [
        {
          orderIndex: 1,
          label: 'Verify "Assignments" folder exists',
          ruleType: 'FOLDER_EXISTS',
          rulePayload: JSON.stringify({ name: 'Assignments' }),
          marks: 4,
          hintText: 'Open File Manager and ensure an Assignments folder exists.',
        },
        {
          orderIndex: 2,
          label: 'Save Word document inside "Assignments"',
          ruleType: 'FILE_IN_FOLDER',
          rulePayload: JSON.stringify({ folderName: 'Assignments', fileType: 'document' }),
          marks: 6,
          hintText: 'In Word Writer, pick Folder: Assignments and click Save.',
        },
        {
          orderIndex: 3,
          label: 'Document has "ICT", >= 8 words, Bold & Underline formatting',
          ruleType: 'DOC_CONTAINS',
          rulePayload: JSON.stringify({
            textContains: 'ICT',
            minWords: 8,
            requireBold: true,
            requireUnderline: true,
          }),
          marks: 10,
          hintText: 'Use the B (Bold) and U (Underline) buttons in Word Writer.',
        },
      ],
    },
    // Form 2 — Level 1
    {
      id: 'seed-ex-form2-compress-encrypt',
      moduleSlug: 'operating-systems',
      formLevel: 2,
      syllabusCode: '2.1',
      title: 'Form 2 (2.1): File Compression (.zip) & Encryption (.enc)',
      description: 'Practise compressing school files into .zip archives and password-encrypting sensitive documents.',
      instructions:
        'Open File Manager, select any document or spreadsheet, click "Compress (.zip)" to create a compressed archive, then select a file and click "Encrypt" to protect it with a password.',
      level: 1,
      totalMarks: 20,
      criteria: [
        {
          orderIndex: 1,
          label: 'Compress a file into a .zip archive',
          ruleType: 'FILE_COMPRESSED',
          rulePayload: JSON.stringify({}),
          marks: 10,
          hintText: 'Click a file in File Manager and press "Compress (.zip)" on the toolbar.',
        },
        {
          orderIndex: 2,
          label: 'Encrypt a file with a password (.enc)',
          ruleType: 'FILE_ENCRYPTED',
          rulePayload: JSON.stringify({}),
          marks: 10,
          hintText: 'Select a file in File Manager, click "Encrypt", and enter a passphrase.',
        },
      ],
    },
    // Form 2 — Level 2
    {
      id: 'seed-ex-form2-spreadsheets',
      moduleSlug: 'spreadsheet-simulator',
      formLevel: 2,
      syllabusCode: '2.2.2',
      title: 'Form 2 (2.2.2): Class Marks, MIN, MAX & COUNT Sheet',
      description: 'Build a five-pupil mark sheet using SUM, AVERAGE, MIN, MAX, and COUNT formulas.',
      instructions:
        'Open CalcSheet, enter 5 pupils and marks in rows 2–6, compute =SUM(B2:B6), =AVERAGE(B2:B6), =MIN(B2:B6), and =MAX(B2:B6), then save your spreadsheet.',
      level: 2,
      totalMarks: 20,
      criteria: [
        {
          orderIndex: 1,
          label: 'Spreadsheet file created and saved',
          ruleType: 'FILE_EXISTS',
          rulePayload: JSON.stringify({ fileType: 'spreadsheet' }),
          marks: 6,
          hintText: 'Save your CalcSheet file so it appears in your virtual drive.',
        },
        {
          orderIndex: 2,
          label: 'Contains 5+ data rows with SUM, AVERAGE, MIN, and MAX formulas',
          ruleType: 'SHEET_HAS_FORMULA',
          rulePayload: JSON.stringify({ formulas: ['SUM', 'AVERAGE', 'MIN', 'MAX'], minDataRows: 5 }),
          marks: 14,
          hintText: 'Add =MIN(B2:B6) and =MAX(B2:B6) alongside =SUM and =AVERAGE.',
        },
      ],
    },
    // Form 2 — Level 2
    {
      id: 'seed-ex-form2-publisher-email',
      moduleSlug: 'virtual-computer-desktop',
      formLevel: 2,
      syllabusCode: '2.2.4 & 2.3',
      title: 'Form 2 (2.2.4 & 2.3): Design a Flyer & Email with Attachment',
      description: 'Create a school event poster in Publisher and email it with an attachment via EduMail.',
      instructions:
        'Open Publisher on the Virtual Desktop to design and save a school flyer/poster. Then open EduMail, compose a polite message to your teacher, attach a file, and click Send.',
      level: 2,
      totalMarks: 20,
      criteria: [
        {
          orderIndex: 1,
          label: 'Design and save a publication in Publisher',
          ruleType: 'PUBLICATION_CREATED',
          rulePayload: JSON.stringify({}),
          marks: 10,
          hintText: 'Open Publisher app on the desktop, customize your flyer/poster, and click Save.',
        },
        {
          orderIndex: 2,
          label: 'Send an email with an attachment in EduMail',
          ruleType: 'EMAIL_SENT',
          rulePayload: JSON.stringify({ requireAttachment: true }),
          marks: 10,
          hintText: 'Open EduMail, enter recipient, attach a virtual file, and click Send.',
        },
      ],
    },
    // Form 3 — Level 2
    {
      id: 'seed-ex-form3-web-cloud',
      moduleSlug: 'website-design-templates',
      formLevel: 3,
      syllabusCode: '3.1 & 3.2',
      title: 'Form 3 (3.1 & 3.2): Publish Template Website & Share on CloudDrive',
      description: 'Customize a school website template in WebBuilder and share coursework via CloudDrive.',
      instructions:
        'Open WebBuilder, choose a school website template, customize the headline and sections, click Publish & Save. Then open CloudDrive, upload any file, and click Share.',
      level: 2,
      totalMarks: 20,
      criteria: [
        {
          orderIndex: 1,
          label: 'Customize, publish, and save a website in WebBuilder',
          ruleType: 'WEBSITE_CREATED',
          rulePayload: JSON.stringify({ requirePublished: true }),
          marks: 10,
          hintText: 'In WebBuilder, toggle Publish Site and click Save Website.',
        },
        {
          orderIndex: 2,
          label: 'Upload and share a file in CloudDrive',
          ruleType: 'CLOUD_SHARED',
          rulePayload: JSON.stringify({}),
          marks: 10,
          hintText: 'Open CloudDrive, pick a document to upload, and turn on sharing permissions.',
        },
      ],
    },
    // Form 3 — Level 3
    {
      id: 'seed-ex-form3-intermediate-sheet',
      moduleSlug: 'intermediate-spreadsheets',
      formLevel: 3,
      syllabusCode: '3.3',
      title: 'Form 3 (3.3): VLOOKUP & CONCATENATE Practical Assessment',
      description: 'Unassisted Form 3 spreadsheet assessment verifying VLOOKUP, CONCATENATE, and SUMIF formulas.',
      instructions:
        'Open CalcSheet, populate at least 5 rows of student data, apply =CONCATENATE(...) and =VLOOKUP(...) (or =SUMIF(...)), and save the spreadsheet.',
      level: 3,
      totalMarks: 25,
      criteria: [
        {
          orderIndex: 1,
          label: 'Spreadsheet file saved in virtual drive',
          ruleType: 'FILE_EXISTS',
          rulePayload: JSON.stringify({ fileType: 'spreadsheet' }),
          marks: 5,
          hintText: '',
        },
        {
          orderIndex: 2,
          label: 'Uses VLOOKUP and CONCATENATE across >= 5 data rows',
          ruleType: 'SHEET_HAS_FORMULA',
          rulePayload: JSON.stringify({ formulas: ['VLOOKUP', 'CONCATENATE'], minDataRows: 5 }),
          marks: 20,
          hintText: '',
        },
      ],
    },
    // Form 4 — Level 3
    {
      id: 'seed-ex-form4-capstone',
      moduleSlug: 'cybersecurity-and-digital-safety',
      formLevel: 4,
      syllabusCode: '1.3, 2.1 & 4.3',
      title: 'Form 4 Capstone: Secure Project Filing, Slides & Encryption Assessment',
      description: 'Comprehensive Form 4 unassisted practical test covering folders, presentation slides, compression, and encryption.',
      instructions:
        'Create a folder "ICT Practical" with a subfolder "Form 4 Capstone". Create a 3-slide SlideDeck saved inside it, compress a copy into .zip, and encrypt a file with a password.',
      level: 3,
      totalMarks: 30,
      criteria: [
        {
          orderIndex: 1,
          label: 'Main folder "ICT Practical" exists',
          ruleType: 'FOLDER_EXISTS',
          rulePayload: JSON.stringify({ name: 'ICT Practical' }),
          marks: 5,
          hintText: '',
        },
        {
          orderIndex: 2,
          label: 'Subfolder "Form 4 Capstone" exists inside "ICT Practical"',
          ruleType: 'SUBFOLDER_EXISTS',
          rulePayload: JSON.stringify({ parentName: 'ICT Practical', name: 'Form 4 Capstone' }),
          marks: 5,
          hintText: '',
        },
        {
          orderIndex: 3,
          label: 'Presentation contains at least 3 completed slides',
          ruleType: 'DECK_MIN_SLIDES',
          rulePayload: JSON.stringify({ minSlides: 3 }),
          marks: 8,
          hintText: '',
        },
        {
          orderIndex: 4,
          label: 'Compressed .zip archive created',
          ruleType: 'FILE_COMPRESSED',
          rulePayload: JSON.stringify({}),
          marks: 6,
          hintText: '',
        },
        {
          orderIndex: 5,
          label: 'Encrypted file created (.enc)',
          ruleType: 'FILE_ENCRYPTED',
          rulePayload: JSON.stringify({}),
          marks: 6,
          hintText: '',
        },
      ],
    },
  ];

  for (const ex of exercisesSeed) {
    const modId = moduleMap.get(ex.moduleSlug);
    if (!modId) continue;

    const existing = await prisma.practicalExercise.findUnique({ where: { id: ex.id } });
    if (existing) {
      await prisma.assessmentCriteria.deleteMany({ where: { exerciseId: ex.id } });
      await prisma.practicalExercise.update({
        where: { id: ex.id },
        data: {
          moduleId: modId,
          title: ex.title,
          description: ex.description,
          instructions: ex.instructions,
          formLevel: ex.formLevel,
          syllabusCode: ex.syllabusCode,
          level: ex.level,
          totalMarks: ex.totalMarks,
          criteria: {
            create: ex.criteria,
          },
        },
      });
    } else {
      await prisma.practicalExercise.create({
        data: {
          id: ex.id,
          moduleId: modId,
          title: ex.title,
          description: ex.description,
          instructions: ex.instructions,
          formLevel: ex.formLevel,
          syllabusCode: ex.syllabusCode,
          level: ex.level,
          totalMarks: ex.totalMarks,
          classId: classForm1.id,
          createdById: teacherLusaka.id,
          criteria: {
            create: ex.criteria,
          },
        },
      });
    }
  }

  // 7. System Settings
  const defaultSettings = [
    {
      key: 'platform_name',
      value: 'ICT Made Easy',
      description: 'Public display name of the educational platform',
    },
    {
      key: 'offline_sync_interval_sec',
      value: '60',
      description: 'Background sync check interval in seconds when online',
    },
    {
      key: 'allow_local_lan_access',
      value: 'true',
      description: 'Allow school local Wi-Fi network access without external internet',
    },
    {
      key: 'passing_score_percent',
      value: '60',
      description: 'Minimum percentage required to pass quizzes and practical assessments',
    },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: s,
      create: s,
    });
  }

  // 8. Sample initial notification for demo pupil
  const notifCount = await prisma.notification.count({ where: { userId: pupil1.id } });
  if (notifCount === 0) {
    await prisma.notification.create({
      data: {
        userId: pupil1.id,
        title: 'Welcome to ICT Made Easy (Form 1–4)',
        message: 'Select your Form level on the Dashboard or explore the Illustrated ICT Tools Gallery and Virtual Desktop.',
        category: 'INFO',
      },
    });
  }

  // 9. Initial Virtual Desktop for demo pupil
  const existingDesktop = await prisma.virtualDesktopState.findUnique({
    where: { pupilId: pupil1.id },
  });
  if (!existingDesktop) {
    const state = await prisma.virtualDesktopState.create({
      data: {
        pupilId: pupil1.id,
        wallpaper: 'zambia-dawn',
        themeMode: 'dark',
        iconSize: 'medium',
        showClock: true,
        folders: {
          create: [
            { name: 'Documents', parentId: null },
            { name: 'Assignments', parentId: null },
            { name: 'Pictures', parentId: null },
          ],
        },
      },
      include: { folders: true },
    });
    const docs = state.folders.find((f) => f.name === 'Documents');
    await prisma.simulatedFile.create({
      data: {
        desktopStateId: state.id,
        folderId: docs?.id ?? null,
        name: 'Getting Started Guide',
        fileType: 'document',
        extension: '.vdoc',
        sizeBytes: 280,
        contentJson: JSON.stringify({
          title: 'Getting Started with ICT Made Easy',
          html: '<p><b>Welcome Lombe!</b></p><p>Use File Manager (compression, encryption, USB backup), Word Writer, CalcSheet, SlideDeck, Publisher, EduMail, WebBuilder, and CloudDrive.</p>',
          plainText:
            'Welcome Lombe! Use File Manager (compression, encryption, USB backup), Word Writer, CalcSheet, SlideDeck, Publisher, EduMail, WebBuilder, and CloudDrive.',
          fontFamily: 'DM Sans',
          fontSize: 16,
        }),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      schoolId: schoolLusaka.id,
      action: 'DATABASE_SEEDED',
      entity: 'System',
      details: 'Seeded Zambian Form 1-4 ICT syllabus (12 modules, 8 practical exercises)',
    },
  });

  console.log('ICT Made Easy Zambian Form 1-4 database seed completed successfully.');
}

seed()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
