# Konomi Willow Core System

Willow Agent -- Token-efficient code processing, NLP, and compression engine.

The Willow system is the operational backbone of the Konomi Architecture. It analyzes, optimizes, and compresses code and conversation data across languages, lowering the computational barrier to AI operations.

## Core Components

- **TokenDB** -- Symbolic token registry mapping language and operation types to tracked symbols with usage analytics. Supports categorized tokens across Python, JS, HTML, CSS, and operational types (compress, clean, merge, sync).
- **CodeProcessor** -- Multi-language static analysis engine. Extracts imports, functions, classes, elements, selectors, and properties from Python, JavaScript, HTML, and CSS. Each analysis is token-tracked for usage metrics.
- **NLPProcessor** -- Lightweight NLP pipeline with sentiment analysis, entity extraction (names, dates, numbers), and keyword frequency extraction. Runs multiple NLP functions concurrently per text input.
- **CompressionUtil** -- Content optimization and compression layer. Strips comments and collapses whitespace for optimization; estimates compression ratios by content type.
- **KonomiWillow** (main orchestrator) -- Integrates all subsystems. Processes a file through code analysis, NLP, optimization, and compression in a single pass, returning unified results with token usage stats.

## How It Fits the Architecture

Willow is the "high protein repository" engine -- it implements the cutting-edge token-efficient compilation and computation methodologies that lower computational barriers, producing more efficient token/watt operations at scale.

## Usage

```javascript
import KonomiWillow from './konomi-willow.js';

const willow = new KonomiWillow();
const results = await willow.processFile(sourceCode, 'JS');
// returns: { code, nlp, optimization, compression, stats }
```

## Files

- `konomi-willow.js` -- Core system (TokenDB, CodeProcessor, NLPProcessor, CompressionUtil, KonomiWillow)
