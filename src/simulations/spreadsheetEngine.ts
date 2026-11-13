export interface SheetCell {
  raw: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  bg?: string;
}

export type SheetGrid = Record<string, SheetCell>;

export const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

function parseCoord(coord: string): { colIdx: number; row: number } | null {
  const m = coord.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  const colIdx = COLS.indexOf(m[1]);
  const row = Number(m[2]);
  if (colIdx === -1 || row < 1 || row > ROWS.length) return null;
  return { colIdx, row };
}

function expandRange(start: string, end: string): string[] {
  const a = parseCoord(start);
  const b = parseCoord(end);
  if (!a || !b) return [];
  const minCol = Math.min(a.colIdx, b.colIdx);
  const maxCol = Math.max(a.colIdx, b.colIdx);
  const minRow = Math.min(a.row, b.row);
  const maxRow = Math.max(a.row, b.row);
  const coords: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      coords.push(`${COLS[c]}${r}`);
    }
  }
  return coords;
}

function expandRangeMatrix(start: string, end: string): string[][] {
  const a = parseCoord(start);
  const b = parseCoord(end);
  if (!a || !b) return [];
  const minCol = Math.min(a.colIdx, b.colIdx);
  const maxCol = Math.max(a.colIdx, b.colIdx);
  const minRow = Math.min(a.row, b.row);
  const maxRow = Math.max(a.row, b.row);
  const rows: string[][] = [];
  for (let r = minRow; r <= maxRow; r++) {
    const rowCoords: string[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      rowCoords.push(`${COLS[c]}${r}`);
    }
    rows.push(rowCoords);
  }
  return rows;
}

function splitFormulaArgs(argStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < argStr.length; i++) {
    const ch = argStr[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === ',' && !inQuotes) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim() !== '') args.push(current.trim());
  return args;
}

