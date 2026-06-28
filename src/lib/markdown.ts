function isSeparatorCell(cell: string): boolean {
  return /^\s*:?-{3,}:?\s*$/.test(cell);
}

function rowFromCells(cells: string[]): string {
  return `|${cells.join("|")}|`;
}

function normalizeMergedTableLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return line;

  if (/\|\s+\|/.test(trimmed) && /\|\s*:?-{3,}:?\s*\|/.test(trimmed)) {
    return trimmed.replace(/\|\s+\|/g, "|\n|");
  }

  const cells = trimmed.slice(1, -1).split("|");
  let separatorStart = -1;
  let separatorLength = 0;

  for (let i = 0; i < cells.length; i += 1) {
    if (!isSeparatorCell(cells[i])) continue;

    let j = i;
    while (j < cells.length && isSeparatorCell(cells[j])) j += 1;
    const length = j - i;
    if (length > separatorLength) {
      separatorStart = i;
      separatorLength = length;
    }
    i = j - 1;
  }

  if (separatorStart < 1 || separatorLength < 2) return line;

  const columnCount = separatorLength;
  const headerStart = separatorStart - columnCount;
  if (headerStart < 0) return line;

  const rows: string[] = [
    rowFromCells(cells.slice(headerStart, separatorStart)),
    rowFromCells(cells.slice(separatorStart, separatorStart + columnCount)),
  ];

  const prefixCells = cells.slice(0, headerStart);
  const suffixCells = cells.slice(separatorStart + columnCount);
  const prefix = prefixCells.length > 0 ? rowFromCells(prefixCells) : "";
  const suffixRows: string[] = [];

  for (let i = 0; i < suffixCells.length; i += columnCount) {
    const rowCells = suffixCells.slice(i, i + columnCount);
    if (rowCells.length === columnCount) {
      suffixRows.push(rowFromCells(rowCells));
    } else if (rowCells.some((cell) => cell.trim())) {
      suffixRows.push(rowCells.join("|").trim());
    }
  }

  return [prefix, ...rows, ...suffixRows].filter(Boolean).join("\n");
}

export function normalizeMarkdownTables(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => normalizeMergedTableLine(line))
    .join("\n");
}
