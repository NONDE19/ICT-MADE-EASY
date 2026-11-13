import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ensurePupilDesktopInitialized } from '../simulation/engine.js';
import {
  desktopSaveSchema,
  fileCreateSchema,
  fileUpdateSchema,
  folderCreateSchema,
  folderUpdateSchema,
} from '../validators/schemas.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getDesktopState(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = await ensurePupilDesktopInitialized(req.user!.id);
    res.json({ state });
  } catch (err) {
    next(err);
  }
}

export async function updateDesktopSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const state = await ensurePupilDesktopInitialized(req.user!.id);
    const data = desktopSaveSchema.parse(req.body);
    const updated = await prisma.virtualDesktopState.update({
      where: { id: state.id },
      data,
      include: {
        folders: { orderBy: { name: 'asc' } },
        files: { orderBy: { name: 'asc' } },
      },
    });
    res.json({ state: updated });
  } catch (err) {
    next(err);
  }
}

export async function createFolder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = await ensurePupilDesktopInitialized(req.user!.id);
    const data = folderCreateSchema.parse(req.body);

    const duplicate = await prisma.simulatedFolder.findFirst({
      where: {
        desktopStateId: state.id,
        parentId: data.parentId ?? null,
        name: data.name,
        isDeleted: false,
      },
    });
    if (duplicate) {
      throw new AppError(`A folder named "${data.name}" already exists here.`, 409);
    }

    const folder = await prisma.simulatedFolder.create({
      data: {
        desktopStateId: state.id,
        name: data.name,
        parentId: data.parentId ?? null,
      },
    });
    res.status(201).json({ folder });
  } catch (err) {
    next(err);
  }
}

export async function updateFolder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = await ensurePupilDesktopInitialized(req.user!.id);
    const id = String(req.params.id);
    const data = folderUpdateSchema.parse(req.body);

    const existing = await prisma.simulatedFolder.findUnique({ where: { id } });
    if (!existing || existing.desktopStateId !== state.id) {
      throw new AppError('Folder not found.', 404);
    }

    const updated = await prisma.simulatedFolder.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        ...(data.isDeleted !== undefined
          ? { isDeleted: data.isDeleted, deletedAt: data.isDeleted ? new Date() : null }
          : {}),
      },
    });
    res.json({ folder: updated });
  } catch (err) {
    next(err);
  }
}

export async function createFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = await ensurePupilDesktopInitialized(req.user!.id);
    const data = fileCreateSchema.parse(req.body);

    const extMap: Record<string, string> = {
      document: '.vdoc',
      spreadsheet: '.vsheet',
      presentation: '.vdeck',
      text: '.txt',
      archive: '.zip',
      publication: '.vpub',
      website: '.vweb',
      email: '.vmail',
      cloud: '.vcloud',
    };

    const file = await prisma.simulatedFile.create({
      data: {
        desktopStateId: state.id,
        folderId: data.folderId ?? null,
        name: data.name,
        fileType: data.fileType,
        extension: data.extension || extMap[data.fileType] || '.vdoc',
        contentJson: data.contentJson,
        sizeBytes: Buffer.byteLength(data.contentJson, 'utf8'),
      },
    });
    res.status(201).json({ file });
  } catch (err) {
    next(err);
  }
}

export async function updateFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = await ensurePupilDesktopInitialized(req.user!.id);
    const id = String(req.params.id);
    const data = fileUpdateSchema.parse(req.body);

    const existing = await prisma.simulatedFile.findUnique({ where: { id } });
    if (!existing || existing.desktopStateId !== state.id) {
      throw new AppError('File not found.', 404);
    }

    const updated = await prisma.simulatedFile.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.extension !== undefined ? { extension: data.extension } : {}),
        ...(data.folderId !== undefined ? { folderId: data.folderId } : {}),
        ...(data.contentJson !== undefined
          ? {
              contentJson: data.contentJson,
              sizeBytes: Buffer.byteLength(data.contentJson, 'utf8'),
            }
          : {}),
        ...(data.isDeleted !== undefined
          ? { isDeleted: data.isDeleted, deletedAt: data.isDeleted ? new Date() : null }
          : {}),
      },
    });
    res.json({ file: updated });
  } catch (err) {
    next(err);
  }
}

export async function emptyRecycleBin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = await ensurePupilDesktopInitialized(req.user!.id);
    await Promise.all([
      prisma.simulatedFile.deleteMany({ where: { desktopStateId: state.id, isDeleted: true } }),
      prisma.simulatedFolder.deleteMany({ where: { desktopStateId: state.id, isDeleted: true } }),
    ]);
    res.json({ message: 'Recycle bin emptied.' });
  } catch (err) {
    next(err);
  }
}
