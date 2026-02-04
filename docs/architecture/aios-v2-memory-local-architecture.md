# AIOS Memory Layer: Local-First Architecture

**ADR:** ADR-001-LOCAL (supersedes ADR-001)
**Status:** APPROVED ✅
**Author:** @architect (Aria)
**Date:** 2026-02-04
**Story:** Epic 7 - Memory Layer

---

## Decision

Implementar Memory Layer com arquitetura **Hybrid Local-First**:
- **JSON/JSONL files** = Source of Truth (git-trackable)
- **SQLite + sqlite-vec** = Index/Search (derived, rebuildable)

---

## Architecture Overview

```
.aios/memory/
├── facts/                      # Layer 1: Entity Knowledge
│   ├── entities.jsonl          # Structured facts about entities
│   └── project-context.jsonl   # Project-specific knowledge
│
├── daily/                      # Layer 2: Daily Notes
│   ├── 2026-02-04.md          # Chronological session logs
│   └── 2026-02-05.md
│
├── persistent/                 # Layer 3: Curated Patterns
│   └── MEMORY.md              # Long-term learnings
│
├── sessions/                   # Session Traces
│   └── {session-id}.jsonl     # Per-session trace log
│
└── index.db                    # SQLite index (derived)
```

---

## File Formats

### 1. Facts (JSONL)

**Location:** `.aios/memory/facts/*.jsonl`

```jsonl
{"id":"fact-001","entity":"user","fact":"Prefers TypeScript over JavaScript","category":"preference","priority":"high","status":"active","created":"2026-02-04T10:00:00Z"}
{"id":"fact-002","entity":"project","fact":"Uses Supabase for production, SQLite for local","category":"context","priority":"medium","status":"active","created":"2026-02-04T10:05:00Z"}
{"id":"fact-003","entity":"user","fact":"Senior developer with 10+ years experience","category":"context","priority":"high","status":"active","created":"2026-02-04T10:10:00Z"}
```

**Schema:**
```typescript
interface Fact {
  id: string;              // Unique identifier (fact-XXX)
  entity: string;          // What/who this is about
  fact: string;            // The knowledge statement
  category: 'preference' | 'context' | 'decision' | 'learning' | 'constraint';
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'superseded' | 'archived';
  supersedes?: string;     // ID of fact this replaces
  source_session?: string; // Session that created this
  created: string;         // ISO timestamp
  updated?: string;        // ISO timestamp if modified
}
```

### 2. Daily Notes (Markdown)

**Location:** `.aios/memory/daily/YYYY-MM-DD.md`

```markdown
# 2026-02-04

## Session: abc123 (10:00-11:30)

### Context
- Working on Epic 7 Memory Layer
- User decided on local-first architecture

### Key Decisions
- [HIGH] Chose Hybrid storage: JSON + SQLite
- [MEDIUM] Will use sqlite-vec for vector search

### Learnings
- User prefers hermetic solutions over cloud dependencies
- Project prioritizes portability

### Follow-ups
- [ ] Create Story 7.1 for schema migration
- [ ] Research sqlite-vec Node.js integration

---

## Session: def456 (14:00-15:00)
...
```

### 3. Persistent Memory (Markdown)

**Location:** `.aios/memory/persistent/MEMORY.md`

```markdown
# Project Memory

## User Preferences
- Prefers local-first, hermetic solutions
- TypeScript over JavaScript
- CLI-first approach

## Architectural Decisions
- Memory Layer: Hybrid JSON + SQLite
- No cloud dependencies for core features

## Learned Patterns
- Always offer options before deciding
- User appreciates detailed technical analysis

## Constraints
- Must work offline
- Git-trackable where possible
```

### 4. Session Traces (JSONL)

**Location:** `.aios/memory/sessions/{session-id}.jsonl`

```jsonl
{"ts":"2026-02-04T10:00:00Z","agent":"architect","action":"read","target":"docs/architecture/aios-v2-memory-viability.md"}
{"ts":"2026-02-04T10:01:00Z","agent":"architect","action":"analyze","input":"storage options","output":"5 options presented"}
{"ts":"2026-02-04T10:05:00Z","agent":"architect","action":"decision","input":"user chose option 1","output":"Hybrid JSON+SQLite"}
```

**Schema:**
```typescript
interface SessionTrace {
  ts: string;              // ISO timestamp
  agent: string;           // Agent ID
  action: string;          // What was done
  target?: string;         // File/resource acted upon
  input?: string;          // Summary of input
  output?: string;         // Summary of output
  tools_called?: string[]; // Tools used
  cost_usd?: number;       // API cost if tracked
  user_feedback?: -1 | 0 | 1; // Negative/Neutral/Positive
}
```

