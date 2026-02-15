/**
 * Tests: TISS XML Parser
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import {
  parseTissXml,
  extractCabecalho,
  extractBeneficiario,
  extractPrestador,
  extractProcedimentos,
  extractGuia,
  detectGuiaType,
  findInObject,
} from './tiss-xml-parser';

// ============================================================================
// Fixtures
// ============================================================================

const VALID_SP_SADT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <cabecalho>
    <identificacaoTransacao>
      <tipoTransacao>ENVIO_LOTE_GUIAS</tipoTransacao>
      <sequencialTransacao>12345</sequencialTransacao>
      <dataRegistroTransacao>2024-01-15</dataRegistroTransacao>
      <horaRegistroTransacao>10:30:00</horaRegistroTransacao>
    </identificacaoTransacao>
    <versaoPadrao>3.05.00</versaoPadrao>
  </cabecalho>
  <prestadorParaOperadora>
    <loteGuias>
      <numeroLote>1001</numeroLote>
      <guiasTISS>
        <guiaSP_SADT>
          <cabecalhoGuia>
            <registroANS>123456</registroANS>
            <numeroGuiaPrestador>G-2024-001</numeroGuiaPrestador>
          </cabecalhoGuia>
          <dadosBeneficiario>
            <numeroCarteira>98765432100</numeroCarteira>
            <nomeBeneficiario>João da Silva</nomeBeneficiario>
            <dataNascimento>1985-03-20</dataNascimento>
          </dadosBeneficiario>
          <dadosSolicitante>
            <contratadoSolicitante>
              <codigoPrestadorNaOperadora>CNES001</codigoPrestadorNaOperadora>
              <nomeContratado>Hospital ABC</nomeContratado>
            </contratadoSolicitante>
          </dadosSolicitante>
          <dadosAtendimento>
            <dataAtendimento>2024-01-15</dataAtendimento>
          </dadosAtendimento>
          <procedimentosExecutados>
            <procedimentoExecutado>
              <sequencialItem>1</sequencialItem>
              <dataExecucao>2024-01-15</dataExecucao>
              <procedimento>
                <codigoTabela>22</codigoTabela>
                <codigoProcedimento>40301010</codigoProcedimento>
                <descricaoProcedimento>Hemograma completo</descricaoProcedimento>
              </procedimento>
              <quantidadeExecutada>1</quantidadeExecutada>
              <valorUnitario>25.00</valorUnitario>
              <valorTotal>25.00</valorTotal>
            </procedimentoExecutado>
            <procedimentoExecutado>
              <sequencialItem>2</sequencialItem>
              <dataExecucao>2024-01-15</dataExecucao>
              <procedimento>
                <codigoTabela>22</codigoTabela>
                <codigoProcedimento>40302040</codigoProcedimento>
                <descricaoProcedimento>Glicose</descricaoProcedimento>
              </procedimento>
              <quantidadeExecutada>1</quantidadeExecutada>
              <valorUnitario>15.00</valorUnitario>
              <valorTotal>15.00</valorTotal>
            </procedimentoExecutado>
          </procedimentosExecutados>
        </guiaSP_SADT>
      </guiasTISS>
    </loteGuias>
  </prestadorParaOperadora>
</ans:mensagemTISS>`;

const NO_NAMESPACE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mensagemTISS>
  <cabecalho>
    <identificacaoTransacao>
      <tipoTransacao>ENVIO_LOTE_GUIAS</tipoTransacao>
    </identificacaoTransacao>
    <versaoPadrao>3.05.00</versaoPadrao>
  </cabecalho>
  <prestadorParaOperadora>
    <loteGuias>
      <guiasTISS>
        <guiaSP_SADT>
          <cabecalhoGuia>
            <numeroGuiaPrestador>G-001</numeroGuiaPrestador>
          </cabecalhoGuia>
          <dadosBeneficiario>
            <numeroCarteira>11111111111</numeroCarteira>
            <nomeBeneficiario>Maria Santos</nomeBeneficiario>
          </dadosBeneficiario>
          <dadosSolicitante>
            <contratadoSolicitante>
              <codigoPrestadorNaOperadora>CNES002</codigoPrestadorNaOperadora>
              <nomeContratado>Clinica XYZ</nomeContratado>
            </contratadoSolicitante>
          </dadosSolicitante>
          <procedimentosExecutados>
            <procedimentoExecutado>
              <procedimento>
                <codigoProcedimento>10101012</codigoProcedimento>
                <descricaoProcedimento>Consulta em consultorio</descricaoProcedimento>
              </procedimento>
              <quantidadeExecutada>1</quantidadeExecutada>
              <valorUnitario>150.00</valorUnitario>
              <valorTotal>150.00</valorTotal>
            </procedimentoExecutado>
          </procedimentosExecutados>
        </guiaSP_SADT>
      </guiasTISS>
    </loteGuias>
  </prestadorParaOperadora>
</mensagemTISS>`;

const CONSULTA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mensagemTISS>
  <cabecalho>
    <identificacaoTransacao>
      <tipoTransacao>ENVIO_LOTE_GUIAS</tipoTransacao>
    </identificacaoTransacao>
    <versaoPadrao>3.05.00</versaoPadrao>
  </cabecalho>
  <prestadorParaOperadora>
    <loteGuias>
      <guiasTISS>
        <guiaConsulta>
          <cabecalhoGuia>
            <numeroGuiaPrestador>C-001</numeroGuiaPrestador>
          </cabecalhoGuia>
          <dadosBeneficiario>
            <numeroCarteira>22222222222</numeroCarteira>
            <nomeBeneficiario>Ana Oliveira</nomeBeneficiario>
          </dadosBeneficiario>
          <dadosSolicitante>
            <contratadoSolicitante>
              <codigoPrestadorNaOperadora>CNES003</codigoPrestadorNaOperadora>
              <nomeContratado>Dr. Carlos</nomeContratado>
            </contratadoSolicitante>
          </dadosSolicitante>
          <dadosAtendimento>
            <tipoConsulta>1</tipoConsulta>
            <indicacaoAcidente>9</indicacaoAcidente>
          </dadosAtendimento>
          <procedimentosExecutados>
            <procedimentoExecutado>
              <procedimento>
                <codigoProcedimento>10101012</codigoProcedimento>
                <descricaoProcedimento>Consulta em consultorio</descricaoProcedimento>
              </procedimento>
              <quantidadeExecutada>1</quantidadeExecutada>
              <valorUnitario>150.00</valorUnitario>
              <valorTotal>150.00</valorTotal>
            </procedimentoExecutado>
          </procedimentosExecutados>
        </guiaConsulta>
      </guiasTISS>
    </loteGuias>
  </prestadorParaOperadora>
</mensagemTISS>`;

const INTERNACAO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mensagemTISS>
  <cabecalho>
    <identificacaoTransacao>
      <tipoTransacao>ENVIO_LOTE_GUIAS</tipoTransacao>
    </identificacaoTransacao>
    <versaoPadrao>3.05.00</versaoPadrao>
  </cabecalho>
  <prestadorParaOperadora>
    <loteGuias>
      <guiasTISS>
        <guiaResumoInternacao>
          <cabecalhoGuia>
            <numeroGuiaPrestador>I-001</numeroGuiaPrestador>
          </cabecalhoGuia>
          <dadosBeneficiario>
            <numeroCarteira>33333333333</numeroCarteira>
            <nomeBeneficiario>Pedro Costa</nomeBeneficiario>
          </dadosBeneficiario>
          <dadosSolicitante>
            <contratadoSolicitante>
              <codigoPrestadorNaOperadora>CNES004</codigoPrestadorNaOperadora>
              <nomeContratado>Hospital Central</nomeContratado>
            </contratadoSolicitante>
          </dadosSolicitante>
          <dadosInternacao>
            <dataInternacao>2024-01-10</dataInternacao>
            <dataAlta>2024-01-15</dataAlta>
            <tipoInternacao>1</tipoInternacao>
            <regimeInternacao>1</regimeInternacao>
            <diarias>5</diarias>
          </dadosInternacao>
          <procedimentosExecutados>
            <procedimentoExecutado>
              <procedimento>
                <codigoProcedimento>30101012</codigoProcedimento>
                <descricaoProcedimento>Cirurgia simples</descricaoProcedimento>
              </procedimento>
              <quantidadeExecutada>1</quantidadeExecutada>
              <valorUnitario>5000.00</valorUnitario>
              <valorTotal>5000.00</valorTotal>
            </procedimentoExecutado>
          </procedimentosExecutados>
        </guiaResumoInternacao>
      </guiasTISS>
    </loteGuias>
  </prestadorParaOperadora>
</mensagemTISS>`;

const MULTI_GUIA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mensagemTISS>
  <cabecalho>
    <identificacaoTransacao><tipoTransacao>ENVIO_LOTE_GUIAS</tipoTransacao></identificacaoTransacao>
    <versaoPadrao>3.05.00</versaoPadrao>
  </cabecalho>
  <prestadorParaOperadora>
    <loteGuias>
      <guiasTISS>
        <guiaSP_SADT>
          <cabecalhoGuia><numeroGuiaPrestador>MULTI-001</numeroGuiaPrestador></cabecalhoGuia>
          <dadosBeneficiario><numeroCarteira>AAA</numeroCarteira><nomeBeneficiario>Paciente A</nomeBeneficiario></dadosBeneficiario>
          <dadosSolicitante><contratadoSolicitante><codigoPrestadorNaOperadora>C1</codigoPrestadorNaOperadora><nomeContratado>Hosp</nomeContratado></contratadoSolicitante></dadosSolicitante>
          <procedimentosExecutados>
            <procedimentoExecutado>
              <procedimento><codigoProcedimento>40301010</codigoProcedimento><descricaoProcedimento>Hemograma</descricaoProcedimento></procedimento>
              <quantidadeExecutada>1</quantidadeExecutada><valorTotal>25.00</valorTotal>
            </procedimentoExecutado>
          </procedimentosExecutados>
        </guiaSP_SADT>
        <guiaConsulta>
          <cabecalhoGuia><numeroGuiaPrestador>MULTI-002</numeroGuiaPrestador></cabecalhoGuia>
          <dadosBeneficiario><numeroCarteira>BBB</numeroCarteira><nomeBeneficiario>Paciente B</nomeBeneficiario></dadosBeneficiario>
          <dadosSolicitante><contratadoSolicitante><codigoPrestadorNaOperadora>C2</codigoPrestadorNaOperadora><nomeContratado>Clinica</nomeContratado></contratadoSolicitante></dadosSolicitante>
          <procedimentosExecutados>
            <procedimentoExecutado>
              <procedimento><codigoProcedimento>10101012</codigoProcedimento><descricaoProcedimento>Consulta</descricaoProcedimento></procedimento>
              <quantidadeExecutada>1</quantidadeExecutada><valorTotal>150.00</valorTotal>
            </procedimentoExecutado>
          </procedimentosExecutados>
        </guiaConsulta>
      </guiasTISS>
    </loteGuias>
  </prestadorParaOperadora>
</mensagemTISS>`;

// ============================================================================
// Tests
// ============================================================================

describe('parseTissXml — basic parsing', () => {
  it('should parse valid SP/SADT XML successfully', () => {
    const result = parseTissXml(VALID_SP_SADT_XML);
    expect(result.success).toBe(true);
    expect(result.guias.length).toBe(1);
    expect(result.errors.length).toBe(0);
  });

  it('should return error for invalid XML', () => {
    // fast-xml-parser is lenient with malformed XML — it may parse without throwing
    // but it will fail structural validation (no prestadorParaOperadora)
    const result = parseTissXml('<invalid><unclosed>');
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return error for empty XML', () => {
    const result = parseTissXml('');
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Empty XML content');
  });

  it('should handle XML with BOM marker', () => {
    const bomXml = '\uFEFF' + NO_NAMESPACE_XML;
    const result = parseTissXml(bomXml);
    expect(result.success).toBe(true);
    expect(result.guias.length).toBe(1);
  });
});

describe('parseTissXml — namespace handling', () => {
  it('should parse XML with ans: namespace prefix', () => {
    const result = parseTissXml(VALID_SP_SADT_XML);
    expect(result.success).toBe(true);
    expect(result.guias[0].tipo).toBe('sp-sadt');
  });

  it('should parse XML without namespace prefix', () => {
    const result = parseTissXml(NO_NAMESPACE_XML);
    expect(result.success).toBe(true);
    expect(result.guias[0].tipo).toBe('sp-sadt');
  });

  it('should extract same data regardless of namespace', () => {
    const withNs = parseTissXml(VALID_SP_SADT_XML);
    const withoutNs = parseTissXml(NO_NAMESPACE_XML);
    expect(withNs.success).toBe(true);
    expect(withoutNs.success).toBe(true);
    // Both should have sp-sadt guides
    expect(withNs.guias[0].tipo).toBe(withoutNs.guias[0].tipo);
  });
});

describe('parseTissXml — guide type detection', () => {
  it('should detect SP/SADT guide type', () => {
    const result = parseTissXml(VALID_SP_SADT_XML);
    expect(result.guias[0].tipo).toBe('sp-sadt');
  });

  it('should detect consulta guide type', () => {
    const result = parseTissXml(CONSULTA_XML);
    expect(result.guias[0].tipo).toBe('consulta');
  });

  it('should detect internacao guide type', () => {
    const result = parseTissXml(INTERNACAO_XML);
    expect(result.guias[0].tipo).toBe('internacao');
  });
});

describe('extractCabecalho', () => {
  it('should extract version and transaction type', () => {
    const parsed = { cabecalho: { identificacaoTransacao: { tipoTransacao: 'ENVIO_LOTE_GUIAS' }, versaoPadrao: '3.05.00' } };
    const cab = extractCabecalho(parsed);
    expect(cab).not.toBeNull();
    expect(cab!.versaoPadrao).toBe('3.05.00');
    expect(cab!.tipoTransacao).toBe('ENVIO_LOTE_GUIAS');
  });

  it('should return null when cabecalho missing', () => {
    const cab = extractCabecalho({});
    expect(cab).toBeNull();
  });

  it('should extract date/time fields', () => {
    const parsed = {
      cabecalho: {
        identificacaoTransacao: {
          tipoTransacao: 'ENVIO_LOTE_GUIAS',
          sequencialTransacao: '12345',
          dataRegistroTransacao: '2024-01-15',
          horaRegistroTransacao: '10:30:00',
        },
        versaoPadrao: '3.05.00',
      },
    };
    const cab = extractCabecalho(parsed);
    expect(cab!.sequencialTransacao).toBe('12345');
    expect(cab!.dataRegistroTransacao).toBe('2024-01-15');
    expect(cab!.horaRegistroTransacao).toBe('10:30:00');
  });
});

describe('extractBeneficiario', () => {
  it('should extract card number and name', () => {
    const node = { dadosBeneficiario: { numeroCarteira: '12345', nomeBeneficiario: 'João' } };
    const ben = extractBeneficiario(node);
    expect(ben.numeroCarteira).toBe('12345');
    expect(ben.nome).toBe('João');
  });

  it('should handle missing optional fields', () => {
    const node = { dadosBeneficiario: { numeroCarteira: '12345', nomeBeneficiario: 'João' } };
    const ben = extractBeneficiario(node);
    expect(ben.dataNascimento).toBeUndefined();
    expect(ben.atendimentoRN).toBeUndefined();
  });

  it('should return empty strings for missing required fields', () => {
    const ben = extractBeneficiario({});
    expect(ben.numeroCarteira).toBe('');
    expect(ben.nome).toBe('');
  });
});

describe('extractProcedimentos', () => {
  it('should extract single procedure', () => {
    const node = {
      procedimentosExecutados: {
        procedimentoExecutado: {
          procedimento: { codigoProcedimento: '40301010', descricaoProcedimento: 'Hemograma' },
          quantidadeExecutada: 1,
          valorUnitario: 25,
          valorTotal: 25,
        },
      },
    };
    const procs = extractProcedimentos(node);
    expect(procs.length).toBe(1);
    expect(procs[0].codigoTuss).toBe('40301010');
    expect(procs[0].descricao).toBe('Hemograma');
  });

  it('should extract multiple procedures', () => {
    const node = {
      procedimentosExecutados: {
        procedimentoExecutado: [
          { procedimento: { codigoProcedimento: '40301010', descricaoProcedimento: 'Hemograma' }, quantidadeExecutada: 1, valorTotal: 25 },
          { procedimento: { codigoProcedimento: '40302040', descricaoProcedimento: 'Glicose' }, quantidadeExecutada: 1, valorTotal: 15 },
        ],
      },
    };
    const procs = extractProcedimentos(node);
    expect(procs.length).toBe(2);
    expect(procs[0].codigoTuss).toBe('40301010');
    expect(procs[1].codigoTuss).toBe('40302040');
  });

  it('should return empty array when no procedures', () => {
    const procs = extractProcedimentos({});
    expect(procs).toEqual([]);
  });

  it('should coerce numeric codes to strings', () => {
    const node = {
      procedimentosExecutados: {
        procedimentoExecutado: {
          procedimento: { codigoProcedimento: 40301010, descricaoProcedimento: 'Hemograma' },
          quantidadeExecutada: 1,
          valorTotal: 25,
        },
      },
    };
    const procs = extractProcedimentos(node);
    expect(procs[0].codigoTuss).toBe('40301010');
    expect(typeof procs[0].codigoTuss).toBe('string');
  });

  it('should extract all procedure fields', () => {
    const node = {
      procedimentosExecutados: {
        procedimentoExecutado: {
          sequencialItem: 3,
          dataExecucao: '2024-01-15',
          procedimento: {
            codigoTabela: '22',
            codigoProcedimento: '40301010',
            descricaoProcedimento: 'Hemograma completo',
            cidPrincipal: 'J18.0',
          },
          quantidadeExecutada: 2,
          valorUnitario: 25.00,
          valorTotal: 50.00,
          viaAcesso: 'U',
          tecnicaUtilizada: 'C',
        },
      },
    };
    const procs = extractProcedimentos(node);
    expect(procs[0].sequencial).toBe(3);
    expect(procs[0].codigoTabela).toBe('22');
    expect(procs[0].dataExecucao).toBe('2024-01-15');
    expect(procs[0].cidPrincipal).toBe('J18.0');
    expect(procs[0].quantidade).toBe(2);
    expect(procs[0].valorUnitario).toBe(25);
    expect(procs[0].valorTotal).toBe(50);
    expect(procs[0].viaAcesso).toBe('U');
    expect(procs[0].tecnicaUtilizada).toBe('C');
  });
});

describe('parseTissXml — complete extraction', () => {
  it('should extract full SP/SADT guide with all fields', () => {
    const result = parseTissXml(VALID_SP_SADT_XML);
    const guia = result.guias[0];

    expect(guia.tipo).toBe('sp-sadt');
    expect(guia.numeroGuiaPrestador).toBe('G-2024-001');
    expect(guia.beneficiario.numeroCarteira).toBe('98765432100');
    expect(guia.beneficiario.nome).toBe('João da Silva');
    expect(guia.prestador.codigoCnes).toBe('CNES001');
    expect(guia.prestador.nome).toBe('Hospital ABC');
    expect(guia.procedimentos.length).toBe(2);
    // valorTotal is sum of procedure totals: 25 + 15 = 40
    expect(guia.valorTotal).toBe(25 + 15);
  });

  it('should extract cabecalho from full XML', () => {
    const result = parseTissXml(VALID_SP_SADT_XML);
    expect(result.cabecalho).toBeDefined();
    expect(result.cabecalho!.versaoPadrao).toBe('3.05.00');
    expect(result.cabecalho!.tipoTransacao).toBe('ENVIO_LOTE_GUIAS');
  });

  it('should handle multi-guide lote', () => {
    const result = parseTissXml(MULTI_GUIA_XML);
    expect(result.success).toBe(true);
    expect(result.guias.length).toBe(2);
    expect(result.guias[0].tipo).toBe('sp-sadt');
    expect(result.guias[0].numeroGuiaPrestador).toBe('MULTI-001');
    expect(result.guias[1].tipo).toBe('consulta');
    expect(result.guias[1].numeroGuiaPrestador).toBe('MULTI-002');
  });

  it('should extract internacao-specific fields', () => {
    const result = parseTissXml(INTERNACAO_XML);
    const guia = result.guias[0];

    expect(guia.tipo).toBe('internacao');
    expect(guia.internacao).toBeDefined();
    expect(guia.internacao!.dataInternacao).toBe('2024-01-10');
    expect(guia.internacao!.dataAlta).toBe('2024-01-15');
    expect(guia.internacao!.diarias).toBe(5);
  });

  it('should extract consulta-specific fields', () => {
    const result = parseTissXml(CONSULTA_XML);
    const guia = result.guias[0];

    expect(guia.tipo).toBe('consulta');
    expect(guia.consulta).toBeDefined();
    expect(guia.consulta!.tipoConsulta).toBe('1');
    expect(guia.consulta!.indicacaoAcidente).toBe('9');
  });
});

describe('detectGuiaType', () => {
  it('should detect SP/SADT from key', () => {
    expect(detectGuiaType({ guiaSP_SADT: {} })).toBe('sp-sadt');
  });

  it('should detect consulta from key', () => {
    expect(detectGuiaType({ guiaConsulta: {} })).toBe('consulta');
  });

  it('should default to sp-sadt for unknown', () => {
    expect(detectGuiaType({ unknownKey: {} })).toBe('sp-sadt');
  });
});

describe('findInObject', () => {
  it('should find deeply nested key', () => {
    const obj = { a: { b: { c: { target: 'found' } } } };
    expect(findInObject(obj, 'target')).toBe('found');
  });

  it('should return undefined for missing key', () => {
    const obj = { a: { b: 'value' } };
    expect(findInObject(obj, 'missing')).toBeUndefined();
  });

  it('should return direct key value', () => {
    const obj = { target: 42 };
    expect(findInObject(obj, 'target')).toBe(42);
  });

  it('should handle null/undefined input', () => {
    expect(findInObject(null, 'key')).toBeUndefined();
    expect(findInObject(undefined, 'key')).toBeUndefined();
  });
});
