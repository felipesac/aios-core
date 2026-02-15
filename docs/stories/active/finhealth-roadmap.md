# FinHealth Roadmap — Phases 8-12

> Gaps pendentes da analise original da Aria (@architect) que ainda nao foram endereçados nas Phases 1-7 nem nos Epics 1-3 do frontend.

**Criado:** 2026-02-15
**Baseline:** Phase 7 completa (1,233 testes), Epics 1-3 frontend completos (696 testes)
**Classificacao original:** C = Critical, H = High, M = Medium

---

## Status das Fases Anteriores

| Fase | Escopo | Status |
|------|--------|--------|
| Phases 1-7 (Squad) | Foundation → Real Agents + AI UI | Done |
| Epic 1 (Frontend) | Brownfield Remediation (RLS, forms, caching) | Done |
| Epic 2 (Frontend) | E2E Test Expansion | Done |
| Epic 3 (Frontend) | Security & Quality Hardening | Done |

---

## Gap Analysis — Estado Atual vs Desejado

| ID | Gap | Estado Atual | Estado Desejado |
|----|-----|-------------|-----------------|
| **C4** | Tabelas de referencia completas | `data/*.json` sao amostras ("Amostra representativa"), `tiss-schemas/` e `.gitkeep` placeholder | TUSS (~5k procedimentos), CBHPM (tabela completa 5a ed.), SIGTAP (tabela oficial DATASUS), schemas XSD reais |
| **C5** | CI/CD, Docker, staging | `tech-stack.md` lista Docker + GH Actions mas nenhum existe no repo | Dockerfile, docker-compose.yml, GH Actions CI, staging environment |
| **C6** | Scrapers contra fontes reais | 3 scrapers (ANS, CBHPM, DATASUS) existem com testes mockados, nunca rodaram contra endpoints reais | Scrapers validados contra fontes oficiais, pipeline de sync periodico |
| **H3** | Scheduler/cron | Workflows YAML definem schedules (audit 6AM, monthly-close 1o dia) mas nao existe runtime scheduler | BullMQ/cron runtime executando workflows automaticamente |
| **H6** | Assinatura XML A1 | Tabela `digital_certificates` existe, TISS XML generation existe, mas zero codigo de assinatura | Assinatura XMLDSig com certificado A1 (.pfx) para envio TISS |
| **M3** | Batch processing / Lotes TISS | BillingAgent valida guias individuais, sem processamento em lote | Lotes TISS (N guias → 1 XML lote), processamento paralelo |
| **M2** | Onboarding de tenant | Multi-tenant RLS com `organization_id` funciona, mas onboarding e manual | CLI/API de provisioning: criar org, seed data, configurar operadoras |

---

## Phase 8: CI/CD, Docker & Staging (C5)

**Prioridade:** Critical — Bloqueia deploys confiaveis e testes de integracao
**Esforco estimado:** 5-8 dias
**Dependencias:** Nenhuma

### Justificativa

Sem CI/CD, cada deploy e manual e sem validacao. Sem Docker, o ambiente de dev nao replica producao. Sem staging, mudancas vao direto para prod. Isso e pre-requisito para testar scrapers (C6), scheduler (H3), e qualquer feature que dependa de infra real.

### Deliverables

| # | Entrega | Detalhes |
|---|---------|----------|
| 8.1 | **Dockerfile** (squad) | Multi-stage build: `npm ci` → `npm run build` → runtime slim. Health check endpoint. |
| 8.2 | **docker-compose.yml** | Servicos: squad (app), postgres (DB), redis (cache/queue). Volumes para dados persistentes. |
| 8.3 | **GitHub Actions CI** | Pipeline: lint → typecheck → test → build. Roda em push para `main` e PRs. Matrix Node 18/20. |
| 8.4 | **GitHub Actions CD** | Deploy automatico para staging em merge na `main`. Deploy manual para prod via workflow_dispatch. |
| 8.5 | **Staging environment** | Railway/Render staging com Supabase staging project. `.env.staging` template. |

### Acceptance Criteria

- [ ] `docker compose up` sobe squad + postgres + redis em <60s
- [ ] CI pipeline roda em <5min para PRs
- [ ] Push para `main` deploya automaticamente em staging
- [ ] Staging acessivel com dados de teste (nao prod)

