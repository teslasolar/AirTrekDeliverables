/**
 * AirTrek QR Matrix System
 *
 * Generates QR codes encoding deliverable states, agent assignments,
 * and production metrics. Each QR is scannable by CV agents or humans
 * and contains the full serialized state needed to reconstruct context.
 *
 * Architecture:
 *   StateEncoder  → JSON → base64 → QR code (canvas)
 *   StateDecoder  → QR scan → base64 → JSON → state object
 *   MatrixView    → Grid of QR tiles per deliverable / phase / agent
 */
(function () {
  'use strict';

  /* ── QR Code Generator (lightweight, no dependencies) ──────────
   *  Implements QR Code Model 2 with numeric/alphanumeric/byte modes.
   *  Based on the ISO/IEC 18004 standard, simplified for our use.
   *  We generate the QR as a boolean matrix then render to canvas.
   * ─────────────────────────────────────────────────────────────── */

  // We use a compact QR encoder for the browser.
  // For production, swap with a CDN lib — this covers versions 1-10.

  var QR = (function () {
    // Galois field tables
    var EXP = new Array(256), LOG = new Array(256);
    (function () {
      var x = 1;
      for (var i = 0; i < 255; i++) {
        EXP[i] = x;
        LOG[x] = i;
        x <<= 1;
        if (x & 256) x ^= 285;
      }
      EXP[255] = EXP[0];
    })();

    function gfMul(a, b) { return a === 0 || b === 0 ? 0 : EXP[(LOG[a] + LOG[b]) % 255]; }

    function polyMul(a, b) {
      var r = new Array(a.length + b.length - 1).fill(0);
      for (var i = 0; i < a.length; i++)
        for (var j = 0; j < b.length; j++)
          r[i + j] ^= gfMul(a[i], b[j]);
      return r;
    }

    function polyRest(data, gen) {
      var r = data.slice();
      for (var i = 0; i < data.length - gen.length + 1; i++) {
        if (r[i] === 0) continue;
        for (var j = 0; j < gen.length; j++)
          r[i + j] ^= gfMul(gen[j], r[i]);
      }
      return r.slice(data.length - gen.length + 1);
    }

    function genPoly(n) {
      var g = [1];
      for (var i = 0; i < n; i++) g = polyMul(g, [1, EXP[i]]);
      return g;
    }

    // Version info
    var VERSIONS = [
      null,
      { total: 26, ec: [7, 10, 13, 17] },
      { total: 44, ec: [10, 16, 22, 28] },
      { total: 70, ec: [15, 26, 36, 44] },
      { total: 100, ec: [20, 36, 52, 64] },
      { total: 134, ec: [26, 48, 72, 88] },
      { total: 172, ec: [36, 64, 96, 112] },
      { total: 196, ec: [40, 72, 108, 130] },
      { total: 242, ec: [48, 88, 132, 156] },
      { total: 292, ec: [60, 110, 160, 192] },
      { total: 346, ec: [72, 130, 192, 224] }
    ];

    function getVersion(dataLen, ecLevel) {
      ecLevel = ecLevel || 0; // L=0, M=1, Q=2, H=3
      for (var v = 1; v <= 10; v++) {
        var capacity = VERSIONS[v].total - VERSIONS[v].ec[ecLevel];
        if (dataLen + 3 <= capacity) return v; // +3 for mode + length + terminator overhead
      }
      return 10; // max we support
    }

    function encode(text) {
      var bytes = [];
      for (var i = 0; i < text.length; i++) {
        var c = text.charCodeAt(i);
        if (c < 128) { bytes.push(c); }
        else if (c < 2048) { bytes.push(192 | (c >> 6), 128 | (c & 63)); }
        else if (c < 65536) { bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63)); }
        else { bytes.push(240 | (c >> 18), 128 | ((c >> 12) & 63), 128 | ((c >> 6) & 63), 128 | (c & 63)); }
      }

      var ecLevel = 0; // L
      var ver = getVersion(bytes.length, ecLevel);
      var size = ver * 4 + 17;
      var totalBytes = VERSIONS[ver].total;
      var ecBytes = VERSIONS[ver].ec[ecLevel];
      var dataBytes = totalBytes - ecBytes;

      // Build data codewords
      var data = [];
      // Byte mode indicator (0100) + count
      data.push(0x40 | (bytes.length >> 4));
      data.push(((bytes.length & 0xf) << 4) | (bytes[0] >> 4));
      for (var i = 1; i < bytes.length; i++) {
        data.push(((bytes[i - 1] & 0xf) << 4) | (bytes[i] >> 4));
      }
      if (bytes.length > 0) data.push((bytes[bytes.length - 1] & 0xf) << 4);

      // Pad to dataBytes
      while (data.length < dataBytes) {
        data.push(data.length % 2 === dataBytes % 2 ? 0xEC : 0x11);
      }
      data = data.slice(0, dataBytes);

      // EC codewords
      var g = genPoly(ecBytes);
      var msgOut = new Array(dataBytes + ecBytes).fill(0);
      for (var i = 0; i < dataBytes; i++) msgOut[i] = data[i];
      var ec = polyRest(msgOut, g);

      // Final message
      var msg = data.concat(ec);

      // Build module matrix
      var matrix = [];
      for (var i = 0; i < size; i++) matrix.push(new Array(size).fill(null));

      // Place finder patterns
      function placeFinder(r, c) {
        for (var dr = -1; dr <= 7; dr++)
          for (var dc = -1; dc <= 7; dc++) {
            var rr = r + dr, cc = c + dc;
            if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
            if (dr === -1 || dr === 7 || dc === -1 || dc === 7) matrix[rr][cc] = false;
            else if (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) matrix[rr][cc] = true;
            else if (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) matrix[rr][cc] = true;
            else if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) matrix[rr][cc] = true;
            else matrix[rr][cc] = false;
          }
      }
      placeFinder(0, 0);
      placeFinder(0, size - 7);
      placeFinder(size - 7, 0);

      // Timing patterns
      for (var i = 8; i < size - 8; i++) {
        if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
        if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
      }

      // Dark module
      matrix[size - 8][8] = true;

      // Reserve format info areas
      for (var i = 0; i < 8; i++) {
        if (matrix[8][i] === null) matrix[8][i] = false;
        if (matrix[i][8] === null) matrix[i][8] = false;
        if (matrix[8][size - 1 - i] === null) matrix[8][size - 1 - i] = false;
        if (matrix[size - 1 - i][8] === null) matrix[size - 1 - i][8] = false;
      }
      if (matrix[8][8] === null) matrix[8][8] = false;

      // Place data bits
      var bitIdx = 0;
      var totalBits = msg.length * 8;
      var right = true;
      for (var col = size - 1; col >= 0; col -= 2) {
        if (col === 6) col = 5; // skip timing column
        for (var row = 0; row < size; row++) {
          var r = right ? size - 1 - row : row;
          for (var dc = 0; dc <= 1; dc++) {
            var c = col - dc;
            if (c < 0) continue;
            if (matrix[r][c] !== null) continue;
            var bit = false;
            if (bitIdx < totalBits) {
              bit = ((msg[Math.floor(bitIdx / 8)] >> (7 - (bitIdx % 8))) & 1) === 1;
              bitIdx++;
            }
            // XOR with mask (checkerboard: (r+c)%2==0)
            if ((r + c) % 2 === 0) bit = !bit;
            matrix[r][c] = bit;
          }
        }
        right = !right;
      }

      // Fill remaining nulls
      for (var r = 0; r < size; r++)
        for (var c = 0; c < size; c++)
          if (matrix[r][c] === null) matrix[r][c] = false;

      // Write format info (L + mask 0)
      var formatBits = 0x77C4; // pre-computed for L, mask 0
      var fmtPositions = [
        [[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]],
        [[8,size-1],[8,size-2],[8,size-3],[8,size-4],[8,size-5],[8,size-6],[8,size-7],[8,size-8],[size-7,8],[size-6,8],[size-5,8],[size-4,8],[size-3,8],[size-2,8],[size-1,8]]
      ];
      for (var s = 0; s < 2; s++)
        for (var i = 0; i < 15; i++)
          matrix[fmtPositions[s][i][0]][fmtPositions[s][i][1]] = ((formatBits >> (14 - i)) & 1) === 1;

      return { matrix: matrix, size: size, version: ver };
    }

    return { encode: encode };
  })();

  /* ── State Encoder ──────────────────────────────────────────────── */

  function encodeState(obj) {
    var json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)));
  }

  function decodeState(b64) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) { return null; }
  }

  /* ── Canvas Renderer ────────────────────────────────────────────── */

  function renderQRToCanvas(canvas, qrData, opts) {
    opts = opts || {};
    var scale = opts.scale || 4;
    var fg = opts.fg || '#e8e9ed';
    var bg = opts.bg || '#0f1117';
    var accent = opts.accent || null;
    var mat = qrData.matrix;
    var sz = qrData.size;
    var padding = 2;
    var total = (sz + padding * 2) * scale;

    canvas.width = total;
    canvas.height = total;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, total, total);

    // Modules
    for (var r = 0; r < sz; r++) {
      for (var c = 0; c < sz; c++) {
        if (mat[r][c]) {
          ctx.fillStyle = accent && isFinder(r, c, sz) ? accent : fg;
          ctx.fillRect((c + padding) * scale, (r + padding) * scale, scale, scale);
        }
      }
    }
  }

  function isFinder(r, c, sz) {
    return (r < 7 && c < 7) || (r < 7 && c >= sz - 7) || (r >= sz - 7 && c < 7);
  }

  /* ── Deliverable State QR System ────────────────────────────────── */

  var ISA_STATES = {
    'not-started': { emoji: '\u23F8', label: 'IDLE', color: '#6b7084' },
    'on-hold':     { emoji: '\u26A0', label: 'HELD', color: '#F59E0B' },
    'in-progress': { emoji: '\u25B6', label: 'RUNNING', color: '#4F7BF7' },
    'in-review':   { emoji: '\u23EF', label: 'COMPLETING', color: '#7C5CFC' },
    'complete':    { emoji: '\u2705', label: 'COMPLETE', color: '#34D399' }
  };

  var AGENT_TYPES = {
    'human':    { emoji: '\uD83D\uDC64', label: 'Human Agent' },
    'cv':       { emoji: '\uD83D\uDC41', label: 'CV Agent (Computer Vision)' },
    'llm':      { emoji: '\uD83E\uDDE0', label: 'LLM Agent' },
    'auto':     { emoji: '\u2699', label: 'Automation Agent' },
    'reviewer': { emoji: '\uD83D\uDD0D', label: 'Review Agent' }
  };

  function buildDeliverablePayload(item) {
    return {
      v: 1,                          // schema version
      t: 'deliverable',
      id: item.id,
      doc: item.documentId || null,
      s: item.status || 'not-started',
      p: item.phase || 'phase-1',
      c: item.category || '',
      pr: item.priority || 'medium',
      o: item.owner || 'unassigned',
      ts: Date.now()
    };
  }

  function buildPhasePayload(phaseId, metrics) {
    var bp = metrics.byPhase[phaseId] || { total: 0, byStatus: {} };
    return {
      v: 1,
      t: 'phase',
      id: phaseId,
      total: bp.total,
      complete: bp.byStatus['complete'] || 0,
      running: bp.byStatus['in-progress'] || 0,
      held: bp.byStatus['on-hold'] || 0,
      ts: Date.now()
    };
  }

  function buildAgentPayload(agentType, assignedItems) {
    return {
      v: 1,
      t: 'agent',
      agent: agentType,
      items: assignedItems.map(function (i) { return i.id; }),
      count: assignedItems.length,
      ts: Date.now()
    };
  }

  function buildOverviewPayload(metrics) {
    return {
      v: 1,
      t: 'overview',
      total: metrics.total,
      complete: metrics.complete,
      pct: metrics.percentComplete,
      throughput: metrics.throughput,
      phase: metrics.currentPhase,
      ts: Date.now()
    };
  }

  /* ── Matrix Grid Rendering ──────────────────────────────────────── */

  var factoryData = null;
  var factoryMetrics = null;

  function loadData() {
    return fetch('app/data/deliverables.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        factoryData = json;
        factoryMetrics = computeQuickMetrics(json);
        return factoryMetrics;
      });
  }

  function computeQuickMetrics(d) {
    var deliverables = d.deliverables || [];
    var total = deliverables.length;
    var byStatus = {};
    var byPhase = {};
    var byCategory = {};
    deliverables.forEach(function (item) {
      var s = item.status || 'not-started';
      var p = item.phase || 'phase-1';
      var c = item.category || 'unknown';
      byStatus[s] = (byStatus[s] || 0) + 1;
      if (!byPhase[p]) byPhase[p] = { total: 0, byStatus: {} };
      byPhase[p].total++;
      byPhase[p].byStatus[s] = (byPhase[p].byStatus[s] || 0) + 1;
      if (!byCategory[c]) byCategory[c] = [];
      byCategory[c].push(item);
    });
    var complete = byStatus['complete'] || 0;
    var projectStart = new Date('2026-02-01');
    var elapsed = Math.max(1, Math.floor((new Date() - projectStart) / 86400000));
    return {
      total: total, complete: complete,
      percentComplete: total > 0 ? Math.round((complete / total) * 1000) / 10 : 0,
      throughput: Math.round((complete / elapsed) * 100) / 100,
      currentPhase: 'phase-1',
      byStatus: byStatus, byPhase: byPhase, byCategory: byCategory,
      deliverables: deliverables, phases: d.phases || [], categories: d.categories || []
    };
  }

  /* ── View Modes ─────────────────────────────────────────────────── */

  function renderMatrix(container) {
    if (!factoryMetrics) return;
    var m = factoryMetrics;
    var view = container.getAttribute('data-view') || 'overview';

    var html = '';

    if (view === 'overview') {
      html += renderOverviewGrid(m);
    } else if (view === 'deliverables') {
      html += renderDeliverableGrid(m);
    } else if (view === 'agents') {
      html += renderAgentGrid(m);
    } else if (view === 'phases') {
      html += renderPhaseGrid(m);
    }

    container.innerHTML = html;

    // Render QR codes into canvases
    var canvases = container.querySelectorAll('canvas[data-qr]');
    for (var i = 0; i < canvases.length; i++) {
      var c = canvases[i];
      var payload = c.getAttribute('data-qr');
      var accent = c.getAttribute('data-accent') || null;
      try {
        var qrData = QR.encode(payload);
        renderQRToCanvas(c, qrData, { scale: 3, accent: accent });
      } catch (e) {
        // If QR encode fails for oversized data, show placeholder
        c.width = 80; c.height = 80;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#1a1d27';
        ctx.fillRect(0, 0, 80, 80);
        ctx.fillStyle = '#6b7084';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QR overflow', 40, 44);
      }
    }
  }

  function renderOverviewGrid(m) {
    var html = '<div class="qr-grid qr-grid-overview">';

    // Overall project QR
    var overviewPayload = encodeState(buildOverviewPayload(m));
    html += renderQRTile('Project Overview', m.percentComplete + '% complete', overviewPayload, 'var(--blue)', 'large');

    // Phase QRs
    var phaseIds = ['phase-1', 'phase-2', 'phase-3', 'phase-4'];
    var phaseNames = { 'phase-1': 'Foundation', 'phase-2': 'Core Build', 'phase-3': 'Experience', 'phase-4': 'Launch' };
    phaseIds.forEach(function (pid) {
      var payload = encodeState(buildPhasePayload(pid, m));
      var bp = m.byPhase[pid] || { total: 0, byStatus: {} };
      var pct = bp.total > 0 ? Math.round(((bp.byStatus['complete'] || 0) / bp.total) * 100) : 0;
      html += renderQRTile(phaseNames[pid], pct + '% \u00B7 ' + bp.total + ' items', payload, 'var(--purple)');
    });

    // Agent type QRs
    Object.keys(AGENT_TYPES).forEach(function (agentType) {
      var at = AGENT_TYPES[agentType];
      var payload = encodeState(buildAgentPayload(agentType, []));
      html += renderQRTile(at.emoji + ' ' + at.label, 'Scan to assign', payload, 'var(--cyan)');
    });

    html += '</div>';
    return html;
  }

  function renderDeliverableGrid(m) {
    var html = '<div class="qr-grid qr-grid-deliverables">';
    m.deliverables.forEach(function (item) {
      var payload = encodeState(buildDeliverablePayload(item));
      var st = ISA_STATES[item.status || 'not-started'];
      html += renderQRTile(
        item.id,
        st.emoji + ' ' + st.label,
        payload,
        st.color,
        'small'
      );
    });
    html += '</div>';
    return html;
  }

  function renderAgentGrid(m) {
    var html = '<div class="qr-grid qr-grid-agents">';
    Object.keys(AGENT_TYPES).forEach(function (agentType) {
      var at = AGENT_TYPES[agentType];
      // Group deliverables by hypothetical agent assignment
      var items = m.deliverables.filter(function (d) {
        if (agentType === 'human') return d.status === 'in-progress';
        if (agentType === 'reviewer') return d.status === 'in-review';
        if (agentType === 'cv') return d.category === 'testing-quality';
        if (agentType === 'llm') return d.category === 'content-cultural';
        return false;
      });
      var payload = encodeState(buildAgentPayload(agentType, items));

      html += '<div class="qr-agent-card">';
      html += '  <div class="qr-agent-header">';
      html += '    <span class="qr-agent-emoji">' + at.emoji + '</span>';
      html += '    <div>';
      html += '      <div class="qr-agent-name">' + at.label + '</div>';
      html += '      <div class="qr-agent-count">' + items.length + ' assigned items</div>';
      html += '    </div>';
      html += '  </div>';
      html += '  <canvas data-qr="' + escapeAttr(payload) + '" data-accent="var(--cyan)" class="qr-agent-canvas"></canvas>';
      html += '  <div class="qr-agent-items">';
      items.slice(0, 5).forEach(function (item) {
        var st = ISA_STATES[item.status || 'not-started'];
        html += '<div class="qr-agent-item"><span class="qr-mini-dot" style="background:' + st.color + '"></span>' + item.id + '</div>';
      });
      if (items.length > 5) html += '<div class="qr-agent-item qr-more">+' + (items.length - 5) + ' more</div>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderPhaseGrid(m) {
    var html = '<div class="qr-grid qr-grid-phases">';
    var phaseNames = { 'phase-1': 'Foundation', 'phase-2': 'Core Build', 'phase-3': 'Experience Layer', 'phase-4': 'Launch Readiness' };
    ['phase-1', 'phase-2', 'phase-3', 'phase-4'].forEach(function (pid) {
      var bp = m.byPhase[pid] || { total: 0, byStatus: {} };
      var pct = bp.total > 0 ? Math.round(((bp.byStatus['complete'] || 0) / bp.total) * 100) : 0;
      var payload = encodeState(buildPhasePayload(pid, m));

      html += '<div class="qr-phase-card">';
      html += '  <canvas data-qr="' + escapeAttr(payload) + '" data-accent="var(--purple)" class="qr-phase-canvas"></canvas>';
      html += '  <div class="qr-phase-info">';
      html += '    <div class="qr-phase-name">' + phaseNames[pid] + '</div>';
      html += '    <div class="qr-phase-bar-bg"><div class="qr-phase-bar-fill" style="width:' + pct + '%;background:var(--purple)"></div></div>';
      html += '    <div class="qr-phase-stats">';
      Object.keys(ISA_STATES).forEach(function (s) {
        var count = bp.byStatus[s] || 0;
        if (count > 0) {
          html += '<span class="qr-phase-stat"><span class="qr-mini-dot" style="background:' + ISA_STATES[s].color + '"></span>' + count + ' ' + ISA_STATES[s].label + '</span>';
        }
      });
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  /* ── Tile Helper ────────────────────────────────────────────────── */

  function renderQRTile(title, subtitle, payload, accent, size) {
    size = size || 'medium';
    return '<div class="qr-tile qr-tile-' + size + '">' +
      '<canvas data-qr="' + escapeAttr(payload) + '" data-accent="' + accent + '" class="qr-canvas"></canvas>' +
      '<div class="qr-tile-label">' +
      '  <div class="qr-tile-title">' + title + '</div>' +
      '  <div class="qr-tile-sub">' + subtitle + '</div>' +
      '</div></div>';
  }

  function escapeAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Public API ─────────────────────────────────────────────────── */

  window.AirTrekQR = {
    encode: function (obj) { return encodeState(obj); },
    decode: decodeState,
    generateQR: function (text) { return QR.encode(text); },
    renderToCanvas: renderQRToCanvas,
    renderMatrix: renderMatrix,
    loadData: loadData,
    STATES: ISA_STATES,
    AGENTS: AGENT_TYPES,
    data: function () { return factoryData; },
    metrics: function () { return factoryMetrics; }
  };

  /* ── Auto-init ──────────────────────────────────────────────────── */

  function init() {
    var el = document.getElementById('qrMatrixContainer');
    if (!el) return;
    loadData().then(function () {
      renderMatrix(el);
      // Wire view tabs
      var tabs = document.querySelectorAll('.qr-view-tab');
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function () {
          for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
          this.classList.add('active');
          el.setAttribute('data-view', this.getAttribute('data-view'));
          renderMatrix(el);
        });
      }
    });
  }

  document.addEventListener('templates-loaded', init);
  if (document.readyState !== 'loading') setTimeout(init, 200);

})();
