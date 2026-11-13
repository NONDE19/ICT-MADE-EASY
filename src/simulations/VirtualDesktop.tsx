import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Cpu,
  FileSpreadsheet,
  FileText,
  Folder,
  Globe,
  HardDrive,
  Layout,
  Mail,
  Maximize2,
  Minimize2,
  Minus,
  Monitor,
  PanelTop,
  Power,
  Presentation,
  RotateCcw,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { apiRequest, isNetworkError } from '../services/api.ts';
import {
  createDefaultOfflineDesktopState,
  getCachedJson,
  queueOfflineAction,
  setCachedJson,
} from '../services/offlineDb.ts';
import {
  DesktopAppId,
  DesktopWindow,
  SimActionLog,
  SimFile,
  SimFileType,
  SimFolder,
  VirtualDesktopStateData,
} from '../types/index.ts';
import {
  APP_CATALOG,
  ClipboardItem,
  closeWindow,
  createActionEntry,
  DesktopNotification,
  focusWindow,
  moveWindow,
  openAppWindow,
  toggleMaximizeWindow,
  toggleMinimizeWindow,
} from './desktopEngine.ts';
import { FileManagerApp } from './apps/FileManagerApp.tsx';
import { WordWriterApp } from './apps/WordWriterApp.tsx';
import { CalcSheetApp } from './apps/CalcSheetApp.tsx';
import { SlideDeckApp } from './apps/SlideDeckApp.tsx';
import { EduBrowserApp } from './apps/EduBrowserApp.tsx';
import { PublisherApp } from './apps/PublisherApp.tsx';
import { EduMailApp } from './apps/EduMailApp.tsx';
import { WebBuilderApp } from './apps/WebBuilderApp.tsx';
import { CloudDriveApp } from './apps/CloudDriveApp.tsx';

interface VirtualDesktopProps {
  compact?: boolean;
  onActionsChange?: (actions: SimActionLog[]) => void;
  onDesktopStateChange?: (folders: SimFolder[], files: SimFile[]) => void;
}

const WALLPAPERS: Record<string, string> = {
  'zambia-dawn': 'bg-gradient-to-br from-[#0B1F3A] via-[#12385B] to-[#0D6E6E]',
  'lusaka-night': 'bg-gradient-to-br from-slate-950 via-[#0F2744] to-slate-900',
  'copperbelt-slate': 'bg-gradient-to-br from-slate-800 via-slate-900 to-[#164E63]',
  'clear-teal': 'bg-gradient-to-br from-teal-900 via-[#0F3A4A] to-[#0B192C]',
};

const EXT_MAP: Record<SimFileType, string> = {
  document: '.vdoc',
  spreadsheet: '.vsheet',
  presentation: '.vslide',
  text: '.txt',
  archive: '.zip',
  publication: '.vpub',
  website: '.vweb',
  email: '.vmail',
  cloud: '.vcloud',
};

const BOOT_STEPS = [
  { label: 'PSU Power-Good Signal', detail: '+12V / +5V / +3.3V DC Rails Verified' },
  { label: 'ROM BIOS / UEFI Firmware v2.4', detail: 'Power-On Self-Test (POST) Completed OK' },
  { label: 'CPU Initialization', detail: 'Quad-Core 2.0 GHz Processor Verified' },
  { label: 'RAM Memory Test', detail: '8192 MB DDR4 System Memory OK' },
  { label: 'Storage & Peripherals', detail: '120 GB SSD (C:), USB (E:), Mouse & Keyboard Ready' },
  { label: 'Loading ICT Made Easy OS', detail: 'Starting Graphical Desktop Environment...' },
];