---

## Phase 9: Reference Data Pipeline (C4 + C6)

**Prioridade:** Critical — Sem dados reais, validacoes TISS/SUS retornam falsos positivos
**Esforco estimado:** 8-12 dias
**Dependencias:** Phase 8 (Docker para rodar scrapers em container)

### Justificativa

Os scrapers existem (`ans-scraper.ts`, `cbhpm-scraper.ts`, `datasus-scraper.ts`) mas nunca rodaram contra as fontes oficiais. Os JSONs de referencia sao amostras com ~20 registros cada, enquanto a tabela TUSS completa tem ~5.000 procedimentos e o SIGTAP tem ~4.500. BillingAgent valida contra dados incompletos.

### Deliverables

| # | Entrega | Detalhes |
|---|---------|----------|
| 9.1 | **ANS Scraper → real** | Validar contra `gov.br/ans/` — tabela de operadoras ativas. Retry + rate-limit. Output: `data/ans-operadoras.json` (~1.200 operadoras). |
| 9.2 | **DATASUS Scraper → real** | Validar contra SIGTAP (FTP DATASUS ou API competencia). Parsing de arquivo `.txt` tabulado. Output: `data/sigtap-procedures.json` (~4.500 procedimentos). |
| 9.3 | **CBHPM Scraper → real** | Fonte AMB/CBHPM (PDF ou tabela estruturada). LLM-assisted parsing para extrair portes + valores. Output: `data/cbhpm-values.json` (tabela completa 5a edicao). |
| 9.4 | **TUSS full sync** | Fonte ANS (CSV oficial do TUSS). Parser + dedup. Output: `data/tuss-procedures.json` (~5.000 procedimentos). |
| 9.5 | **TISS XSD schemas** | Download dos schemas oficiais ANS (guia SP/SADT, lote, recurso). Salvar em `data/tiss-schemas/`. |
| 9.6 | **DB seed script** | Script que carrega JSONs atualizados para as tabelas `tuss_procedures`, `sigtap_procedures` no Supabase. Idempotente (upsert). |
| 9.7 | **Sync workflow** | Workflow `data-sync-pipeline.yaml` que roda scrapers + seed. Trigger: manual + scheduled (mensal). |
| 9.8 | **Integration tests** | Testes E2E dos scrapers contra fontes reais (tagged `@integration`, skip em CI rapido). |

### Acceptance Criteria

- [ ] `tuss-procedures.json` contem >= 4.000 procedimentos com codigo, descricao, porte
- [ ] `sigtap-procedures.json` contem >= 4.000 procedimentos DATASUS
- [ ] `cbhpm-values.json` contem tabela completa de portes (1A ate 14)
- [ ] `data/tiss-schemas/` contem XSD oficiais da ANS (v4.01.00+)
- [ ] `npm run seed` carrega dados no Supabase sem erros
- [ ] BillingAgent.validateTiss valida contra dados reais sem falsos positivos
- [ ] Notas "Amostra representativa" removidas dos `_meta` dos JSONs

---

## Phase 10: Scheduler & Workflow Automation (H3)

**Prioridade:** High — Workflows definem schedules que nao sao executados
**Esforco estimado:** 5-7 dias
**Dependencias:** Phase 8 (Redis para BullMQ)

### Justificativa

Existem 4 workflows YAML definidos com triggers (`scheduled`, `on-event`, `manual`), mas nenhum runtime os executa. O `audit-pipeline` deveria rodar diariamente as 6AM, o `monthly-close` no 1o dia do mes, e o `reconciliation-pipeline` no evento `payment-received`. Hoje tudo e manual via CLI.

### Deliverables