function stripQuotes(val: string): string {
  const s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function evaluateSimpleMath(expr: string): number {
  const cleaned = expr.replace(/[^0-9+\-*/().\s]/g, '');
  if (!cleaned.trim()) return 0;
  let pos = 0;
  const s = cleaned.replace(/\s+/g, '');

  function parseExpr(): number {
    let val = parseTerm();
    while (pos < s.length && (s[pos] === '+' || s[pos] === '-')) {
      const op = s[pos++];
      const right = parseTerm();
      val = op === '+' ? val + right : val - right;
    }
    return val;
  }

  function parseTerm(): number {
    let val = parseFactor();
    while (pos < s.length && (s[pos] === '*' || s[pos] === '/')) {
      const op = s[pos++];
      const right = parseFactor();
      val = op === '*' ? val * right : right === 0 ? NaN : val / right;
    }
    return val;
  }

  function parseFactor(): number {
    if (s[pos] === '(') {
      pos++;
      const val = parseExpr();
      if (s[pos] === ')') pos++;
      return val;
    }
    if (s[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    const start = pos;
    while (pos < s.length && /[0-9.]/.test(s[pos])) pos++;
    if (start === pos) return 0;
    return Number(s.slice(start, pos));
  }

  return parseExpr();
}

export function evaluateCellDisplay(
  coord: string,
  cells: SheetGrid,
  visited = new Set<string>()
): string {
  const key = coord.toUpperCase();
  if (visited.has(key)) return '#CYCLE!';
  const cell = cells[key];
  if (!cell || cell.raw === undefined || cell.raw === '') return '';

  const raw = cell.raw.trim();
  if (!raw.startsWith('=')) return raw;

  const nextVisited = new Set(visited);
  nextVisited.add(key);

  const formula = raw.slice(1).trim();

  // CONCATENATE(arg1, arg2, ...)
  const concatMatch = formula.match(/^CONCATENATE\((.+)\)$/i);
  if (concatMatch) {
    const args = splitFormulaArgs(concatMatch[1]);
    return args
      .map((arg) => {
        if (/^[A-H]\d{1,2}$/i.test(arg)) {
          return evaluateCellDisplay(arg.toUpperCase(), cells, nextVisited);
        }
        return stripQuotes(arg);
      })
      .join('');
  }

  // SUMIF(range, criteria, [sum_range])
  const sumifMatch = formula.match(/^SUMIF\((.+)\)$/i);
  if (sumifMatch) {
    const args = splitFormulaArgs(sumifMatch[1]);
    if (args.length < 2 || !args[0].includes(':')) return '#VALUE!';
    const [rStart, rEnd] = args[0].split(':');
    const condCoords = expandRange(rStart, rEnd);
    const critRaw = stripQuotes(args[1]);
    const sumCoords =
      args[2] && args[2].includes(':')
        ? expandRange(args[2].split(':')[0], args[2].split(':')[1])
        : condCoords;

    let total = 0;
    condCoords.forEach((cCoord, idx) => {
      const valStr = evaluateCellDisplay(cCoord, cells, nextVisited);
      const valNum = Number(valStr);
      let matches = false;
      if (critRaw.startsWith('>=')) matches = !Number.isNaN(valNum) && valNum >= Number(critRaw.slice(2));
      else if (critRaw.startsWith('<=')) matches = !Number.isNaN(valNum) && valNum <= Number(critRaw.slice(2));
      else if (critRaw.startsWith('>')) matches = !Number.isNaN(valNum) && valNum > Number(critRaw.slice(1));
      else if (critRaw.startsWith('<')) matches = !Number.isNaN(valNum) && valNum < Number(critRaw.slice(1));
      else matches = valStr.toLowerCase() === critRaw.toLowerCase();

      if (matches && sumCoords[idx]) {
        const sNum = Number(evaluateCellDisplay(sumCoords[idx], cells, nextVisited));
        if (!Number.isNaN(sNum)) total += sNum;
      }
    });
    return Number.isInteger(total) ? String(total) : total.toFixed(2);
  }

  // VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
  const vlookupMatch = formula.match(/^VLOOKUP\((.+)\)$/i);
  if (vlookupMatch) {
    const args = splitFormulaArgs(vlookupMatch[1]);
    if (args.length < 3 || !args[1].includes(':')) return '#N/A';
    const lookupRaw = /^[A-H]\d{1,2}$/i.test(args[0])
      ? evaluateCellDisplay(args[0].toUpperCase(), cells, nextVisited)
      : stripQuotes(args[0]);
    const [tStart, tEnd] = args[1].split(':');
    const matrix = expandRangeMatrix(tStart, tEnd);
    const colIdxNum = Math.max(1, Number(args[2]) || 1);

    for (const rowCoords of matrix) {
      if (rowCoords.length === 0) continue;
      const firstVal = evaluateCellDisplay(rowCoords[0], cells, nextVisited);
      if (firstVal.trim().toLowerCase() === lookupRaw.trim().toLowerCase()) {
        const targetCoord = rowCoords[colIdxNum - 1];
        if (!targetCoord) return '#REF!';
        return evaluateCellDisplay(targetCoord, cells, nextVisited);
      }
    }
    return '#N/A';
  }

  // Aggregate functions: SUM, AVERAGE, AVG, MIN, MAX, COUNT, COUNTA
  const fnMatch = formula.match(/^(SUM|AVERAGE|AVG|MIN|MAX|COUNT|COUNTA)\(([^)]+)\)$/i);
  if (fnMatch) {
    const fn = fnMatch[1].toUpperCase();
    const arg = fnMatch[2].trim();
    const parts = arg.split(',').map((p) => p.trim());
    const coords: string[] = [];
    for (const part of parts) {
      if (part.includes(':')) {
        const [start, end] = part.split(':');
        coords.push(...expandRange(start, end));
      } else {
        coords.push(part.toUpperCase());
      }
    }

    if (fn === 'COUNTA') {
      const nonEmpty = coords.filter((c) => evaluateCellDisplay(c, cells, nextVisited).trim() !== '');
      return String(nonEmpty.length);
    }

    const nums = coords
      .map((c) => {
        const disp = evaluateCellDisplay(c, cells, nextVisited).trim();
        return disp === '' ? NaN : Number(disp);
      })
      .filter((n) => !Number.isNaN(n) && Number.isFinite(n));

    if (fn === 'COUNT') {
      return String(nums.length);
    }

    if (nums.length === 0) return '0';

    let result = 0;
    if (fn === 'SUM') result = nums.reduce((a, b) => a + b, 0);
    else if (fn === 'AVERAGE' || fn === 'AVG') result = nums.reduce((a, b) => a + b, 0) / nums.length;
    else if (fn === 'MIN') result = Math.min(...nums);
    else if (fn === 'MAX') result = Math.max(...nums);

    return Number.isInteger(result) ? String(result) : result.toFixed(2);
  }

  // Replace cell references like B2 with numeric values
  let hasCycle = false;
  const substituted = formula.replace(/\b([A-H]\d{1,2})\b/gi, (_m, ref) => {
    const rawDisplay = evaluateCellDisplay(ref.toUpperCase(), cells, nextVisited);
    if (rawDisplay === '#CYCLE!') {
      hasCycle = true;
      return '0';
    }
    const val = Number(rawDisplay);
    return Number.isNaN(val) ? '0' : String(val);
  });

  if (hasCycle) return '#CYCLE!';

  const computed = evaluateSimpleMath(substituted);
  if (Number.isNaN(computed) || !Number.isFinite(computed)) return '#DIV/0!';
  return Number.isInteger(computed) ? String(computed) : computed.toFixed(2);
}
