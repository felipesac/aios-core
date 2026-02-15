/**
 * Tests: Payment XML Parser
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import {
  parsePaymentXml,
  detectInsurerFormat,
  extractPaymentItems,
  normalizePaymentItem,
  calculatePaymentStats,
  FIELD_MAPPINGS,
  type PaymentItem,
  type InsurerFormat,
} from './payment-xml-parser';

// ============================================================================
// Fixtures
// ============================================================================

const VALID_PAYMENT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<demonstrativoPagamento>
  <operadora>
    <registroANS>123456</registroANS>
    <nomeOperadora>Plano Saude ABC</nomeOperadora>
  </operadora>
  <prestador>
    <codigoCnes>CNES001</codigoCnes>
    <nomePrestador>Hospital XYZ</nomePrestador>
  </prestador>
  <competencia>202401</competencia>
  <dataPagamento>2024-02-10</dataPagamento>
  <numeroLote>5001</numeroLote>
  <itensDemonstrativo>
    <item>
      <numeroGuia>G-2024-001</numeroGuia>
      <numeroProtocolo>PROT-001</numeroProtocolo>
      <codigoProcedimento>40301010</codigoProcedimento>
      <descricaoProcedimento>Hemograma completo</descricaoProcedimento>
      <valorApresentado>25.00</valorApresentado>
      <valorProcessado>25.00</valorProcessado>
      <valorPago>25.00</valorPago>
      <valorGlosado>0</valorGlosado>
      <dataProcessamento>2024-02-05</dataProcessamento>
    </item>
    <item>
      <numeroGuia>G-2024-002</numeroGuia>
      <codigoProcedimento>40302040</codigoProcedimento>
      <descricaoProcedimento>Glicose</descricaoProcedimento>
      <valorApresentado>15.00</valorApresentado>
      <valorProcessado>15.00</valorProcessado>
      <valorPago>10.00</valorPago>
      <valorGlosado>5.00</valorGlosado>
      <codigoGlosa>GA001</codigoGlosa>
      <justificativaGlosa>Sem autorizacao previa</justificativaGlosa>
      <dataProcessamento>2024-02-05</dataProcessamento>
    </item>
  </itensDemonstrativo>
</demonstrativoPagamento>`;

const UNIMED_FORMAT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<demonstrativoPagamento>
  <operadora>
    <registroANS>654321</registroANS>
    <nomeOperadora>Unimed Central</nomeOperadora>
  </operadora>
  <competencia>202401</competencia>
  <itensDemonstrativo>
    <item>
      <nrGuia>U-001</nrGuia>
      <nrProtocolo>UP-001</nrProtocolo>
      <cdProcedimento>40301010</cdProcedimento>
      <dsProcedimento>Hemograma</dsProcedimento>
      <vlApresentado>30.00</vlApresentado>
      <vlProcessado>30.00</vlProcessado>
      <vlPago>25.00</vlPago>
      <vlGlosa>5.00</vlGlosa>
      <cdGlosa>GT001</cdGlosa>
      <dsGlosa>Procedimento incompativel</dsGlosa>
      <dtProcessamento>2024-02-01</dtProcessamento>
    </item>
  </itensDemonstrativo>
</demonstrativoPagamento>`;

const BRADESCO_FORMAT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<demonstrativoRetorno>
  <operadora>
    <registroANS>789012</registroANS>
    <nomeOperadora>Bradesco Saude</nomeOperadora>
  </operadora>
  <competencia>202401</competencia>
  <itensDemonstrativo>
    <item>
      <numeroGuia>B-001</numeroGuia>
      <valorApresentado>100.00</valorApresentado>
      <valorProcessado>100.00</valorProcessado>
      <valorPago>100.00</valorPago>
      <valorGlosado>0</valorGlosado>
    </item>
  </itensDemonstrativo>
</demonstrativoRetorno>`;

const EMPTY_ITEMS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<demonstrativoPagamento>
  <operadora>
    <registroANS>111111</registroANS>
    <nomeOperadora>Plano Vazio</nomeOperadora>
  </operadora>
  <competencia>202401</competencia>
</demonstrativoPagamento>`;

// ============================================================================
// Tests
// ============================================================================

describe('parsePaymentXml — basic parsing', () => {
  it('should parse valid payment XML successfully', () => {
    const result = parsePaymentXml(VALID_PAYMENT_XML);
    expect(result.success).toBe(true);
    expect(result.payment).toBeDefined();
    expect(result.itemCount).toBe(2);
    expect(result.errors.length).toBe(0);
  });

  it('should handle malformed XML gracefully', () => {
    // fast-xml-parser is lenient — malformed XML may parse without throwing
    // but will result in zero items
    const result = parsePaymentXml('<invalid><unclosed>');
    expect(result.itemCount).toBe(0);
  });

  it('should return error for empty XML', () => {
    const result = parsePaymentXml('');
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Empty XML content');
  });

  it('should handle XML with no items gracefully', () => {
    const result = parsePaymentXml(EMPTY_ITEMS_XML);
    expect(result.success).toBe(true);
    expect(result.itemCount).toBe(0);
    expect(result.warnings).toContain('No payment items found in XML');
  });
});

describe('parsePaymentXml — header extraction', () => {
  it('should extract operadora info', () => {
    const result = parsePaymentXml(VALID_PAYMENT_XML);
    expect(result.payment!.operadora.codigoAns).toBe('123456');
    expect(result.payment!.operadora.nome).toBe('Plano Saude ABC');
  });

  it('should extract competencia and payment date', () => {
    const result = parsePaymentXml(VALID_PAYMENT_XML);
    expect(result.payment!.competencia).toBe('202401');
    expect(result.payment!.dataPagamento).toBe('2024-02-10');
  });

  it('should extract lote number', () => {
    const result = parsePaymentXml(VALID_PAYMENT_XML);
    expect(result.payment!.numeroLote).toBe('5001');
  });
});

describe('detectInsurerFormat', () => {
  it('should detect generic format', () => {
    const parsed = { demonstrativoPagamento: { itensDemonstrativo: { item: { numeroGuia: 'G1', valorApresentado: 100 } } } };
    expect(detectInsurerFormat(parsed)).toBe('generic');
  });

  it('should detect Unimed format by field prefixes', () => {
    const parsed = { demonstrativoPagamento: { itensDemonstrativo: { item: { nrGuia: 'U1', vlApresentado: 100 } } } };
    expect(detectInsurerFormat(parsed)).toBe('unimed');
  });

  it('should detect Bradesco format by root element', () => {
    const parsed = { demonstrativoRetorno: { itensDemonstrativo: { item: {} } } };
    expect(detectInsurerFormat(parsed)).toBe('bradesco');
  });
});

describe('extractPaymentItems', () => {
  it('should extract items with all fields', () => {
    const result = parsePaymentXml(VALID_PAYMENT_XML);
    const items = result.payment!.itens;
    expect(items.length).toBe(2);
    expect(items[0].numeroGuia).toBe('G-2024-001');
    expect(items[0].valorApresentado).toBe(25);
    expect(items[0].valorPago).toBe(25);
  });

  it('should extract glosa information', () => {
    const result = parsePaymentXml(VALID_PAYMENT_XML);
    const glosaItem = result.payment!.itens[1];
    expect(glosaItem.valorGlosado).toBe(5);
    expect(glosaItem.glosas.length).toBe(1);
    expect(glosaItem.glosas[0].codigoGlosa).toBe('GA001');
    expect(glosaItem.glosas[0].descricaoGlosa).toBe('Sem autorizacao previa');
  });

  it('should handle items with zero glosa', () => {
    const result = parsePaymentXml(VALID_PAYMENT_XML);
    const noGlosaItem = result.payment!.itens[0];
    expect(noGlosaItem.valorGlosado).toBe(0);
    expect(noGlosaItem.glosas.length).toBe(0);
  });

  it('should return empty array when no items container', () => {
    const parsed = { demonstrativoPagamento: { operadora: {} } };
    const items = extractPaymentItems(parsed, 'generic');
    expect(items).toEqual([]);
  });

  it('should handle single item (non-array)', () => {
    const parsed = {
      itensDemonstrativo: {
        item: { numeroGuia: 'SINGLE-001', valorApresentado: 50, valorPago: 50, valorGlosado: 0 },
      },
    };
    const items = extractPaymentItems(parsed, 'generic');
    expect(items.length).toBe(1);
    expect(items[0].numeroGuia).toBe('SINGLE-001');
  });
});

describe('normalizePaymentItem', () => {
  it('should normalize Unimed field names', () => {
    const raw = {
      nrGuia: 'U-001',
      nrProtocolo: 'UP-001',
      vlApresentado: 30,
      vlPago: 25,
      vlGlosa: 5,
      cdGlosa: 'GT001',
      dsGlosa: 'Motivo teste',
    };
    const item = normalizePaymentItem(raw, 'unimed');
    expect(item.numeroGuia).toBe('U-001');
    expect(item.numeroProtocolo).toBe('UP-001');
    expect(item.valorApresentado).toBe(30);
    expect(item.valorPago).toBe(25);
    expect(item.valorGlosado).toBe(5);
    expect(item.glosas[0].codigoGlosa).toBe('GT001');
  });

  it('should normalize generic field names', () => {
    const raw = {
      numeroGuia: 'G-001',
      valorApresentado: '100.50',
      valorPago: '90.00',
      valorGlosado: '10.50',
    };
    const item = normalizePaymentItem(raw, 'generic');
    expect(item.numeroGuia).toBe('G-001');
    expect(item.valorApresentado).toBe(100.5);
    expect(item.valorPago).toBe(90);
    expect(item.valorGlosado).toBe(10.5);
  });

  it('should handle missing optional fields', () => {
    const raw = { numeroGuia: 'G-001', valorApresentado: 50, valorPago: 50, valorGlosado: 0 };
    const item = normalizePaymentItem(raw, 'generic');
    expect(item.numeroProtocolo).toBeUndefined();
    expect(item.codigoProcedimento).toBeUndefined();
    expect(item.dataProcessamento).toBeUndefined();
  });

  it('should parse numeric strings correctly', () => {
    const raw = { numeroGuia: 'G-001', valorApresentado: '25.50', valorPago: '20.00', valorGlosado: '5.50' };
    const item = normalizePaymentItem(raw, 'generic');
    expect(item.valorApresentado).toBe(25.5);
    expect(item.valorPago).toBe(20);
    expect(item.valorGlosado).toBe(5.5);
  });
});

describe('parsePaymentXml — Unimed format end-to-end', () => {
  it('should parse Unimed-format XML correctly', () => {
    const result = parsePaymentXml(UNIMED_FORMAT_XML);
    expect(result.success).toBe(true);
    expect(result.detectedFormat).toBe('unimed');
    expect(result.payment!.itens[0].numeroGuia).toBe('U-001');
    expect(result.payment!.itens[0].valorPago).toBe(25);
    expect(result.payment!.itens[0].glosas[0].codigoGlosa).toBe('GT001');
  });
});

describe('parsePaymentXml — Bradesco format end-to-end', () => {
  it('should parse Bradesco-format XML correctly', () => {
    const result = parsePaymentXml(BRADESCO_FORMAT_XML);
    expect(result.success).toBe(true);
    expect(result.detectedFormat).toBe('bradesco');
    expect(result.payment!.itens[0].numeroGuia).toBe('B-001');
    expect(result.payment!.itens[0].valorPago).toBe(100);
  });
});

describe('calculatePaymentStats', () => {
  it('should calculate totals correctly', () => {
    const items: PaymentItem[] = [
      { numeroGuia: 'G1', valorApresentado: 100, valorProcessado: 100, valorPago: 80, valorGlosado: 20, glosas: [] },
      { numeroGuia: 'G2', valorApresentado: 50, valorProcessado: 50, valorPago: 50, valorGlosado: 0, glosas: [] },
    ];
    const stats = calculatePaymentStats(items);
    expect(stats.totalApresentado).toBe(150);
    expect(stats.totalPago).toBe(130);
    expect(stats.totalGlosado).toBe(20);
  });

  it('should calculate glosa percentage', () => {
    const items: PaymentItem[] = [
      { numeroGuia: 'G1', valorApresentado: 100, valorProcessado: 100, valorPago: 70, valorGlosado: 30, glosas: [] },
    ];
    const stats = calculatePaymentStats(items);
    expect(stats.percentualGlosa).toBe(30);
  });

  it('should handle empty items array', () => {
    const stats = calculatePaymentStats([]);
    expect(stats.totalApresentado).toBe(0);
    expect(stats.totalPago).toBe(0);
    expect(stats.totalGlosado).toBe(0);
    expect(stats.percentualGlosa).toBe(0);
  });
});

describe('FIELD_MAPPINGS', () => {
  it('should have required field mappings for all formats', () => {
    const requiredFields = ['guia', 'valorApresentado', 'valorPago', 'valorGlosado', 'codigoGlosa'];
    const formats: InsurerFormat[] = ['generic', 'unimed', 'amil', 'bradesco', 'sulamerica'];

    for (const format of formats) {
      const mapping = FIELD_MAPPINGS[format];
      expect(mapping).toBeDefined();
      for (const field of requiredFields) {
        expect(mapping[field as keyof typeof mapping]).toBeDefined();
        expect(Array.isArray(mapping[field as keyof typeof mapping])).toBe(true);
        expect((mapping[field as keyof typeof mapping] as string[]).length).toBeGreaterThan(0);
      }
    }
  });
});
