/* ============================================================
   AIRTREK ENTERPRISE TASK TRACKER — Application Logic
   ============================================================ */

(function () {
  'use strict';

  // --- State ---
  let data = null;
  let currentView = 'dashboard';
  let currentCategory = null;
  let currentFilter = 'all';
  let searchQuery = '';
  let selectedDeliverable = null;

  // --- Icons (SVG-free, using simple Unicode/text) ---
  const ICONS = {
    briefcase: '\u{1F4BC}',
    palette: '\u{1F3A8}',
    cpu: '\u{1F4BB}',
    code: '\u{2699}',
    globe: '\u{1F30D}',
    settings: '\u{1F527}',
    shield: '\u{1F6E1}',
    'check-circle': '\u2714',
    dashboard: '\u{25A6}',
    list: '\u{2630}',
    kanban: '\u{25A3}',
    investor: '\u{1F4C8}',
    search: '\u{1F50D}',
    close: '\u2715',
    arrow: '\u2192',
    phase: '\u{25C9}'
  };

  // --- Category Colors ---
  const CATEGORY_COLORS = {
    'business-strategy': '#4F46E5',
    'product-design': '#7C3AED',
    'technical-architecture': '#0891B2',
    'development': '#059669',
    'content-cultural': '#D97706',
    'operations': '#DC2626',
    'legal-compliance': '#4338CA',
    'testing-quality': '#166534'
  };

  // --- Utility Functions ---
  function $(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function $$(selector, parent) {
    return Array.from((parent || document).querySelectorAll(selector));
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(function (entry) {
        var key = entry[0];
        var val = entry[1];
        if (key === 'className') node.className = val;
        else if (key === 'textContent') node.textContent = val;
        else if (key === 'innerHTML') node.innerHTML = val;
        else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), val);
        else if (key === 'style' && typeof val === 'object') Object.assign(node.style, val);
        else node.setAttribute(key, val);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child == null) return;
        if (typeof child === 'string') node.appendChild(document.createTextNode(child));
        else node.appendChild(child);
      });
    }
    return node;
  }

  function statusLabel(status) {
    var map = {
      'not-started': 'Not Started',
      'in-progress': 'In Progress',
      'complete': 'Complete',
      'on-hold': 'On Hold',
      'in-review': 'In Review'
    };
    return map[status] || status;
  }

  function statusColor(status) {
    var map = {
      'not-started': 'var(--status-not-started)',
      'in-progress': 'var(--status-in-progress)',
      'complete': 'var(--status-complete)',
      'on-hold': 'var(--status-on-hold)',
      'in-review': 'var(--status-in-review)'
    };
    return map[status] || 'var(--text-muted)';
  }

  function effortLabel(effort) {
    var map = { small: 'S', medium: 'M', large: 'L', xlarge: 'XL' };
    return map[effort] || effort;
  }

  function getCategoryForDeliverable(d) {
    return data.categories.find(function (c) { return c.id === d.category; });
  }

  function getDeliverableById(id) {
    return data.deliverables.find(function (d) { return d.id === id; });
  }

  function getPhaseById(id) {
    return data.phases.find(function (p) { return p.id === id; });
  }

  function getFilteredDeliverables() {
    var items = data.deliverables;
    if (currentCategory) {
      items = items.filter(function (d) { return d.category === currentCategory; });
    }
    if (currentFilter !== 'all') {
      items = items.filter(function (d) { return d.status === currentFilter; });
    }
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      items = items.filter(function (d) {
        return d.title.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          (d.plainLanguage && d.plainLanguage.toLowerCase().includes(q));
      });
    }
    return items;
  }

  function getStats() {
    var all = data.deliverables;
    return {
      total: all.length,
      notStarted: all.filter(function (d) { return d.status === 'not-started'; }).length,
      inProgress: all.filter(function (d) { return d.status === 'in-progress'; }).length,
      complete: all.filter(function (d) { return d.status === 'complete'; }).length,
      onHold: all.filter(function (d) { return d.status === 'on-hold'; }).length,
      inReview: all.filter(function (d) { return d.status === 'in-review'; }).length,
      critical: all.filter(function (d) { return d.priority === 'critical'; }).length
    };
  }

  function getCategoryStats(catId) {
    var items = data.deliverables.filter(function (d) { return d.category === catId; });
    return {
      total: items.length,
      complete: items.filter(function (d) { return d.status === 'complete'; }).length,
      inProgress: items.filter(function (d) { return d.status === 'in-progress'; }).length,
      notStarted: items.filter(function (d) { return d.status === 'not-started'; }).length
    };
  }

  function getPhaseStats(phaseId) {
    var items = data.deliverables.filter(function (d) { return d.phase === phaseId; });
    return {
      total: items.length,
      complete: items.filter(function (d) { return d.status === 'complete'; }).length,
      inProgress: items.filter(function (d) { return d.status === 'in-progress'; }).length
    };
  }

  // --- Render Functions ---

  function renderSidebar() {
    var sidebar = $('.sidebar');
    sidebar.innerHTML = '';

    // Views section
    var viewSection = el('div', { className: 'sidebar-section' }, [
      el('div', { className: 'sidebar-section-title', textContent: 'Views' })
    ]);

    var views = [
      { id: 'dashboard', icon: ICONS.dashboard, label: 'Dashboard' },
      { id: 'list', icon: ICONS.list, label: 'All Deliverables' },
      { id: 'kanban', icon: ICONS.kanban, label: 'Kanban Board' },
      { id: 'investor', icon: ICONS.investor, label: 'Investor View' }
    ];

    views.forEach(function (v) {
      var item = el('div', {
        className: 'sidebar-item' + (currentView === v.id && !currentCategory ? ' active' : ''),
        onClick: function () {
          currentView = v.id;
          currentCategory = null;
          render();
        }
      }, [
        el('span', { className: 'sidebar-icon', textContent: v.icon }),
        el('span', { textContent: v.label })
      ]);
      viewSection.appendChild(item);
    });

    sidebar.appendChild(viewSection);

    // Categories section
    var catSection = el('div', { className: 'sidebar-section' }, [
      el('div', { className: 'sidebar-section-title', textContent: 'Categories' })
    ]);

    data.categories.forEach(function (cat) {
      var stats = getCategoryStats(cat.id);
      var item = el('div', {
        className: 'sidebar-item' + (currentCategory === cat.id ? ' active' : ''),
        onClick: function () {
          currentCategory = cat.id;
          currentView = 'list';
          render();
        }
      }, [
        el('span', { className: 'sidebar-dot', style: { background: cat.color } }),
        el('span', { textContent: cat.name }),
        el('span', { className: 'count', textContent: stats.complete + '/' + stats.total })
      ]);
      catSection.appendChild(item);
    });

    sidebar.appendChild(catSection);

    // Phases section
    var phaseSection = el('div', { className: 'sidebar-section' }, [
      el('div', { className: 'sidebar-section-title', textContent: 'Phases' })
    ]);

    data.phases.forEach(function (phase) {
      var stats = getPhaseStats(phase.id);
      var item = el('div', {
        className: 'sidebar-item',
        onClick: function () {
          currentView = 'dashboard';
          currentCategory = null;
          render();
          // Scroll to phase
        }
      }, [
        el('span', { className: 'sidebar-icon', textContent: ICONS.phase }),
        el('span', { textContent: phase.name }),
        el('span', { className: 'count', textContent: stats.complete + '/' + stats.total })
      ]);
      phaseSection.appendChild(item);
    });

    sidebar.appendChild(phaseSection);
  }

  function renderViewToggle() {
    var toggle = $('.view-toggle');
    if (!toggle) return;
    var buttons = $$('button', toggle);
    buttons.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.view === currentView);
    });
  }

  function renderDashboard() {
    var main = $('.main-content');
    var stats = getStats();
    var pct = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

    main.innerHTML = '';

    // Header
    var header = el('div', { className: 'dashboard-header' }, [
      el('h1', { textContent: 'AirTrek Project Dashboard' }),
      el('p', { textContent: 'Empathy Through Cultural Exploration — ' + stats.total + ' deliverables across ' + data.categories.length + ' categories' })
    ]);
    main.appendChild(header);

    // Stats Grid
    var statsGrid = el('div', { className: 'stats-grid' }, [
      createStatCard('Total Deliverables', stats.total, 'across ' + data.phases.length + ' phases', 'var(--text-primary)'),
      createStatCard('Complete', stats.complete, pct + '% done', 'var(--accent-green)'),
      createStatCard('In Progress', stats.inProgress, 'actively being worked on', 'var(--accent-blue)'),
      createStatCard('Not Started', stats.notStarted, 'available to pick up', 'var(--text-muted)'),
      createStatCard('Critical Priority', stats.critical, 'must complete for launch', 'var(--accent-red)')
    ]);
    main.appendChild(statsGrid);

    // Overall Progress Bar
    var progressContainer = el('div', { className: 'progress-bar-container' }, [
      el('div', { className: 'progress-bar-label' }, [
        el('span', { textContent: 'Overall Progress' }),
        el('span', { textContent: stats.complete + ' of ' + stats.total + ' complete (' + pct + '%)' })
      ]),
      createProgressBar(stats)
    ]);
    main.appendChild(progressContainer);

    // Phase Timeline
    var phaseHeader = el('div', { className: 'section-header' }, [
      el('h2', { className: 'section-title', textContent: 'Project Phases' })
    ]);
    main.appendChild(phaseHeader);

    var phaseGrid = el('div', { className: 'phase-timeline' });
    data.phases.forEach(function (phase) {
      phaseGrid.appendChild(createPhaseCard(phase));
    });
    main.appendChild(phaseGrid);

    // Category Overview
    var catHeader = el('div', { className: 'section-header' }, [
      el('h2', { className: 'section-title', textContent: 'Categories' })
    ]);
    main.appendChild(catHeader);

    var catGrid = el('div', { className: 'category-grid' });
    data.categories.forEach(function (cat) {
      catGrid.appendChild(createCategoryCard(cat));
    });
    main.appendChild(catGrid);
  }

  function createStatCard(label, value, sub, color) {
    return el('div', { className: 'stat-card animate-in' }, [
      el('div', { className: 'stat-label', textContent: label }),
      el('div', { className: 'stat-value', style: { color: color }, textContent: String(value) }),
      el('div', { className: 'stat-sub', textContent: sub })
    ]);
  }

  function createProgressBar(stats) {
    var total = stats.total || 1;
    var bar = el('div', { className: 'progress-bar' });
    if (stats.complete > 0) {
      bar.appendChild(el('div', {
        className: 'progress-segment complete',
        style: { width: (stats.complete / total * 100) + '%' }
      }));
    }
    if (stats.inProgress > 0) {
      bar.appendChild(el('div', {
        className: 'progress-segment in-progress',
        style: { width: (stats.inProgress / total * 100) + '%' }
      }));
    }
    if (stats.inReview > 0) {
      bar.appendChild(el('div', {
        className: 'progress-segment in-review',
        style: { width: (stats.inReview / total * 100) + '%' }
      }));
    }
    return bar;
  }

  function createPhaseCard(phase) {
    var stats = getPhaseStats(phase.id);
    var pct = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

    return el('div', { className: 'phase-card animate-in' }, [
      el('div', { className: 'phase-number', textContent: 'Phase ' + phase.order }),
      el('div', { className: 'phase-name', textContent: phase.name }),
      el('div', { className: 'phase-desc', textContent: phase.description }),
      el('div', { className: 'phase-target', textContent: 'Target: ' + phase.targetDate }),
      el('div', { className: 'phase-progress' }, [
        el('div', { className: 'phase-progress-bar' }, [
          el('div', { className: 'phase-progress-fill', style: { width: pct + '%' } })
        ]),
        el('div', { className: 'phase-progress-text', textContent: stats.complete + '/' + stats.total + ' complete (' + pct + '%)' })
      ])
    ]);
  }

  function createCategoryCard(cat) {
    var stats = getCategoryStats(cat.id);
    var pct = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;
    var icon = ICONS[cat.icon] || cat.icon;

    var card = el('div', { className: 'category-card animate-in', onClick: function () {
      currentCategory = cat.id;
      currentView = 'list';
      render();
    } }, [
      el('div', { className: 'category-card-header' }, [
        el('div', { className: 'category-icon', style: { background: cat.color + '22', color: cat.color }, textContent: icon }),
        el('div', { className: 'category-title', textContent: cat.name })
      ]),
      el('div', { className: 'category-desc', textContent: cat.description }),
      el('div', { className: 'category-stats' }, [
        createCategoryStat(stats.complete, 'Complete', 'var(--accent-green)'),
        createCategoryStat(stats.inProgress, 'In Progress', 'var(--accent-blue)'),
        createCategoryStat(stats.notStarted, 'Not Started', 'var(--text-muted)')
      ]),
      el('div', { className: 'category-progress' }, [
        el('div', { className: 'category-progress-fill', style: { width: pct + '%', background: cat.color } })
      ]),
      el('div', { className: 'category-audience' },
        cat.audience.map(function (a) {
          return el('span', { className: 'audience-tag', textContent: a });
        })
      )
    ]);

    return card;
  }

  function createCategoryStat(count, label, color) {
    return el('span', { className: 'category-stat' }, [
      el('span', { className: 'dot', style: { background: color } }),
      el('span', { textContent: count + ' ' + label })
    ]);
  }

  // --- List View ---
  function renderList() {
    var main = $('.main-content');
    main.innerHTML = '';

    var catName = currentCategory
      ? data.categories.find(function (c) { return c.id === currentCategory; }).name
      : 'All Deliverables';

    var header = el('div', { className: 'section-header' }, [
      el('h2', { className: 'section-title', textContent: catName }),
      el('span', { className: 'section-count', textContent: getFilteredDeliverables().length + ' items' })
    ]);
    main.appendChild(header);

    // Filter bar
    var filterBar = el('div', { className: 'filter-bar' });
    var filters = [
      { id: 'all', label: 'All' },
      { id: 'not-started', label: 'Not Started' },
      { id: 'in-progress', label: 'In Progress' },
      { id: 'complete', label: 'Complete' },
      { id: 'on-hold', label: 'On Hold' },
      { id: 'in-review', label: 'In Review' }
    ];
    filters.forEach(function (f) {
      filterBar.appendChild(el('button', {
        className: 'filter-btn' + (currentFilter === f.id ? ' active' : ''),
        textContent: f.label,
        onClick: function () {
          currentFilter = f.id;
          render();
        }
      }));
    });
    main.appendChild(filterBar);

    // Table
    var items = getFilteredDeliverables();
    if (items.length === 0) {
      main.appendChild(el('div', { className: 'empty-state' }, [
        el('h3', { textContent: 'No deliverables match your filters' }),
        el('p', { textContent: 'Try changing the filter or search query.' })
      ]));
      return;
    }

    var table = el('table', { className: 'deliverable-table' });
    var thead = el('thead', null, [
      el('tr', null, [
        el('th', { textContent: 'ID' }),
        el('th', { textContent: 'Deliverable' }),
        el('th', { textContent: 'Category' }),
        el('th', { textContent: 'Status' }),
        el('th', { textContent: 'Priority' }),
        el('th', { textContent: 'Phase' }),
        el('th', { textContent: 'Effort' }),
        el('th', { textContent: 'Owner' })
      ])
    ]);
    table.appendChild(thead);

    var tbody = el('tbody');
    items.forEach(function (d) {
      var cat = getCategoryForDeliverable(d);
      var phase = getPhaseById(d.phase);
      var row = el('tr', { className: 'animate-in', onClick: function () { openDetail(d); } }, [
        el('td', null, [el('span', { className: 'deliverable-id', textContent: d.id })]),
        el('td', null, [
          el('div', { className: 'deliverable-title-cell' }, [
            el('div', { textContent: d.title }),
            el('div', { className: 'subtitle', textContent: d.plainLanguage ? d.plainLanguage.substring(0, 80) + '...' : '' })
          ])
        ]),
        el('td', null, [
          el('span', {
            style: { fontSize: '0.78rem', color: cat ? cat.color : 'inherit' },
            textContent: cat ? cat.name : ''
          })
        ]),
        el('td', null, [createStatusBadge(d.status)]),
        el('td', null, [el('span', { className: 'priority-badge ' + d.priority, textContent: d.priority })]),
        el('td', null, [el('span', { style: { fontSize: '0.8rem', color: 'var(--text-muted)' }, textContent: phase ? phase.name : '' })]),
        el('td', null, [el('span', { className: 'effort-badge', textContent: effortLabel(d.estimatedEffort) })]),
        el('td', null, [el('span', { style: { fontSize: '0.83rem', color: d.owner ? 'var(--text-primary)' : 'var(--text-muted)' }, textContent: d.owner || 'Unassigned' })])
      ]);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    main.appendChild(table);
  }

  function createStatusBadge(status) {
    return el('span', { className: 'status-badge ' + status }, [
      el('span', { className: 'dot' }),
      el('span', { textContent: statusLabel(status) })
    ]);
  }

  // --- Kanban View ---
  function renderKanban() {
    var main = $('.main-content');
    main.innerHTML = '';

    var header = el('div', { className: 'section-header' }, [
      el('h2', { className: 'section-title', textContent: 'Kanban Board' })
    ]);
    main.appendChild(header);

    var container = el('div', { className: 'kanban-container' });
    var columns = [
      { status: 'not-started', label: 'Not Started', color: 'var(--status-not-started)' },
      { status: 'in-progress', label: 'In Progress', color: 'var(--status-in-progress)' },
      { status: 'in-review', label: 'In Review', color: 'var(--status-in-review)' },
      { status: 'complete', label: 'Complete', color: 'var(--status-complete)' },
      { status: 'on-hold', label: 'On Hold', color: 'var(--status-on-hold)' }
    ];

    columns.forEach(function (col) {
      var items = data.deliverables.filter(function (d) { return d.status === col.status; });
      if (currentCategory) {
        items = items.filter(function (d) { return d.category === currentCategory; });
      }

      var column = el('div', { className: 'kanban-column' }, [
        el('div', { className: 'kanban-column-header' }, [
          el('span', { className: 'dot', style: { background: col.color } }),
          el('h3', { textContent: col.label }),
          el('span', { className: 'count', textContent: String(items.length) })
        ])
      ]);

      items.forEach(function (d) {
        var cat = getCategoryForDeliverable(d);
        column.appendChild(el('div', {
          className: 'kanban-card',
          onClick: function () { openDetail(d); }
        }, [
          el('div', { className: 'kanban-card-id', textContent: d.id }),
          el('div', { className: 'kanban-card-title', textContent: d.title }),
          el('div', { className: 'kanban-card-meta' }, [
            el('span', {
              className: 'kanban-card-category',
              style: { background: cat ? cat.color : 'var(--bg-accent)' },
              textContent: cat ? cat.name : ''
            }),
            el('span', { className: 'priority-badge ' + d.priority, textContent: d.priority })
          ])
        ]));
      });

      container.appendChild(column);
    });

    main.appendChild(container);
  }

  // --- Investor View ---
  function renderInvestor() {
    var main = $('.main-content');
    main.innerHTML = '';
    var stats = getStats();
    var pct = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

    // Hero
    var hero = el('div', { className: 'investor-hero animate-in' }, [
      el('h1', { textContent: 'AirTrek' }),
      el('p', { textContent: 'Empathy Through Cultural Exploration — AI-powered conversations that build cross-cultural understanding through travel, voice, and music.' })
    ]);
    main.appendChild(hero);

    // KPIs
    var kpiGrid = el('div', { className: 'investor-kpi-grid' }, [
      createInvestorKPI(pct + '%', 'Project Completion', 'var(--accent-green)'),
      createInvestorKPI(String(stats.total), 'Total Deliverables', 'var(--accent-blue)'),
      createInvestorKPI(String(data.phases.length), 'Development Phases', 'var(--accent-purple)'),
      createInvestorKPI(String(data.categories.length), 'Work Categories', 'var(--accent-orange)')
    ]);
    main.appendChild(kpiGrid);

    // Roadmap
    var roadmapSection = el('div', { className: 'investor-roadmap' }, [
      el('h2', { textContent: 'Development Roadmap' })
    ]);

    data.phases.forEach(function (phase, i) {
      var phaseStats = getPhaseStats(phase.id);
      var phasePct = phaseStats.total > 0 ? Math.round((phaseStats.complete / phaseStats.total) * 100) : 0;
      var isComplete = phasePct === 100;
      var isActive = phaseStats.inProgress > 0 || (phasePct > 0 && !isComplete);

      var dotClass = 'roadmap-dot';
      if (isComplete) dotClass += ' complete';
      else if (isActive) dotClass += ' active';

      var content = el('div', { className: 'roadmap-content animate-in' }, [
        el('h3', { textContent: 'Phase ' + phase.order + ': ' + phase.name }),
        el('p', { textContent: phase.description }),
        el('div', { className: 'date', textContent: 'Target: ' + phase.targetDate + ' | ' + phaseStats.complete + '/' + phaseStats.total + ' deliverables complete (' + phasePct + '%)' }),
        el('div', { style: { marginTop: '10px' } }, [
          el('div', { className: 'phase-progress-bar', style: { height: '6px', background: 'var(--bg-accent)', borderRadius: '3px', overflow: 'hidden' } }, [
            el('div', { style: { height: '100%', width: phasePct + '%', background: isComplete ? 'var(--accent-green)' : 'var(--accent-blue)', borderRadius: '3px', transition: 'width 0.5s ease' } })
          ])
        ])
      ]);

      var marker = el('div', { className: 'roadmap-marker' }, [
        el('div', { className: dotClass })
      ]);
      if (i < data.phases.length - 1) {
        marker.appendChild(el('div', { className: 'roadmap-line' }));
      }

      roadmapSection.appendChild(el('div', { className: 'roadmap-phase' }, [marker, content]));
    });

    main.appendChild(roadmapSection);

    // Key Deliverable Categories for investors
    var investorCats = data.categories.filter(function (c) {
      return c.audience.indexOf('investors') !== -1;
    });

    var catSection = el('div', null, [
      el('h2', { style: { fontSize: '1.3rem', fontWeight: '600', marginBottom: '20px' }, textContent: 'Key Areas for Investors' })
    ]);

    var catGrid = el('div', { className: 'category-grid' });
    investorCats.forEach(function (cat) {
      catGrid.appendChild(createCategoryCard(cat));
    });
    catSection.appendChild(catGrid);
    main.appendChild(catSection);

    // Platform Overview
    var platformSection = el('div', { style: { marginTop: '32px' } }, [
      el('h2', { style: { fontSize: '1.3rem', fontWeight: '600', marginBottom: '20px' }, textContent: 'Platform Components' }),
      createPlatformTable()
    ]);
    main.appendChild(platformSection);
  }

  function createInvestorKPI(value, label, color) {
    return el('div', { className: 'investor-kpi animate-in' }, [
      el('div', { className: 'value', style: { color: color }, textContent: value }),
      el('div', { className: 'label', textContent: label })
    ]);
  }

  function createPlatformTable() {
    var services = [
      { name: 'Triad Engine', desc: 'AI conversation system with three specialized agents', status: 'Planned' },
      { name: 'Voice Service', desc: 'Character voice synthesis via ElevenLabs', status: 'Planned' },
      { name: 'Song Service', desc: 'AI-generated songs from emotional arcs via Suno', status: 'Planned' },
      { name: 'Passport System', desc: 'User progress, journeys, and milestones', status: 'Planned' },
      { name: 'Trekcoin Economy', desc: 'Virtual currency earn/spend system', status: 'Planned' },
      { name: 'TrekCube', desc: '3D spatial exploration and VR-ready experience', status: 'Planned' },
      { name: 'Cultural Packs', desc: 'Loadable destination content packages', status: 'Planned' }
    ];

    var table = el('table', { className: 'deliverable-table' });
    table.appendChild(el('thead', null, [
      el('tr', null, [
        el('th', { textContent: 'Component' }),
        el('th', { textContent: 'Description' }),
        el('th', { textContent: 'Status' })
      ])
    ]));

    var tbody = el('tbody');
    services.forEach(function (s) {
      tbody.appendChild(el('tr', null, [
        el('td', { style: { fontWeight: '500' }, textContent: s.name }),
        el('td', { style: { color: 'var(--text-secondary)', fontSize: '0.87rem' }, textContent: s.desc }),
        el('td', null, [createStatusBadge('not-started')])
      ]));
    });
    table.appendChild(tbody);
    return table;
  }

  // --- Detail Panel ---
  function openDetail(d) {
    selectedDeliverable = d;
    renderDetail();
    $('.detail-overlay').classList.add('open');
    $('.detail-panel').classList.add('open');
  }

  function closeDetail() {
    $('.detail-overlay').classList.remove('open');
    $('.detail-panel').classList.remove('open');
    selectedDeliverable = null;
  }

  function renderDetail() {
    var d = selectedDeliverable;
    if (!d) return;

    var body = $('.detail-body');
    body.innerHTML = '';
    var cat = getCategoryForDeliverable(d);
    var phase = getPhaseById(d.phase);

    // Title
    var titleEl = $('.detail-title');
    titleEl.textContent = d.title;
    var idEl = $('.detail-id');
    idEl.textContent = d.documentId || d.id;

    // Meta grid
    var metaGrid = el('div', { className: 'detail-meta-grid' }, [
      createMetaItem('Status', createStatusBadge(d.status)),
      createMetaItem('Priority', el('span', { className: 'priority-badge ' + d.priority, textContent: d.priority })),
      createMetaItem('Category', el('span', { style: { color: cat ? cat.color : '', fontSize: '0.87rem' }, textContent: cat ? cat.name : '' })),
      createMetaItem('Phase', el('span', { style: { fontSize: '0.87rem' }, textContent: phase ? 'Phase ' + phase.order + ': ' + phase.name : '' })),
      createMetaItem('Effort', el('span', { style: { fontSize: '0.87rem' }, textContent: d.estimatedEffort ? d.estimatedEffort.charAt(0).toUpperCase() + d.estimatedEffort.slice(1) : '' })),
      createMetaItem('Owner', el('span', { style: { fontSize: '0.87rem', color: d.owner ? 'var(--text-primary)' : 'var(--text-muted)' }, textContent: d.owner || 'Unassigned' }))
    ]);
    body.appendChild(el('div', { className: 'detail-section' }, [metaGrid]));

    // Plain Language
    if (d.plainLanguage) {
      body.appendChild(el('div', { className: 'detail-section' }, [
        el('div', { className: 'detail-plain-language', textContent: d.plainLanguage })
      ]));
    }

    // Description
    body.appendChild(el('div', { className: 'detail-section' }, [
      el('div', { className: 'detail-section-title', textContent: 'Technical Description' }),
      el('div', { className: 'detail-description', textContent: d.description })
    ]));

    // Dependencies
    if (d.dependencies && d.dependencies.length > 0) {
      var depsSection = el('div', { className: 'detail-section' }, [
        el('div', { className: 'detail-section-title', textContent: 'Dependencies (' + d.dependencies.length + ')' })
      ]);
      d.dependencies.forEach(function (depId) {
        var dep = getDeliverableById(depId);
        if (dep) {
          depsSection.appendChild(el('div', {
            className: 'detail-dependency',
            onClick: function () { openDetail(dep); }
          }, [
            el('span', { className: 'dep-status', style: { background: statusColor(dep.status) } }),
            el('span', { style: { fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }, textContent: dep.id }),
            el('span', { textContent: dep.title }),
            el('span', { style: { marginLeft: 'auto' } }, [createStatusBadge(dep.status)])
          ]));
        }
      });
      body.appendChild(depsSection);
    }

    // Control Narratives (if applicable)
    if (d.controlNarratives && d.controlNarratives.length > 0) {
      var cnSection = el('div', { className: 'detail-section' }, [
        el('div', { className: 'detail-section-title', textContent: 'Control Narratives (ISA-88) — ' + d.controlNarratives.length + ' procedures' }),
        el('div', { className: 'cn-list' })
      ]);
      var cnList = $('.cn-list', cnSection);
      d.controlNarratives.forEach(function (cn) {
        cnList.appendChild(el('div', { className: 'cn-item' }, [
          el('span', { className: 'cn-item-id', textContent: cn.id }),
          el('span', { className: 'cn-item-name', textContent: cn.name }),
          el('span', { className: 'cn-item-trigger', textContent: cn.trigger })
        ]));
      });
      body.appendChild(cnSection);
    }

    // Related narratives
    if (d.relatedNarratives && d.relatedNarratives.length > 0) {
      body.appendChild(el('div', { className: 'detail-section' }, [
        el('div', { className: 'detail-section-title', textContent: 'Related Control Narratives' }),
        el('div', { className: 'detail-tags' },
          d.relatedNarratives.map(function (cn) {
            return el('span', { className: 'detail-tag', style: { color: 'var(--accent-cyan)' }, textContent: cn });
          })
        )
      ]));
    }

    // Tags
    if (d.tags && d.tags.length > 0) {
      body.appendChild(el('div', { className: 'detail-section' }, [
        el('div', { className: 'detail-section-title', textContent: 'Tags' }),
        el('div', { className: 'detail-tags' },
          d.tags.map(function (tag) {
            return el('span', { className: 'detail-tag', textContent: tag });
          })
        )
      ]));
    }

    // File location
    if (cat) {
      body.appendChild(el('div', { className: 'detail-section' }, [
        el('div', { className: 'detail-section-title', textContent: 'File Location' }),
        el('div', {
          style: { fontFamily: 'var(--font-mono)', fontSize: '0.83rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
          textContent: 'deliverables/' + cat.folder + '/'
        })
      ]));
    }
  }

  function createMetaItem(label, content) {
    var item = el('div', { className: 'detail-meta-item' }, [
      el('label', { textContent: label })
    ]);
    if (typeof content === 'string') {
      item.appendChild(el('span', { textContent: content }));
    } else {
      item.appendChild(content);
    }
    return item;
  }

  // --- Main Render ---
  function render() {
    renderSidebar();
    renderViewToggle();

    switch (currentView) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'list':
        renderList();
        break;
      case 'kanban':
        renderKanban();
        break;
      case 'investor':
        renderInvestor();
        break;
      default:
        renderDashboard();
    }
  }

  // --- Init ---
  function init() {
    // Load data
    fetch('data/deliverables.json')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        data = json;
        render();
      })
      .catch(function () {
        // Fallback: try loading from embedded script tag
        var scriptEl = document.getElementById('deliverables-data');
        if (scriptEl) {
          data = JSON.parse(scriptEl.textContent);
          render();
        }
      });

    // View toggle buttons
    document.addEventListener('click', function (e) {
      if (e.target.closest('.view-toggle button')) {
        var btn = e.target.closest('.view-toggle button');
        currentView = btn.dataset.view;
        currentCategory = null;
        render();
      }
    });

    // Search
    var searchInput = $('.topbar-search');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        searchQuery = e.target.value;
        if (currentView === 'dashboard') {
          currentView = 'list';
          currentCategory = null;
        }
        render();
      });
    }

    // Detail panel close
    var overlay = $('.detail-overlay');
    if (overlay) overlay.addEventListener('click', closeDetail);

    var closeBtn = $('.detail-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDetail);

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDetail();
    });
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
