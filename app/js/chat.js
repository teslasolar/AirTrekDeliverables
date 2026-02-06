/* ============================================================
   AIRTREK — WebLLM AI Chat Agent
   Provides project-aware chat using WebLLM or fallback
   ISA-88 SOP: Document assistance procedure
   ============================================================ */

(function () {
  'use strict';

  var chatWindow = document.getElementById('chatWindow');
  var chatToggle = document.getElementById('chatToggle');
  var chatClose = document.getElementById('chatClose');
  var chatMessages = document.getElementById('chatMessages');
  var chatInput = document.getElementById('chatInput');
  var chatSend = document.getElementById('chatSend');
  var chatStatus = document.getElementById('chatStatus');

  var engine = null;
  var isLoading = false;
  var useWebLLM = false;
  var projectData = null;

  // --- Load project data for context ---
  fetch('data/deliverables.json')
    .then(function (r) { return r.json(); })
    .then(function (d) { projectData = d; })
    .catch(function () { /* fallback */ });

  // --- Toggle chat ---
  chatToggle.addEventListener('click', function () {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      chatInput.focus();
      if (!engine && !isLoading) {
        initEngine();
      }
    }
  });

  chatClose.addEventListener('click', function () {
    chatWindow.classList.remove('open');
  });

  // --- Init WebLLM engine ---
  function initEngine() {
    setStatus('Checking WebLLM availability...', 'loading');

    // Try to load WebLLM from CDN
    if (typeof window.webllm !== 'undefined') {
      loadWebLLM();
    } else {
      var script = document.createElement('script');
      script.src = 'https://esm.run/@anthropic-ai/sdk';
      script.onload = function () { loadWebLLM(); };
      script.onerror = function () {
        setStatus('Using built-in knowledge base (no WebLLM)', 'ready');
        useWebLLM = false;
      };

      // Fallback: use built-in knowledge
      setStatus('Ready — using project knowledge base', 'ready');
      useWebLLM = false;
    }
  }

  function loadWebLLM() {
    // WebLLM integration point
    // When WebLLM is available, this initializes the local model
    setStatus('Ready — using project knowledge base', 'ready');
    useWebLLM = false;
  }

  // --- Send message ---
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    var text = chatInput.value.trim();
    if (!text || isLoading) return;

    appendMessage('user', text);
    chatInput.value = '';
    isLoading = true;
    chatSend.disabled = true;
    setStatus('Thinking...', 'loading');

    showTyping();

    // Process with delay for natural feel
    setTimeout(function () {
      var response = generateResponse(text);
      hideTyping();
      appendMessage('assistant', response);
      isLoading = false;
      chatSend.disabled = false;
      setStatus('Ready', 'ready');
    }, 600 + Math.random() * 800);
  }

  // --- Project-aware response generation ---
  function generateResponse(query) {
    if (!projectData) {
      return 'I\'m still loading project data. Please try again in a moment.';
    }

    var q = query.toLowerCase();
    var deliverables = projectData.deliverables;
    var categories = projectData.categories;
    var phases = projectData.phases;

    // Status / progress queries
    if (q.includes('status') || q.includes('progress') || q.includes('how far') || q.includes('completion')) {
      return buildStatusResponse();
    }

    // Phase queries
    if (q.includes('phase')) {
      return buildPhaseResponse(q);
    }

    // Category queries
    for (var i = 0; i < categories.length; i++) {
      if (q.includes(categories[i].name.toLowerCase()) || q.includes(categories[i].id.replace('-', ' '))) {
        return buildCategoryResponse(categories[i]);
      }
    }

    // Specific deliverable search
    var matched = deliverables.filter(function (d) {
      return d.title.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        (d.documentId && d.documentId.toLowerCase().includes(q));
    });
    if (matched.length > 0 && matched.length <= 5) {
      return buildDeliverableResponse(matched);
    }

    // Control narrative queries
    if (q.includes('control narrative') || q.includes('cn-') || q.includes('isa-88') || q.includes('narrative')) {
      return buildCNResponse();
    }

    // ISA queries
    if (q.includes('isa-95') || q.includes('isa 95') || q.includes('tag')) {
      return 'ISA-95 defines our tag hierarchy for monitoring. The AirTrek tag structure follows ISA-95 levels:\n\n' +
        '- AirTrek/Gateway/ — System state, uptime, connections\n' +
        '- AirTrek/Services/ — Each backend service (Triad, Voice, Song, etc.)\n' +
        '- AirTrek/Sessions/ — Active user sessions by tier\n' +
        '- AirTrek/Jobs/ — Chat, voice, song, and batch job queues\n' +
        '- AirTrek/Metrics/ — Requests, latency, credits, empathy scores\n' +
        '- AirTrek/Alarms/ — Service health and threshold alerts\n\n' +
        'See deliverable TA-008 for the complete tag hierarchy.';
    }

    // Trekcoin / economy queries
    if (q.includes('trekcoin') || q.includes('economy') || q.includes('credit') || q.includes('balance')) {
      return 'The Trekcoin economy is AirTrek\'s virtual currency system:\n\n' +
        '- Users get 10 Trekcoin on registration (welcome bonus)\n' +
        '- Chat queries cost 1-8 Trekcoin based on complexity level\n' +
        '- Voice synthesis costs 2 Trekcoin (Explorer+ tier)\n' +
        '- Song generation costs 8 Trekcoin (Explorer+ tier)\n' +
        '- Users earn Trekcoin through daily logins and milestones\n' +
        '- Each tier has a daily earning cap\n\n' +
        'Control narratives: CN-ECON-001 (Credit) and CN-ECON-002 (Debit)\n' +
        'Related deliverables: PD-006 (Economy Design), DEV-007 (Economy Service)';
    }

    // Kappa / empathy queries
    if (q.includes('kappa') || q.includes('empathy') || q.includes('score')) {
      return 'The Kappa (k) system measures empathetic engagement through 6 signals:\n\n' +
        '1. Question Depth — How thoughtfully users ask questions\n' +
        '2. Perspective Adoption — Ability to see from other viewpoints\n' +
        '3. Assumption Surfacing — Recognizing own biases\n' +
        '4. Engagement Duration — Time invested in conversations\n' +
        '5. Topic Exploration — Breadth of cultural curiosity\n' +
        '6. Emotional Resonance — Emotional connection to content\n\n' +
        'Formula: k_raw = sum(Si x Wi), smoothed with alpha=0.3\n' +
        'See deliverable PD-007 for the full system design.';
    }

    // Triad / AI engine queries
    if (q.includes('triad') || q.includes('agent') || q.includes('lambda') || q.includes('compositor')) {
      return 'The Triad Engine is AirTrek\'s core AI conversation system with 5 components:\n\n' +
        '- Epsilon (Router) — Routes queries to appropriate depth level (1-5)\n' +
        '- Lambda (Local) — The character voice, speaks as the cultural guide\n' +
        '- Mu (Guide) — The teacher, provides educational depth\n' +
        '- Nu (Mirror) — Reflects user\'s perspective back for growth\n' +
        '- Omega (Compositor) — Merges all agent outputs into coherent response\n\n' +
        'Level 1 uses Lambda only. Level 2 adds Mu. Level 3+ uses all three.\n' +
        'See CN-CHAT-001 for the full control narrative.';
    }

    // Architecture queries
    if (q.includes('architect') || q.includes('service') || q.includes('infrastructure')) {
      return 'AirTrek architecture (7 backend services + gateway):\n\n' +
        '- Triad Engine (port 8001) — AI conversation\n' +
        '- Voice Service (port 8002) — ElevenLabs TTS\n' +
        '- Song Service (port 8003) — Suno music generation\n' +
        '- Passport Service (port 8004) — User progress\n' +
        '- TrekCube (port 8005) — 3D spatial experience\n' +
        '- Compost (port 8006) — Wisdom DAO\n' +
        '- Cultural Packs (port 8007) — Content delivery\n\n' +
        'Data layer: Supabase (auth/users), Vector DB (embeddings), Blob Storage (media), Trekcoin Ledger.\n' +
        'See deliverable TA-001 for full architecture.';
    }

    // SOP queries
    if (q.includes('sop') || q.includes('procedure') || q.includes('standard')) {
      return 'AirTrek follows ISA-88/ISA-95 standards for documentation:\n\n' +
        'ISA-88 (Batch Control) defines our procedural model:\n' +
        '  Procedure > Unit Procedure > Operation > Phase > Step\n\n' +
        'ISA-95 (Enterprise Integration) defines our tag hierarchy and monitoring.\n\n' +
        'All deliverables are managed as SOPs (Standard Operating Procedures) with:\n' +
        '- Document IDs (e.g., CN-AIRTREK-001)\n' +
        '- Version control\n' +
        '- Approval workflows\n' +
        '- Revision history\n\n' +
        'See the deliverables/ folder structure for the complete SOP library.';
    }

    // Help / what can you do
    if (q.includes('help') || q.includes('what can') || q.includes('how do')) {
      return 'I can help with:\n\n' +
        '- Project status and progress ("What\'s the project status?")\n' +
        '- Phase details ("Tell me about Phase 2")\n' +
        '- Category overviews ("What\'s in Business & Strategy?")\n' +
        '- Specific deliverables ("What is TA-001?")\n' +
        '- Control narratives ("Explain the control narratives")\n' +
        '- ISA-88/ISA-95 standards ("What is ISA-95?")\n' +
        '- Trekcoin economy ("How does Trekcoin work?")\n' +
        '- Empathy system ("Explain kappa scoring")\n' +
        '- Triad Engine ("How does the AI work?")\n' +
        '- Architecture ("What services does AirTrek have?")\n\n' +
        'Try asking a specific question!';
    }

    // Dependencies
    if (q.includes('depend') || q.includes('blocked') || q.includes('blocking')) {
      return buildDependencyResponse();
    }

    // Priority / critical
    if (q.includes('critical') || q.includes('priority') || q.includes('urgent') || q.includes('important')) {
      return buildPriorityResponse();
    }

    // What to work on next
    if (q.includes('next') || q.includes('start') || q.includes('pick up') || q.includes('available')) {
      return buildNextTaskResponse();
    }

    // Generic search
    if (matched.length > 5) {
      return 'I found ' + matched.length + ' deliverables matching your query. Can you be more specific? Try asking about a specific category, phase, or deliverable ID.';
    }

    return 'I\'m not sure about that. Try asking about:\n' +
      '- Project status or progress\n' +
      '- Specific deliverables (by name or ID)\n' +
      '- Categories (Business, Product, Technical, etc.)\n' +
      '- Phases (Phase 1-4)\n' +
      '- ISA-88 control narratives\n' +
      '- Trekcoin economy or Kappa empathy system\n' +
      '- Architecture and services';
  }

  function buildStatusResponse() {
    var d = projectData.deliverables;
    var total = d.length;
    var complete = d.filter(function (x) { return x.status === 'complete'; }).length;
    var inProg = d.filter(function (x) { return x.status === 'in-progress'; }).length;
    var notStarted = d.filter(function (x) { return x.status === 'not-started'; }).length;
    var pct = Math.round((complete / total) * 100);

    return 'Project Status Summary:\n\n' +
      '- Total: ' + total + ' deliverables\n' +
      '- Complete: ' + complete + ' (' + pct + '%)\n' +
      '- In Progress: ' + inProg + '\n' +
      '- Not Started: ' + notStarted + '\n\n' +
      'Phase breakdown:\n' +
      projectData.phases.map(function (p) {
        var items = d.filter(function (x) { return x.phase === p.id; });
        var done = items.filter(function (x) { return x.status === 'complete'; }).length;
        return '  Phase ' + p.order + ' (' + p.name + '): ' + done + '/' + items.length;
      }).join('\n');
  }

  function buildPhaseResponse(q) {
    var phase = null;
    projectData.phases.forEach(function (p) {
      if (q.includes('phase ' + p.order) || q.includes(p.name.toLowerCase())) {
        phase = p;
      }
    });
    if (!phase) {
      return 'AirTrek has 4 phases:\n\n' +
        projectData.phases.map(function (p) {
          return 'Phase ' + p.order + ': ' + p.name + ' (target: ' + p.targetDate + ')\n  ' + p.description;
        }).join('\n\n');
    }

    var items = projectData.deliverables.filter(function (d) { return d.phase === phase.id; });
    var complete = items.filter(function (d) { return d.status === 'complete'; }).length;

    return 'Phase ' + phase.order + ': ' + phase.name + '\n' +
      'Target: ' + phase.targetDate + '\n' +
      phase.description + '\n\n' +
      'Deliverables: ' + items.length + ' (' + complete + ' complete)\n\n' +
      items.map(function (d) {
        return '  [' + d.status + '] ' + d.id + ' — ' + d.title;
      }).join('\n');
  }

  function buildCategoryResponse(cat) {
    var items = projectData.deliverables.filter(function (d) { return d.category === cat.id; });
    var complete = items.filter(function (d) { return d.status === 'complete'; }).length;

    return cat.name + '\n' + cat.description + '\n\n' +
      'Deliverables: ' + items.length + ' (' + complete + ' complete)\n' +
      'Audience: ' + cat.audience.join(', ') + '\n\n' +
      items.map(function (d) {
        return '  [' + d.status + '] ' + d.id + ' — ' + d.title;
      }).join('\n');
  }

  function buildDeliverableResponse(matched) {
    return matched.map(function (d) {
      var lines = d.id + ': ' + d.title + '\n';
      lines += 'Status: ' + d.status + ' | Priority: ' + d.priority + '\n';
      if (d.plainLanguage) lines += '\n' + d.plainLanguage + '\n';
      lines += '\n' + d.description;
      if (d.dependencies && d.dependencies.length > 0) {
        lines += '\n\nDepends on: ' + d.dependencies.join(', ');
      }
      return lines;
    }).join('\n\n---\n\n');
  }

  function buildCNResponse() {
    var cn = projectData.deliverables.find(function (d) { return d.id === 'TA-002'; });
    if (!cn || !cn.controlNarratives) {
      return 'Control narratives follow the ISA-88 procedural model. See CN-AIRTREK-001 for all 14 control narratives covering auth, chat, voice, song, economy, passport, operations, and exception handling.';
    }
    return 'AirTrek Control Narratives (CN-AIRTREK-001)\nISA-88 Compliant | 14 Procedures\n\n' +
      cn.controlNarratives.map(function (n) {
        return n.id + ' — ' + n.name + ' [' + n.trigger + ']';
      }).join('\n');
  }

  function buildDependencyResponse() {
    var blocked = projectData.deliverables.filter(function (d) {
      if (d.status === 'complete') return false;
      if (!d.dependencies || d.dependencies.length === 0) return false;
      return d.dependencies.some(function (depId) {
        var dep = projectData.deliverables.find(function (x) { return x.id === depId; });
        return dep && dep.status !== 'complete';
      });
    });
    if (blocked.length === 0) return 'No deliverables are currently blocked by unfinished dependencies.';

    return 'Deliverables with unfinished dependencies (' + blocked.length + '):\n\n' +
      blocked.slice(0, 10).map(function (d) {
        var unfinishedDeps = d.dependencies.filter(function (depId) {
          var dep = projectData.deliverables.find(function (x) { return x.id === depId; });
          return dep && dep.status !== 'complete';
        });
        return d.id + ' — ' + d.title + '\n  Waiting on: ' + unfinishedDeps.join(', ');
      }).join('\n\n');
  }

  function buildPriorityResponse() {
    var critical = projectData.deliverables.filter(function (d) {
      return d.priority === 'critical' && d.status !== 'complete';
    });
    return 'Critical priority deliverables (' + critical.length + ' remaining):\n\n' +
      critical.map(function (d) {
        return '  [' + d.status + '] ' + d.id + ' — ' + d.title;
      }).join('\n');
  }

  function buildNextTaskResponse() {
    var available = projectData.deliverables.filter(function (d) {
      if (d.status !== 'not-started') return false;
      if (!d.dependencies || d.dependencies.length === 0) return true;
      return d.dependencies.every(function (depId) {
        var dep = projectData.deliverables.find(function (x) { return x.id === depId; });
        return dep && dep.status === 'complete';
      });
    });

    // Sort by priority
    var order = { critical: 0, high: 1, medium: 2, low: 3 };
    available.sort(function (a, b) {
      return (order[a.priority] || 9) - (order[b.priority] || 9);
    });

    if (available.length === 0) return 'All tasks either have unfinished dependencies or are already in progress/complete.';

    return 'Available tasks with no blockers (' + available.length + '):\n' +
      'Sorted by priority:\n\n' +
      available.slice(0, 10).map(function (d) {
        return '  [' + d.priority + '] ' + d.id + ' — ' + d.title;
      }).join('\n') +
      (available.length > 10 ? '\n\n  ...and ' + (available.length - 10) + ' more' : '');
  }

  // --- UI Helpers ---
  function appendMessage(role, text) {
    var msg = document.createElement('div');
    msg.className = 'chat-msg ' + role;

    var label = document.createElement('div');
    label.className = 'chat-msg-label';
    label.textContent = role === 'user' ? 'You' : role === 'system' ? 'System' : 'AirTrek AI';

    var content = document.createElement('div');
    content.className = 'chat-msg-content';
    // Simple markdown-like formatting
    content.innerHTML = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    msg.appendChild(label);
    msg.appendChild(content);
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTyping() {
    var typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.id = 'chatTypingIndicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTyping() {
    var typing = document.getElementById('chatTypingIndicator');
    if (typing) typing.remove();
  }

  function setStatus(text, type) {
    chatStatus.textContent = text;
    chatStatus.className = 'chat-status ' + (type || '');
  }
})();