export const VirtualDesktop: React.FC<VirtualDesktopProps> = ({
  compact = false,
  onActionsChange,
  onDesktopStateChange,
}) => {
  const { user, isOfflineGuest } = useAuth();
  const cacheKey = `desktopState:${user?.id || 'guest'}`;

  const [powerState, setPowerState] = useState<'off' | 'booting' | 'on'>(compact ? 'on' : 'off');
  const [bootStep, setBootStep] = useState(0);
  const [desktopState, setDesktopState] = useState<VirtualDesktopStateData | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [windows, setWindows] = useState<DesktopWindow[]>([]);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [notifications, setNotifications] = useState<DesktopNotification[]>([]);
  const [actionsLog, setActionsLog] = useState<SimActionLog[]>([]);
  const [nowTime, setNowTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Keep parent callbacks in refs so changing inline props never triggers re-boot loops
  const onActionsChangeRef = useRef(onActionsChange);
  const onDesktopStateChangeRef = useRef(onDesktopStateChange);
  useEffect(() => {
    onActionsChangeRef.current = onActionsChange;
  }, [onActionsChange]);
  useEffect(() => {
    onDesktopStateChangeRef.current = onDesktopStateChange;
  }, [onDesktopStateChange]);

  const dragRef = useRef<{
    winId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const pushNotification = useCallback((title: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setNotifications((prev) => [
      ...prev.slice(-2),
      { id, title, message, timestamp: new Date().toLocaleTimeString() },
    ]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  }, []);

  const logAction = useCallback((type: string, target?: string, detail?: string) => {
    const entry = createActionEntry(type, target, detail);
    setActionsLog((prev) => {
      const next = [...prev, entry];
      onActionsChangeRef.current?.(next);
      return next;
    });
  }, []);

  const applyAndCacheDesktopState = useCallback(
    async (nextState: VirtualDesktopStateData) => {
      setDesktopState(nextState);
      onDesktopStateChangeRef.current?.(nextState.folders, nextState.files);
      try {
        await setCachedJson(cacheKey, nextState);
      } catch {
        // Ignore IndexedDB quota errors
      }
    },
    [cacheKey]
  );

  const loadDesktopState = useCallback(async () => {
    setLoading(true);
    try {
      if (isOfflineGuest) {
        const cached =
          (await getCachedJson<VirtualDesktopStateData>(cacheKey)) ||
          createDefaultOfflineDesktopState();
        await applyAndCacheDesktopState(cached);
        setOfflineMode(true);
        setError('');
        return;
      }

      const res = await apiRequest<{ state: VirtualDesktopStateData }>('/api/desktop/state');
      setOfflineMode(false);
      await applyAndCacheDesktopState(res.state);
      setError('');
    } catch (err) {
      if (isNetworkError(err)) {
        const cached =
          (await getCachedJson<VirtualDesktopStateData>(cacheKey)) ||
          createDefaultOfflineDesktopState();
        await applyAndCacheDesktopState(cached);
        setOfflineMode(true);
        setError('');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load virtual desktop state.');
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, isOfflineGuest, applyAndCacheDesktopState]);

  useEffect(() => {
    loadDesktopState();
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadDesktopState]);

  useEffect(() => {
    if (powerState !== 'booting') return;
    setBootStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= BOOT_STEPS.length; i++) {
      timers.push(
        setTimeout(() => {
          if (i < BOOT_STEPS.length) {
            setBootStep(i);
          } else {
            setPowerState('on');
            pushNotification('Computer Booted', 'BIOS POST passed. ICT Made Easy OS is ready.');
          }
        }, i * 380)
      );
    }
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [powerState, pushNotification]);

  const handlePowerOn = () => {
    if (powerState !== 'off') return;
    logAction('BOOT_PC', 'power-button', 'Pressed system unit power button');
    setPowerState('booting');
  };

  const handleShutdown = () => {
    setWindows([]);
    setStartMenuOpen(false);
    setContextMenu(null);
    logAction('SHUTDOWN_PC', 'power-button', 'Shut down simulated computer');
    setPowerState('off');
  };

  const handleRestartBootDemo = () => {
    setWindows([]);
    setStartMenuOpen(false);
    setContextMenu(null);
    logAction('RESTART_PC', 'boot-demo', 'Restarted computer for boot demonstration');
    setPowerState('booting');
  };

  const handleOpenApp = (appId: DesktopAppId, fileId?: string | null, titleOverride?: string) => {
    setWindows((prev) => openAppWindow(prev, appId, { fileId, titleOverride }));
    setStartMenuOpen(false);
    setContextMenu(null);
    logAction('OPEN_APP', appId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const { winId, startX, startY, origX, origY } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    setWindows((prev) => moveWindow(prev, winId, origX + dx, origY + dy));
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const refreshAfterChange = async () => {
    const res = await apiRequest<{ state: VirtualDesktopStateData }>('/api/desktop/state');
    setOfflineMode(false);
    await applyAndCacheDesktopState(res.state);
    return res.state;
  };

  const mutateOffline = async (
    updater: (prev: VirtualDesktopStateData) => VirtualDesktopStateData,
    syncItem?: { endpoint: string; method: string; body: unknown; description: string }
  ) => {
    setOfflineMode(true);
    if (!desktopState) return;
    const next = updater(desktopState);
    await applyAndCacheDesktopState(next);
    if (syncItem && !isOfflineGuest && !syncItem.endpoint.includes('local-')) {
      try {
        await queueOfflineAction(
          syncItem.endpoint,
          syncItem.method,
          syncItem.body,
          syncItem.description
        );
      } catch {
        // ignore queue error
      }
    }
  };

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    if (!isOfflineGuest) {
      try {
        await apiRequest('/api/desktop/folders', {
          method: 'POST',
          body: JSON.stringify({ name, parentId }),
        });
        await refreshAfterChange();
        logAction('CREATE_FOLDER', name);
        pushNotification('Folder Created', `Created folder "${name}"`);
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    const newFolder: SimFolder = {
      id: `local-folder-${Date.now()}`,
      desktopStateId: desktopState?.id || 'offline-desktop-state',
      name,
      parentId,
      isDeleted: false,
      deletedAt: null,
    };
    await mutateOffline(
      (prev) => ({ ...prev, folders: [...prev.folders, newFolder] }),
      {
        endpoint: '/api/desktop/folders',
        method: 'POST',
        body: { name, parentId },
        description: `Create folder "${name}"`,
      }
    );
    logAction('CREATE_FOLDER', name);
    pushNotification('Folder Saved Locally', `Created folder "${name}" offline`);
  };

  const handleRenameFolder = async (id: string, name: string) => {
    if (!isOfflineGuest && !id.startsWith('local-')) {
      try {
        await apiRequest(`/api/desktop/folders/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name }),
        });
        await refreshAfterChange();
        logAction('RENAME_FOLDER', name);
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({
        ...prev,
        folders: prev.folders.map((f) => (f.id === id ? { ...f, name } : f)),
      }),
      {
        endpoint: `/api/desktop/folders/${id}`,
        method: 'PATCH',
        body: { name },
        description: `Rename folder to "${name}"`,
      }
    );
    logAction('RENAME_FOLDER', name);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!isOfflineGuest && !id.startsWith('local-')) {
      try {
        await apiRequest(`/api/desktop/folders/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isDeleted: true }),
        });
        await refreshAfterChange();
        logAction('DELETE_FOLDER', id);
        pushNotification('Moved to Recycle Bin', 'Folder moved to Recycle Bin.');
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({
        ...prev,
        folders: prev.folders.map((f) => (f.id === id ? { ...f, isDeleted: true } : f)),
      }),
      {
        endpoint: `/api/desktop/folders/${id}`,
        method: 'PATCH',
        body: { isDeleted: true },
        description: 'Move folder to Recycle Bin',
      }
    );
    logAction('DELETE_FOLDER', id);
    pushNotification('Moved to Recycle Bin', 'Folder moved to Recycle Bin (offline).');
  };

  const handleRestoreFolder = async (id: string) => {
    if (!isOfflineGuest && !id.startsWith('local-')) {
      try {
        await apiRequest(`/api/desktop/folders/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isDeleted: false }),
        });
        await refreshAfterChange();
        logAction('RESTORE_FOLDER', id);
        pushNotification('Restored', 'Folder restored from Recycle Bin.');
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({
        ...prev,
        folders: prev.folders.map((f) => (f.id === id ? { ...f, isDeleted: false } : f)),
      }),
      {
        endpoint: `/api/desktop/folders/${id}`,
        method: 'PATCH',
        body: { isDeleted: false },
        description: 'Restore folder from Recycle Bin',
      }
    );
    logAction('RESTORE_FOLDER', id);
    pushNotification('Restored', 'Folder restored from Recycle Bin (offline).');
  };

  const handleCreateFile = async (
    name: string,
    fileType: SimFileType,
    folderId: string | null,
    contentJson: string = '{}',
    extensionOverride?: string
  ) => {
    const resolvedExtension = extensionOverride || EXT_MAP[fileType] || '.txt';
    if (!isOfflineGuest) {
      try {
        const res = await apiRequest<{ file: SimFile }>('/api/desktop/files', {
          method: 'POST',
          body: JSON.stringify({
            name,
            fileType,
            extension: resolvedExtension,
            folderId,
            contentJson,
          }),
        });
        await refreshAfterChange();
        logAction('CREATE_FILE', name);
        pushNotification('File Created', `Created "${res.file.name}${res.file.extension}"`);
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    const newFile: SimFile = {
      id: `local-file-${Date.now()}`,
      desktopStateId: desktopState?.id || 'offline-desktop-state',
      folderId,
      name,
      fileType,
      extension: resolvedExtension,
      contentJson,
      sizeBytes: contentJson.length,
      isDeleted: false,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    };
    await mutateOffline(
      (prev) => ({ ...prev, files: [...prev.files, newFile] }),
      {
        endpoint: '/api/desktop/files',
        method: 'POST',
        body: { name, fileType, extension: resolvedExtension, folderId, contentJson },
        description: `Create file "${name}${resolvedExtension}"`,
      }
    );
    logAction('CREATE_FILE', name);
    pushNotification('File Saved Locally', `Created "${name}${resolvedExtension}" offline`);
  };

  const handleUpdateFileContent = async (
    id: string,
    patch: { name?: string; extension?: string; contentJson?: string }
  ) => {
    if (!isOfflineGuest && !id.startsWith('local-')) {
      try {
        await apiRequest(`/api/desktop/files/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        await refreshAfterChange();
        logAction('UPDATE_FILE', patch.name || id);
        pushNotification('File Updated', `Updated "${patch.name || 'file'}"`);
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({
        ...prev,
        files: prev.files.map((f) =>
          f.id === id
            ? {
                ...f,
                name: patch.name ?? f.name,
                extension: patch.extension ?? f.extension,
                contentJson: patch.contentJson ?? f.contentJson,
                sizeBytes: patch.contentJson ? patch.contentJson.length : f.sizeBytes,
                updatedAt: new Date().toISOString(),
              }
            : f
        ),
      }),
      {
        endpoint: `/api/desktop/files/${id}`,
        method: 'PATCH',
        body: patch,
        description: `Update file "${patch.name || id}"`,
      }
    );
    logAction('UPDATE_FILE', patch.name || id);
    pushNotification('File Updated Locally', `Updated "${patch.name || 'file'}" offline`);
  };

  const handleSaveAppFile = async (
    fileType: SimFileType,
    params: { fileId?: string | null; name: string; folderId: string | null; contentJson: string }
  ): Promise<SimFile> => {
    if (!isOfflineGuest && (!params.fileId || !params.fileId.startsWith('local-'))) {
      try {
        let savedFile: SimFile;
        if (params.fileId) {
          const res = await apiRequest<{ file: SimFile }>(`/api/desktop/files/${params.fileId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              name: params.name,
              folderId: params.folderId,
              contentJson: params.contentJson,
            }),
          });
          savedFile = res.file;
        } else {
          const res = await apiRequest<{ file: SimFile }>('/api/desktop/files', {
            method: 'POST',
            body: JSON.stringify({
              name: params.name,
              fileType,
              folderId: params.folderId,
              contentJson: params.contentJson,
            }),
          });
          savedFile = res.file;
        }
        await refreshAfterChange();
        logAction('SAVE_FILE', savedFile.name, fileType);
        pushNotification('File Saved', `Saved "${savedFile.name}${savedFile.extension}"`);
        return savedFile;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    const extension = EXT_MAP[fileType] || '.vdoc';
    const existing = params.fileId
      ? desktopState?.files.find((f) => f.id === params.fileId)
      : undefined;

    const savedFile: SimFile = existing
      ? {
          ...existing,
          name: params.name,
          folderId: params.folderId,
          contentJson: params.contentJson,
          sizeBytes: params.contentJson.length,
          updatedAt: new Date().toISOString(),
        }
      : {
          id: `local-file-${Date.now()}`,
          desktopStateId: desktopState?.id || 'offline-desktop-state',
          folderId: params.folderId,
          name: params.name,
          fileType,
          extension,
          contentJson: params.contentJson,
          sizeBytes: params.contentJson.length,
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date().toISOString(),
        };

    await mutateOffline(
      (prev) => ({
        ...prev,
        files: existing
          ? prev.files.map((f) => (f.id === existing.id ? savedFile : f))
          : [...prev.files, savedFile],
      }),
      existing
        ? {
            endpoint: `/api/desktop/files/${existing.id}`,
            method: 'PATCH',
            body: {
              name: params.name,
              folderId: params.folderId,
              contentJson: params.contentJson,
            },
            description: `Update "${params.name}"`,
          }
        : {
            endpoint: '/api/desktop/files',
            method: 'POST',
            body: {
              name: params.name,
              fileType,
              folderId: params.folderId,
              contentJson: params.contentJson,
            },
            description: `Create "${params.name}${extension}"`,
          }
    );
    logAction('SAVE_FILE', savedFile.name, fileType);
    pushNotification('Saved Locally', `Saved "${savedFile.name}${savedFile.extension}" offline`);
    return savedFile;
  };

  const handleRenameFile = async (id: string, name: string) => {
    if (!isOfflineGuest && !id.startsWith('local-')) {
      try {
        await apiRequest(`/api/desktop/files/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name }),
        });
        await refreshAfterChange();
        logAction('RENAME_FILE', name);
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === id ? { ...f, name } : f)),
      }),
      {
        endpoint: `/api/desktop/files/${id}`,
        method: 'PATCH',
        body: { name },
        description: `Rename file to "${name}"`,
      }
    );
    logAction('RENAME_FILE', name);
  };

  const handleMoveFile = async (id: string, targetFolderId: string | null) => {
    if (!isOfflineGuest && !id.startsWith('local-')) {
      try {
        await apiRequest(`/api/desktop/files/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ folderId: targetFolderId }),
        });
        await refreshAfterChange();
        logAction('MOVE_FILE', id);
        pushNotification('File Moved', 'File moved to selected folder.');
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === id ? { ...f, folderId: targetFolderId } : f)),
      }),
      {
        endpoint: `/api/desktop/files/${id}`,
        method: 'PATCH',
        body: { folderId: targetFolderId },
        description: 'Move file to folder',
      }
    );
    logAction('MOVE_FILE', id);
    pushNotification('File Moved', 'File moved locally (offline).');
  };

  const handleCopyFileToFolder = async (file: SimFile, targetFolderId: string | null) => {
    if (!isOfflineGuest) {
      try {
        await apiRequest('/api/desktop/files', {
          method: 'POST',
          body: JSON.stringify({
            name: `${file.name} (Copy)`,
            fileType: file.fileType,
            extension: file.extension,
            folderId: targetFolderId,
            contentJson: file.contentJson,
          }),
        });
        await refreshAfterChange();
        logAction('COPY_FILE', file.name);
        pushNotification('File Copied', `Copied "${file.name}"`);
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    const copied: SimFile = {
      ...file,
      id: `local-file-${Date.now()}`,
      name: `${file.name} (Copy)`,
      folderId: targetFolderId,
      isDeleted: false,
      updatedAt: new Date().toISOString(),
    };
    await mutateOffline(
      (prev) => ({ ...prev, files: [...prev.files, copied] }),
      {
        endpoint: '/api/desktop/files',
        method: 'POST',
        body: {
          name: copied.name,
          fileType: file.fileType,
          extension: file.extension,
          folderId: targetFolderId,
          contentJson: file.contentJson,
        },
        description: `Copy "${file.name}"`,
      }
    );
    logAction('COPY_FILE', file.name);
    pushNotification('File Copied', `Copied "${file.name}" offline`);
  };

  const handleDeleteFile = async (id: string) => {
    if (!isOfflineGuest && !id.startsWith('local-')) {
      try {
        await apiRequest(`/api/desktop/files/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isDeleted: true }),
        });
        await refreshAfterChange();
        logAction('DELETE_FILE', id);
        pushNotification('Moved to Recycle Bin', 'File moved to Recycle Bin.');
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === id ? { ...f, isDeleted: true } : f)),
      }),
      {
        endpoint: `/api/desktop/files/${id}`,
        method: 'PATCH',
        body: { isDeleted: true },
        description: 'Move file to Recycle Bin',
      }
    );
    logAction('DELETE_FILE', id);
    pushNotification('Moved to Recycle Bin', 'File moved to Recycle Bin (offline).');
  };

  const handleRestoreFile = async (id: string) => {
    if (!isOfflineGuest && !id.startsWith('local-')) {
      try {
        await apiRequest(`/api/desktop/files/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isDeleted: false }),
        });
        await refreshAfterChange();
        logAction('RESTORE_FILE', id);
        pushNotification('File Restored', 'File restored from Recycle Bin.');
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === id ? { ...f, isDeleted: false } : f)),
      }),
      {
        endpoint: `/api/desktop/files/${id}`,
        method: 'PATCH',
        body: { isDeleted: false },
        description: 'Restore file from Recycle Bin',
      }
    );
    logAction('RESTORE_FILE', id);
    pushNotification('File Restored', 'File restored from Recycle Bin (offline).');
  };

  const handleEmptyRecycleBin = async () => {
    if (!isOfflineGuest) {
      try {
        await apiRequest('/api/desktop/recycle-bin', { method: 'DELETE' });
        await refreshAfterChange();
        pushNotification('Recycle Bin Emptied', 'Deleted items cleared.');
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({
        ...prev,
        folders: prev.folders.filter((f) => !f.isDeleted),
        files: prev.files.filter((f) => !f.isDeleted),
      }),
      {
        endpoint: '/api/desktop/recycle-bin',
        method: 'DELETE',
        body: {},
        description: 'Empty Recycle Bin',
      }
    );
    pushNotification('Recycle Bin Emptied', 'Deleted items cleared locally.');
  };

  const handleSaveSettings = async (patch: Partial<VirtualDesktopStateData>) => {
    if (!isOfflineGuest) {
      try {
        const res = await apiRequest<{ state: VirtualDesktopStateData }>('/api/desktop/settings', {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        await applyAndCacheDesktopState(res.state);
        logAction('CHANGE_SETTINGS', JSON.stringify(patch));
        pushNotification('Settings Updated', 'Desktop preferences saved.');
        return;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
      }
    }

    await mutateOffline(
      (prev) => ({ ...prev, ...patch }),
      {
        endpoint: '/api/desktop/settings',
        method: 'PATCH',
        body: patch,
        description: 'Update desktop settings',
      }
    );
    logAction('CHANGE_SETTINGS', JSON.stringify(patch));
    pushNotification('Settings Saved', 'Desktop preferences saved locally.');
  };

  const openFileInApp = (file: SimFile) => {
    if (file.fileType === 'document' || file.fileType === 'text') {
      handleOpenApp('word-writer', file.id, `Word Writer — ${file.name}`);
    } else if (file.fileType === 'spreadsheet') {
      handleOpenApp('calc-sheet', file.id, `CalcSheet — ${file.name}`);
    } else if (file.fileType === 'presentation') {
      handleOpenApp('slide-deck', file.id, `SlideDeck — ${file.name}`);
    } else if (file.fileType === 'publication') {
      handleOpenApp('publisher', file.id, `Publisher — ${file.name}`);
    } else if (file.fileType === 'website') {
      handleOpenApp('web-builder', file.id, `WebBuilder — ${file.name}`);
    } else if (file.fileType === 'email') {
      handleOpenApp('edu-mail', file.id, 'EduMail (Simulated)');
    } else if (file.fileType === 'cloud') {
      handleOpenApp('cloud-drive', file.id, 'CloudDrive Sync');
    }
  };

  const renderDesktopIcon = (appId: DesktopAppId) => {
    if (appId === 'file-manager') return <Folder className="h-6 w-6 text-amber-400" />;
    if (appId === 'word-writer') return <FileText className="h-6 w-6 text-sky-400" />;
    if (appId === 'calc-sheet') return <FileSpreadsheet className="h-6 w-6 text-emerald-400" />;
    if (appId === 'slide-deck') return <Presentation className="h-6 w-6 text-orange-400" />;
    if (appId === 'publisher') return <Layout className="h-6 w-6 text-pink-400" />;
    if (appId === 'edu-mail') return <Mail className="h-6 w-6 text-indigo-400" />;
    if (appId === 'web-builder') return <PanelTop className="h-6 w-6 text-violet-400" />;
    if (appId === 'cloud-drive') return <Cloud className="h-6 w-6 text-teal-300" />;
    if (appId === 'edu-browser') return <Globe className="h-6 w-6 text-cyan-400" />;
    if (appId === 'recycle-bin') return <Trash2 className="h-6 w-6 text-slate-300" />;
    return <Settings className="h-6 w-6 text-slate-300" />;
  };

  if (powerState === 'off') {
    return (
      <div className="space-y-3">
        {!compact && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              ICT Made Easy Computer Simulation · Hardware Standby Mode (Press Power Button to Boot)
            </span>
            <span className="font-mono tabular-nums">
              Actions logged this session: {actionsLog.length}
            </span>
          </div>
        )}

        <div
          className={`relative w-full ${
            compact ? 'h-[560px]' : 'h-[640px]'
          } rounded-xl border-4 border-slate-800 bg-slate-950 overflow-hidden shadow-xl flex flex-col justify-between p-6 text-slate-200`}
        >
          {/* Dark Powered-Off Monitor Screen */}
          <div className="flex-1 rounded-lg border border-slate-800 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <Monitor className="h-12 w-12 text-slate-700 mb-3" />
            <p className="font-mono text-xs text-slate-500 uppercase tracking-wider">
              Monitor Status: No Video Signal (System Unit Powered Off)
            </p>
            <h3 className="mt-2 font-display text-xl font-bold text-white">
              Press the System Unit Power Button to Boot the Computer
            </h3>
            <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
              Demonstrate how a computer turns on: pressing the hardware power button wakes the PSU, runs ROM BIOS/UEFI Power-On Self-Test (POST), verifies CPU/RAM/SSD, and loads the Desktop OS.
            </p>

            <button
              type="button"
              onClick={handlePowerOn}
              className="mt-6 inline-flex items-center gap-3 rounded-full border-2 border-emerald-400/70 bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/60 hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer"
            >
              <Power className="h-5 w-5" />
              <span>Press Power Button to Boot PC</span>
            </button>
          </div>

          {/* Realistic System Unit Front Panel Bar */}
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-300 font-medium">Mains AC: Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="text-slate-400">CPU / RAM / SSD: Powered Off</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="text-slate-400">USB Drive (E:): Standby</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePowerOn}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-slate-700 cursor-pointer"
            >
              <Power className="h-4 w-4" />
              <span>⏻ Power On System Unit</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (powerState === 'booting') {
    return (
      <div className="space-y-3">
        {!compact && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>ICT Made Easy Computer Simulation · Running Hardware POST &amp; OS Boot</span>
            <span className="font-mono tabular-nums">
              Step {Math.min(bootStep + 1, BOOT_STEPS.length)}/{BOOT_STEPS.length}
            </span>
          </div>
        )}

        <div
          className={`relative w-full ${
            compact ? 'h-[560px]' : 'h-[640px]'
          } rounded-xl border-4 border-slate-800 bg-slate-950 overflow-hidden shadow-xl flex flex-col justify-between p-6 text-slate-100`}
        >
          <div className="flex-1 rounded-lg border border-slate-800 bg-black p-6 font-mono text-xs flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <Cpu className="h-4 w-4" />
                  <span>ICT MADE EASY BIOS / UEFI POST v2.4</span>
                </div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  POWER ON
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {BOOT_STEPS.map((step, index) => {
                  const done = index < bootStep;
                  const active = index === bootStep;
                  return (
                    <div
                      key={step.label}
                      className={`flex items-start justify-between gap-4 rounded-lg border px-3.5 py-2.5 transition-all ${
                        done
                          ? 'border-emerald-800/60 bg-emerald-950/20 text-emerald-300'
                          : active
                          ? 'border-teal-500/70 bg-teal-950/30 text-white'
                          : 'border-slate-900 bg-slate-950/40 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              active ? 'bg-teal-400 animate-pulse' : 'bg-slate-700'
                            }`}
                          />
                        )}
                        <span className="font-semibold">{step.label}</span>
                      </div>
                      <span className="text-[11px] text-right">{step.detail}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
              <span className="text-slate-400">
                Boot sequence runs automatically from Power Button press...
              </span>
              <button
                type="button"
                onClick={() => {
                  setPowerState('on');
                  pushNotification('Computer Booted', 'ICT Made Easy OS is ready.');
                }}
                className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-sans font-medium text-slate-200 hover:bg-slate-800"
              >
                Skip Animation -&gt; Open Desktop
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[580px] rounded-xl bg-slate-900 text-slate-300 flex items-center justify-center text-sm">
        Loading ICT Made Easy Desktop Environment...
      </div>
    );
  }

  if (error || !desktopState) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-800">
        {error || 'Virtual Desktop unavailable.'}
      </div>
    );
  }

  const wallpaperClass = WALLPAPERS[desktopState.wallpaper] || WALLPAPERS['zambia-dawn'];

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            ICT Made Easy Simulated Computer Desktop · Educational Sandbox (
            {offlineMode ? (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                <HardDrive className="h-3.5 w-3.5" />
                Offline Local Storage
              </span>
            ) : (
              'Changes persist to your school database'
            )}
            )
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRestartBootDemo}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3 w-3" />
              Restart (Boot Demo)
            </button>
            <button
              type="button"
              onClick={handleShutdown}
              className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              <Power className="h-3 w-3" />
              Shut Down PC
            </button>
            <span className="font-mono tabular-nums">
              Actions logged: {actionsLog.length}
            </span>
          </div>
        </div>
      )}

      {/* Desktop Screen Frame */}
      <div
        className={`relative w-full ${
          compact ? 'h-[560px]' : 'h-[640px]'
        } rounded-xl border border-slate-700 overflow-hidden shadow-xl select-none flex flex-col ${wallpaperClass}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => {
          setStartMenuOpen(false);
          setContextMenu(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        {/* Desktop Canvas Area */}
        <div className="relative flex-1 p-4 overflow-hidden">
          {/* Desktop Icons Grid */}
          <div className="grid grid-flow-col grid-rows-6 gap-2 w-fit">
            {APP_CATALOG.map((app) => (
              <button
                key={app.appId}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenApp(app.appId);
                }}
                className="w-24 rounded-lg p-1.5 flex flex-col items-center text-center text-white hover:bg-white/15 focus:bg-white/20 focus:outline-none transition-colors"
              >
                <div className="mb-1">{renderDesktopIcon(app.appId)}</div>
                <span className="text-[11px] font-medium leading-tight drop-shadow">
                  {app.shortLabel}
                </span>
              </button>
            ))}
          </div>

          {/* Open Windows */}
          {windows
            .filter((w) => !w.isMinimized)
            .map((win) => (
              <div
                key={win.id}
                onMouseDown={() => setWindows((prev) => focusWindow(prev, win.id))}
                style={
                  win.isMaximized
                    ? { inset: '0px', zIndex: win.zIndex }
                    : {
                        left: `${win.x}px`,
                        top: `${win.y}px`,
                        width: `min(${win.width}px, calc(100% - 16px))`,
                        height: `min(${win.height}px, calc(100% - 16px))`,
                        zIndex: win.zIndex,
                      }
                }
                className="absolute rounded-lg border border-slate-600/80 bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Window Title Bar */}
                <div
                  onMouseDown={(e) => {
                    if (win.isMaximized) return;
                    dragRef.current = {
                      winId: win.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: win.x,
                      origY: win.y,
                    };
                  }}
                  className="flex h-9 items-center justify-between bg-slate-950 px-3 text-xs text-slate-200 border-b border-slate-800 cursor-move shrink-0"
                >
                  <span className="font-medium truncate pr-3">{win.title}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWindows((prev) => toggleMinimizeWindow(prev, win.id));
                      }}
                      className="rounded p-1 hover:bg-slate-800"
                      aria-label="Minimize window"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWindows((prev) => toggleMaximizeWindow(prev, win.id));
                      }}
                      className="rounded p-1 hover:bg-slate-800"
                      aria-label="Maximize window"
                    >
                      {win.isMaximized ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWindows((prev) => closeWindow(prev, win.id));
                      }}
                      className="rounded p-1 hover:bg-red-600 hover:text-white"
                      aria-label="Close window"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Window Body */}
                <div className="flex-1 overflow-hidden">
                  {(win.appId === 'file-manager' || win.appId === 'recycle-bin') && (
                    <FileManagerApp
                      mode={win.appId === 'recycle-bin' ? 'recycle-bin' : 'explorer'}
                      folders={desktopState.folders}
                      files={desktopState.files}
                      clipboard={clipboard}
                      onSetClipboard={setClipboard}
                      onCreateFolder={handleCreateFolder}
                      onRenameFolder={handleRenameFolder}
                      onDeleteFolder={handleDeleteFolder}
                      onRestoreFolder={handleRestoreFolder}
                      onCreateFile={handleCreateFile}
                      onUpdateFileContent={handleUpdateFileContent}
                      onRenameFile={handleRenameFile}
                      onMoveFile={handleMoveFile}
                      onCopyFileToFolder={handleCopyFileToFolder}
                      onDeleteFile={handleDeleteFile}
                      onRestoreFile={handleRestoreFile}
                      onEmptyRecycleBin={handleEmptyRecycleBin}
                      onOpenFile={openFileInApp}
                      onLogCustomAction={logAction}
                    />
                  )}

                  {win.appId === 'word-writer' && (
                    <WordWriterApp
                      initialFileId={win.fileId}
                      folders={desktopState.folders}
                      files={desktopState.files}
                      onSaveDocument={(p) => handleSaveAppFile('document', p)}
                    />
                  )}

                  {win.appId === 'calc-sheet' && (
                    <CalcSheetApp
                      initialFileId={win.fileId}
                      folders={desktopState.folders}
                      files={desktopState.files}
                      onSaveSheet={(p) => handleSaveAppFile('spreadsheet', p)}
                    />
                  )}

                  {win.appId === 'slide-deck' && (
                    <SlideDeckApp
                      initialFileId={win.fileId}
                      folders={desktopState.folders}
                      files={desktopState.files}
                      onSaveDeck={(p) => handleSaveAppFile('presentation', p)}
                    />
                  )}

                  {win.appId === 'publisher' && (
                    <PublisherApp
                      initialFileId={win.fileId}
                      folders={desktopState.folders}
                      files={desktopState.files}
                      onSavePublication={(p) => handleSaveAppFile('publication', p)}
                    />
                  )}

                  {win.appId === 'edu-mail' && (
                    <EduMailApp
                      userEmail={user?.email || 'learner@virtuolab.edu.zm'}
                      files={desktopState.files}
                      onSaveEmailFile={(p) => handleSaveAppFile('email', p)}
                      onLogAction={logAction}
                    />
                  )}

                  {win.appId === 'web-builder' && (
                    <WebBuilderApp
                      initialFileId={win.fileId}
                      folders={desktopState.folders}
                      files={desktopState.files}
                      onSaveWebsite={(p) => handleSaveAppFile('website', p)}
                      onLogAction={logAction}
                    />
                  )}

                  {win.appId === 'cloud-drive' && (
                    <CloudDriveApp
                      files={desktopState.files}
                      onSaveCloudFile={(p) => handleSaveAppFile('cloud', p)}
                      onLogAction={logAction}
                    />
                  )}

                  {win.appId === 'edu-browser' && <EduBrowserApp />}

                  {win.appId === 'settings' && (
                    <div className="h-full bg-slate-900 p-5 text-slate-100 text-xs space-y-5 overflow-y-auto">
                      <div>
                        <h4 className="font-display text-sm font-bold text-white">
                          Simulated System Settings
                        </h4>
                        <p className="text-slate-400 mt-0.5">
                          Customize your virtual desktop appearance. Preferences are saved automatically.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold mb-2">Desktop Background Wallpaper</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.keys(WALLPAPERS).map((wp) => (
                            <button
                              key={wp}
                              type="button"
                              onClick={() => handleSaveSettings({ wallpaper: wp })}
                              className={`rounded-lg border p-3 text-left capitalize ${
                                desktopState.wallpaper === wp
                                  ? 'border-teal-400 bg-teal-950/50'
                                  : 'border-slate-700 hover:bg-slate-800'
                              }`}
                            >
                              {wp.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                        <span>Show Clock &amp; Date on Taskbar</span>
                        <button
                          type="button"
                          onClick={() => handleSaveSettings({ showClock: !desktopState.showClock })}
                          className="rounded bg-teal-600 px-3 py-1 font-semibold text-white"
                        >
                          {desktopState.showClock ? 'Visible (Click to Hide)' : 'Hidden (Click to Show)'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

          {/* Context Menu */}
          {contextMenu && (
            <div
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
              className="absolute z-50 w-48 rounded-lg border border-slate-700 bg-slate-900 py-1.5 text-xs text-slate-100 shadow-xl"
            >
              <button
                type="button"
                onClick={() => handleOpenApp('file-manager')}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-800"
              >
                Open File Manager
              </button>
              <button
                type="button"
                onClick={() => handleOpenApp('word-writer')}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-800"
              >
                New Word Document
              </button>
              <button
                type="button"
                onClick={() => handleOpenApp('settings')}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-800"
              >
                Desktop Settings
              </button>
            </div>
          )}

          {/* Start Menu */}
          {startMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 left-2 z-50 w-64 max-h-[380px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur"
            >
              <p className="px-2 pb-2 text-xs font-semibold text-teal-400 border-b border-slate-800">
                ICT Made Easy Applications
              </p>
              <div className="mt-2 space-y-1">
                {APP_CATALOG.map((app) => (
                  <button
                    key={app.appId}
                    type="button"
                    onClick={() => handleOpenApp(app.appId)}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs hover:bg-slate-800 text-left"
                  >
                    <span className="scale-75">{renderDesktopIcon(app.appId)}</span>
                    <span>{app.title}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestartBootDemo}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restart
                </button>
                <button
                  type="button"
                  onClick={handleShutdown}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-900/70 px-2.5 py-1.5 text-[11px] font-medium text-red-100 hover:bg-red-800"
                >
                  <Power className="h-3.5 w-3.5" />
                  Shut Down
                </button>
              </div>
            </div>
          )}

          {/* Notifications Toast Stack */}
          <div className="absolute bottom-3 right-3 z-40 space-y-2 pointer-events-none">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="w-64 rounded-lg border border-teal-500/40 bg-slate-950/95 p-3 text-xs text-white shadow-lg"
              >
                <p className="font-semibold text-teal-300">{n.title}</p>
                <p className="mt-0.5 text-slate-300">{n.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Taskbar */}
        <div className="h-11 bg-slate-950/95 border-t border-slate-800 px-2.5 flex items-center justify-between gap-3 text-xs text-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStartMenuOpen((o) => !o);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 font-semibold text-white hover:bg-teal-500 shrink-0"
            >
              <Monitor className="h-3.5 w-3.5" />
              Start
            </button>

            <div className="flex items-center gap-1 overflow-x-auto">
              {windows.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() =>
                    w.isMinimized
                      ? setWindows((prev) => focusWindow(prev, w.id))
                      : setWindows((prev) => toggleMinimizeWindow(prev, w.id))
                  }
                  className={`rounded px-2.5 py-1 text-xs truncate max-w-[140px] ${
                    w.isMinimized
                      ? 'bg-slate-800/70 text-slate-400'
                      : 'bg-slate-800 text-white border-b-2 border-teal-400'
                  }`}
                >
                  {w.title}
                </button>
              ))}
            </div>
          </div>

          {desktopState.showClock && (
            <div className="text-right font-mono tabular-nums text-[11px] text-slate-300 shrink-0">
              <div>{nowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-[10px] text-slate-400">{nowTime.toLocaleDateString()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
