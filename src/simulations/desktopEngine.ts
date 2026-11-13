import {
  AssessmentCriterion,
  DesktopAppId,
  DesktopWindow,
  SimActionLog,
  SimFile,
  SimFolder,
} from '../types/index.ts';

export interface ClipboardItem {
  kind: 'file' | 'folder';
  mode: 'copy' | 'cut';
  id: string;
}

export interface DesktopNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
}

export const APP_CATALOG: Array<{
  appId: DesktopAppId;
  title: string;
  shortLabel: string;
  defaultWidth: number;
  defaultHeight: number;
}> = [
  { appId: 'file-manager', title: 'File Manager', shortLabel: 'Files', defaultWidth: 780, defaultHeight: 500 },
  { appId: 'word-writer', title: 'Word Writer', shortLabel: 'Word Writer', defaultWidth: 780, defaultHeight: 520 },
  { appId: 'calc-sheet', title: 'CalcSheet', shortLabel: 'CalcSheet', defaultWidth: 820, defaultHeight: 530 },
  { appId: 'slide-deck', title: 'SlideDeck', shortLabel: 'SlideDeck', defaultWidth: 820, defaultHeight: 530 },
  { appId: 'publisher', title: 'Publisher Studio', shortLabel: 'Publisher', defaultWidth: 800, defaultHeight: 520 },
  { appId: 'edu-mail', title: 'EduMail (Simulated)', shortLabel: 'EduMail', defaultWidth: 800, defaultHeight: 520 },
  { appId: 'web-builder', title: 'WebBuilder Studio', shortLabel: 'WebBuilder', defaultWidth: 820, defaultHeight: 530 },
  { appId: 'cloud-drive', title: 'CloudDrive Sync', shortLabel: 'CloudDrive', defaultWidth: 760, defaultHeight: 500 },
  { appId: 'edu-browser', title: 'EduBrowser (Simulated)', shortLabel: 'EduBrowser', defaultWidth: 800, defaultHeight: 510 },
  { appId: 'recycle-bin', title: 'Recycle Bin', shortLabel: 'Recycle Bin', defaultWidth: 660, defaultHeight: 420 },
  { appId: 'settings', title: 'System Settings', shortLabel: 'Settings', defaultWidth: 620, defaultHeight: 440 },
];

