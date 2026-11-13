export interface SimFolderRecord {
  id: string;
  name: string;
  parentId: string | null;
  isDeleted: boolean;
}

export interface SimFileRecord {
  id: string;
  name: string;
  fileType: string;
  folderId: string | null;
  contentJson: string;
  isDeleted: boolean;
}

export interface SimActionRecord {
  type: string;
  target?: string;
  detail?: string;
  timestamp?: string;
}

export interface CriterionDefinition {
  id: string;
  orderIndex: number;
  label: string;
  ruleType: string;
  rulePayload: string;
  marks: number;
  hintText: string;
}

export interface CriterionEvaluationResult {
  criterionId: string;
  label: string;
  passed: boolean;
  awardedMarks: number;
  maxMarks: number;
  feedback: string;
}

export interface EvaluationSummary {
  awardedMarks: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  criteriaResults: CriterionEvaluationResult[];
}

function normalizeName(v: string): string {
  return v.trim().toLowerCase();
}

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function evaluatePracticalSubmission(
  criteria: CriterionDefinition[],
  folders: SimFolderRecord[],
  files: SimFileRecord[],
  actionsLog: SimActionRecord[]
): EvaluationSummary {
  const activeFolders = folders.filter((f) => !f.isDeleted);
  const activeFiles = files.filter((f) => !f.isDeleted);

  const results: CriterionEvaluationResult[] = criteria.map((criterion) => {
    const payload = safeParseJson<Record<string, unknown>>(criterion.rulePayload, {});
    let passed = false;
    let feedback = '';

    switch (criterion.ruleType) {
      case 'FOLDER_EXISTS': {
        const targetName = normalizeName(String(payload.name || ''));
        const found = activeFolders.find((f) => normalizeName(f.name) === targetName);
        passed = Boolean(found);
        feedback = passed
          ? `Folder "${payload.name}" was found in your virtual drive.`
          : `Missing folder "${payload.name}". ${criterion.hintText || 'Create this folder in File Manager.'}`;
        break;
      }

      case 'SUBFOLDER_EXISTS': {
        const parentName = normalizeName(String(payload.parentName || ''));
        const childName = normalizeName(String(payload.name || ''));
        const parentFolder = activeFolders.find((f) => normalizeName(f.name) === parentName);
        const childFolder = parentFolder
          ? activeFolders.find(
              (f) => f.parentId === parentFolder.id && normalizeName(f.name) === childName
            )
          : undefined;
        passed = Boolean(childFolder);
        if (passed) {
          feedback = `Subfolder "${payload.name}" exists inside "${payload.parentName}".`;
        } else if (!parentFolder) {
          feedback = `Parent folder "${payload.parentName}" does not exist yet.`;
        } else {
          feedback = `Subfolder "${payload.name}" was not found inside "${payload.parentName}".`;
        }
        break;
      }

      case 'FILE_EXISTS': {
        const expectedName = payload.name ? normalizeName(String(payload.name)) : null;
        const expectedType = payload.fileType ? String(payload.fileType) : null;
        const found = activeFiles.find((f) => {
          const nameOk = expectedName ? normalizeName(f.name).includes(expectedName) : true;
          const typeOk = expectedType ? f.fileType === expectedType : true;
          return nameOk && typeOk;
        });
        passed = Boolean(found);
        feedback = passed
          ? `Required file "${found?.name}" is present.`
          : `Required ${expectedType || 'file'} ${expectedName ? `"${payload.name}"` : ''} was not found.`;
        break;
      }

      case 'FILE_IN_FOLDER': {
        const folderName = normalizeName(String(payload.folderName || ''));
        const expectedType = payload.fileType ? String(payload.fileType) : null;
        const nameContains = payload.nameContains ? normalizeName(String(payload.nameContains)) : null;
        const targetFolder = activeFolders.find((f) => normalizeName(f.name) === folderName);
        const foundFile = targetFolder
          ? activeFiles.find((f) => {
              const inFolder = f.folderId === targetFolder.id;
              const typeOk = expectedType ? f.fileType === expectedType : true;
              const nameOk = nameContains ? normalizeName(f.name).includes(nameContains) : true;
              return inFolder && typeOk && nameOk;
            })
          : undefined;
        passed = Boolean(foundFile);
        feedback = passed
          ? `File "${foundFile?.name}" is properly saved inside "${payload.folderName}".`
          : `Expected a ${expectedType || 'file'} stored directly inside the "${payload.folderName}" folder.`;
        break;
      }

      case 'DOC_CONTAINS': {
        const docs = activeFiles.filter((f) => f.fileType === 'document');
        const textNeedle = payload.textContains ? normalizeName(String(payload.textContains)) : null;
        const minWords = typeof payload.minWords === 'number' ? payload.minWords : 0;
        const requireBold = Boolean(payload.requireBold);
        const requireUnderline = Boolean(payload.requireUnderline);

        const matchDoc = docs.find((doc) => {
          const content = safeParseJson<{
            title?: string;
            html?: string;
            plainText?: string;
            blocks?: Array<{ text?: string; bold?: boolean; underline?: boolean }>;
          }>(doc.contentJson, {});
          const combinedText = `${content.title || ''} ${content.plainText || ''} ${
            content.blocks?.map((b) => b.text || '').join(' ') || ''
          }`.trim();
          const wordCount = combinedText ? combinedText.split(/\s+/).length : 0;
          const textOk = textNeedle ? normalizeName(combinedText).includes(textNeedle) : true;
          const wordsOk = wordCount >= minWords;
          const html = content.html || '';
          const boldOk = requireBold
            ? html.includes('<b>') ||
              html.includes('<strong>') ||
              Boolean(content.blocks?.some((b) => b.bold))
            : true;
          const underlineOk = requireUnderline
            ? html.includes('<u>') || Boolean(content.blocks?.some((b) => b.underline))
            : true;
          return textOk && wordsOk && boldOk && underlineOk;
        });

        passed = Boolean(matchDoc);
        feedback = passed
          ? `Document "${matchDoc?.name}" meets all content and formatting requirements.`
          : `Check that your Word document includes the required text, minimum word count, and formatting (bold/underline if requested).`;
        break;
      }

      case 'SHEET_HAS_FORMULA': {
        const sheets = activeFiles.filter((f) => f.fileType === 'spreadsheet');
        const requiredFormulas = Array.isArray(payload.formulas)
          ? (payload.formulas as string[]).map((fn) => fn.toUpperCase())
          : ['SUM'];
        const minDataRows = typeof payload.minDataRows === 'number' ? payload.minDataRows : 0;

        const matchSheet = sheets.find((sheet) => {
          const content = safeParseJson<{ cells?: Record<string, { raw?: string }> }>(
            sheet.contentJson,
            {}
          );
          const cellEntries = Object.entries(content.cells || {});
          const formulaStrings = cellEntries
            .map(([, cell]) => String(cell?.raw || '').toUpperCase())
            .filter((v) => v.startsWith('='));

          const hasAllFormulas = requiredFormulas.every((fn) =>
            formulaStrings.some((fStr) => fStr.includes(`${fn}(`))
          );

          const populatedRows = new Set(
            cellEntries
              .filter(([, cell]) => String(cell?.raw || '').trim() !== '')
              .map(([coord]) => coord.replace(/[A-Z]+/gi, ''))
          );

          return hasAllFormulas && populatedRows.size >= minDataRows;
        });

        passed = Boolean(matchSheet);
        feedback = passed
          ? `Spreadsheet "${matchSheet?.name}" includes the required formulas (${requiredFormulas.join(', ')}).`
          : `Ensure your spreadsheet includes formulas (${requiredFormulas.join(', ')}) and enough data rows.`;
        break;
      }

      case 'DECK_MIN_SLIDES': {
        const decks = activeFiles.filter((f) => f.fileType === 'presentation');
        const minSlides = typeof payload.minSlides === 'number' ? payload.minSlides : 2;
        const matchDeck = decks.find((deck) => {
          const content = safeParseJson<{ slides?: Array<{ title?: string; body?: string }> }>(
            deck.contentJson,
            {}
          );
          const nonEmptySlides = (content.slides || []).filter(
            (s) => (s.title || '').trim().length > 0 || (s.body || '').trim().length > 0
          );
          return nonEmptySlides.length >= minSlides;
        });
        passed = Boolean(matchDeck);
        feedback = passed
          ? `Presentation "${matchDeck?.name}" contains at least ${minSlides} completed slides.`
          : `Create and save a presentation with at least ${minSlides} slides containing titles or text.`;
        break;
      }

      case 'FILE_COMPRESSED': {
        const nameContains = payload.nameContains ? normalizeName(String(payload.nameContains)) : null;
        const foundZip = activeFiles.find((f) => {
          const isZip =
            f.fileType === 'archive' ||
            normalizeName(f.name).endsWith('.zip') ||
            f.contentJson.includes('"compressed":true');
          const nameOk = nameContains ? normalizeName(f.name).includes(nameContains) : true;
          return isZip && nameOk;
        });
        const actionZip = actionsLog.some((a) => a.type.toUpperCase() === 'COMPRESS_FILE');
        passed = Boolean(foundZip || (!nameContains && actionZip));
        feedback = passed
          ? `Compressed archive "${foundZip?.name || 'archive.zip'}" verified.`
          : 'Compress a file or folder into a .zip archive in File Manager.';
        break;
      }

      case 'FILE_ENCRYPTED': {
        const foundEnc = activeFiles.find((f) => {
          const parsed = safeParseJson<{ encrypted?: boolean }>(f.contentJson, {});
          return Boolean(parsed.encrypted) || normalizeName(f.name).endsWith('.enc');
        });
        const actionEnc = actionsLog.some((a) => a.type.toUpperCase() === 'ENCRYPT_FILE');
        passed = Boolean(foundEnc || actionEnc);
        feedback = passed
          ? `Encrypted file "${foundEnc?.name || 'protected file'}" verified.`
          : 'Encrypt a file with a password inside File Manager.';
        break;
      }

      case 'EMAIL_SENT': {
        const sentMail = activeFiles.find((f) => {
          if (f.fileType !== 'email') return false;
          const parsed = safeParseJson<{ folder?: string; to?: string; attachmentName?: string }>(
            f.contentJson,
            {}
          );
          const isSent = parsed.folder === 'sent';
          const reqAttachment = payload.requireAttachment ? Boolean(parsed.attachmentName) : true;
          return isSent && reqAttachment;
        });
        const actionSent = actionsLog.some((a) => a.type.toUpperCase() === 'SEND_EMAIL');
        passed = Boolean(sentMail || (!payload.requireAttachment && actionSent));
        feedback = passed
          ? 'Email message successfully composed and sent in EduMail.'
          : 'Open EduMail, compose an email with an attachment if required, and click Send.';
        break;
      }

      case 'PUBLICATION_CREATED': {
        const pub = activeFiles.find((f) => f.fileType === 'publication');
        passed = Boolean(pub);
        feedback = passed
          ? `Publication "${pub?.name}" saved in Publisher.`
          : 'Open Publisher on the Virtual Desktop, design a poster/flyer/card, and click Save.';
        break;
      }

      case 'WEBSITE_CREATED': {
        const site = activeFiles.find((f) => {
          if (f.fileType !== 'website') return false;
          const parsed = safeParseJson<{ published?: boolean }>(f.contentJson, {});
          return payload.requirePublished ? Boolean(parsed.published) : true;
        });
        passed = Boolean(site);
        feedback = passed
          ? `Template website "${site?.name}" built and saved.`
          : 'Open WebBuilder, customize a school website template, publish it, and click Save.';
        break;
      }

      case 'CLOUD_SHARED': {
        const cloudItem = activeFiles.find((f) => {
          if (f.fileType !== 'cloud') return false;
          const parsed = safeParseJson<{ shared?: boolean }>(f.contentJson, {});
          return Boolean(parsed.shared);
        });
        const actionShared = actionsLog.some((a) => a.type.toUpperCase() === 'CLOUD_SHARE');
        passed = Boolean(cloudItem || actionShared);
        feedback = passed
          ? 'Cloud file uploaded and shared with collaboration permissions.'
          : 'Open CloudDrive, upload a document or spreadsheet, and share it with a classmate or teacher.';
        break;
      }

      case 'ACTION_PERFORMED': {
        const expectedAction = String(payload.actionType || '').toUpperCase();
        passed = actionsLog.some((a) => a.type.toUpperCase() === expectedAction);
        feedback = passed
          ? `Verified simulated action: ${expectedAction}.`
          : `Action ${expectedAction} was not recorded during this session.`;
        break;
      }

      default: {
        passed = false;
        feedback = `Unsupported rule type: ${criterion.ruleType}`;
      }
    }

    return {
      criterionId: criterion.id,
      label: criterion.label,
      passed,
      awardedMarks: passed ? criterion.marks : 0,
      maxMarks: criterion.marks,
      feedback,
    };
  });

  const totalMarks = results.reduce((acc, r) => acc + r.maxMarks, 0);
  const awardedMarks = results.reduce((acc, r) => acc + r.awardedMarks, 0);
  const percentage = totalMarks > 0 ? Math.round((awardedMarks / totalMarks) * 1000) / 10 : 0;

  return {
    awardedMarks,
    totalMarks,
    percentage,
    passed: percentage >= 60,
    criteriaResults: results,
  };
}
