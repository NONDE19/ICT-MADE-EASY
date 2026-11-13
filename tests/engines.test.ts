import { describe, expect, it } from 'vitest';
import { evaluateCellDisplay, SheetGrid } from '../src/simulations/spreadsheetEngine.ts';
import {
  closeWindow,
  focusWindow,
  moveWindow,
  openAppWindow,
  toggleMaximizeWindow,
  toggleMinimizeWindow,
} from '../src/simulations/desktopEngine.ts';
import { evaluatePracticalSubmission } from '../server/src/assessments/evaluator.ts';

describe('Spreadsheet Simulation Engine', () => {
  it('computes SUM, AVERAGE, MIN, MAX and arithmetic formulas accurately', () => {
    const cells: SheetGrid = {
      B2: { raw: '70' },
      B3: { raw: '80' },
      B4: { raw: '90' },
      B5: { raw: '=SUM(B2:B4)' },
      B6: { raw: '=AVERAGE(B2:B4)' },
      B7: { raw: '=MIN(B2:B4)' },
      B8: { raw: '=MAX(B2:B4)' },
      C2: { raw: '=B2+10' },
    };

    expect(evaluateCellDisplay('B5', cells)).toBe('240');
    expect(evaluateCellDisplay('B6', cells)).toBe('80');
    expect(evaluateCellDisplay('B7', cells)).toBe('70');
    expect(evaluateCellDisplay('B8', cells)).toBe('90');
    expect(evaluateCellDisplay('C2', cells)).toBe('80');
  });

  it('computes Form 2 and Form 3 formulas: COUNT, COUNTA, SUMIF, CONCATENATE, and VLOOKUP', () => {
    const cells: SheetGrid = {
      A1: { raw: 'Lombe' },
      B1: { raw: 'Kabwe' },
      C1: { raw: '85' },
      A2: { raw: 'Thandiwe' },
      B2: { raw: 'Phiri' },
      C2: { raw: '65' },
      A3: { raw: 'Kelvin' },
      B3: { raw: 'Zulu' },
      C3: { raw: '90' },
      D1: { raw: '=CONCATENATE(A1," ",B1)' },
      D2: { raw: '=COUNT(C1:C3)' },
      D3: { raw: '=COUNTA(A1:C1)' },
      D4: { raw: '=SUMIF(C1:C3,">70")' },
      E1: { raw: 'A' },
      F1: { raw: 'Distinction' },
      E2: { raw: 'B' },
      F2: { raw: 'Merit' },
      D5: { raw: '=VLOOKUP("A",E1:F2,2,FALSE)' },
    };

    expect(evaluateCellDisplay('D1', cells)).toBe('Lombe Kabwe');
    expect(evaluateCellDisplay('D2', cells)).toBe('3');
    expect(evaluateCellDisplay('D3', cells)).toBe('3');
    expect(evaluateCellDisplay('D4', cells)).toBe('175');
    expect(evaluateCellDisplay('D5', cells)).toBe('Distinction');
  });

  it('guards against circular references cleanly', () => {
    const cells: SheetGrid = {
      A1: { raw: '=B1+1' },
      B1: { raw: '=A1+1' },
    };
    expect(evaluateCellDisplay('A1', cells)).toBe('#CYCLE!');
  });
});

describe('Virtual Desktop Window Manager Engine', () => {
  it('opens, focuses, moves, minimizes, maximizes, and closes windows', () => {
    let wins = openAppWindow([], 'file-manager');
    expect(wins).toHaveLength(1);
    const winId = wins[0].id;

    wins = moveWindow(wins, winId, 120, 80);
    expect(wins[0].x).toBe(120);
    expect(wins[0].y).toBe(80);

    wins = toggleMinimizeWindow(wins, winId);
    expect(wins[0].isMinimized).toBe(true);

    wins = focusWindow(wins, winId);
    expect(wins[0].isMinimized).toBe(false);

    wins = toggleMaximizeWindow(wins, winId);
    expect(wins[0].isMaximized).toBe(true);

    wins = closeWindow(wins, winId);
    expect(wins).toHaveLength(0);
  });
});

