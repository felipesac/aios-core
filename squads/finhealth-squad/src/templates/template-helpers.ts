/**
 * Template Helpers
 * FinHealth Squad — Shared Formatting Functions
 *
 * Pure functions: data in → string out.
 * Brazilian locale formatting for healthcare financial documents.
 */

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Format number as Brazilian Real currency: R$ 1.234,56
 * Uses manual formatting to avoid locale dependency in Node.js.
 */
export function formatCurrency(value: number): string {
  const isNegative = value < 0;
  const abs = Math.abs(value);
  const fixed = abs.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}R$ ${withSeparators},${decPart}`;
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format Date as DD/MM/YYYY (Brazilian format).
 */
export function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Format Date as YYYY-MM-DD (ISO date, no time).
 */
export function formatDateIso(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
}

// ============================================================================
// Percentage Formatting
// ============================================================================

/**
 * Format number as percentage: 75,3%
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

// ============================================================================
// Markdown Table
// ============================================================================

/**
 * Render a markdown table from headers and rows.
 * Auto-formats numeric values based on header keywords.
 */
export function renderMarkdownTable(
  headers: string[],
  rows: (string | number)[][],
): string {
  if (headers.length === 0 || rows.length === 0) return '';

  const formattedRows = rows.map(row =>
    row.map((cell, i) => {
      if (typeof cell === 'number') {
        const header = (headers[i] || '').toLowerCase();
        if (header.includes('valor') || header.includes('r$') || header.includes('receita') || header.includes('despesa')) {
          return formatCurrency(cell);
        }
        if (header.includes('%') || header.includes('taxa') || header.includes('margem')) {
          return formatPercent(cell);
        }
        return String(cell);
      }
      return String(cell);
    }),
  );

  const widths = headers.map((h, i) => {
    const cellWidths = formattedRows.map(row => (row[i] || '').length);
    return Math.max(h.length, ...cellWidths);
  });

  const headerRow = '| ' + headers.map((h, i) => h.padEnd(widths[i])).join(' | ') + ' |';
  const separatorRow = '| ' + widths.map(w => '-'.repeat(w)).join(' | ') + ' |';
  const dataRows = formattedRows.map(row =>
    '| ' + row.map((cell, i) => cell.padEnd(widths[i])).join(' | ') + ' |',
  );

  return [headerRow, separatorRow, ...dataRows].join('\n');
}

// ============================================================================
// Section Builders
// ============================================================================

/**
 * Render a markdown heading.
 */
export function heading(text: string, level: 1 | 2 | 3 | 4 = 2): string {
  return `${'#'.repeat(level)} ${text}`;
}

/**
 * Render a horizontal rule.
 */
export function horizontalRule(): string {
  return '---';
}

/**
 * Render a key-value pair line.
 */
export function kvLine(key: string, value: string | number): string {
  return `- **${key}:** ${value}`;
}

/**
 * Render multiple key-value pairs as a bulleted list.
 */
export function kvList(pairs: Array<[string, string | number]>): string {
  return pairs.map(([k, v]) => kvLine(k, v)).join('\n');
}

/**
 * Join sections with double newlines, filtering empties.
 */
export function joinSections(...sections: string[]): string {
  return sections.filter(s => s.trim().length > 0).join('\n\n');
}

/**
 * Wrap text in a blockquote.
 */
export function blockquote(text: string): string {
  return text.split('\n').map(line => `> ${line}`).join('\n');
}

/**
 * Create a numbered list.
 */
export function numberedList(items: string[]): string {
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

/**
 * Create a bulleted list.
 */
export function bulletList(items: string[]): string {
  return items.map(item => `- ${item}`).join('\n');
}

/**
 * Escape special markdown characters in user-provided text.
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([*_~`|])/g, '\\$1');
}
