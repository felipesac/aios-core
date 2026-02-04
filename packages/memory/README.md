# @aios/memory

Local-first persistent memory layer for AIOS agents with SQLite + sqlite-vec.

## Overview

This package implements a three-layer memory architecture:

1. **Entity Knowledge** (Layer 1): Structured facts in JSONL format
2. **Daily Notes** (Layer 2): Chronological session logs in Markdown
3. **Persistent Memory** (Layer 3): Curated patterns and preferences

All data is stored locally with files as the source of truth and SQLite as a derived index for fast searching.

## Installation

```bash
npm install @aios/memory
```

## Quick Start

```typescript
import { createMemoryLayer } from '@aios/memory';

// Create memory layer
const memory = await createMemoryLayer({
  basePath: '.aios/memory',  // Default
  autoIndex: true            // Auto-rebuild on missing index
});

// Add a fact
const fact = await memory.addFact({
  entity: 'user',
  fact: 'Prefers TypeScript over JavaScript',
  category: 'preference',
  priority: 'high'
});

// Search memories
const results = await memory.search('TypeScript');

// Get statistics
const stats = await memory.getIndexStats();
console.log(`Total memories: ${stats.total_memories}`);

// Close when done
memory.close();
```

## Directory Structure

```
.aios/memory/
├── facts/                  # Layer 1: Entity Knowledge (JSONL)
│   └── entities.jsonl
├── daily/                  # Layer 2: Daily Notes (Markdown)
│   └── 2026-02-04.md
├── persistent/             # Layer 3: Curated Patterns
│   └── MEMORY.md
├── sessions/               # Session Traces (JSONL)
│   └── {session-id}.jsonl
├── index.db                # SQLite index (derived, gitignored)
└── .gitignore
```

## API Reference

### Core Methods

#### `createMemoryLayer(config?)`

Creates a new MemoryLayer instance.

```typescript
const memory = await createMemoryLayer({
  basePath: '.aios/memory',      // Base directory
  autoIndex: true,               // Auto-rebuild if index missing
  enableVectorSearch: true,      // Enable sqlite-vec (if available)
  vectorDimensions: 384          // Embedding dimensions
});
```

#### `addFact(input)`

Add a new fact to the knowledge base.

```typescript
const fact = await memory.addFact({
  entity: 'user',                // What/who this is about
  fact: 'Prefers TypeScript',    // The knowledge statement
  category: 'preference',        // preference|context|decision|learning|constraint
  priority: 'high',              // high|medium|low
  source_session: 'session-123'  // Optional: session that created this
});
```

#### `getFacts(filter?)`

Retrieve facts with optional filtering.

```typescript
const facts = await memory.getFacts({
  entity: 'user',
  category: 'preference',
  priority: 'high',
  status: 'active',
  limit: 10
});
```

#### `supersedeFact(id, newFact)`

Replace an existing fact with a new version.

```typescript
const newFact = await memory.supersedeFact(
  'fact-abc123',
  'Strongly prefers TypeScript'
);
// Old fact is marked as 'superseded'
// New fact links to old via 'supersedes' field
```

#### `search(query, options?)`

Full-text search using FTS5.

```typescript
const results = await memory.search('TypeScript framework', {
  limit: 20,
  memory_type: 'entity',
  status: 'active'
});
```

#### `searchSimilar(embedding, limit?)`

Vector similarity search (requires sqlite-vec).

```typescript
const embedding = await getEmbedding('TypeScript preferences');
const similar = await memory.searchSimilar(embedding, 10);
```

#### `rebuildIndex()`

Rebuild SQLite index from source files.

```typescript
const stats = await memory.rebuildIndex();
console.log(`Indexed ${stats.total_memories} memories`);
```

#### `getIndexStats()`

Get index statistics.

```typescript
const stats = await memory.getIndexStats();
// {
//   total_memories: 100,
//   by_type: { entity: 80, daily: 15, persistent: 5 },
//   by_status: { active: 90, superseded: 8, archived: 2 },
//   total_relations: 20,
//   total_traces: 500,
//   last_rebuild: '2026-02-04T10:00:00Z',
//   index_size_bytes: 1048576
// }
```

### Session Traces

```typescript
// Log an action
await memory.traceAction({
  agent: 'dev',
  action: 'read',
  target: 'src/index.ts',
  input: 'Reading file',
  output: 'File contents',
  tools_called: ['Read'],
  cost_usd: 0.001
});

// Get session traces
const traces = await memory.getSessionTraces('session-123');
```

### Persistent Memory

```typescript
// Update persistent memory
await memory.updatePersistent('user_preferences', 'Prefers TypeScript');
await memory.updatePersistent('constraints', 'Must work offline');

// Get persistent memory
const persistent = await memory.getPersistent();
// {
//   user_preferences: ['Prefers TypeScript'],
//   architectural_decisions: [],
//   learned_patterns: [],
//   constraints: ['Must work offline']
// }
```

## Architecture

This package follows **ADR-001-LOCAL**:

- **Files = Source of Truth**: All data is stored in human-readable files
- **SQLite = Derived Index**: Can be rebuilt from files at any time
- **Git-Trackable**: Files are versioned, index.db is gitignored
- **Zero Cloud Dependencies**: Works 100% offline

### Storage Strategy

| Data Type | Format | Storage |
|-----------|--------|---------|
| Facts | JSONL | `facts/*.jsonl` |
| Daily Notes | Markdown | `daily/YYYY-MM-DD.md` |
| Persistent | Markdown | `persistent/MEMORY.md` |
| Traces | JSONL | `sessions/{id}.jsonl` |
| Index | SQLite | `index.db` |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type check
npm run typecheck

# Lint
npm run lint
```

## License

MIT
