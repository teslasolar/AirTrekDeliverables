/* ============================================================
   AIRTREK — Collaborative Global Chat (WebRTC + BroadcastChannel)
   P2P real-time team communication for project coordination
   ============================================================ */

(function () {
  'use strict';

  // --- Config ---
  var ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // --- State ---
  var peers = {};           // peerId -> { conn, channel, name }
  var localId = generateId();
  var localName = 'User-' + localId.slice(0, 4);
  var broadcastChannel = null;
  var messages = [];
  var isOpen = false;
  var onlineUsers = {};     // id -> { name, lastSeen }

  // --- DOM ---
  var panel, msgList, msgInput, sendBtn, statusEl, userList, nameInput;
  var roomCodeInput, roomCreateBtn, roomJoinBtn, roomDisplay;
  var peerConnArea, offerArea, answerArea;

  // --- Utilities ---
  function generateId() {
    return Math.random().toString(36).slice(2, 10);
  }

  function timestamp() {
    var d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0');
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // --- BroadcastChannel (same-origin tab-to-tab) ---
  function initBroadcast() {
    if (!window.BroadcastChannel) return;
    broadcastChannel = new BroadcastChannel('airtrek-collab');

    broadcastChannel.onmessage = function (e) {
      handleIncoming(e.data);
    };

    // Announce presence
    broadcastSend({
      type: 'presence',
      id: localId,
      name: localName,
      timestamp: Date.now()
    });

    // Heartbeat
    setInterval(function () {
      broadcastSend({
        type: 'presence',
        id: localId,
        name: localName,
        timestamp: Date.now()
      });
      // Prune stale users (no heartbeat in 15s)
      var now = Date.now();
      Object.keys(onlineUsers).forEach(function (uid) {
        if (now - onlineUsers[uid].lastSeen > 15000) {
          delete onlineUsers[uid];
        }
      });
      renderUsers();
    }, 5000);
  }

  function broadcastSend(data) {
    if (broadcastChannel) {
      broadcastChannel.postMessage(data);
    }
  }

  // --- WebRTC P2P Connection ---
  function createPeerConnection(peerId) {
    var pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = function (e) {
      // ICE candidates are gathered automatically
    };

    pc.ondatachannel = function (e) {
      var ch = e.channel;
      setupDataChannel(peerId, ch);
    };

    pc.onconnectionstatechange = function () {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removePeer(peerId);
      }
    };

    peers[peerId] = { conn: pc, channel: null, name: 'Peer-' + peerId.slice(0, 4) };
    return pc;
  }

  function setupDataChannel(peerId, channel) {
    channel.onopen = function () {
      if (peers[peerId]) peers[peerId].channel = channel;
      // Send identity
      channel.send(JSON.stringify({
        type: 'identity',
        id: localId,
        name: localName
      }));
      setCollabStatus('Connected to peer', 'ready');
      renderUsers();
    };

    channel.onmessage = function (e) {
      try {
        var data = JSON.parse(e.data);
        handleIncoming(data);
      } catch (err) { /* ignore malformed */ }
    };

    channel.onclose = function () {
      removePeer(peerId);
    };
  }

  function removePeer(peerId) {
    if (peers[peerId]) {
      if (peers[peerId].conn) peers[peerId].conn.close();
      delete peers[peerId];
      delete onlineUsers[peerId];
      renderUsers();
    }
  }

  // Create offer (initiator)
  function createRoom() {
    var peerId = 'room-' + generateId();
    var pc = createPeerConnection(peerId);
    var channel = pc.createDataChannel('airtrek-collab');
    setupDataChannel(peerId, channel);

    pc.createOffer().then(function (offer) {
      return pc.setLocalDescription(offer);
    }).then(function () {
      // Wait for ICE gathering
      return new Promise(function (resolve) {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = function () {
            if (pc.iceGatheringState === 'complete') resolve();
          };
          // Timeout fallback
          setTimeout(resolve, 3000);
        }
      });
    }).then(function () {
      var offer = btoa(JSON.stringify(pc.localDescription));
      if (offerArea) {
        offerArea.value = offer;
        offerArea.style.display = 'block';
        offerArea.select();
      }
      setCollabStatus('Room created — share the offer code', 'ready');
    });
  }

  // Join with offer (joiner)
  function joinRoom(offerCode) {
    try {
      var offer = JSON.parse(atob(offerCode));
      var peerId = 'room-' + generateId();
      var pc = createPeerConnection(peerId);

      pc.setRemoteDescription(new RTCSessionDescription(offer)).then(function () {
        return pc.createAnswer();
      }).then(function (answer) {
        return pc.setLocalDescription(answer);
      }).then(function () {
        return new Promise(function (resolve) {
          if (pc.iceGatheringState === 'complete') {
            resolve();
          } else {
            pc.onicegatheringstatechange = function () {
              if (pc.iceGatheringState === 'complete') resolve();
            };
            setTimeout(resolve, 3000);
          }
        });
      }).then(function () {
        var answer = btoa(JSON.stringify(pc.localDescription));
        if (answerArea) {
          answerArea.value = answer;
          answerArea.style.display = 'block';
          answerArea.select();
        }
        setCollabStatus('Send the answer code back to the host', 'ready');
      });
    } catch (err) {
      setCollabStatus('Invalid offer code', 'error');
    }
  }

  // Host accepts answer
  function acceptAnswer(answerCode, peerId) {
    try {
      var answer = JSON.parse(atob(answerCode));
      // Find the peer connection waiting for answer
      var targetPeer = null;
      Object.keys(peers).forEach(function (pid) {
        if (peers[pid].conn && peers[pid].conn.signalingState === 'have-local-offer') {
          targetPeer = pid;
        }
      });
      if (targetPeer && peers[targetPeer]) {
        peers[targetPeer].conn.setRemoteDescription(new RTCSessionDescription(answer));
        setCollabStatus('Peer connected!', 'ready');
      }
    } catch (err) {
      setCollabStatus('Invalid answer code', 'error');
    }
  }

  // --- Message Handling ---
  function handleIncoming(data) {
    if (!data || !data.type) return;
    if (data.id === localId) return; // ignore own messages from broadcast

    switch (data.type) {
      case 'message':
        addMessage(data.name || 'Unknown', data.text, 'peer', data.id);
        break;
      case 'presence':
        onlineUsers[data.id] = { name: data.name, lastSeen: Date.now() };
        renderUsers();
        break;
      case 'identity':
        if (data.id && peers[data.id]) {
          peers[data.id].name = data.name;
        }
        onlineUsers[data.id] = { name: data.name, lastSeen: Date.now() };
        renderUsers();
        break;
      case 'system':
        addMessage('System', data.text, 'system');
        break;
    }
  }

  function sendMessage() {
    var text = msgInput.value.trim();
    if (!text) return;

    var msg = {
      type: 'message',
      id: localId,
      name: localName,
      text: text,
      timestamp: Date.now()
    };

    // Send via BroadcastChannel
    broadcastSend(msg);

    // Send via WebRTC data channels
    Object.keys(peers).forEach(function (pid) {
      var p = peers[pid];
      if (p.channel && p.channel.readyState === 'open') {
        p.channel.send(JSON.stringify(msg));
      }
    });

    addMessage(localName, text, 'self');
    msgInput.value = '';
    msgInput.focus();
  }

  function addMessage(name, text, type, senderId) {
    messages.push({ name: name, text: text, type: type, time: timestamp() });

    var msgEl = document.createElement('div');
    msgEl.className = 'collab-msg ' + (type || 'peer');

    var header = document.createElement('div');
    header.className = 'collab-msg-header';

    var nameSpan = document.createElement('span');
    nameSpan.className = 'collab-msg-name';
    nameSpan.textContent = name;

    var timeSpan = document.createElement('span');
    timeSpan.className = 'collab-msg-time';
    timeSpan.textContent = timestamp();

    header.appendChild(nameSpan);
    header.appendChild(timeSpan);

    var body = document.createElement('div');
    body.className = 'collab-msg-body';
    body.textContent = text;

    msgEl.appendChild(header);
    msgEl.appendChild(body);
    msgList.appendChild(msgEl);
    msgList.scrollTop = msgList.scrollHeight;
  }

  // --- UI Rendering ---
  function renderUsers() {
    if (!userList) return;
    userList.innerHTML = '';

    // Self
    var selfEl = document.createElement('div');
    selfEl.className = 'collab-user self';
    selfEl.innerHTML = '<span class="collab-user-dot online"></span>' +
      '<span>' + escapeHtml(localName) + ' (you)</span>';
    userList.appendChild(selfEl);

    // Others
    Object.keys(onlineUsers).forEach(function (uid) {
      var u = onlineUsers[uid];
      var el = document.createElement('div');
      el.className = 'collab-user';
      el.innerHTML = '<span class="collab-user-dot online"></span>' +
        '<span>' + escapeHtml(u.name) + '</span>';
      userList.appendChild(el);
    });
  }

  function setCollabStatus(text, type) {
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = 'collab-status ' + (type || '');
    }
  }

  // --- Panel Toggle ---
  function togglePanel() {
    isOpen = !isOpen;
    if (panel) panel.classList.toggle('open', isOpen);
  }

  // --- Init ---
  function init() {
    panel = document.getElementById('collabPanel');
    var toggleBtn = document.getElementById('collabToggle');
    var closeBtn = document.getElementById('collabClose');
    msgList = document.getElementById('collabMessages');
    msgInput = document.getElementById('collabInput');
    sendBtn = document.getElementById('collabSend');
    statusEl = document.getElementById('collabStatus');
    userList = document.getElementById('collabUsers');
    nameInput = document.getElementById('collabName');
    offerArea = document.getElementById('collabOffer');
    answerArea = document.getElementById('collabAnswer');

    if (!panel) return;

    // Toggle
    if (toggleBtn) toggleBtn.addEventListener('click', togglePanel);
    if (closeBtn) closeBtn.addEventListener('click', function () {
      isOpen = false;
      panel.classList.remove('open');
    });

    // Send
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (msgInput) msgInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Name change
    if (nameInput) {
      nameInput.value = localName;
      nameInput.addEventListener('change', function () {
        localName = nameInput.value.trim() || localName;
        broadcastSend({ type: 'presence', id: localId, name: localName, timestamp: Date.now() });
        renderUsers();
      });
    }

    // P2P buttons
    var createBtn = document.getElementById('collabCreate');
    var joinBtn = document.getElementById('collabJoin');
    var acceptBtn = document.getElementById('collabAccept');

    if (createBtn) createBtn.addEventListener('click', createRoom);
    if (joinBtn) joinBtn.addEventListener('click', function () {
      var code = offerArea ? offerArea.value.trim() : '';
      if (code) joinRoom(code);
    });
    if (acceptBtn) acceptBtn.addEventListener('click', function () {
      var code = answerArea ? answerArea.value.trim() : '';
      if (code) acceptAnswer(code);
    });

    // Tab switcher within collab panel
    var tabs = panel.querySelectorAll('.collab-tab');
    var tabPanes = panel.querySelectorAll('.collab-tab-pane');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tabPanes.forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var target = document.getElementById(tab.dataset.tab);
        if (target) target.classList.add('active');
      });
    });

    // Start broadcast channel
    initBroadcast();
    renderUsers();
    setCollabStatus('Local broadcast active', 'ready');

    addMessage('System',
      'Collab chat is live. Messages are shared across open tabs via BroadcastChannel. ' +
      'For cross-browser P2P, use the Connect tab to exchange WebRTC offer/answer codes.',
      'system');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
