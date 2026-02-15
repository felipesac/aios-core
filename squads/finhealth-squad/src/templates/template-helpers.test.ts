/**
 * Tests: Template Helpers
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateIso,
  formatPercent,
  renderMarkdownTable,
  heading,
  kvLine,
  kvList,
  joinSections,
  bulletList,
  numberedList,
  blockquote,
  horizontalRule,
  escapeMarkdown,
} from './template-helpers';

// ============================================================================
// formatCurrency
// ============================================================================

describe('formatCurrency', () => {
  it('should format positive values as R$ X.XXX,XX', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('should format zero as R$ 0,00', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('should format negative values with minus sign', () => {
    expect(formatCurrency(-500.10)).toBe('-R$ 500,10');
  });

  it('should handle large values with thousands separators', () => {
    expect(formatCurrency(1500000.99)).toBe('R$ 1.500.000,99');
  });

  it('should handle values with no decimal significance', () => {
    expect(formatCurrency(100)).toBe('R$ 100,00');
  });
});

// ============================================================================
// formatDate
// ============================================================================

describe('formatDate', () => {
  it('should format as DD/MM/YYYY', () => {
    expect(formatDate(new Date(2025, 2, 15))).toBe('15/03/2025');
  });

  it('should pad single-digit day and month', () => {
    expect(formatDate(new Date(2025, 0, 5))).toBe('05/01/2025');
  });
});

// ============================================================================
// formatDateIso
// ============================================================================

describe('formatDateIso', () => {
  it('should format as YYYY-MM-DD', () => {
    expect(formatDateIso(new Date(2025, 2, 15))).toBe('2025-03-15');
  });
});

// ============================================================================
// formatPercent
// ============================================================================

describe('formatPercent', () => {
  it('should format with default 1 decimal', () => {
    expect(formatPercent(75.3)).toBe('75,3%');
  });

  it('should format with custom decimals', () => {
    expect(formatPercent(85, 0)).toBe('85%');
    expect(formatPercent(12.345, 2)).toBe('12,35%');
  });
});

// ============================================================================
// renderMarkdownTable
// ============================================================================

describe('renderMarkdownTable', () => {
  it('should render a basic table with headers and rows', () => {
    const result = renderMarkdownTable(
      ['Nome', 'Idade'],
      [['Alice', '30'], ['Bob', '25']],
    );

    expect(result).toContain('| Nome');
    expect(result).toContain('| Alice');
    expect(result).toContain('| Bob');
    expect(result.split('\n').length).toBe(4); // header + separator + 2 rows
  });

  it('should auto-format currency columns by header keyword', () => {
    const result = renderMarkdownTable(
      ['Item', 'Valor (R$)'],
      [['Consulta', 150]],
    );

    expect(result).toContain('R$ 150,00');
  });

  it('should return empty string for empty input', () => {
    expect(renderMarkdownTable([], [])).toBe('');
    expect(renderMarkdownTable(['A'], [])).toBe('');
  });

  it('should handle mixed string and number cells', () => {
    const result = renderMarkdownTable(
      ['Codigo', 'Qtd'],
      [['10101012', 5]],
    );

    expect(result).toContain('10101012');
    expect(result).toContain('5');
  });
});

// ============================================================================
// Section Builders
// ============================================================================

describe('heading', () => {
  it('should render correct heading level', () => {
    expect(heading('Title', 1)).toBe('# Title');
    expect(heading('Section', 2)).toBe('## Section');
    expect(heading('Sub', 3)).toBe('### Sub');
  });
});

describe('kvLine and kvList', () => {
  it('should render key-value pair', () => {
    expect(kvLine('Nome', 'João')).toBe('- **Nome:** João');
  });

  it('should render multiple pairs as list', () => {
    const result = kvList([['A', '1'], ['B', '2']]);
    expect(result).toContain('- **A:** 1');
    expect(result).toContain('- **B:** 2');
  });
});

describe('joinSections', () => {
  it('should join with double newlines', () => {
    expect(joinSections('A', 'B', 'C')).toBe('A\n\nB\n\nC');
  });

  it('should filter out empty sections', () => {
    expect(joinSections('A', '', '  ', 'B')).toBe('A\n\nB');
  });
});

describe('bulletList and numberedList', () => {
  it('should create bulleted list', () => {
    expect(bulletList(['a', 'b'])).toBe('- a\n- b');
  });

  it('should create numbered list', () => {
    expect(numberedList(['a', 'b'])).toBe('1. a\n2. b');
  });
});

describe('blockquote', () => {
  it('should wrap text in blockquote', () => {
    expect(blockquote('line1\nline2')).toBe('> line1\n> line2');
  });
});

describe('horizontalRule', () => {
  it('should return ---', () => {
    expect(horizontalRule()).toBe('---');
  });
});

describe('escapeMarkdown', () => {
  it('should escape special characters', () => {
    expect(escapeMarkdown('**bold** and _italic_')).toBe('\\*\\*bold\\*\\* and \\_italic\\_');
  });
});