describe('Reusable Practical Assessment Evaluator', () => {
  it('evaluates nested folders, document placement, and recorded actions', () => {
    const criteria = [
      {
        id: 'c1',
        orderIndex: 1,
        label: 'Main folder ICT Practical exists',
        ruleType: 'FOLDER_EXISTS',
        rulePayload: JSON.stringify({ name: 'ICT Practical' }),
        marks: 5,
        hintText: '',
      },
      {
        id: 'c2',
        orderIndex: 2,
        label: 'Subfolder Assignments exists inside ICT Practical',
        ruleType: 'SUBFOLDER_EXISTS',
        rulePayload: JSON.stringify({ parentName: 'ICT Practical', name: 'Assignments' }),
        marks: 10,
        hintText: '',
      },
      {
        id: 'c3',
        orderIndex: 3,
        label: 'Document saved inside Assignments',
        ruleType: 'FILE_IN_FOLDER',
        rulePayload: JSON.stringify({ folderName: 'Assignments', fileType: 'document' }),
        marks: 10,
        hintText: '',
      },
    ];

    const folders = [
      { id: 'f-main', name: 'ICT Practical', parentId: null, isDeleted: false },
      { id: 'f-sub', name: 'Assignments', parentId: 'f-main', isDeleted: false },
    ];
    const files = [
      {
        id: 'doc-1',
        name: 'My Report',
        fileType: 'document',
        folderId: 'f-sub',
        contentJson: JSON.stringify({ plainText: 'Hello ICT' }),
        isDeleted: false,
      },
    ];

    const summary = evaluatePracticalSubmission(criteria, folders, files, []);
    expect(summary.awardedMarks).toBe(25);
    expect(summary.totalMarks).toBe(25);
    expect(summary.percentage).toBe(100);
    expect(summary.passed).toBe(true);
  });

  it('evaluates Form 2–4 compression, encryption, email, publication, website, and cloud sharing criteria', () => {
    const criteria = [
      {
        id: 'r1',
        orderIndex: 1,
        label: 'Compressed ZIP created',
        ruleType: 'FILE_COMPRESSED',
        rulePayload: '{}',
        marks: 5,
        hintText: '',
      },
      {
        id: 'r2',
        orderIndex: 2,
        label: 'File encrypted',
        ruleType: 'FILE_ENCRYPTED',
        rulePayload: '{}',
        marks: 5,
        hintText: '',
      },
      {
        id: 'r3',
        orderIndex: 3,
        label: 'Email sent with attachment',
        ruleType: 'EMAIL_SENT',
        rulePayload: JSON.stringify({ requireAttachment: true }),
        marks: 5,
        hintText: '',
      },
      {
        id: 'r4',
        orderIndex: 4,
        label: 'Publication created',
        ruleType: 'PUBLICATION_CREATED',
        rulePayload: '{}',
        marks: 5,
        hintText: '',
      },
      {
        id: 'r5',
        orderIndex: 5,
        label: 'Published website created',
        ruleType: 'WEBSITE_CREATED',
        rulePayload: JSON.stringify({ requirePublished: true }),
        marks: 5,
        hintText: '',
      },
      {
        id: 'r6',
        orderIndex: 6,
        label: 'Cloud file shared',
        ruleType: 'CLOUD_SHARED',
        rulePayload: '{}',
        marks: 5,
        hintText: '',
      },
    ];

    const files = [
      {
        id: 'zip1',
        name: 'Notes_archive',
        fileType: 'archive',
        folderId: null,
        contentJson: JSON.stringify({ compressed: true }),
        isDeleted: false,
      },
      {
        id: 'enc1',
        name: 'Report_encrypted',
        fileType: 'document',
        folderId: null,
        contentJson: JSON.stringify({ encrypted: true }),
        isDeleted: false,
      },
      {
        id: 'mail1',
        name: 'Sent_Email',
        fileType: 'email',
        folderId: null,
        contentJson: JSON.stringify({ folder: 'sent', attachmentName: 'Flyer.vpub' }),
        isDeleted: false,
      },
      {
        id: 'pub1',
        name: 'ICT_Flyer',
        fileType: 'publication',
        folderId: null,
        contentJson: JSON.stringify({ headline: 'ICT Day' }),
        isDeleted: false,
      },
      {
        id: 'web1',
        name: 'School_Portal',
        fileType: 'website',
        folderId: null,
        contentJson: JSON.stringify({ published: true }),
        isDeleted: false,
      },
      {
        id: 'cld1',
        name: 'Notes_cloud',
        fileType: 'cloud',
        folderId: null,
        contentJson: JSON.stringify({ shared: true, permission: 'edit' }),
        isDeleted: false,
      },
    ];

    const summary = evaluatePracticalSubmission(criteria, [], files, []);
    expect(summary.awardedMarks).toBe(30);
    expect(summary.totalMarks).toBe(30);
    expect(summary.passed).toBe(true);
  });
});
