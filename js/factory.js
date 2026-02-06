/**
 * AirTrek Factory — ISA-88 Batch Production Pipeline
 *
 * Models the repo's deliverable production as a factory floor:
 *
 *   ISA-88 Hierarchy:
 *   ┌─────────────────────────────────────────────┐
 *   │ PROCEDURE      = Phase (Foundation → Launch) │
 *   │  └─ UNIT PROC  = Category (Business, Dev..) │
 *   │      └─ OPERATION = Deliverable              │
 *   │          └─ PHASE  = Status transitions      │
 *   └─────────────────────────────────────────────┘
 *
 * Loads deliverables.json, computes production metrics, and renders
 * a factory-floor dashboard with conveyor belts, station gauges,
 * and batch progress tracking.
 */
(function () {
  'use strict';

  /* ── ISA-88 State Model ────────────────────────────────────────── */

  var STATES = {
    'not-started': { label: 'Idle',        order: 0, color: '#6b7084', isa: 'IDLE' },
    'on-hold':     { label: 'Held',        order: 1, color: '#F59E0B', isa: 'HELD' },
    'in-progress': { label: 'Running',     order: 2, color: '#4F7BF7', isa: 'RUNNING' },
    'in-review':   { label: 'Completing',  order: 3, color: '#7C5CFC', isa: 'COMPLETING' },
    'complete':    { label: 'Complete',     order: 4, color: '#34D399', isa: 'COMPLETE' }
  };

  var PHASE_ORDER = ['phase-1', 'phase-2', 'phase-3', 'phase-4'];
  var PHASE_NAMES = {
    'phase-1': 'Foundation',
    'phase-2': 'Core Build',
    'phase-3': 'Experience Layer',
    'phase-4': 'Launch Readiness'
  };

  /* ── Data ───────────────────────────────────────────────────────── */

  var data = null;
  var metrics = null;

  function loadData() {
    return fetch('app/data/deliverables.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        data = json;
        metrics = computeMetrics(json);
        return metrics;
      })
      .catch(function (err) {
        console.warn('[factory] Could not load deliverables.json', err);
        return null;
      });
  }

  /* ── Metrics Engine ─────────────────────────────────────────────── */

  function computeMetrics(d) {
    var deliverables = d.deliverables || [];
    var phases = d.phases || [];
    var categories = d.categories || [];

    var total = deliverables.length;
    var byStatus = {};
    var byPhase = {};
    var byCategory = {};
    var byCatPhase = {};

    deliverables.forEach(function (item) {
      var s = item.status || 'not-started';
      var p = item.phase || 'phase-1';
      var c = item.category || 'unknown';

      byStatus[s] = (byStatus[s] || 0) + 1;
      if (!byPhase[p]) byPhase[p] = { total: 0, byStatus: {} };
      byPhase[p].total++;
      byPhase[p].byStatus[s] = (byPhase[p].byStatus[s] || 0) + 1;

      if (!byCategory[c]) byCategory[c] = { total: 0, byStatus: {} };
      byCategory[c].total++;
      byCategory[c].byStatus[s] = (byCategory[c].byStatus[s] || 0) + 1;

      var key = c + '|' + p;
      if (!byCatPhase[key]) byCatPhase[key] = { total: 0, complete: 0 };
      byCatPhase[key].total++;
      if (s === 'complete') byCatPhase[key].complete++;
    });

    var complete = byStatus['complete'] || 0;
    var inProgress = byStatus['in-progress'] || 0;
    var inReview = byStatus['in-review'] || 0;
    var onHold = byStatus['on-hold'] || 0;
    var notStarted = byStatus['not-started'] || 0;

    // Throughput = complete / total elapsed days since project start
    var projectStart = new Date('2026-02-01');
    var now = new Date();
    var elapsedDays = Math.max(1, Math.floor((now - projectStart) / 86400000));
    var throughput = complete / elapsedDays;

    // Estimated completion at current throughput
    var remaining = total - complete;
    var estDaysToComplete = throughput > 0 ? Math.ceil(remaining / throughput) : null;

    // Current batch (phase)
    var currentPhase = null;
    for (var i = 0; i < PHASE_ORDER.length; i++) {
      var pid = PHASE_ORDER[i];
      var ps = byPhase[pid];
      if (ps && (ps.byStatus['complete'] || 0) < ps.total) {
        currentPhase = pid;
        break;
      }
    }
    if (!currentPhase) currentPhase = PHASE_ORDER[PHASE_ORDER.length - 1];

    return {
      total: total,
      complete: complete,
      inProgress: inProgress,
      inReview: inReview,
      onHold: onHold,
      notStarted: notStarted,
      percentComplete: total > 0 ? Math.round((complete / total) * 1000) / 10 : 0,
      throughput: Math.round(throughput * 100) / 100,
      estDaysToComplete: estDaysToComplete,
      elapsedDays: elapsedDays,
      currentPhase: currentPhase,
      byStatus: byStatus,
      byPhase: byPhase,
      byCategory: byCategory,
      byCatPhase: byCatPhase,
      phases: phases,
      categories: categories,
      deliverables: deliverables
    };
  }

  /* ── Rendering ──────────────────────────────────────────────────── */

  function render() {
    if (!metrics) return;
    var el = document.getElementById('factoryDashboard');
    if (!el) return;

    var m = metrics;
    var html = '';

    // ── Overall Production Gauge ──
    html += '<div class="factory-overview">';
    html += renderGauge(m.percentComplete, 'Overall Production', m.complete + ' / ' + m.total + ' deliverables');
    html += '<div class="factory-kpis">';
    html += renderKPI('Throughput', m.throughput + ' / day', 'Items completed per day');
    html += renderKPI('Elapsed', m.elapsedDays + ' days', 'Since project start');
    html += renderKPI('ETA', m.estDaysToComplete ? m.estDaysToComplete + ' days' : 'N/A', 'At current throughput');
    html += renderKPI('Current Batch', PHASE_NAMES[m.currentPhase] || m.currentPhase, 'Active ISA-88 procedure');
    html += '</div>';
    html += '</div>';

    // ── Batch Pipeline (Phase Conveyor) ──
    html += '<div class="factory-pipeline">';
    html += '<h3 class="factory-subtitle">Batch Pipeline <span class="factory-tag">ISA-88 Procedures</span></h3>';
    html += '<div class="factory-conveyor">';
    PHASE_ORDER.forEach(function (pid) {
      var bp = m.byPhase[pid] || { total: 0, byStatus: {} };
      var pct = bp.total > 0 ? Math.round(((bp.byStatus['complete'] || 0) / bp.total) * 100) : 0;
      var isCurrent = pid === m.currentPhase;
      html += '<div class="conveyor-station' + (isCurrent ? ' conveyor-active' : '') + '">';
      html += '  <div class="conveyor-label">' + (PHASE_NAMES[pid] || pid) + '</div>';
      html += '  <div class="conveyor-bar-bg"><div class="conveyor-bar-fill" style="width:' + pct + '%;background:' + (isCurrent ? 'var(--blue)' : 'var(--green)') + '"></div></div>';
      html += '  <div class="conveyor-stats">' + (bp.byStatus['complete'] || 0) + '/' + bp.total + ' (' + pct + '%)</div>';
      html += '</div>';
      if (pid !== PHASE_ORDER[PHASE_ORDER.length - 1]) {
        html += '<div class="conveyor-arrow">&#x25B6;</div>';
      }
    });
    html += '</div></div>';

    // ── Work Stations (Categories) ──
    html += '<div class="factory-stations">';
    html += '<h3 class="factory-subtitle">Work Stations <span class="factory-tag">ISA-88 Unit Procedures</span></h3>';
    html += '<div class="factory-station-grid">';
    (m.categories || []).forEach(function (cat) {
      var bc = m.byCategory[cat.id] || { total: 0, byStatus: {} };
      var pct = bc.total > 0 ? Math.round(((bc.byStatus['complete'] || 0) / bc.total) * 100) : 0;
      var running = bc.byStatus['in-progress'] || 0;
      var queued = bc.byStatus['not-started'] || 0;
      var done = bc.byStatus['complete'] || 0;

      html += '<div class="factory-station-card" style="border-top:3px solid ' + (cat.color || 'var(--border)') + '">';
      html += '  <div class="station-header">';
      html += '    <span class="station-icon">' + (cat.icon || '&#x2699;') + '</span>';
      html += '    <span class="station-name">' + cat.name + '</span>';
      html += '  </div>';
      html += '  <div class="station-bar-bg"><div class="station-bar-fill" style="width:' + pct + '%;background:' + (cat.color || 'var(--blue)') + '"></div></div>';
      html += '  <div class="station-metrics">';
      html += '    <span class="station-metric"><b>' + done + '</b> done</span>';
      html += '    <span class="station-metric"><b>' + running + '</b> active</span>';
      html += '    <span class="station-metric"><b>' + queued + '</b> queued</span>';
      html += '  </div>';
      html += renderStatusStrip(bc.byStatus, bc.total);
      html += '</div>';
    });
    html += '</div></div>';

    // ── ISA-88 State Distribution ──
    html += '<div class="factory-states">';
    html += '<h3 class="factory-subtitle">ISA-88 State Distribution <span class="factory-tag">Operations</span></h3>';
    html += '<div class="factory-state-bars">';
    Object.keys(STATES).forEach(function (s) {
      var st = STATES[s];
      var count = m.byStatus[s] || 0;
      var pct = m.total > 0 ? Math.round((count / m.total) * 100) : 0;
      html += '<div class="state-row">';
      html += '  <div class="state-label"><span class="state-dot" style="background:' + st.color + '"></span>' + st.isa + ' (' + st.label + ')</div>';
      html += '  <div class="state-bar-bg"><div class="state-bar-fill" style="width:' + pct + '%;background:' + st.color + '"></div></div>';
      html += '  <div class="state-count">' + count + '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    el.innerHTML = html;
  }

  /* ── Render Helpers ─────────────────────────────────────────────── */

  function renderGauge(pct, title, subtitle) {
    var circumference = 2 * Math.PI * 54;
    var offset = circumference - (pct / 100) * circumference;
    return '<div class="factory-gauge">' +
      '<svg viewBox="0 0 120 120" class="gauge-svg">' +
      '  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" stroke-width="8"/>' +
      '  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--green)" stroke-width="8"' +
      '    stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"' +
      '    stroke-linecap="round" transform="rotate(-90 60 60)" class="gauge-progress"/>' +
      '  <text x="60" y="56" text-anchor="middle" fill="var(--text)" font-size="22" font-weight="700">' + pct + '%</text>' +
      '  <text x="60" y="74" text-anchor="middle" fill="var(--text3)" font-size="8">' + title + '</text>' +
      '</svg>' +
      '<div class="gauge-subtitle">' + subtitle + '</div>' +
      '</div>';
  }

  function renderKPI(label, value, desc) {
    return '<div class="factory-kpi">' +
      '<div class="kpi-value">' + value + '</div>' +
      '<div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-desc">' + desc + '</div>' +
      '</div>';
  }

  function renderStatusStrip(byStatus, total) {
    if (!total) return '';
    var html = '<div class="station-strip">';
    Object.keys(STATES).forEach(function (s) {
      var count = byStatus[s] || 0;
      if (count > 0) {
        var pct = (count / total) * 100;
        html += '<div class="strip-seg" style="width:' + pct + '%;background:' + STATES[s].color + '" title="' + STATES[s].label + ': ' + count + '"></div>';
      }
    });
    html += '</div>';
    return html;
  }

  /* ── Public API ─────────────────────────────────────────────────── */

  window.AirTrekFactory = {
    load: loadData,
    metrics: function () { return metrics; },
    data: function () { return data; },
    render: render,
    STATES: STATES
  };

  /* ── Auto-init ──────────────────────────────────────────────────── */

  function init() {
    if (document.getElementById('factoryDashboard')) {
      loadData().then(render);
    }
  }

  document.addEventListener('templates-loaded', init);
  if (document.readyState !== 'loading') {
    setTimeout(init, 150);
  }

})();
