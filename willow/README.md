# Konomi Willow Core System

Token-efficient code processing, NLP, and compression engine with WebGPU integration.

Willow is the operational backbone of the Konomi Architecture. It pre-processes user input, post-processes LLM output, hashes conversation data on the GPU, and analyzes code -- all integrated with the WebLLM local inference pipeline.

## Architecture

```
User Input
    |
    v
AirTrekWillow.preProcess()      <-- NLP: sentiment, keywords, entities
    |                                Compression: token optimization
    v                                Context enrichment for system prompt
AirTrekLLM.generate()           <-- WebLLM via WebGPU (local inference)
    |                                or knowledge base fallback
    v
AirTrekWillow.postProcess()     <-- Response NLP analysis
    |
    v
AirTrekWillow.hashConversation() <-- WebGPU compute shader (djb2 hash)
    |                                 CPU fallback if no GPU
    v
Chat UI
```

## Core Components

- **TokenDB** -- Symbolic token registry with usage analytics. Tracks Python, JS, HTML, CSS, GPU, LLM, and operational tokens (compress, clean, merge, sync).
- **CodeProcessor** -- Multi-language static analysis. Extracts imports, functions, classes, elements, selectors, properties from Python, JS, HTML, CSS.
- **NLPProcessor** -- Sentiment analysis, entity extraction (names, dates, numbers, URLs), keyword frequency. Expanded word lists for better accuracy.
- **CompressionUtil** -- Strips comments, collapses whitespace. Reports compression ratio and bytes saved.
- **WebGPU Compute Layer** -- Initializes `navigator.gpu`, acquires device, runs WGSL compute shaders for data hashing. Falls back to CPU djb2 hash.
- **KonomiWillow** (orchestrator) -- Manages init, pre/post processing, file analysis, and GPU hashing. Exposes `window.AirTrekWillow` API.

## WebGPU Integration

Willow probes for WebGPU on init:

1. `navigator.gpu.requestAdapter()` -- check for GPU availability
2. `adapter.requestDevice()` -- acquire a GPUDevice
3. Compute shaders run via `GPUComputePipeline` with WGSL (WebGPU Shading Language)
4. WebLLM's `CreateMLCEngine` shares the same WebGPU backend for model inference

If WebGPU is unavailable, all operations fall back to CPU with no loss of functionality.

## API (`window.AirTrekWillow`)

```javascript
// Initialize (probes WebGPU, returns status)
AirTrekWillow.init()               // -> Promise<{ready, gpu, webgpu, gpuDevice, tokenStats}>

// Pre-process user message before LLM
AirTrekWillow.preProcess(msg)      // -> {original, nlp, compression, enrichedContext, timestamp}

// Post-process LLM response
AirTrekWillow.postProcess(resp)    // -> {text, nlp, length, wordCount}

// Hash conversation data (GPU compute shader or CPU fallback)
AirTrekWillow.hashConversation(text) // -> Promise<{hash, computedOn: 'gpu'|'cpu'}>

// Full file analysis pipeline
AirTrekWillow.processFile(code, 'JS') // -> {code, nlp, compression, stats}

// Status
AirTrekWillow.getStatus()          // -> {ready, gpu, webgpu, gpuDevice, tokenStats}
AirTrekWillow.isReady()            // -> boolean
AirTrekWillow.hasGPU()             // -> boolean
```

## Integration with WebLLM

Willow loads before WebLLM in the script order:

```html
<script src="../willow/konomi-willow.js"></script>  <!-- Willow: WebGPU + NLP -->
<script src="js/chat.js"></script>                   <!-- Chat UI -->
<script src="js/webllm.js"></script>                 <!-- WebLLM: local LLM -->
```

WebLLM (`app/js/webllm.js`) calls Willow automatically:
- On model load: `initWillow()` acquires the WebGPU device
- On generate: `preProcess()` enriches the system prompt with NLP context
- On response: `postProcess()` analyzes the output, `hashConversation()` hashes it on GPU

The CDN for WebLLM is `@mlc-ai/web-llm` (not `@anthropic-ai/sdk`).

## Files

- `konomi-willow.js` -- Core system (browser IIFE, exposes `window.AirTrekWillow`)
- `README.md` -- This file
