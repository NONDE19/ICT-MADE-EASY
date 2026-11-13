import React, { useState } from 'react';
import { Cloud, CloudUpload, Share2, Users } from 'lucide-react';
import { SimFile } from '../../types/index.ts';

interface CloudDriveAppProps {
  files: SimFile[];
  onSaveCloudFile: (params: {
    name: string;
    folderId: string | null;
    contentJson: string;
  }) => Promise<SimFile>;
  onLogAction?: (type: string, target?: string, detail?: string) => void;
}

export const CloudDriveApp: React.FC<CloudDriveAppProps> = ({
  files,
  onSaveCloudFile,
  onLogAction,
}) => {
  const [provider, setProvider] = useState<'google-drive' | 'onedrive'>('google-drive');
  const [selectedLocalId, setSelectedLocalId] = useState<string>('');
  const [collaborator, setCollaborator] = useState('thandiwe@virtuolab.edu.zm');
  const [permission, setPermission] = useState<'view' | 'edit'>('edit');
  const [statusMsg, setStatusMsg] = useState('');

  const localFiles = files.filter(
    (f) => !f.isDeleted && !['cloud', 'email'].includes(f.fileType)
  );
  const cloudFiles = files.filter((f) => !f.isDeleted && f.fileType === 'cloud');

  const handleUploadAndShare = async () => {
    const src = localFiles.find((f) => f.id === selectedLocalId) || localFiles[0];
    const targetName = src ? `${src.name}_cloud` : 'Shared_ICT_Notes_cloud';
    await onSaveCloudFile({
      name: targetName,
      folderId: null,
      contentJson: JSON.stringify({
        provider,
        sourceName: src ? `${src.name}${src.extension}` : 'Shared_ICT_Notes.vdoc',
        shared: true,
        collaborator: collaborator.trim(),
        permission,
        uploadedAt: new Date().toISOString(),
      }),
    });
    onLogAction?.('CLOUD_SHARE', targetName, `${provider}:${permission}`);
    setStatusMsg(`Uploaded & shared "${targetName}" on ${provider === 'google-drive' ? 'Google Drive' : 'OneDrive'} (${permission})`);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-900 text-xs">
      <div className="bg-[#13315C] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold flex items-center gap-2">
          <Cloud className="h-4 w-4 text-teal-300" />
          CloudDrive Collaboration Simulator (Form 3.2 &amp; 4.2)
        </span>
        <div className="flex gap-1 bg-slate-900/50 rounded p-0.5">
          <button
            type="button"
            onClick={() => setProvider('google-drive')}
            className={`rounded px-2.5 py-1 ${provider === 'google-drive' ? 'bg-teal-600 text-white' : 'text-slate-300'}`}
          >
            Google Drive
          </button>
          <button
            type="button"
            onClick={() => setProvider('onedrive')}
            className={`rounded px-2.5 py-1 ${provider === 'onedrive' ? 'bg-teal-600 text-white' : 'text-slate-300'}`}
          >
            OneDrive
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Upload & Share Controls */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h4 className="font-display text-sm font-bold flex items-center gap-1.5">
            <CloudUpload className="h-4 w-4 text-teal-600" />
            Upload from Local Virtual Drive &amp; Share with Classmates
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">1. Choose Local File</label>
              <select
                value={selectedLocalId}
                onChange={(e) => setSelectedLocalId(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
              >
                <option value="">-- Select a file (or default sample) --</option>
                {localFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {f.extension}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">2. Classmate / Teacher Email</label>
              <input
                type="text"
                value={collaborator}
                onChange={(e) => setCollaborator(e.target.value)}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">3. Collaboration Permission</label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
              >
                <option value="edit">Can Edit (Co-authoring)</option>
                <option value="view">Can View (Read-only)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUploadAndShare}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#13315C] px-4 py-2 font-semibold text-white hover:bg-[#1B437D]"
          >
            <Share2 className="h-3.5 w-3.5" /> Upload &amp; Share File
          </button>
        </div>

        {/* Cloud Files List */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <h4 className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-teal-600" />
            Synced &amp; Shared Cloud Files ({cloudFiles.length})
          </h4>
          {cloudFiles.length === 0 ? (
            <p className="text-slate-500">No files uploaded to simulated cloud storage yet.</p>
          ) : (
            <div className="space-y-2">
              {cloudFiles.map((cf) => {
                let meta: { provider?: string; collaborator?: string; permission?: string } = {};
                try {
                  meta = JSON.parse(cf.contentJson);
                } catch {
                  meta = {};
                }
                return (
                  <div
                    key={cf.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold">{cf.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Provider: {meta.provider === 'onedrive' ? 'OneDrive' : 'Google Drive'} · Shared with{' '}
                        {meta.collaborator || 'Class'} ({meta.permission || 'view'})
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-teal-700 font-semibold">Synced</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 flex justify-between">
        <span>CloudDrive Simulator · Physical USB vs Cloud Sync</span>
        <span className="font-medium text-teal-700">{statusMsg}</span>
      </div>
    </div>
  );
};
