/* ============================================================
   AIRTREK — WebLLM Local AI Engine
   Browser-based LLM inference using WebLLM (@mlc-ai/web-llm)
   Integrates Konomi Willow for pre/post processing via WebGPU
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
  var willowReady = false;

  // Available models (small enough for browser via WebGPU)
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
    '- Konomi Willow: Token-efficient processing engine using WebGPU compute',
    '',
    'Pricing tiers: Free, Explorer ($9.99/mo), Voyager ($19.99/mo), Patron ($49.99/mo)',
    'Kappa (k) measures empathy via 6 signals: question depth, perspective adoption, assumption surfacing, engagement duration, topic exploration, emotional resonance.',
    'Kappa biological: k = H(state) / H_max where H = entropy of neurochemical state. Optimal awareness: k = 1/phi (0.6138).',
    '',
    'The project has 56 deliverables across 8 categories and 4 phases.',
    'Architecture follows ISA-88 (batch control) and ISA-95 (enterprise integration) standards.',
    '',
    'Answer questions about the project concisely and accurately.',
    'If you do not know something specific, say so rather than guessing.'
  ].join('\n');

  // --- Initialize Willow (WebGPU + NLP pre-processing) ---
  function initWillow() {
    if (window.AirTrekWillow) {
      window.AirTrekWillow.init().then(function (status) {
        willowReady = true;
        if (status.gpu) {
          console.log('[Willow] WebGPU device acquired — GPU compute active');
        } else if (status.webgpu) {
          console.log('[Willow] WebGPU API detected but device unavailable — CPU fallback');
        } else {
          console.log('[Willow] No WebGPU — CPU mode');
        }
      }).catch(function () {
        console.log('[Willow] Init failed — running without pre-processing');
      });
    }
  }

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

    // Load a WebLLM model via WebGPU
    loadModel: function (modelId, onProgress, onComplete, onError) {
      if (isLoading) return;
      if (modelId) selectedModel = modelId;
      isLoading = true;
      loadProgress = 0;

      // Initialize Willow alongside model load
      initWillow();

      // Check if WebGPU is available (required for WebLLM)
      if (!checkWebGPU()) {
        isLoading = false;
        if (onError) onError(new Error('WebGPU not available — cannot run local LLM. Using knowledge base.'));
        return;
      }

      // Load WebLLM from correct CDN (@mlc-ai/web-llm)
      if (window._CreateMLCEngine) {
        doLoadModel(modelId, onProgress, onComplete, onError);
      } else {
        loadWebLLMFromCDN(modelId, onProgress, onComplete, onError);
      }
    },

    // Generate response (Willow pre-process → WebLLM → Willow post-process)
    generate: function (userMessage, onChunk, onComplete, onError) {
      // Run through Willow pre-processing if available
      var willowContext = '';
      if (willowReady && window.AirTrekWillow) {
        var preProcessed = window.AirTrekWillow.preProcess(userMessage);
        willowContext = preProcessed.enrichedContext;
      }

      if (isModelLoaded && engine) {
        generateWithWebLLM(userMessage, willowContext, onChunk, function (fullResponse) {
          // Post-process through Willow
          if (willowReady && window.AirTrekWillow) {
            var post = window.AirTrekWillow.postProcess(fullResponse);
            // Hash the conversation for the data pipeline
            window.AirTrekWillow.hashConversation(userMessage + '\n' + fullResponse);
          }
          if (onComplete) onComplete(fullResponse);
        }, onError);
      } else {
        var response = generateFallback(userMessage);
        if (onChunk) onChunk(response);
        if (onComplete) onComplete(response);
      }
    },

    // Get model info including Willow/GPU status
    getModelInfo: function () {
      var model = MODELS.find(function (m) { return m.id === selectedModel; });
      var willowStatus = willowReady && window.AirTrekWillow
        ? window.AirTrekWillow.getStatus() : null;
      return {
        id: selectedModel,
        name: model ? model.name : selectedModel,
        loaded: isModelLoaded,
        loading: isLoading,
        progress: loadProgress,
        hasWebGPU: checkWebGPU(),
        willow: willowStatus
      };
    }
  };

  // --- WebGPU Check ---
  function checkWebGPU() {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  // --- Load WebLLM from CDN (@mlc-ai/web-llm) ---
  function loadWebLLMFromCDN(modelId, onProgress, onComplete, onError) {
    // Primary: esm.run CDN for @mlc-ai/web-llm
    var script = document.createElement('script');
    script.type = 'module';
    script.textContent = [
      'try {',
      '  const { CreateMLCEngine } = await import("https://esm.run/@mlc-ai/web-llm");',
      '  window._CreateMLCEngine = CreateMLCEngine;',
      '  window.dispatchEvent(new Event("webllm-ready"));',
      '} catch(e) {',
      '  try {',
      '    const webllm = await import("https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/+esm");',
      '    window._CreateMLCEngine = webllm.CreateMLCEngine;',
      '    window.dispatchEvent(new Event("webllm-ready"));',
      '  } catch(e2) {',
      '    console.warn("[WebLLM] CDN load failed:", e2);',
      '    window.dispatchEvent(new Event("webllm-ready"));',
      '  }',
      '}'
    ].join('\n');

    window.addEventListener('webllm-ready', function handler() {
      window.removeEventListener('webllm-ready', handler);
      if (window._CreateMLCEngine) {
        doLoadModel(modelId, onProgress, onComplete, onError);
      } else {
        isLoading = false;
        if (onError) onError(new Error('WebLLM not available — using knowledge base fallback'));
      }
    }, { once: true });

    // Timeout: 30s for initial CDN + model download is more realistic
    setTimeout(function () {
      if (isLoading && !isModelLoaded) {
        isLoading = false;
        if (onError) onError(new Error('WebLLM load timeout — using knowledge base fallback'));
      }
    }, 30000);

    document.head.appendChild(script);
  }

  // --- Actual Model Load (uses WebGPU internally for inference) ---
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

    // CreateMLCEngine uses WebGPU for model inference
    window._CreateMLCEngine(modelId || selectedModel, {
      initProgressCallback: progressCallback
    }).then(function (eng) {
      engine = eng;
      isModelLoaded = true;
      isLoading = false;
      loadProgress = 1;
      console.log('[WebLLM] Model loaded via WebGPU:', modelId || selectedModel);
      if (onComplete) onComplete(eng);
    }).catch(function (err) {
      isLoading = false;
      console.warn('[WebLLM] Model load failed:', err.message);
      if (onError) onError(err);
    });
  }

  // --- Generate with WebLLM (WebGPU-accelerated inference) ---
  function generateWithWebLLM(userMessage, willowContext, onChunk, onComplete, onError) {
    if (!engine) {
      if (onError) onError(new Error('Model not loaded'));
      return;
    }

    // Enrich system prompt with project data and Willow NLP context
    var contextNote = '';
    if (projectData) {
      contextNote = '\n\n[Project has ' + projectData.deliverables.length +
        ' deliverables across ' + projectData.categories.length + ' categories.]';
    }
    if (willowContext) {
      contextNote += '\n' + willowContext;
    }

    var messages = [
      { role: 'system', content: SYSTEM_PROMPT + contextNote },
      { role: 'user', content: userMessage }
    ];

    // Streaming generation (runs on WebGPU)
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

  // --- Fallback generation (keyword matching + Willow NLP) ---
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

    if (q.includes('willow') || q.includes('webgpu') || q.includes('gpu')) {
      var gpuInfo = checkWebGPU() ? 'WebGPU detected' : 'WebGPU not available';
      var willowInfo = willowReady ? 'Willow active' : 'Willow initializing';
      return 'Konomi Willow Core System: ' + willowInfo + '. ' + gpuInfo + '.\n\n' +
        'Willow provides token-efficient pre/post processing for all LLM interactions:\n' +
        '- NLP pipeline (sentiment, entities, keywords)\n' +
        '- WebGPU compute shaders for conversation hashing\n' +
        '- Compression and optimization for token efficiency\n' +
        '- Code analysis across Python, JS, HTML, CSS';
    }

    if (q.includes('trekcoin') || q.includes('economy')) {
      return 'Trekcoin: Virtual currency. 10 welcome bonus. Chat costs 1-8, Voice costs 2, Song costs 8. Daily caps per tier. See CN-ECON-001/002.';
    }

    if (q.includes('kappa') || q.includes('empathy')) {
      return 'Kappa measures empathy via 6 signals: question depth, perspective adoption, assumption surfacing, engagement, topic exploration, emotional resonance.\n' +
        'Biophysical model: k = H(state) / H_max. Optimal awareness: k = 1/phi (0.6138). Peak experience: k = 0.7-0.8.';
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

    return 'I can answer questions about AirTrek deliverables, architecture, Trekcoin economy, Kappa empathy, the Triad Engine, and Konomi Willow. Try asking about a specific topic.';
  }

  // --- Auto-init Willow on load ---
  initWillow();
})();