---

## SQLite Index Schema

**Location:** `.aios/memory/index.db`

### Tables

```sql
-- Core memories table (mirrors facts + daily extractions)
CREATE TABLE aios_memories (
  id TEXT PRIMARY KEY,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('entity', 'daily', 'persistent')),
  entity TEXT,
  content TEXT NOT NULL,
  category TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'archived')),
  source_file TEXT NOT NULL,      -- Which JSON/MD file this came from
  source_session TEXT,
  embedding BLOB,                  -- sqlite-vec vector (1536 dimensions)
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- Relations between memories
CREATE TABLE aios_memory_relations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES aios_memories(id),
  target_id TEXT NOT NULL REFERENCES aios_memories(id),
  relation_type TEXT NOT NULL CHECK (relation_type IN ('references', 'supersedes', 'relates_to', 'contradicts')),
  confidence REAL DEFAULT 1.0,
  created_at TEXT NOT NULL
);

-- Session traces for self-improvement
CREATE TABLE aios_session_traces (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  tools_called TEXT,              -- JSON array
  cost_usd REAL,
  user_feedback INTEGER CHECK (user_feedback IN (-1, 0, 1)),
  source_file TEXT NOT NULL,      -- Which session JSONL
  created_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_memories_type_status ON aios_memories(memory_type, status);
CREATE INDEX idx_memories_entity ON aios_memories(entity);
CREATE INDEX idx_memories_priority ON aios_memories(priority);
CREATE INDEX idx_memories_source ON aios_memories(source_file);
CREATE INDEX idx_relations_source ON aios_memory_relations(source_id);
CREATE INDEX idx_relations_target ON aios_memory_relations(target_id);
CREATE INDEX idx_traces_session ON aios_session_traces(session_id);
CREATE INDEX idx_traces_agent ON aios_session_traces(agent_id);

-- FTS5 for full-text search
CREATE VIRTUAL TABLE aios_memories_fts USING fts5(
  content,
  entity,
  content='aios_memories',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER aios_memories_ai AFTER INSERT ON aios_memories BEGIN
  INSERT INTO aios_memories_fts(rowid, content, entity)
  VALUES (NEW.rowid, NEW.content, NEW.entity);
END;

CREATE TRIGGER aios_memories_ad AFTER DELETE ON aios_memories BEGIN
  INSERT INTO aios_memories_fts(aios_memories_fts, rowid, content, entity)
  VALUES('delete', OLD.rowid, OLD.content, OLD.entity);
END;

CREATE TRIGGER aios_memories_au AFTER UPDATE ON aios_memories BEGIN
  INSERT INTO aios_memories_fts(aios_memories_fts, rowid, content, entity)
  VALUES('delete', OLD.rowid, OLD.content, OLD.entity);
  INSERT INTO aios_memories_fts(rowid, content, entity)
  VALUES (NEW.rowid, NEW.content, NEW.entity);
END;
```

### sqlite-vec Integration

```sql
-- Vector similarity search (requires sqlite-vec extension)
-- Install: npm install sqlite-vec

-- Create vector index
CREATE VIRTUAL TABLE aios_memories_vec USING vec0(
  memory_id TEXT PRIMARY KEY,
  embedding FLOAT[1536]
);

-- Search similar memories
SELECT m.*, v.distance
FROM aios_memories_vec v
JOIN aios_memories m ON m.id = v.memory_id
WHERE v.embedding MATCH ?  -- query embedding
  AND k = 10               -- top 10 results
ORDER BY v.distance;
```

---

## Node.js Implementation

### Dependencies

```json
{
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "sqlite-vec": "^0.1.0"
  }
}
```

### Core Module Structure

```
packages/memory/
├── src/
│   ├── index.ts              # Public API
│   ├── files/
│   │   ├── facts.ts          # JSONL facts management
│   │   ├── daily.ts          # Daily notes management
│   │   ├── persistent.ts     # MEMORY.md management
│   │   └── sessions.ts       # Session traces
│   ├── db/
│   │   ├── connection.ts     # SQLite connection + extensions
│   │   ├── schema.ts         # Table creation/migration
│   │   ├── index-builder.ts  # Rebuild index from files
│   │   └── search.ts         # Query functions
│   ├── sync/
│   │   ├── file-watcher.ts   # Watch for file changes
│   │   └── indexer.ts        # Index files on change
│   └── types.ts              # TypeScript interfaces
├── package.json
└── README.md
```

### Public API