| # | Entrega | Detalhes |
|---|---------|----------|
| 10.1 | **Workflow Scheduler** | `src/scheduler/workflow-scheduler.ts` — le workflows YAML, registra cron jobs via `node-cron` ou BullMQ repeatable jobs. |
| 10.2 | **Event dispatcher** | `src/scheduler/event-dispatcher.ts` — publica eventos (`payment-received`, etc.) que trigam workflows `on-event`. |
| 10.3 | **Scheduler CLI** | Comandos: `finhealth scheduler start`, `finhealth scheduler status`, `finhealth scheduler trigger <workflow>`. |
| 10.4 | **Execution log** | Tabela `workflow_executions` — id, workflow_name, trigger_type, started_at, finished_at, status, output_summary. |
| 10.5 | **Frontend: Workflow monitor** | Pagina `/workflows` no dashboard listando execucoes recentes, status, next run. |
| 10.6 | **Tests** | Unit tests para scheduler + dispatcher. Integration test para cron trigger. |

### Acceptance Criteria

- [ ] `audit-pipeline` executa automaticamente as 6AM (America/Sao_Paulo)
- [ ] `monthly-close` executa no 1o dia do mes as 8AM
- [ ] `reconciliation-pipeline` dispara no evento `payment-received`
- [ ] `billing-pipeline` pode ser trigado manualmente via CLI
- [ ] Dashboard mostra historico de execucoes com status (success/failed/running)
- [ ] Scheduler sobrevive a restart (jobs persistidos no Redis)

---

## Phase 11: Assinatura XML com Certificado Digital A1 (H6)

**Prioridade:** High — Obrigatorio para envio TISS para operadoras
**Esforco estimado:** 5-7 dias
**Dependencias:** Phase 9 (XSD schemas para validacao pre-assinatura)

### Justificativa

O padrao TISS da ANS exige que guias XML sejam assinadas digitalmente com certificado ICP-Brasil tipo A1 (arquivo `.pfx`/`.p12`). Sem assinatura, operadoras rejeitam o lote. A tabela `digital_certificates` ja existe no schema, mas nao ha codigo para: upload de certificado, validacao de validade, assinatura XMLDSig, ou verificacao.

### Deliverables

| # | Entrega | Detalhes |
|---|---------|----------|
| 11.1 | **Certificate Manager** | `src/crypto/certificate-manager.ts` — upload `.pfx`, validar validade/CA, extrair subject/issuer, armazenar encrypted no DB. |
| 11.2 | **XML Signer** | `src/crypto/xml-signer.ts` — assinatura XMLDSig (enveloped) usando `xml-crypto` ou `xmldsigjs`. Canonicalizacao C14N. |
| 11.3 | **XML Validator** | Validacao contra XSD schema antes de assinar. Rejeitar XML invalido. |
| 11.4 | **BillingAgent integration** | `generateTissGuide` → gerar XML → validar XSD → assinar → retornar XML assinado. |
| 11.5 | **Frontend: Certificate upload** | Pagina `/settings/certificates` — upload `.pfx`, mostrar validade, status (ativo/expirado/revogado). |
| 11.6 | **Frontend: API route** | `/api/settings/certificates` — CRUD com RBAC `settings:certificates:write`. |
| 11.7 | **Tests** | Testes com certificado de teste (self-signed). Validacao de assinatura. |

### Acceptance Criteria

- [ ] Upload de certificado `.pfx` com senha, armazenamento encrypted
- [ ] Validacao de validade (rejeitar expirados, alertar <30 dias)
- [ ] XML TISS assinado valida contra schema XSD da ANS
- [ ] Assinatura XMLDSig verificavel por terceiros (openssl, xmlsec1)
- [ ] BillingAgent retorna XML assinado quando certificado ativo disponivel
- [ ] Dashboard mostra certificados com status e dias para expirar

---

## Phase 12: Batch Processing TISS + Tenant Onboarding (M3 + M2)

**Prioridade:** Medium — Escala e operacionalizacao
**Esforco estimado:** 8-10 dias
**Dependencias:** Phase 11 (assinatura XML), Phase 10 (scheduler para batch agendado)

### M3: Batch Processing / Lotes TISS

BillingAgent hoje valida/gera guias individualmente. Operadoras esperam receber **lotes** (XML com N guias agrupadas por competencia + operadora).

