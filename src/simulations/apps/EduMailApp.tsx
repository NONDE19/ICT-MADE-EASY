import React, { useState } from 'react';
import { Inbox, Mail, Paperclip, Save, Send, ShieldAlert } from 'lucide-react';
import { SimFile } from '../../types/index.ts';

interface EduMailAppProps {
  userEmail: string;
  files: SimFile[];
  onSaveEmailFile: (params: {
    name: string;
    folderId: string | null;
    contentJson: string;
  }) => Promise<SimFile>;
  onLogAction?: (type: string, target?: string, detail?: string) => void;
}

const SAMPLE_INBOX = [
  {
    id: 'inbox-1',
    from: 'teacher.mwamba@virtuolab.edu.zm',
    subject: 'Form 2 Practical: Send Your Flyer or Assignment',
    body: 'Dear Learner,\nPlease compose a polite formal email to teacher.mwamba@virtuolab.edu.zm, attach a file from your Virtual Drive, and click Send.\n\nBest regards,\nMr. Mwamba',
    date: 'Today, 08:30',
  },
  {
    id: 'inbox-2',
    from: 'ecz-updates@example.zm',
    subject: 'Understanding Netiquette & Spam Filters',
    body: 'Always include a clear Subject line, polite greeting, and never send angry or ALL-CAPS messages in school or workplace emails.',
    date: 'Yesterday',
  },
];