```typescript
// packages/memory/src/index.ts

export interface MemoryLayer {
  // Facts (Layer 1)
  addFact(fact: Omit<Fact, 'id' | 'created'>): Promise<Fact>;
  getFacts(filter?: FactFilter): Promise<Fact[]>;
  supersedeFact(id: string, newFact: string): Promise<Fact>;

  // Daily Notes (Layer 2)
  logToDaily(entry: DailyEntry): Promise<void>;
  getDailyNotes(date: string): Promise<DailyNote>;

  // Persistent Memory (Layer 3)
  updatePersistent(section: string, content: string): Promise<void>;
  getPersistent(): Promise<PersistentMemory>;

  // Session Traces
  traceAction(trace: Omit<SessionTrace, 'ts'>): Promise<void>;
  getSessionTraces(sessionId: string): Promise<SessionTrace[]>;

  // Search (uses SQLite index)
  search(query: string, options?: SearchOptions): Promise<Memory[]>;
  searchSimilar(embedding: number[], limit?: number): Promise<Memory[]>;

  // Index Management
  rebuildIndex(): Promise<void>;
  getIndexStats(): Promise<IndexStats>;
}

// Usage
import { createMemoryLayer } from '@aios/memory';

const memory = await createMemoryLayer({
  basePath: '.aios/memory',  // Default
  autoIndex: true,           // Auto-rebuild on file changes
});

// Add a fact
await memory.addFact({
  entity: 'user',
  fact: 'Prefers local-first architecture',
  category: 'preference',
  priority: 'high',
});

// Search memories
const results = await memory.search('local architecture');

// Search by similarity (requires embeddings)
const similar = await memory.searchSimilar(queryEmbedding, 10);
```

---

## Sync Strategy

### Files → Index

```
┌─────────────────┐
│  JSON/MD Files  │ ← Source of Truth
└────────┬────────┘
         │ on change / on demand
         ▼
┌─────────────────┐
│  Index Builder  │ ← Parses files, extracts memories
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   index.db      │ ← Derived, rebuildable
└─────────────────┘
```

### Rebuild Scenarios

| Trigger | Action |
|---------|--------|
| `index.db` missing | Full rebuild from files |
| `index.db` corrupted | Delete and rebuild |
| File modified | Incremental update |
| Manual `rebuildIndex()` | Full rebuild |
| Git pull with memory changes | Rebuild affected |

---

## Embedding Strategy

### Option A: On-Demand (Recommended for MVP)

- Generate embeddings only when `searchSimilar()` is called
- Cache embeddings in index.db
- Use local embedding model (e.g., `all-MiniLM-L6-v2` via `@xenova/transformers`)

### Option B: Background Indexing

- Generate embeddings on file change
- Requires background process
- Better search performance

### Local Embedding Model

```typescript
// Using Xenova Transformers (runs locally, no API)
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

async function getEmbedding(text: string): Promise<number[]> {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
```

**Note:** `all-MiniLM-L6-v2` produces 384-dim vectors (not 1536). Adjust schema accordingly or use larger model.

---

## Migration Path

### From Supabase Schema (if existing)

1. Export `unified_memories` → `.aios/memory/facts/migrated.jsonl`
2. Export `memory_relations` → Include in facts with `supersedes` field
3. Export `session_traces` → `.aios/memory/sessions/migrated.jsonl`
4. Run `rebuildIndex()` to populate local index.db

### Fresh Install

1. Create directory structure
2. Initialize empty index.db with schema
3. Ready to use

---

## Git Integration

### .gitignore

```gitignore
# Ignore derived index (can be rebuilt)
.aios/memory/index.db
.aios/memory/index.db-*

# Track source files
!.aios/memory/facts/
!.aios/memory/daily/
!.aios/memory/persistent/
!.aios/memory/sessions/
```

### Benefits

- Memory files versioned with project
- Team can share learned facts
- History of decisions preserved
- Rollback possible via git

---

## Security Considerations

1. **Sensitive Data:** Don't store secrets in facts (use `.env`)
2. **Personal Info:** Session traces may contain PII - consider `.gitignore`
3. **Embeddings:** Local model means no data leaves machine

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Index rebuild time | < 5s for 1000 facts |
| Search latency (FTS) | < 50ms |
| Search latency (vector) | < 200ms |
| Memory footprint | < 50MB for index.db |
| Zero external dependencies | ✅ |

---

## References

- [sqlite-vec](https://github.com/asg017/sqlite-vec) - Vector search for SQLite
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Fast SQLite for Node.js
- [Xenova Transformers](https://github.com/xenova/transformers.js) - Local embeddings
- [ADR-001 Original](./aios-v2-memory-viability.md) - Supabase version

---

*Architecture by @architect (Aria) | 2026-02-04*

— Aria, arquitetando o futuro 🏗️