| # | Entrega | Detalhes |
|---|---------|----------|
| 12.1 | **Lote TISS generator** | `src/billing/tiss-batch.ts` — agrupa guias por (operadora, competencia), gera XML lote conforme schema ANS. |
| 12.2 | **BillingAgent: `generate-tiss-batch`** | Nova task: recebe filtros (operadora, periodo), busca guias pendentes, gera lote, assina, retorna. |
| 12.3 | **Parallel processing** | Processamento paralelo de multiplos lotes (por operadora) via BullMQ workers. |
| 12.4 | **Batch status tracking** | Tabela `tiss_batches` — id, operadora, competencia, total_guias, status (pending/processing/sent/accepted/rejected), xml_url. |
| 12.5 | **Frontend: Batch view** | Pagina `/tiss/batches` — lista lotes, status, download XML, reenvio. |
| 12.6 | **Tests** | Geracao de lote com N guias, validacao XSD, assinatura do lote. |

### M2: Onboarding de Tenant Automatizado

Hoje criar um novo tenant (hospital/clinica) requer: criar org no Supabase, configurar RLS, inserir operadoras, configurar certificados — tudo manual.

| # | Entrega | Detalhes |
|---|---------|----------|
| 12.7 | **Tenant provisioner** | `src/onboarding/tenant-provisioner.ts` — cria organization, admin user, seed reference data, configura operadoras padrao. |
| 12.8 | **CLI command** | `finhealth tenant create --name "Hospital X" --cnpj "XX.XXX.XXX/XXXX-XX" --admin-email "admin@hospital.com"`. |
| 12.9 | **API endpoint** | `/api/admin/tenants` — CRUD com RBAC `admin:tenants:write` (super-admin only). |
| 12.10 | **Onboarding wizard** | Frontend: `/onboarding` — wizard 4 steps: dados da organizacao → operadoras → certificado → usuarios. |
| 12.11 | **Tests** | Provisioning end-to-end, cleanup on failure (rollback parcial). |

### Acceptance Criteria (M3)

- [ ] Lote TISS agrupa guias por operadora + competencia
- [ ] XML lote valida contra XSD de lote ANS
- [ ] Lote assinado com certificado A1 da organizacao
- [ ] Processamento paralelo de 5+ lotes simultaneos
- [ ] Dashboard mostra status de cada lote com timeline

### Acceptance Criteria (M2)

- [ ] `finhealth tenant create` provisiona org completa em <30s
- [ ] Seed automatico de tabelas de referencia (TUSS, SIGTAP, codigos de glosa)
- [ ] Rollback automatico se qualquer step falhar
- [ ] Admin user recebe email de boas-vindas com link de ativacao
- [ ] Wizard frontend guia o onboarding sem necessidade de CLI

---

## Grafo de Dependencias

```
Phase 8: CI/CD + Docker + Staging (C5)
  |
  +---> Phase 9: Reference Data Pipeline (C4 + C6)
  |       |
  |       +---> Phase 11: XML Signing A1 (H6)
  |               |
  |               +---> Phase 12: Batch TISS + Tenant Onboarding (M3 + M2)
  |
  +---> Phase 10: Scheduler & Workflow Automation (H3)
          |
          +---> Phase 12: Batch TISS (M3) [scheduler para batch agendado]
```

---

## Estimativa Total

| Phase | Escopo | Prioridade | Esforco |
|-------|--------|------------|---------|
| 8 | CI/CD, Docker, Staging | Critical | 5-8 dias |
| 9 | Reference Data Pipeline | Critical | 8-12 dias |
| 10 | Scheduler & Workflows | High | 5-7 dias |
| 11 | XML Signing A1 | High | 5-7 dias |
| 12 | Batch TISS + Tenant Onboarding | Medium | 8-10 dias |
| **Total** | | | **31-44 dias** |

---

## Mapeamento para Classificacao Original da Aria

| ID Original | Descricao | Phase | Status |
|-------------|-----------|-------|--------|
| C4 | Tabelas de referencia completas | Phase 9 | Pendente |
| C5 | CI/CD, Docker, staging | Phase 8 | Pendente |
| C6 | Scrapers contra fontes reais | Phase 9 | Pendente |
| H3 | Scheduler/cron workflows | Phase 10 | Pendente |
| H6 | Assinatura XML A1 | Phase 11 | Pendente |
| M3 | Batch processing / Lotes TISS | Phase 12 | Pendente |
| M2 | Onboarding de tenant | Phase 12 | Pendente |
