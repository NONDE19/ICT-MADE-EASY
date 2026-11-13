import { prisma } from '../config/prisma.js';

export async function ensurePupilDesktopInitialized(pupilId: string) {
  let state = await prisma.virtualDesktopState.findUnique({
    where: { pupilId },
    include: {
      folders: { orderBy: { name: 'asc' } },
      files: { orderBy: { name: 'asc' } },
    },
  });

  if (state) {
    return state;
  }

  state = await prisma.virtualDesktopState.create({
    data: {
      pupilId,
      wallpaper: 'zambia-dawn',
      themeMode: 'dark',
      iconSize: 'medium',
      showClock: true,
      settingsJson: JSON.stringify({ notificationsEnabled: true, soundEffects: false }),
      folders: {
        create: [
          { name: 'Documents', parentId: null },
          { name: 'Assignments', parentId: null },
          { name: 'Pictures', parentId: null },
        ],
      },
    },
    include: {
      folders: { orderBy: { name: 'asc' } },
      files: { orderBy: { name: 'asc' } },
    },
  });

  const docsFolder = state.folders.find((f) => f.name === 'Documents');

  await prisma.simulatedFile.create({
    data: {
      desktopStateId: state.id,
      folderId: docsFolder?.id ?? null,
      name: 'Welcome to ICT Made Easy',
      fileType: 'document',
      extension: '.vdoc',
      sizeBytes: 340,
      contentJson: JSON.stringify({
        title: 'Welcome to ICT Made Easy',
        html: '<p><b>Welcome to your Virtual Computer Desktop!</b></p><p>You can create folders, write documents in Word Writer, calculate marks in CalcSheet, and prepare slides in SlideDeck.</p>',
        plainText:
          'Welcome to your Virtual Computer Desktop! You can create folders, write documents in Word Writer, calculate marks in CalcSheet, and prepare slides in SlideDeck.',
        fontFamily: 'DM Sans',
        fontSize: 16,
      }),
    },
  });

  return prisma.virtualDesktopState.findUniqueOrThrow({
    where: { id: state.id },
    include: {
      folders: { orderBy: { name: 'asc' } },
      files: { orderBy: { name: 'asc' } },
    },
  });
}