export const EduMailApp: React.FC<EduMailAppProps> = ({
  userEmail,
  files,
  onSaveEmailFile,
  onLogAction,
}) => {
  const [mailboxTab, setMailboxTab] = useState<'inbox' | 'compose' | 'sent' | 'drafts'>('compose');
  const [toAddr, setToAddr] = useState('teacher.mwamba@virtuolab.edu.zm');
  const [subject, setSubject] = useState('Form 2 ICT Practical Submission');
  const [body, setBody] = useState(
    'Dear Teacher,\n\nPlease find attached my practical work from ICT Made Easy.\n\nKind regards,\nLearner'
  );
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>('');
  const [selectedInboxId, setSelectedInboxId] = useState<string>('inbox-1');
  const [statusMsg, setStatusMsg] = useState('');

  const activeFiles = files.filter((f) => !f.isDeleted && f.fileType !== 'email');
  const savedEmails = files
    .filter((f) => !f.isDeleted && f.fileType === 'email')
    .map((f) => {
      try {
        return {
          id: f.id,
          name: f.name,
          ...(JSON.parse(f.contentJson) as {
            folder: 'sent' | 'drafts';
            to: string;
            subject: string;
            body: string;
            attachmentName?: string;
            sentAt?: string;
          }),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    folder: 'sent' | 'drafts';
    to: string;
    subject: string;
    body: string;
    attachmentName?: string;
    sentAt?: string;
  }>;

  const isValidEmailAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddr.trim());
  const netiquetteWarning =
    subject.trim().length < 3 || body === body.toUpperCase()
      ? 'Netiquette tip: Use a clear subject and avoid typing the entire message in ALL CAPS.'
      : '';

  const handleSendOrDraft = async (folder: 'sent' | 'drafts') => {
    if (folder === 'sent' && !isValidEmailAddress) {
      setStatusMsg('Enter a valid email address in the format username@domain (e.g., teacher@virtuolab.edu.zm).');
      return;
    }
    const attached = activeFiles.find((f) => f.id === selectedAttachmentId);
    const attachmentName = attached ? `${attached.name}${attached.extension}` : '';

    await onSaveEmailFile({
      name: `${folder === 'sent' ? 'Sent' : 'Draft'}_${subject.slice(0, 24)}`,
      folderId: null,
      contentJson: JSON.stringify({
        folder,
        from: userEmail,
        to: toAddr.trim(),
        subject: subject.trim(),
        body,
        attachmentName,
        sentAt: new Date().toISOString(),
      }),
    });
    if (folder === 'sent') {
      onLogAction?.('SEND_EMAIL', toAddr.trim(), subject.trim());
      setStatusMsg(`Email sent to ${toAddr.trim()}${attachmentName ? ` with attachment ${attachmentName}` : ''}!`);
      setMailboxTab('sent');
    } else {
      setStatusMsg('Saved email to Drafts folder.');
      setMailboxTab('drafts');
    }
  };

  const sentMessages = savedEmails.filter((m) => m.folder === 'sent');
  const draftMessages = savedEmails.filter((m) => m.folder === 'drafts');
  const activeInbox = SAMPLE_INBOX.find((m) => m.id === selectedInboxId) || SAMPLE_INBOX[0];

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-900 text-xs">
      <div className="bg-[#13315C] text-white px-3 py-2 flex items-center justify-between">
        <span className="font-semibold flex items-center gap-1.5">
          <Mail className="h-4 w-4 text-teal-300" />
          EduMail Client ({userEmail}) — Offline Safe Sandbox
        </span>
        <button
          type="button"
          onClick={() => setMailboxTab('compose')}
          className="rounded bg-teal-600 px-3 py-1 font-semibold hover:bg-teal-500"
        >
          + Compose Email
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Folders Sidebar */}
        <div className="w-40 border-r border-slate-200 bg-white p-2 space-y-1 shrink-0">
          {[
            { id: 'compose' as const, label: 'Compose New', count: null },
            { id: 'inbox' as const, label: 'Inbox', count: SAMPLE_INBOX.length },
            { id: 'sent' as const, label: 'Sent', count: sentMessages.length },
            { id: 'drafts' as const, label: 'Drafts', count: draftMessages.length },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMailboxTab(item.id)}
              className={`w-full flex items-center justify-between rounded px-2.5 py-2 text-left font-medium ${
                mailboxTab === item.id
                  ? 'bg-[#13315C] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{item.label}</span>
              {item.count !== null && (
                <span className="font-mono text-[11px] opacity-80">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Main Mail Panel */}
        <div className="flex-1 overflow-y-auto p-4">
          {mailboxTab === 'compose' && (
            <div className="max-w-xl space-y-3 bg-white rounded-xl border border-slate-200 p-4">
              <div>
                <label className="block font-semibold mb-1">To (username@domain)</label>
                <input
                  type="text"
                  value={toAddr}
                  onChange={(e) => setToAddr(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Attach File from Virtual Drive</label>
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  <select
                    value={selectedAttachmentId}
                    onChange={(e) => setSelectedAttachmentId(e.target.value)}
                    className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1.5"
                  >
                    <option value="">No attachment selected</option>
                    {activeFiles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                        {f.extension} ({f.fileType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Message Body</label>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2.5"
                />
              </div>
              {netiquetteWarning && (
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>{netiquetteWarning}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSendOrDraft('sent')}
                  className="inline-flex items-center gap-1.5 rounded bg-[#13315C] px-4 py-1.5 font-semibold text-white hover:bg-[#1B437D]"
                >
                  <Send className="h-3.5 w-3.5" /> Send Email
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOrDraft('drafts')}
                  className="inline-flex items-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50"
                >
                  <Save className="h-3.5 w-3.5" /> Save as Draft
                </button>
              </div>
            </div>
          )}

          {mailboxTab === 'inbox' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_INBOX.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedInboxId(m.id)}
                    className={`text-left rounded-lg border p-3 ${
                      selectedInboxId === m.id ? 'border-teal-600 bg-white' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="font-semibold truncate">{m.subject}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{m.from}</p>
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <p className="font-bold text-sm">{activeInbox.subject}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  From: {activeInbox.from} · {activeInbox.date}
                </p>
                <p className="pt-2 whitespace-pre-line text-slate-700 leading-relaxed">{activeInbox.body}</p>
              </div>
            </div>
          )}

          {(mailboxTab === 'sent' || mailboxTab === 'drafts') && (
            <div className="space-y-2.5">
              {(mailboxTab === 'sent' ? sentMessages : draftMessages).length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
                  <Inbox className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  <p>No messages in {mailboxTab} folder yet.</p>
                </div>
              ) : (
                (mailboxTab === 'sent' ? sentMessages : draftMessages).map((m) => (
                  <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold">{m.subject}</span>
                      <span className="font-mono text-[11px] text-slate-500">To: {m.to}</span>
                    </div>
                    <p className="text-slate-600 whitespace-pre-line">{m.body}</p>
                    {m.attachmentName && (
                      <p className="text-[11px] text-teal-700 font-medium flex items-center gap-1 pt-1">
                        <Paperclip className="h-3 w-3" /> Attached: {m.attachmentName}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 flex justify-between">
        <span>EduMail Simulator (Form 2.3 Email &amp; Netiquette)</span>
        <span className="font-medium text-teal-700">{statusMsg}</span>
      </div>
    </div>
  );
};