export function openAppWindow(
  windows: DesktopWindow[],
  appId: DesktopAppId,
  options?: { fileId?: string | null; titleOverride?: string }
): DesktopWindow[] {
  const maxZ = windows.reduce((m, w) => Math.max(m, w.zIndex), 10);
  const meta = APP_CATALOG.find((a) => a.appId === appId)!;

  // Reuse existing window for same app unless opening a specific file
  const existing = windows.find(
    (w) => w.appId === appId && (!options?.fileId || w.fileId === options.fileId)
  );
  if (existing) {
    return windows.map((w) =>
      w.id === existing.id
        ? { ...w, isMinimized: false, zIndex: maxZ + 1, fileId: options?.fileId ?? w.fileId }
        : w
    );
  }

  const offset = (windows.length % 5) * 28;
  const newWin: DesktopWindow = {
    id: `${appId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    appId,
    title: options?.titleOverride || meta.title,
    x: 44 + offset,
    y: 28 + offset,
    width: meta.defaultWidth,
    height: meta.defaultHeight,
    isMinimized: false,
    isMaximized: false,
    zIndex: maxZ + 1,
    fileId: options?.fileId ?? null,
  };
  return [...windows, newWin];
}

export function focusWindow(windows: DesktopWindow[], winId: string): DesktopWindow[] {
  const maxZ = windows.reduce((m, w) => Math.max(m, w.zIndex), 10);
  return windows.map((w) => (w.id === winId ? { ...w, isMinimized: false, zIndex: maxZ + 1 } : w));
}

export function toggleMinimizeWindow(windows: DesktopWindow[], winId: string): DesktopWindow[] {
  return windows.map((w) => (w.id === winId ? { ...w, isMinimized: !w.isMinimized } : w));
}

export function toggleMaximizeWindow(windows: DesktopWindow[], winId: string): DesktopWindow[] {
  return windows.map((w) => (w.id === winId ? { ...w, isMaximized: !w.isMaximized } : w));
}

export function moveWindow(windows: DesktopWindow[], winId: string, x: number, y: number): DesktopWindow[] {
  return windows.map((w) => (w.id === winId ? { ...w, x: Math.max(0, x), y: Math.max(0, y) } : w));
}

export function closeWindow(windows: DesktopWindow[], winId: string): DesktopWindow[] {
  return windows.filter((w) => w.id !== winId);
}

export function searchVirtualDrive(
  folders: SimFolder[],
  files: SimFile[],
  query: string
): { folders: SimFolder[]; files: SimFile[] } {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      folders: folders.filter((f) => !f.isDeleted),
      files: files.filter((f) => !f.isDeleted),
    };
  }
  return {
    folders: folders.filter((f) => !f.isDeleted && f.name.toLowerCase().includes(q)),
    files: files.filter((f) => !f.isDeleted && f.name.toLowerCase().includes(q)),
  };
}

export function getFolderBreadcrumb(folders: SimFolder[], currentFolderId: string | null): SimFolder[] {
  const chain: SimFolder[] = [];
  let cursor = currentFolderId;
  let guard = 0;
  while (cursor && guard < 12) {
    const folder = folders.find((f) => f.id === cursor);
    if (!folder) break;
    chain.unshift(folder);
    cursor = folder.parentId;
    guard++;
  }
  return chain;
}

export function createActionEntry(type: string, target?: string, detail?: string): SimActionLog {
  return {
    type,
    target,
    detail,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Client-side live checklist evaluator for Level 1 Guided Learning hints.
 * Mirrors the authoritative server evaluator without duplicating grading persistence.
 */
export function checkCriterionLivePreview(
  criterion: AssessmentCriterion,
  folders: SimFolder[],
  files: SimFile[],
  actionsLog: SimActionLog[]
): boolean {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(criterion.rulePayload);
  } catch {
    return false;
  }

  const activeFolders = folders.filter((f) => !f.isDeleted);
  const activeFiles = files.filter((f) => !f.isDeleted);
  const norm = (s: unknown) => String(s || '').trim().toLowerCase();

  switch (criterion.ruleType) {
    case 'FOLDER_EXISTS':
      return activeFolders.some((f) => norm(f.name) === norm(payload.name));

    case 'SUBFOLDER_EXISTS': {
      const parent = activeFolders.find((f) => norm(f.name) === norm(payload.parentName));
      return Boolean(
        parent && activeFolders.some((f) => f.parentId === parent.id && norm(f.name) === norm(payload.name))
      );
    }

    case 'FILE_EXISTS':
      return activeFiles.some((f) => {
        const typeOk = payload.fileType ? f.fileType === payload.fileType : true;
        const nameOk = payload.name ? norm(f.name).includes(norm(payload.name)) : true;
        return typeOk && nameOk;
      });

    case 'FILE_IN_FOLDER': {
      const target = activeFolders.find((f) => norm(f.name) === norm(payload.folderName));
      return Boolean(
        target &&
          activeFiles.some((f) => {
            const typeOk = payload.fileType ? f.fileType === payload.fileType : true;
            return f.folderId === target.id && typeOk;
          })
      );
    }

    case 'DOC_CONTAINS': {
      const docs = activeFiles.filter((f) => f.fileType === 'document');
      const needle = payload.textContains ? norm(payload.textContains) : null;
      const minWords = typeof payload.minWords === 'number' ? payload.minWords : 0;
      const reqBold = Boolean(payload.requireBold);
      const reqUnderline = Boolean(payload.requireUnderline);
      return docs.some((doc) => {
        try {
          const content = JSON.parse(doc.contentJson) as {
            title?: string;
            plainText?: string;
            html?: string;
          };
          const combined = `${content.title || ''} ${content.plainText || ''}`.trim();
          const words = combined ? combined.split(/\s+/).length : 0;
          const html = content.html || '';
          return (
            (!needle || norm(combined).includes(needle)) &&
            words >= minWords &&
            (!reqBold || html.includes('<b>') || html.includes('<strong>')) &&
            (!reqUnderline || html.includes('<u>'))
          );
        } catch {
          return false;
        }
      });
    }

    case 'SHEET_HAS_FORMULA': {
      const sheets = activeFiles.filter((f) => f.fileType === 'spreadsheet');
      const formulas = Array.isArray(payload.formulas)
        ? (payload.formulas as string[]).map((f) => f.toUpperCase())
        : ['SUM'];
      const minRows = typeof payload.minDataRows === 'number' ? payload.minDataRows : 0;
      return sheets.some((s) => {
        try {
          const parsed = JSON.parse(s.contentJson) as { cells?: Record<string, { raw?: string }> };
          const entries = Object.entries(parsed.cells || {});
          const formulaStrs = entries
            .map(([, c]) => String(c?.raw || '').toUpperCase())
            .filter((v) => v.startsWith('='));
          const hasAll = formulas.every((fn) => formulaStrs.some((fs) => fs.includes(`${fn}(`)));
          const rows = new Set(
            entries.filter(([, c]) => String(c?.raw || '').trim() !== '').map(([k]) => k.replace(/[A-Z]+/gi, ''))
          );
          return hasAll && rows.size >= minRows;
        } catch {
          return false;
        }
      });
    }

    case 'DECK_MIN_SLIDES': {
      const minSlides = typeof payload.minSlides === 'number' ? payload.minSlides : 2;
      return activeFiles
        .filter((f) => f.fileType === 'presentation')
        .some((d) => {
          try {
            const parsed = JSON.parse(d.contentJson) as { slides?: Array<{ title?: string; body?: string }> };
            return (
              (parsed.slides || []).filter((s) => (s.title || '').trim() || (s.body || '').trim())
                .length >= minSlides
            );
          } catch {
            return false;
          }
        });
    }

    case 'FILE_COMPRESSED': {
      const nameContains = payload.nameContains ? norm(payload.nameContains) : null;
      const foundZip = activeFiles.some((f) => {
        const isZip =
          f.fileType === 'archive' ||
          norm(f.name).endsWith('.zip') ||
          f.contentJson.includes('"compressed":true');
        return isZip && (!nameContains || norm(f.name).includes(nameContains));
      });
      return foundZip || (!nameContains && actionsLog.some((a) => a.type.toUpperCase() === 'COMPRESS_FILE'));
    }

    case 'FILE_ENCRYPTED': {
      const foundEnc = activeFiles.some((f) => {
        try {
          const parsed = JSON.parse(f.contentJson) as { encrypted?: boolean };
          return Boolean(parsed.encrypted) || norm(f.name).endsWith('.enc');
        } catch {
          return norm(f.name).endsWith('.enc');
        }
      });
      return foundEnc || actionsLog.some((a) => a.type.toUpperCase() === 'ENCRYPT_FILE');
    }

    case 'EMAIL_SENT': {
      const sent = activeFiles.some((f) => {
        if (f.fileType !== 'email') return false;
        try {
          const parsed = JSON.parse(f.contentJson) as { folder?: string; attachmentName?: string };
          return parsed.folder === 'sent' && (!payload.requireAttachment || Boolean(parsed.attachmentName));
        } catch {
          return false;
        }
      });
      return sent || (!payload.requireAttachment && actionsLog.some((a) => a.type.toUpperCase() === 'SEND_EMAIL'));
    }

    case 'PUBLICATION_CREATED':
      return activeFiles.some((f) => f.fileType === 'publication');

    case 'WEBSITE_CREATED':
      return activeFiles.some((f) => {
        if (f.fileType !== 'website') return false;
        try {
          const parsed = JSON.parse(f.contentJson) as { published?: boolean };
          return payload.requirePublished ? Boolean(parsed.published) : true;
        } catch {
          return false;
        }
      });

    case 'CLOUD_SHARED':
      return (
        activeFiles.some((f) => {
          if (f.fileType !== 'cloud') return false;
          try {
            return Boolean((JSON.parse(f.contentJson) as { shared?: boolean }).shared);
          } catch {
            return false;
          }
        }) || actionsLog.some((a) => a.type.toUpperCase() === 'CLOUD_SHARE')
      );

    case 'ACTION_PERFORMED':
      return actionsLog.some((a) => a.type.toUpperCase() === String(payload.actionType || '').toUpperCase());

    default:
      return false;
  }
}
