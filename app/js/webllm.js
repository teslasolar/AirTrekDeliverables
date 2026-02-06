/* ============================================================
   AIRTREK — WebLLM Local AI Engine
   Browser-based LLM inference using WebLLM (web-llm)
   Falls back to project knowledge base if model unavailable
   ============================================================ */

(function () {
  'use strict';

  // --- State ---
  var engine = null;
  var isModelLoaded = false;
  var isLoading = false;
  var loadProgress = 0;
  var selectedModel = 'Llama-3.1-8B-Instruct-q4f32_1-MLC';
  var projectData = null;

  // Available models (small enough for browser)
  var MODELS = [
    { id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC', name: 'Llama 3.1 8B', size: '~4.3 GB', desc: 'Good balance of quality and speed' },
    { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 Mini', size: '~2.2 GB', desc: 'Smaller, faster, good for Q&A' },
    { id: 'gemma-2-2b-it-q4f32_1-MLC', name: 'Gemma 2 2B', size: '~1.4 GB', desc: 'Smallest, fastest load' },
    { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 1.5B', size: '~1 GB', desc: 'Ultra-light, good for simple tasks' }
  ];

  // System prompt with AirTrek context
  var SYSTEM_PROMPT = [
    'You are the AirTrek AI Assistant, an expert on the AirTrek platform.',
    'AirTrek is an AI-powered cultural exploration platform that builds empathy through travel.',
    '',
    'Key systems:',
    '- Triad Engine: AI conversation with 3 agents (Lambda=Local guide, Mu=Teacher, Nu=Mirror) + Compositor',
    '- Voice Service: Character voice via ElevenLabs',
    '- Song Service: AI-generated songs from emotional arcs via Suno',
    '- Passport: User progress, journeys, milestones',
    '- Trekcoin: Virtual currency (earn/spend), daily caps, tier discounts',
    '- TrekCube: 3D spatial world map, VR-ready',
    '',
    'Pricing tiers: Free, Explorer, Voyager, Patron',
    'Kappa (k) measures empathy via 6 signals: question depth, perspective adoption, assumption surfacing, engagement duration, topic exploration, emotional resonance.',
    '',
    'The project has 56 deliverables across 8 categories and 4 phases.',
    'Architecture follows ISA-88 (batch control) and ISA-95 (enterprise integration) standards.',
    '',
    'Answer questions about the project concisely and accurately.',
    'If you do not know something specific, say so rather than guessing.'
  ].join('\n');

  // --- Load project data ---
  fetch('data/deliverables.json')
    .then(function (r) { return r.json(); })
    .then(function (d) { projectData = d; })
    .catch(function () { /* fallback */ });

  // --- Public API (exposed on window for chat.js to use) ---
  window.AirTrekLLM = {
    isLoaded: function () { return isModelLoaded; },
    isLoading: function () { return isLoading; },
    getProgress: function () { return loadProgress; },
    getModels: function () { return MODELS; },
    getSelectedModel: function () { return selectedModel; },

    // Load a WebLLM model
    loadModel: function (modelId, onProgress, onComplete, onError) {
      if (isLoading) return;
      if (modelId) selectedModel = modelId;
      isLoading = true;
      loadProgress = 0;

      // Check for WebLLM availability
      if (typeof window.webllm === 'undefined') {
        // Try to load from CDN
        var script = document.createElement('script');
        script.type = 'module';
        script.textContent = [
          'import * as webllm from "https://esm.run/@anthropic-ai/sdk@latest";',
          'window.webllm = webllm;'
        ].join('\n');

        // Alternative: direct webllm import
        var script2 = document.createElement('script');
        script2.type = 'module';
        script2.textContent = [
          'try {',
          '  const webllm = await import("https://esm.run/@anthropic-ai/sdk");',
          '  window._webllmReady = true;',
          '} catch(e) {',
          '  window._webllmFailed = true;',
          '}'
        ].join('\n');

        // For now, try the actual web-llm package
        loadWebLLMFromCDN(modelId, onProgress, onComplete, onError);
        return;
      }

      doLoadModel(modelId, onProgress, onComplete, onError);
    },

    // Generate response (uses WebLLM if loaded, else fallback)
    generate: function (userMessage, onChunk, onComplete, onError) {
      if (isModelLoaded && engine) {
        generateWithWebLLM(userMessage, onChunk, onComplete, onError);
      } else {
        // Fallback: use project knowledge base (same as chat.js logic)
        var response = generateFallback(userMessage);
        if (onChunk) onChunk(response);
        if (onComplete) onComplete(response);
      }
    },

    // Get model info
    getModelInfo: function () {
      var model = MODELS.find(function (m) { return m.id === selectedModel; });
      return {
        id: selectedModel,
        name: model ? model.name : selectedModel,
        loaded: isModelLoaded,
        loading: isLoading,
        progress: loadProgress,
        hasWebGPU: checkWebGPU()
      };
    }
  };

  // --- WebGPU Check ---
  function checkWebGPU() {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  // --- Load from CDN ---
  function loadWebLLMFromCDN(modelId, onProgress, onComplete, onError) {
    var script = document.createElement('script');
    script.type = 'module';
    script.textContent = [
      'import { CreateMLCEngine } from "https://esm.run/@anthropic-ai/sdk@latest";',
      'window._CreateMLCEngine = CreateMLCEngine;',
      'window.dispatchEvent(new Event("webllm-ready"));'
    ].join('\n');

    window.addEventListener('webllm-ready', function handler() {
      window.removeEventListener('webllm-ready', handler);
      if (window._CreateMLCEngine) {
        doLoadModel(modelId, onProgress, onComplete, onError);
      } else {
        isLoading = false;
        if (onError) onError(new Error('WebLLM not available'));
      }
    }, { once: true });

    // Timeout fallback
    setTimeout(function () {
      if (isLoading && !isModelLoaded) {
        isLoading = false;
        if (onError) onError(new Error('WebLLM load timeout — using knowledge base fallback'));
      }
    }, 10000);

    // Try alternate import path for actual web-llm package
    var script2 = document.createElement('script');
    script2.type = 'module';
    script2.textContent = [
      'try {',
      '  const { CreateMLCEngine } = await import("https://esm.run/@anthropic-ai/sdk@latest");',
      '  window._CreateMLCEngine = CreateMLCEngine;',
      '  window.dispatchEvent(new Event("webllm-ready"));',
      '} catch(e) {',
      '  try {',
      '    const webllm = await import("https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@latest/+esm");',
      '    window._CreateMLCEngine = webllm.CreateMLCEngine;',
      '    window.dispatchEvent(new Event("webllm-ready"));',
      '  } catch(e2) {',
      '    window.dispatchEvent(new Event("webllm-ready"));',
      '  }',
      '}'
    ].join('\n');
    document.head.appendChild(script2);
  }

  // --- Actual Model Load ---
  function doLoadModel(modelId, onProgress, onComplete, onError) {
    if (!window._CreateMLCEngine) {
      isLoading = false;
      if (onError) onError(new Error('WebLLM engine not available — using knowledge base'));
      return;
    }

    var progressCallback = function (report) {
      loadProgress = report.progress || 0;
      if (onProgress) onProgress(report);
    };

    window._CreateMLCEngine(modelId || selectedModel, {
      initProgressCallback: progressCallback
    }).then(function (eng) {
      engine = eng;
      isModelLoaded = true;
      isLoading = false;
      loadProgress = 1;
      if (onComplete) onComplete(eng);
    }).catch(function (err) {
      isLoading = false;
      if (onError) onError(err);
    });
  }

  // --- Generate with WebLLM ---
  function generateWithWebLLM(userMessage, onChunk, onComplete, onError) {
    if (!engine) {
      if (onError) onError(new Error('Model not loaded'));
      return;
    }

    // Add project context to the message
    var contextNote = '';
    if (projectData) {
      contextNote = '\n\n[Project has ' + projectData.deliverables.length +
        ' deliverables across ' + projectData.categories.length + ' categories.]';
    }

    var messages = [
      { role: 'system', content: SYSTEM_PROMPT + contextNote },
      { role: 'user', content: userMessage }
    ];

    // Streaming generation
    engine.chat.completions.create({
      messages: messages,
      temperature: 0.7,
      max_tokens: 512,
      stream: true
    }).then(function (stream) {
      var fullResponse = '';

      (function readStream() {
        stream.next().then(function (result) {
          if (result.done) {
            if (onComplete) onComplete(fullResponse);
            return;
          }
          var chunk = result.value;
          if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta) {
            var text = chunk.choices[0].delta.content || '';
            fullResponse += text;
            if (onChunk) onChunk(text);
          }
          readStream();
        }).catch(function (err) {
          if (onError) onError(err);
        });
      })();
    }).catch(function (err) {
      if (onError) onError(err);
    });
  }

  // --- Fallback generation (keyword matching) ---
  function generateFallback(query) {
    if (!projectData) return 'Project data not loaded yet. Please try again.';

    var q = query.toLowerCase();
    var d = projectData.deliverables;

    if (q.includes('status') || q.includes('progress')) {
      var complete = d.filter(function (x) { return x.status === 'complete'; }).length;
      return 'Project: ' + complete + '/' + d.length + ' deliverables complete (' +
        Math.round(complete / d.length * 100) + '%). ' +
        d.filter(function (x) { return x.status === 'in-progress'; }).length + ' in progress.';
    }

    if (q.includes('trekcoin') || q.includes('economy')) {
      return 'Trekcoin: Virtual currency. 10 welcome bonus. Chat costs 1-8, Voice costs 2, Song costs 8. Daily caps per tier. See CN-ECON-001/002.';
    }

    if (q.includes('kappa') || q.includes('empathy')) {
      return 'Kappa measures empathy via 6 signals: question depth, perspective adoption, assumption surfacing, engagement, topic exploration, emotional resonance. k=sum(Si*Wi), smoothed alpha=0.3.';
    }

    if (q.includes('triad') || q.includes('agent')) {
      return 'Triad Engine: Router(epsilon) -> Lambda(Local guide) + Mu(Teacher) + Nu(Mirror) -> Omega(Compositor). Level 1=Lambda only, Level 2=+Mu, Level 3+=all three.';
    }

    // Search deliverables
    var matches = d.filter(function (x) {
      return x.title.toLowerCase().includes(q) || x.id.toLowerCase().includes(q);
    });
    if (matches.length > 0 && matches.length <= 3) {
      return matches.map(function (m) {
        return m.id + ': ' + m.title + ' [' + m.status + '] — ' + (m.plainLanguage || m.description).substring(0, 120);
      }).join('\n\n');
    }

    return 'I can answer questions about AirTrek deliverables, architecture, Trekcoin economy, Kappa empathy, and the Triad Engine. Try asking about a specific topic.';
  }
})();
