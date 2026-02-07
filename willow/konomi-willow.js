/* ============================================================
   KONOMI WILLOW CORE SYSTEM
   Token-efficient code processing, NLP, and compression agent
   Integrates with WebLLM via WebGPU for local AI inference
   ============================================================ */

(function () {
  'use strict';

  // --- WebGPU State ---
  var gpu = null;
  var gpuDevice = null;
  var gpuReady = false;

  // =====================
  // TokenDB
  // =====================
  function TokenDB() {
    this.db = new Map();
    this.symbolMap = new Map([
      ['PYTHON', '\u{1F40D}'], ['JS', '\u{1F4DC}'],
      ['HTML', '\u{1F3D7}\uFE0F'], ['CSS', '\u{1F3A8}'],
      ['COMPRESS', '\u{1F4E6}'], ['CLEAN', '\u{1F9F9}'],
      ['MERGE', '\u{1F91D}'], ['SYNC', '\u{1F504}'],
      ['GPU', '\u{1F680}'], ['LLM', '\u{1F9E0}']
    ]);
  }

  TokenDB.prototype.addToken = function (key, value, category) {
    category = category || 'general';
    this.db.set(category + ':' + key, {
      value: value,
      symbol: this.symbolMap.get(key.toUpperCase()) || '\u26A1',
      usage: 0,
      lastUsed: null
    });
  };

  TokenDB.prototype.getToken = function (key, category) {
    category = category || 'general';
    var token = this.db.get(category + ':' + key);
    if (token) {
      token.usage++;
      token.lastUsed = Date.now();
      return token;
    }
    return null;
  };

  TokenDB.prototype.getStats = function () {
    var stats = [];
    this.db.forEach(function (data, key) {
      stats.push({ key: key, usage: data.usage, symbol: data.symbol });
    });
    return stats;
  };

  // =====================
  // CodeProcessor
  // =====================
  function CodeProcessor(tokenDB) {
    this.tokenDB = tokenDB;
  }

  CodeProcessor.prototype.process = function (code, language) {
    var lang = (language || '').toUpperCase();
    switch (lang) {
      case 'PYTHON': return this._python(code);
      case 'JS': case 'JAVASCRIPT': return this._js(code);
      case 'HTML': return this._html(code);
      case 'CSS': return this._css(code);
      default: return { type: lang.toLowerCase(), analysis: { lines: code.split('\n').length } };
    }
  };

  CodeProcessor.prototype._python = function (code) {
    var token = this.tokenDB.getToken('PYTHON');
    return {
      type: 'python', symbol: token ? token.symbol : '',
      analysis: {
        imports: code.match(/import \w+/g) || [],
        functions: code.match(/def \w+/g) || [],
        classes: code.match(/class \w+/g) || []
      }
    };
  };

  CodeProcessor.prototype._js = function (code) {
    var token = this.tokenDB.getToken('JS');
    return {
      type: 'javascript', symbol: token ? token.symbol : '',
      analysis: {
        imports: code.match(/import .* from/g) || [],
        functions: code.match(/function \w+/g) || [],
        classes: code.match(/class \w+/g) || []
      }
    };
  };

  CodeProcessor.prototype._html = function (code) {
    var token = this.tokenDB.getToken('HTML');
    return {
      type: 'html', symbol: token ? token.symbol : '',
      analysis: {
        elements: code.match(/<\w+/g) || [],
        attributes: code.match(/\w+="/g) || []
      }
    };
  };

  CodeProcessor.prototype._css = function (code) {
    var token = this.tokenDB.getToken('CSS');
    return {
      type: 'css', symbol: token ? token.symbol : '',
      analysis: {
        selectors: code.match(/[\.#]\w+/g) || [],
        properties: code.match(/[\w-]+:/g) || []
      }
    };
  };

  // =====================
  // NLPProcessor
  // =====================
  var POSITIVE_WORDS = ['good', 'great', 'excellent', 'amazing', 'wonderful',
    'fantastic', 'helpful', 'love', 'like', 'best', 'better', 'happy',
    'beautiful', 'perfect', 'brilliant', 'awesome', 'nice', 'cool'];
  var NEGATIVE_WORDS = ['bad', 'poor', 'terrible', 'awful', 'horrible',
    'hate', 'worst', 'boring', 'ugly', 'broken', 'fail', 'wrong',
    'confused', 'frustrating', 'annoying', 'useless'];
  var STOP_WORDS = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an',
    'and', 'or', 'but', 'in', 'of', 'to', 'for', 'it', 'with', 'as',
    'was', 'are', 'be', 'by', 'that', 'this', 'from', 'i', 'you', 'we',
    'they', 'he', 'she', 'do', 'does', 'did', 'have', 'has', 'had',
    'not', 'no', 'so', 'if', 'my', 'me', 'can', 'will', 'just', 'about']);

  function NLPProcessor(tokenDB) {
    this.tokenDB = tokenDB;
    this._posSet = new Set(POSITIVE_WORDS);
    this._negSet = new Set(NEGATIVE_WORDS);
  }

  NLPProcessor.prototype.process = function (text) {
    return {
      sentiment: this._sentiment(text),
      entities: this._entities(text),
      keywords: this._keywords(text),
      charCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length
    };
  };

  NLPProcessor.prototype._sentiment = function (text) {
    var words = text.toLowerCase().split(/\s+/);
    var score = 0;
    var self = this;
    words.forEach(function (w) {
      if (self._posSet.has(w)) score++;
      if (self._negSet.has(w)) score--;
    });
    return {
      score: score,
      normalized: words.length > 0 ? score / words.length : 0,
      label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
    };
  };

  NLPProcessor.prototype._entities = function (text) {
    return {
      names: text.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [],
      dates: text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g) || [],
      numbers: text.match(/\d+/g) || [],
      urls: text.match(/https?:\/\/[^\s]+/g) || []
    };
  };

  NLPProcessor.prototype._keywords = function (text) {
    var words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    var freq = {};
    words.forEach(function (w) {
      if (!STOP_WORDS.has(w) && w.length > 2) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });
    return Object.keys(freq)
      .sort(function (a, b) { return freq[b] - freq[a]; })
      .slice(0, 10);
  };

  // =====================
  // CompressionUtil
  // =====================
  function CompressionUtil(tokenDB) {
    this.tokenDB = tokenDB;
  }

  CompressionUtil.prototype.compress = function (content) {
    this.tokenDB.getToken('COMPRESS');
    var original = content.length;
    var compressed = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return {
      original: original,
      compressed: compressed.length,
      ratio: original > 0 ? (compressed.length / original).toFixed(3) : '1.000',
      saved: original - compressed.length,
      output: compressed
    };
  };

  CompressionUtil.prototype.optimize = function (content) {
    this.tokenDB.getToken('CLEAN');
    var optimized = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return { original: content.length, optimized: optimized.length, output: optimized };
  };

  // =====================
  // WebGPU Compute Layer
  // =====================
  function initWebGPU() {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      return Promise.resolve(false);
    }
    return navigator.gpu.requestAdapter().then(function (adapter) {
      if (!adapter) return false;
      gpu = adapter;
      return adapter.requestDevice();
    }).then(function (device) {
      if (!device) return false;
      gpuDevice = device;
      gpuReady = true;
      return true;
    }).catch(function () {
      return false;
    });
  }

  // WebGPU compute shader for hashing conversation data
  function gpuComputeHash(data) {
    if (!gpuReady || !gpuDevice) {
      return Promise.resolve(cpuFallbackHash(data));
    }

    var encoder = new TextEncoder();
    var bytes = encoder.encode(data);
    var uint32Count = Math.ceil(bytes.length / 4);
    var inputData = new Uint32Array(uint32Count + 1);
    inputData[0] = bytes.length;
    var view = new Uint8Array(inputData.buffer, 4);
    view.set(bytes);

    var shaderCode = [
      '@group(0) @binding(0) var<storage, read> input: array<u32>;',
      '@group(0) @binding(1) var<storage, read_write> output: array<u32>;',
      '',
      '@compute @workgroup_size(1)',
      'fn main() {',
      '  let len = input[0];',
      '  var hash: u32 = 5381u;',
      '  let words = (len + 3u) / 4u;',
      '  for (var i: u32 = 0u; i < words; i = i + 1u) {',
      '    hash = ((hash << 5u) + hash) ^ input[i + 1u];',
      '  }',
      '  output[0] = hash;',
      '}'
    ].join('\n');

    try {
      var shaderModule = gpuDevice.createShaderModule({ code: shaderCode });

      var inputBuffer = gpuDevice.createBuffer({
        size: inputData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      });
      gpuDevice.queue.writeBuffer(inputBuffer, 0, inputData);

      var outputBuffer = gpuDevice.createBuffer({
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
      });

      var readBuffer = gpuDevice.createBuffer({
        size: 4,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
      });

      var bindGroupLayout = gpuDevice.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
          { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }
        ]
      });

      var bindGroup = gpuDevice.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: inputBuffer } },
          { binding: 1, resource: { buffer: outputBuffer } }
        ]
      });

      var pipelineLayout = gpuDevice.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
      var pipeline = gpuDevice.createComputePipeline({
        layout: pipelineLayout,
        compute: { module: shaderModule, entryPoint: 'main' }
      });

      var commandEncoder = gpuDevice.createCommandEncoder();
      var passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(1);
      passEncoder.end();
      commandEncoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, 4);
      gpuDevice.queue.submit([commandEncoder.finish()]);

      return readBuffer.mapAsync(GPUMapMode.READ).then(function () {
        var result = new Uint32Array(readBuffer.getMappedRange())[0];
        readBuffer.unmap();
        inputBuffer.destroy();
        outputBuffer.destroy();
        readBuffer.destroy();
        return { hash: result.toString(16), computedOn: 'gpu' };
      });
    } catch (e) {
      return Promise.resolve(cpuFallbackHash(data));
    }
  }

  function cpuFallbackHash(data) {
    var hash = 5381;
    for (var i = 0; i < data.length; i++) {
      hash = ((hash << 5) + hash + data.charCodeAt(i)) | 0;
    }
    return { hash: (hash >>> 0).toString(16), computedOn: 'cpu' };
  }

  // =====================
  // KonomiWillow — Main Orchestrator
  // =====================
  function KonomiWillow() {
    this.tokenDB = new TokenDB();
    this.codeProcessor = new CodeProcessor(this.tokenDB);
    this.nlpProcessor = new NLPProcessor(this.tokenDB);
    this.compressionUtil = new CompressionUtil(this.tokenDB);
    this.ready = false;
    this.gpuAvailable = false;
    this._initTokens();
  }

  KonomiWillow.prototype._initTokens = function () {
    var tokens = ['PYTHON', 'JS', 'HTML', 'CSS', 'COMPRESS', 'CLEAN', 'MERGE', 'SYNC', 'GPU', 'LLM'];
    for (var i = 0; i < tokens.length; i++) {
      this.tokenDB.addToken(tokens[i], tokens[i].toLowerCase());
    }
  };

  KonomiWillow.prototype.init = function () {
    var self = this;
    return initWebGPU().then(function (hasGPU) {
      self.gpuAvailable = hasGPU;
      self.ready = true;
      if (hasGPU) {
        self.tokenDB.getToken('GPU');
      }
      return self.getStatus();
    });
  };

  KonomiWillow.prototype.getStatus = function () {
    return {
      ready: this.ready,
      gpu: this.gpuAvailable,
      webgpu: typeof navigator !== 'undefined' && 'gpu' in navigator,
      gpuDevice: gpuReady,
      tokenStats: this.tokenDB.getStats()
    };
  };

  // Pre-process user input before sending to WebLLM
  KonomiWillow.prototype.preProcess = function (userMessage) {
    var nlp = this.nlpProcessor.process(userMessage);
    var compressed = this.compressionUtil.compress(userMessage);
    this.tokenDB.getToken('LLM');

    return {
      original: userMessage,
      nlp: nlp,
      compression: compressed,
      enrichedContext: this._buildContext(nlp),
      timestamp: Date.now()
    };
  };

  // Build enriched context string from NLP analysis for system prompt injection
  KonomiWillow.prototype._buildContext = function (nlp) {
    var parts = [];
    if (nlp.sentiment.label !== 'neutral') {
      parts.push('User sentiment: ' + nlp.sentiment.label);
    }
    if (nlp.keywords.length > 0) {
      parts.push('Key topics: ' + nlp.keywords.slice(0, 5).join(', '));
    }
    if (nlp.entities.names.length > 0) {
      parts.push('Mentioned: ' + nlp.entities.names.join(', '));
    }
    return parts.length > 0 ? '[Willow context: ' + parts.join(' | ') + ']' : '';
  };

  // Post-process WebLLM response
  KonomiWillow.prototype.postProcess = function (response) {
    var nlp = this.nlpProcessor.process(response);
    return {
      text: response,
      nlp: nlp,
      length: response.length,
      wordCount: nlp.wordCount
    };
  };

  // Hash conversation data using WebGPU compute shader (CPU fallback)
  KonomiWillow.prototype.hashConversation = function (conversationText) {
    return gpuComputeHash(conversationText);
  };

  // Full file processing pipeline (code analysis + NLP + compression)
  KonomiWillow.prototype.processFile = function (content, language) {
    return {
      code: this.codeProcessor.process(content, language),
      nlp: this.nlpProcessor.process(content),
      compression: this.compressionUtil.compress(content),
      stats: this.tokenDB.getStats()
    };
  };

  // =====================
  // Initialize and expose globally
  // =====================
  var willow = new KonomiWillow();

  window.AirTrekWillow = {
    init: function () { return willow.init(); },
    preProcess: function (msg) { return willow.preProcess(msg); },
    postProcess: function (resp) { return willow.postProcess(resp); },
    hashConversation: function (text) { return willow.hashConversation(text); },
    processFile: function (content, lang) { return willow.processFile(content, lang); },
    getStatus: function () { return willow.getStatus(); },
    isReady: function () { return willow.ready; },
    hasGPU: function () { return willow.gpuAvailable; }
  };
})();
