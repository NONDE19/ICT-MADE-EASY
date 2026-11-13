import React, { useState } from 'react';
import {
  Archive,
  ChevronRight,
  Clipboard,
  Copy,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  Globe,
  HardDrive,
  Home,
  Info,
  Layout,
  Lock,
  Mail,
  Pencil,
  Presentation,
  RotateCcw,
  Scissors,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Unlock,
  Usb,
  X,
} from 'lucide-react';
import { SimFile, SimFileType, SimFolder } from '../../types/index.ts';
import { ClipboardItem, getFolderBreadcrumb } from '../desktopEngine.ts';

interface FileManagerAppProps {
  mode: 'explorer' | 'recycle-bin';
  folders: SimFolder[];
  files: SimFile[];
  clipboard: ClipboardItem | null;
  onSetClipboard: (item: ClipboardItem | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  onRestoreFolder: (id: string) => Promise<void>;
  onCreateFile: (
    name: string,
    fileType: SimFileType,
    folderId: string | null,
    contentJson?: string,
    extension?: string
  ) => Promise<void>;
  onUpdateFileContent: (id: string, patch: { name?: string; extension?: string; contentJson?: string }) => Promise<void>;
  onRenameFile: (id: string, name: string) => Promise<void>;
  onMoveFile: (id: string, targetFolderId: string | null) => Promise<void>;
  onCopyFileToFolder: (file: SimFile, targetFolderId: string | null) => Promise<void>;
  onDeleteFile: (id: string) => Promise<void>;
  onRestoreFile: (id: string) => Promise<void>;
  onEmptyRecycleBin: () => Promise<void>;
  onOpenFile: (file: SimFile) => void;
  onLogCustomAction?: (type: string, target?: string, detail?: string) => void;
}

function parseFileMeta(file: SimFile): Record<string, unknown> {
  try {
    const parsed = JSON.parse(file.contentJson);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function buildCiphertextHexPreview(seed: string): string {
  const bytes: string[] = [];
  const source = seed || 'ICT_MADE_EASY_AES_256';
  for (let i = 0; i < 36; i++) {
    const ch = source.charCodeAt(i % source.length);
    const scrambled = (ch * 37 + i * 19 + 0x5a) & 0xff;
    bytes.push(scrambled.toString(16).toUpperCase().padStart(2, '0'));
  }
  return bytes.join(' ');
}

export const FileManagerApp: React.FC<FileManagerAppProps> = ({
  mode,
  folders,
  files,
  clipboard,
  onSetClipboard,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRestoreFolder,
  onCreateFile,
  onUpdateFileContent,
  onRenameFile,
  onMoveFile,
  onCopyFileToFolder,
  onDeleteFile,
  onRestoreFile,
  onEmptyRecycleBin,
  onOpenFile,
  onLogCustomAction,
}) => {
  const [driveTab, setDriveTab] = useState<'c-drive' | 'usb-e'>('c-drive');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ kind: 'folder' | 'file'; id: string } | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [encryptPromptOpen, setEncryptPromptOpen] = useState(false);
  const [encryptPassphrase, setEncryptPassphrase] = useState('ict2026');
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  if (mode === 'recycle-bin') {
    const deletedFolders = folders.filter((f) => f.isDeleted);
    const deletedFiles = files.filter((f) => f.isDeleted);

    return (
      <div className="h-full flex flex-col bg-slate-900 text-slate-100 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-950/60">
          <span className="font-medium text-slate-200">
            Recycle Bin ({deletedFolders.length + deletedFiles.length} deleted items)
          </span>
          <button
            type="button"
            disabled={deletedFolders.length + deletedFiles.length === 0}
            onClick={onEmptyRecycleBin}
            className="rounded bg-red-600/90 px-3 py-1 font-medium text-white hover:bg-red-600 disabled:opacity-40"
          >
            Empty Recycle Bin
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {deletedFolders.length === 0 && deletedFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Trash2 className="h-8 w-8 mb-2 opacity-50" />
              <p>Recycle Bin is empty. Deleted folders and files appear here for safe recovery.</p>
            </div>
          ) : (
            <>
              {deletedFolders.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className="h-4 w-4 text-amber-400" />
                    <span className="font-medium">{f.name} (Folder)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestoreFolder(f.id)}
                    className="inline-flex items-center gap-1 rounded bg-teal-600 px-2.5 py-1 font-medium text-white hover:bg-teal-500"
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                </div>
              ))}
              {deletedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-sky-400" />
                    <span className="font-medium">
                      {file.name}
                      {file.extension}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestoreFile(file.id)}
                    className="inline-flex items-center gap-1 rounded bg-teal-600 px-2.5 py-1 font-medium text-white hover:bg-teal-500"
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  const breadcrumbs = getFolderBreadcrumb(folders, currentFolderId);
  const activeFolders = folders.filter((f) => !f.isDeleted);
  const activeFiles = files.filter((f) => !f.isDeleted);

  const usbFolder = activeFolders.find((f) => f.name === 'USB Backup (E:)');

  const visibleFolders =
    driveTab === 'usb-e'
      ? []
      : searchQuery.trim()
      ? activeFolders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : activeFolders.filter((f) => f.parentId === currentFolderId && f.name !== 'USB Backup (E:)');

  const visibleFiles =
    driveTab === 'usb-e'
      ? usbFolder
        ? activeFiles.filter((f) => f.folderId === usbFolder.id)
        : []
      : searchQuery.trim()
      ? activeFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : activeFiles.filter((f) => f.folderId === currentFolderId);

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setErrorMsg('');
    try {
      await onCreateFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName('');
      setNewFolderOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create folder.');
    }
  };

  const handlePaste = async () => {
    if (!clipboard || clipboard.kind !== 'file') return;
    const sourceFile = files.find((f) => f.id === clipboard.id);
    if (!sourceFile) return;
    if (clipboard.mode === 'cut') {
      await onMoveFile(sourceFile.id, currentFolderId);
      onSetClipboard(null);
    } else {
      await onCopyFileToFolder(sourceFile, currentFolderId);
    }
  };

  const isFileEncrypted = (file: SimFile) => {
    const parsed = parseFileMeta(file);
    return Boolean(parsed.encrypted) || file.extension === '.enc';
  };

  const isFileReadOnly = (file: SimFile) => {
    const parsed = parseFileMeta(file);
    return Boolean(parsed.readOnly);
  };

  const handleCompressSelected = async (file: SimFile) => {
    setErrorMsg('');
    const zipPayload = JSON.stringify({
      compressed: true,
      algorithm: 'ZIP/DEFLATE (WinRAR / 7-Zip Simulation)',
      sourceFileId: file.id,
      sourceName: `${file.name}${file.extension}`,
      originalBytes: file.sizeBytes,
      compressedBytes: Math.max(32, Math.round(file.sizeBytes * 0.45)),
      originalContent: file.contentJson,
      createdAt: new Date().toISOString(),
    });
    await onCreateFile(`${file.name}_archive`, 'archive', currentFolderId, zipPayload, '.zip');
    onLogCustomAction?.('COMPRESS_FILE', file.name, `Compressed ${file.name} to .zip`);
    setStatusMsg(`Compressed "${file.name}${file.extension}" into "${file.name}_archive.zip" (~55% smaller).`);
  };

  const handleExtractArchive = async (file: SimFile) => {
    setErrorMsg('');
    try {
      const parsed = JSON.parse(file.contentJson) as {
        sourceName?: string;
        originalContent?: string;
      };
      const baseName = (parsed.sourceName || file.name.replace('_archive', '')).replace(/\.[^.]+$/, '');
      await onCreateFile(
        `${baseName}_extracted`,
        'document',
        currentFolderId,
        parsed.originalContent || JSON.stringify({ plainText: 'Extracted file contents.' }),
        '.vdoc'
      );
      onLogCustomAction?.('EXTRACT_ARCHIVE', file.name);
      setStatusMsg(`Extracted contents of "${file.name}.zip"`);
    } catch {
      setStatusMsg('Could not parse archive contents.');
    }
  };

  const handleEncryptSelected = async (file: SimFile) => {
    setErrorMsg('');
    const parsed = parseFileMeta(file);
    const isAlreadyEncrypted = Boolean(parsed.encrypted) || file.extension === '.enc';
    if (isAlreadyEncrypted) {
      if (parsed.passphrase && parsed.passphrase !== encryptPassphrase) {
        setErrorMsg('Incorrect decryption passphrase! Try your encryption key (default: ict2026).');
        return;
      }
      const restoredContent = String(parsed.originalContent || '{}');
      await onUpdateFileContent(file.id, {
        name: file.name.replace(/_encrypted$/, ''),
        extension: String(parsed.originalExtension || '.vdoc'),
        contentJson: restoredContent,
      });
      onLogCustomAction?.('DECRYPT_FILE', file.name, 'Decrypted file back to readable format');
      setEncryptPromptOpen(false);
      setStatusMsg(`Decrypted "${file.name}" successfully.`);
      return;
    }

    const encryptedPayload = JSON.stringify({
      encrypted: true,
      cipher: 'AES-256 Simulation (Password / BitLocker Protection)',
      passphrase: encryptPassphrase || 'ict2026',
      originalExtension: file.extension,
      originalContent: file.contentJson,
      readOnly: Boolean(parsed.readOnly),
    });
    await onUpdateFileContent(file.id, {
      name: `${file.name}_encrypted`,
      extension: '.enc',
      contentJson: encryptedPayload,
    });
    onLogCustomAction?.('ENCRYPT_FILE', file.name, 'Encrypted file with password');
    setEncryptPromptOpen(false);
    setStatusMsg(`Encrypted "${file.name}" as .enc protected file. Inspect ciphertext in Properties.`);
  };

  const handleToggleReadOnly = async (file: SimFile) => {
    setErrorMsg('');
    const parsed = parseFileMeta(file);
    const nextReadOnly = !Boolean(parsed.readOnly);
    await onUpdateFileContent(file.id, {
      contentJson: JSON.stringify({ ...parsed, readOnly: nextReadOnly }),
    });
    onLogCustomAction?.('TOGGLE_READ_ONLY', file.name, nextReadOnly ? 'Locked as Read-Only' : 'Unlocked Read-Only');
    setStatusMsg(
      nextReadOnly
        ? `Enabled Read-Only lock on "${file.name}${file.extension}" (protected against deletion).`
        : `Removed Read-Only lock from "${file.name}${file.extension}".`
    );
  };

  const handleBackupToUsb = async (file: SimFile) => {
    setErrorMsg('');
    const targetUsbId = usbFolder?.id ?? null;
    if (!targetUsbId) {
      await onCreateFolder('USB Backup (E:)', null);
      onLogCustomAction?.('BACKUP_TO_USB', file.name);
      setStatusMsg('USB Flash Disk (E:) initialized. Click Backup to USB again to copy file.');
      return;
    }
    await onCopyFileToFolder(file, targetUsbId);
    onLogCustomAction?.('BACKUP_TO_USB', file.name);
    setStatusMsg(`Backed up "${file.name}${file.extension}" to USB Flash Disk (E:).`);
  };

  const requireSelectedFile = (actionLabel: string): SimFile | null => {
    if (!selectedFile) {
      setStatusMsg(`Select any file below first, then click "${actionLabel}".`);
      return null;
    }
    return selectedFile;
  };

  const renderFileIcon = (file: SimFile) => {
    if (isFileEncrypted(file)) return <Lock className="h-5 w-5 text-amber-400" />;
    if (file.fileType === 'archive' || file.extension === '.zip') return <Archive className="h-5 w-5 text-purple-400" />;
    if (file.fileType === 'spreadsheet') return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
    if (file.fileType === 'presentation') return <Presentation className="h-5 w-5 text-amber-400" />;
    if (file.fileType === 'publication') return <Layout className="h-5 w-5 text-pink-400" />;
    if (file.fileType === 'website') return <Globe className="h-5 w-5 text-cyan-400" />;
    if (file.fileType === 'email') return <Mail className="h-5 w-5 text-indigo-400" />;
    return <FileText className="h-5 w-5 text-sky-400" />;
  };

  const selectedFolder =
    selectedItem?.kind === 'folder' ? activeFolders.find((f) => f.id === selectedItem.id) : null;
  const selectedFile =
    selectedItem?.kind === 'file' ? activeFiles.find((f) => f.id === selectedItem.id) : null;

  const selectedMeta = selectedFile ? parseFileMeta(selectedFile) : {};
  const selectedEncrypted = selectedFile ? isFileEncrypted(selectedFile) : false;
  const selectedReadOnly = selectedFile ? isFileReadOnly(selectedFile) : false;

  return (
    <div
      className="h-full flex flex-col bg-slate-900 text-slate-100 text-xs select-none"
      onKeyDown={(e) => {
        if (e.key === 'Delete' && selectedItem) {
          if (selectedItem.kind === 'file' && selectedFile && isFileReadOnly(selectedFile)) {
            setErrorMsg('Cannot delete a Read-Only protected file. Click "Unlock Read-Only" first.');
            return;
          }
          if (selectedItem.kind === 'folder') onDeleteFolder(selectedItem.id);
          else onDeleteFile(selectedItem.id);
          setSelectedItem(null);
          setPropertiesOpen(false);
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedFile) {
          onSetClipboard({ kind: 'file', mode: 'copy', id: selectedFile.id });
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard) {
          handlePaste();
        } else if (e.key === 'F2' && selectedItem) {
          setRenamingId(selectedItem.id);
          setRenameText(selectedFolder?.name || selectedFile?.name || '');
        }
      }}
      tabIndex={0}
    >
      {/* Primary Create & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/80 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setDriveTab('c-drive');
              setNewFolderOpen(true);
              setErrorMsg('');
            }}
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1.5 font-medium hover:bg-slate-700"
          >
            <FolderPlus className="h-3.5 w-3.5 text-amber-400" />
            New Folder
          </button>

          <button
            type="button"
            onClick={() =>
              onCreateFile(
                'ICT_Notes_2026',
                'document',
                currentFolderId,
                JSON.stringify({
                  title: 'ICT Notes 2026',
                  plainText: 'Confidential Form 1-4 ICT revision summary.',
                  html: '<p>Confidential Form 1-4 ICT revision summary.</p>',
                }),
                '.vdoc'
              )
            }
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1.5 font-medium hover:bg-slate-700"
          >
            <FileText className="h-3.5 w-3.5 text-sky-400" />
            New Doc
          </button>

          <button
            type="button"
            onClick={() =>
              onCreateFile(
                'School_Budget_2026',
                'spreadsheet',
                currentFolderId,
                JSON.stringify({
                  cells: {
                    A1: { raw: 'Item' },
                    B1: { raw: 'Amount (ZMW)' },
                    A2: { raw: 'Exercise Books' },
                    B2: { raw: '250' },
                    A3: { raw: 'Printer Ink' },
                    B3: { raw: '420' },
                    A4: { raw: 'Total' },
                    B4: { raw: '=SUM(B2:B3)' },
                  },
                  locked: false,
                }),
                '.vsheet'
              )
            }
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1.5 font-medium hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            New Sheet
          </button>

          {clipboard && (
            <button
              type="button"
              onClick={handlePaste}
              className="inline-flex items-center gap-1 rounded bg-teal-600 px-2.5 py-1.5 font-medium text-white hover:bg-teal-500"
            >
              <Clipboard className="h-3.5 w-3.5" /> Paste Here
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-40 rounded bg-slate-800 border border-slate-700 pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
          />
        </div>
      </div>

      {/* File Management & File Security Action Bar (Always Discoverable) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 bg-slate-900/95 px-3 py-1.5">
        <span className="text-[11px] font-semibold text-slate-400 mr-1">
          File Tools &amp; Security:
        </span>

        <button
          type="button"
          onClick={() => {
            const file = requireSelectedFile('Copy');
            if (file) {
              onSetClipboard({ kind: 'file', mode: 'copy', id: file.id });
              setStatusMsg(`Copied "${file.name}${file.extension}" to clipboard.`);
            }
          }}
          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 hover:bg-slate-700"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>

        <button
          type="button"
          onClick={() => {
            const file = requireSelectedFile('Move');
            if (file) {
              onSetClipboard({ kind: 'file', mode: 'cut', id: file.id });
              setStatusMsg(`Ready to move "${file.name}${file.extension}". Open target folder and click Paste.`);
            }
          }}
          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 hover:bg-slate-700"
        >
          <Scissors className="h-3.5 w-3.5" /> Move
        </button>

        {selectedFile?.fileType === 'archive' ? (
          <button
            type="button"
            onClick={() => handleExtractArchive(selectedFile)}
            className="inline-flex items-center gap-1 rounded bg-purple-700/80 px-2.5 py-1 font-medium hover:bg-purple-600"
          >
            <Archive className="h-3.5 w-3.5" /> Extract .zip
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const file = requireSelectedFile('Compress (.zip)');
              if (file) handleCompressSelected(file);
            }}
            className="inline-flex items-center gap-1 rounded bg-purple-700/80 px-2.5 py-1 font-medium hover:bg-purple-600"
            title="Form 2.1 File Compression"
          >
            <Archive className="h-3.5 w-3.5" /> Compress (.zip)
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            const file = requireSelectedFile('Encrypt (.enc)');
            if (file) {
              setEncryptPromptOpen(true);
              setErrorMsg('');
            }
          }}
          className="inline-flex items-center gap-1 rounded bg-amber-700/80 px-2.5 py-1 font-medium hover:bg-amber-600"
          title="Form 2.1 File Encryption"
        >
          {selectedEncrypted ? (
            <>
              <Unlock className="h-3.5 w-3.5" /> Decrypt
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" /> Encrypt (.enc)
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            const file = requireSelectedFile('Read-Only Lock');
            if (file) handleToggleReadOnly(file);
          }}
          className="inline-flex items-center gap-1 rounded bg-indigo-700/80 px-2.5 py-1 font-medium hover:bg-indigo-600"
          title="Protect file from accidental deletion"
        >
          {selectedReadOnly ? (
            <>
              <ShieldOff className="h-3.5 w-3.5" /> Unlock Read-Only
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5" /> Read-Only Lock
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            const file = requireSelectedFile('Backup to USB');
            if (file) handleBackupToUsb(file);
          }}
          className="inline-flex items-center gap-1 rounded bg-teal-800/80 px-2.5 py-1 font-medium hover:bg-teal-700"
          title="Form 1.3 USB Flash Disk Backup"
        >
          <Usb className="h-3.5 w-3.5" /> Backup USB
        </button>

        <button
          type="button"
          onClick={() => {
            const file = requireSelectedFile('Properties');
            if (file) setPropertiesOpen((prev) => !prev);
          }}
          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 font-medium hover:bg-slate-700"
        >
          <Info className="h-3.5 w-3.5 text-teal-400" /> Properties
        </button>

        {selectedItem && (
          <>
            <button
              type="button"
              onClick={() => {
                setRenamingId(selectedItem.id);
                setRenameText(selectedFolder?.name || selectedFile?.name || '');
              }}
              className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 hover:bg-slate-700"
            >
              <Pencil className="h-3.5 w-3.5" /> Rename
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedItem.kind === 'file' && selectedFile && isFileReadOnly(selectedFile)) {
                  setErrorMsg('Cannot delete a Read-Only protected file. Click "Unlock Read-Only" first.');
                  return;
                }
                if (selectedItem.kind === 'folder') onDeleteFolder(selectedItem.id);
                else onDeleteFile(selectedItem.id);
                setSelectedItem(null);
                setPropertiesOpen(false);
              }}
              className="inline-flex items-center gap-1 rounded bg-red-900/60 px-2 py-1 text-red-200 hover:bg-red-800"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </>
        )}
      </div>

      {/* Drive & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-300">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setDriveTab('c-drive');
              setCurrentFolderId(null);
              setSearchQuery('');
            }}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${
              driveTab === 'c-drive' ? 'bg-slate-800 text-teal-300' : 'hover:bg-slate-800'
            }`}
          >
            <Home className="h-3.5 w-3.5 text-teal-400" />
            <span>Local Drive (C:)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDriveTab('usb-e');
              setSearchQuery('');
              setSelectedItem(null);
            }}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${
              driveTab === 'usb-e' ? 'bg-slate-800 text-teal-300' : 'hover:bg-slate-800'
            }`}
          >
            <Usb className="h-3.5 w-3.5 text-amber-400" />
            <span>USB Flash Disk (E:)</span>
          </button>

          {driveTab === 'c-drive' &&
            breadcrumbs.map((b) => (
              <React.Fragment key={b.id}>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentFolderId(b.id);
                    setSearchQuery('');
                  }}
                  className="rounded px-1.5 py-0.5 hover:bg-slate-800"
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
        </div>

        {statusMsg && <span className="text-[11px] text-teal-400">{statusMsg}</span>}
      </div>

      {errorMsg && (
        <div className="bg-red-950/70 border-b border-red-800 px-3 py-1.5 text-red-200">{errorMsg}</div>
      )}

      {encryptPromptOpen && selectedFile && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950 px-3 py-2">
          <Lock className="h-3.5 w-3.5 text-amber-400" />
          <span>
            {isFileEncrypted(selectedFile)
              ? `Enter passphrase to decrypt "${selectedFile.name}":`
              : `Set passphrase to encrypt "${selectedFile.name}":`}
          </span>
          <input
            type="text"
            value={encryptPassphrase}
            onChange={(e) => setEncryptPassphrase(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white w-36"
          />
          <button
            type="button"
            onClick={() => handleEncryptSelected(selectedFile)}
            className="rounded bg-amber-600 px-3 py-1 font-semibold text-white hover:bg-amber-500"
          >
            {isFileEncrypted(selectedFile) ? 'Decrypt File' : 'Encrypt File'}
          </button>
          <button
            type="button"
            onClick={() => setEncryptPromptOpen(false)}
            className="rounded border border-slate-700 px-2.5 py-1 text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      {newFolderOpen && (
        <form
          onSubmit={handleCreateFolderSubmit}
          className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-3 py-2"
        >
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter new folder name (e.g., Schoolwork or ICT)"
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-white"
          />
          <button type="submit" className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">
            Create
          </button>
          <button
            type="button"
            onClick={() => setNewFolderOpen(false)}
            className="rounded border border-slate-700 px-2.5 py-1 text-slate-300"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Main Content Area + Optional Properties & Ciphertext Inspector */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {visibleFolders.length === 0 && visibleFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <HardDrive className="h-8 w-8 mb-2 opacity-40" />
              <p>
                {driveTab === 'usb-e'
                  ? 'USB Flash Disk (E:) is empty. Select a file on Drive C: and click Backup USB.'
                  : searchQuery
                  ? 'No matching files or folders.'
                  : 'This folder is empty.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visibleFolders.map((folder) => {
                const isSelected = selectedItem?.kind === 'folder' && selectedItem.id === folder.id;
                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setSelectedItem({ kind: 'folder', id: folder.id });
                      setPropertiesOpen(false);
                    }}
                    onDoubleClick={() => {
                      setCurrentFolderId(folder.id);
                      setSearchQuery('');
                      setSelectedItem(null);
                      setPropertiesOpen(false);
                    }}
                    className={`rounded-lg border p-3 flex flex-col items-center text-center cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-teal-400 bg-teal-950/40'
                        : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/70'
                    }`}
                  >
                    <Folder className="h-8 w-8 text-amber-400 mb-2" />
                    {renamingId === folder.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onBlur={async () => {
                          if (renameText.trim()) await onRenameFolder(folder.id, renameText.trim());
                          setRenamingId(null);
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && renameText.trim()) {
                            await onRenameFolder(folder.id, renameText.trim());
                            setRenamingId(null);
                          }
                        }}
                        className="w-full rounded bg-slate-900 border border-teal-400 px-1.5 py-0.5 text-center text-white"
                      />
                    ) : (
                      <span className="font-medium break-words w-full">{folder.name}</span>
                    )}
                  </div>
                );
              })}

              {visibleFiles.map((file) => {
                const isSelected = selectedItem?.kind === 'file' && selectedItem.id === file.id;
                const readOnly = isFileReadOnly(file);
                const encrypted = isFileEncrypted(file);
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedItem({ kind: 'file', id: file.id })}
                    onDoubleClick={() => {
                      if (encrypted) {
                        setSelectedItem({ kind: 'file', id: file.id });
                        setEncryptPromptOpen(true);
                      } else if (file.fileType !== 'archive') {
                        onOpenFile(file);
                      }
                    }}
                    className={`rounded-lg border p-3 flex flex-col items-center text-center cursor-pointer transition-colors relative ${
                      isSelected
                        ? 'border-teal-400 bg-teal-950/40'
                        : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/70'
                    }`}
                  >
                    {(encrypted || readOnly) && (
                      <div className="flex items-center gap-1 mb-1">
                        {encrypted && (
                          <span className="rounded bg-amber-900/70 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                            ENCRYPTED
                          </span>
                        )}
                        {readOnly && (
                          <span className="rounded bg-indigo-900/70 px-1.5 py-0.5 text-[9px] font-bold text-indigo-200">
                            READ-ONLY
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mb-2">{renderFileIcon(file)}</div>
                    {renamingId === file.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onBlur={async () => {
                          if (renameText.trim()) await onRenameFile(file.id, renameText.trim());
                          setRenamingId(null);
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && renameText.trim()) {
                            await onRenameFile(file.id, renameText.trim());
                            setRenamingId(null);
                          }
                        }}
                        className="w-full rounded bg-slate-900 border border-teal-400 px-1.5 py-0.5 text-center text-white"
                      />
                    ) : (
                      <span className="font-medium break-words w-full">
                        {file.name}
                        <span className="text-slate-400">{file.extension}</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* File Properties & Security Inspector Drawer */}
        {propertiesOpen && selectedFile && (
          <aside className="w-72 border-l border-slate-800 bg-slate-950 p-4 overflow-y-auto space-y-3 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-teal-300 flex items-center gap-1.5">
                <Info className="h-4 w-4" />
                File Properties
              </span>
              <button
                type="button"
                onClick={() => setPropertiesOpen(false)}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <p className="text-slate-400">Filename</p>
                <p className="font-semibold text-white break-all">
                  {selectedFile.name}
                  {selectedFile.extension}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400">Type</p>
                  <p className="capitalize text-slate-200">{selectedFile.fileType}</p>
                </div>
                <div>
                  <p className="text-slate-400">Size</p>
                  <p className="font-mono text-slate-200">{selectedFile.sizeBytes} bytes</p>
                </div>
              </div>
              {Boolean(selectedMeta.compressed) && (
                <div className="rounded border border-purple-800/70 bg-purple-950/40 p-2">
                  <p className="font-semibold text-purple-300">ZIP Compression Active</p>
                  <p className="text-slate-300 mt-0.5">
                    Original: {String(selectedMeta.originalBytes || selectedFile.sizeBytes)} B -&gt;{' '}
                    Compressed: {String(selectedMeta.compressedBytes || '?')} B
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400">Encryption</p>
                  <p className={selectedEncrypted ? 'font-semibold text-amber-300' : 'text-slate-300'}>
                    {selectedEncrypted ? 'AES-256 (.enc)' : 'Plaintext'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Read-Only Lock</p>
                  <p className={selectedReadOnly ? 'font-semibold text-indigo-300' : 'text-slate-300'}>
                    {selectedReadOnly ? 'Locked (Safe)' : 'Unlocked'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 mb-1">
                  {selectedEncrypted
                    ? 'Encrypted Ciphertext Preview (Unreadable Without Key)'
                    : 'Readable Data Preview'}
                </p>
                <div className="rounded border border-slate-800 bg-slate-900 p-2 font-mono text-[10px] text-slate-300 break-all leading-relaxed">
                  {selectedEncrypted
                    ? buildCiphertextHexPreview(selectedFile.contentJson)
                    : String(
                        selectedMeta.plainText ||
                          selectedMeta.sourceName ||
                          selectedFile.contentJson.slice(0, 140)
                      )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <div className="border-t border-slate-800 bg-slate-950/60 px-3 py-1.5 text-slate-400 flex justify-between">
        <span>
          {visibleFolders.length} folders, {visibleFiles.length} files · Click item to Compress, Encrypt, Lock, or Backup USB
        </span>
        {clipboard && (
          <span className="text-teal-400">
            Clipboard: {clipboard.mode === 'cut' ? 'Moving' : 'Copied'} file ready to paste
          </span>
        )}
      </div>
    </div>
  );
};

