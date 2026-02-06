/**
 * AirTrek Status Checker
 *
 * Client-side health monitoring for airtrek.ai and related services.
 * Runs periodic checks from the browser using fetch + CORS/no-cors probes.
 * Renders results into the status dashboard template.
 */
(function () {
  'use strict';

  /* ── Configuration ─────────────────────────────────────────────── */

  var ENDPOINTS = [
    {
      id: 'airtrek-ai',
      name: 'AirTrek.ai',
      url: 'https://airtrek.ai',
      description: 'Main production website',
      category: 'Production'
    },
    {
      id: 'airtrek-ai-api',
      name: 'AirTrek.ai API',
      url: 'https://airtrek.ai/api/health',
      description: 'Backend API health endpoint',
      category: 'Production'
    },
    {
      id: 'github-pages',
      name: 'GitHub Pages',
      url: 'https://teslasolar.github.io/AirTrekDeliverables/',
      description: 'Documentation & task tracker site',
      category: 'Documentation'
    },
    {
      id: 'github-repo',
      name: 'GitHub Repository',
      url: 'https://api.github.com/repos/teslasolar/AirTrekDeliverables',
      description: 'Source repository via GitHub API',
      category: 'Development'
    },
    {
      id: 'github-pages-docs',
      name: 'Docs Viewer',
      url: 'https://teslasolar.github.io/AirTrekDeliverables/docs.html',
      description: 'Markdown document viewer',
      category: 'Documentation'
    },
    {
      id: 'github-pages-app',
      name: 'Task Tracker App',
      url: 'https://teslasolar.github.io/AirTrekDeliverables/app/index.html',
      description: 'Enterprise task tracker application',
      category: 'Documentation'
    }
  ];

  var CHECK_INTERVAL = 60000; // 60 seconds
  var TIMEOUT = 8000;         // 8 second request timeout
  var HISTORY_KEY = 'airtrek_status_history';
  var MAX_HISTORY = 50;

  /* ── State ──────────────────────────────────────────────────────── */

  var results = {};
  var history = loadHistory();
  var intervalId = null;

  /* ── Storage ────────────────────────────────────────────────────── */

  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) { /* quota exceeded — ignore */ }
  }

  /* ── Probing ────────────────────────────────────────────────────── */

  /**
   * Check a single endpoint. We try cors first, then no-cors (opaque).
   * Returns { status, code, latency, timestamp }
   */
  function checkEndpoint(ep) {
    var start = performance.now();
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT);

    return fetch(ep.url, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal
    }).then(function (res) {
      clearTimeout(timer);
      var latency = Math.round(performance.now() - start);
      var ok = res.ok; // 2xx
      return {
        status: ok ? 'up' : (res.status >= 500 ? 'down' : 'degraded'),
        code: res.status,
        latency: latency,
        timestamp: Date.now()
      };
    }).catch(function () {
      // CORS blocked — try opaque (no-cors). A response means the server is reachable.
      clearTimeout(timer);
      var start2 = performance.now();
      var controller2 = new AbortController();
      var timer2 = setTimeout(function () { controller2.abort(); }, TIMEOUT);

      return fetch(ep.url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller2.signal
      }).then(function () {
        clearTimeout(timer2);
        var latency = Math.round(performance.now() - start2);
        // Opaque response — server responded but we can't read status
        return {
          status: 'reachable',
          code: null,
          latency: latency,
          timestamp: Date.now()
        };
      }).catch(function () {
        clearTimeout(timer2);
        return {
          status: 'down',
          code: null,
          latency: null,
          timestamp: Date.now()
        };
      });
    });
  }

  /* ── Run All Checks ─────────────────────────────────────────────── */

  function runAllChecks() {
    var promises = ENDPOINTS.map(function (ep) {
      return checkEndpoint(ep).then(function (result) {
        results[ep.id] = result;

        // Append to history
        if (!history[ep.id]) history[ep.id] = [];
        history[ep.id].push(result);
        if (history[ep.id].length > MAX_HISTORY) {
          history[ep.id] = history[ep.id].slice(-MAX_HISTORY);
        }
      });
    });

    return Promise.all(promises).then(function () {
      saveHistory();
      render();
    });
  }

  /* ── Rendering ──────────────────────────────────────────────────── */

  function statusLabel(s) {
    var map = {
      up: 'Operational',
      reachable: 'Reachable',
      degraded: 'Degraded',
      down: 'Down',
      checking: 'Checking...'
    };
    return map[s] || 'Unknown';
  }

  function statusClass(s) {
    if (s === 'up') return 'status-up';
    if (s === 'reachable') return 'status-reachable';
    if (s === 'degraded') return 'status-degraded';
    if (s === 'down') return 'status-down';
    return 'status-checking';
  }

  function overallStatus() {
    var statuses = Object.keys(results).map(function (k) { return results[k].status; });
    if (!statuses.length) return 'checking';
    if (statuses.every(function (s) { return s === 'up'; })) return 'up';
    if (statuses.some(function (s) { return s === 'down'; })) return 'degraded';
    return 'reachable';
  }

  function uptimePercent(id) {
    var h = history[id];
    if (!h || !h.length) return null;
    var good = h.filter(function (r) { return r.status === 'up' || r.status === 'reachable'; }).length;
    return Math.round((good / h.length) * 1000) / 10;
  }

  function renderMiniChart(id) {
    var h = history[id];
    if (!h || h.length < 2) return '';
    var last = h.slice(-20);
    var bars = last.map(function (r) {
      var cls = statusClass(r.status);
      return '<div class="status-bar ' + cls + '" title="' + statusLabel(r.status) +
             (r.latency ? ' · ' + r.latency + 'ms' : '') + '"></div>';
    });
    return '<div class="status-mini-chart">' + bars.join('') + '</div>';
  }

  function render() {
    var container = document.getElementById('statusDashboard');
    if (!container) return;

    // Overall banner
    var overall = overallStatus();
    var bannerEl = document.getElementById('statusBanner');
    if (bannerEl) {
      bannerEl.className = 'status-banner ' + statusClass(overall);
      bannerEl.innerHTML =
        '<span class="status-dot ' + statusClass(overall) + '"></span>' +
        '<span class="status-banner-text">' +
        (overall === 'up' ? 'All Systems Operational' :
         overall === 'reachable' ? 'Systems Reachable (CORS restricted)' :
         overall === 'degraded' ? 'Some Systems Degraded' :
         overall === 'down' ? 'Systems Experiencing Issues' : 'Checking Systems...') +
        '</span>' +
        '<span class="status-banner-time">Last check: ' + new Date().toLocaleTimeString() + '</span>';
    }

    // Group by category
    var categories = {};
    ENDPOINTS.forEach(function (ep) {
      if (!categories[ep.category]) categories[ep.category] = [];
      categories[ep.category].push(ep);
    });

    var html = '';
    Object.keys(categories).forEach(function (cat) {
      html += '<div class="status-category">';
      html += '<h3 class="status-category-title">' + cat + '</h3>';
      html += '<div class="status-items">';

      categories[cat].forEach(function (ep) {
        var r = results[ep.id] || { status: 'checking', code: null, latency: null };
        var uptime = uptimePercent(ep.id);
        var cls = statusClass(r.status);

        html += '<div class="status-item">';
        html += '  <div class="status-item-left">';
        html += '    <span class="status-dot ' + cls + '"></span>';
        html += '    <div class="status-item-info">';
        html += '      <div class="status-item-name">' + ep.name + '</div>';
        html += '      <div class="status-item-desc">' + ep.description + '</div>';
        html += '    </div>';
        html += '  </div>';
        html += '  <div class="status-item-right">';
        if (r.latency !== null) {
          html += '    <span class="status-latency">' + r.latency + 'ms</span>';
        }
        if (r.code) {
          html += '    <span class="status-code status-code-' + Math.floor(r.code / 100) + 'xx">' + r.code + '</span>';
        }
        if (uptime !== null) {
          html += '    <span class="status-uptime">' + uptime + '%</span>';
        }
        html += '    <span class="status-label ' + cls + '">' + statusLabel(r.status) + '</span>';
        html += '  </div>';
        html += '</div>';
        html += renderMiniChart(ep.id);
      });

      html += '</div></div>';
    });

    container.innerHTML = html;
  }

  /* ── Public API ─────────────────────────────────────────────────── */

  window.AirTrekStatus = {
    check: runAllChecks,
    results: function () { return results; },
    history: function () { return history; },
    endpoints: ENDPOINTS,
    start: function () {
      if (intervalId) return;
      runAllChecks();
      intervalId = setInterval(runAllChecks, CHECK_INTERVAL);
    },
    stop: function () {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }
  };

  /* ── Auto-start when templates are loaded ───────────────────────── */

  function init() {
    if (document.getElementById('statusDashboard')) {
      window.AirTrekStatus.start();
    }
  }

  document.addEventListener('templates-loaded', init);
  // Fallback if templates already loaded
  if (document.readyState !== 'loading') {
    setTimeout(init, 100);
  }

})();
