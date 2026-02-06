/* ============================================================
   AIRTREK — GitHub Repository Reader
   Browse and read public GitHub repos via the GitHub REST API
   No authentication required for public repositories
   ============================================================ */

(function () {
  'use strict';

  // --- Config ---
  var API_BASE = 'https://api.github.com';
  var CACHE = {};
  var CACHE_TTL = 300000; // 5 min

  // --- State ---
  var isOpen = false;
  var currentRepo = null;   // { owner, repo }
  var currentPath = '';
  var history = [];         // breadcrumb path history
  var fileContent = null;

  // --- DOM refs ---
  var panel, closeBtn, repoInput, loadBtn, statusEl;
  var breadcrumbEl, fileListEl, fileViewerEl, fileNameEl;
  var backBtn;

  // --- API helpers ---
  function apiGet(url, callback) {
    // Check cache
    var cached = CACHE[url];
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      callback(null, cached.data);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.onload = function () {
      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        CACHE[url] = { data: data, time: Date.now() };
        callback(null, data);
      } else if (xhr.status === 403) {
        callback(new Error('GitHub API rate limit reached. Wait a minute and try again.'));
      } else if (xhr.status === 404) {
        callback(new Error('Repository or path not found. Check the URL.'));
      } else {
        callback(new Error('GitHub API error: ' + xhr.status));
      }
    };
    xhr.onerror = function () {
      callback(new Error('Network error — check your connection.'));
    };
    xhr.send();
  }

  // --- Parse repo URL ---
  function parseRepoInput(input) {
    input = input.trim();
    // Handle full GitHub URLs
    var urlMatch = input.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (urlMatch) {
      return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
    }
    // Handle owner/repo format
    var slashMatch = input.match(/^([^/]+)\/([^/]+)$/);
    if (slashMatch) {
      return { owner: slashMatch[1], repo: slashMatch[2] };
    }
    return null;
  }

  // --- Load repo info ---
  function loadRepo(owner, repo) {
    currentRepo = { owner: owner, repo: repo };
    currentPath = '';
    history = [];
    setGHStatus('Loading repository...', 'loading');

    var url = API_BASE + '/repos/' + owner + '/' + repo;
    apiGet(url, function (err, data) {
      if (err) {
        setGHStatus(err.message, 'error');
        return;
      }

      setGHStatus(data.full_name + ' — ' + (data.description || 'No description'), 'ready');
      renderRepoHeader(data);
      loadContents('');
    });
  }

  // --- Load directory contents ---
  function loadContents(path) {
    currentPath = path;
    fileContent = null;
    showFileList();

    var url = API_BASE + '/repos/' + currentRepo.owner + '/' + currentRepo.repo +
      '/contents/' + path;

    fileListEl.innerHTML = '<div class="gh-loading">Loading...</div>';

    apiGet(url, function (err, data) {
      if (err) {
        fileListEl.innerHTML = '<div class="gh-error">' + escapeHtml(err.message) + '</div>';
        return;
      }

      // If it's a single file (API returns object not array)
      if (!Array.isArray(data)) {
        loadFileContent(data);
        return;
      }

      renderFileList(data, path);
      renderBreadcrumb(path);
    });
  }

  // --- Load single file ---
  function loadFileContent(fileData) {
    showFileViewer();
    fileNameEl.textContent = fileData.name;
    renderBreadcrumb(fileData.path || currentPath);

    if (fileData.encoding === 'base64' && fileData.content) {
      var decoded = decodeBase64(fileData.content);
      renderFileContent(fileData.name, decoded, fileData.size);
    } else if (fileData.download_url) {
      fileViewerEl.innerHTML = '<div class="gh-loading">Loading file...</div>';
      // Fetch raw content
      var xhr = new XMLHttpRequest();
      xhr.open('GET', fileData.download_url);
      xhr.onload = function () {
        if (xhr.status === 200) {
          renderFileContent(fileData.name, xhr.responseText, fileData.size);
        } else {
          fileViewerEl.innerHTML = '<div class="gh-error">Could not load file content</div>';
        }
      };
      xhr.onerror = function () {
        fileViewerEl.innerHTML = '<div class="gh-error">Network error loading file</div>';
      };
      xhr.send();
    }
  }

  function loadFilePath(path) {
    var url = API_BASE + '/repos/' + currentRepo.owner + '/' + currentRepo.repo +
      '/contents/' + path;

    showFileViewer();
    fileViewerEl.innerHTML = '<div class="gh-loading">Loading...</div>';

    apiGet(url, function (err, data) {
      if (err) {
        fileViewerEl.innerHTML = '<div class="gh-error">' + escapeHtml(err.message) + '</div>';
        return;
      }

      if (Array.isArray(data)) {
        // It's a directory
        currentPath = path;
        showFileList();
        renderFileList(data, path);
        renderBreadcrumb(path);
      } else {
        loadFileContent(data);
      }
    });
  }

  // --- Render functions ---
  function renderRepoHeader(repoData) {
    var existing = panel.querySelector('.gh-repo-header');
    if (existing) existing.remove();

    var header = document.createElement('div');
    header.className = 'gh-repo-header';
    header.innerHTML =
      '<div class="gh-repo-name">' + escapeHtml(repoData.full_name) + '</div>' +
      '<div class="gh-repo-meta">' +
        '<span class="gh-repo-stat">' + (repoData.stargazers_count || 0) + ' stars</span>' +
        '<span class="gh-repo-stat">' + (repoData.forks_count || 0) + ' forks</span>' +
        '<span class="gh-repo-stat">' + (repoData.language || 'Unknown') + '</span>' +
        '<span class="gh-repo-stat">' + (repoData.default_branch || 'main') + '</span>' +
      '</div>' +
      (repoData.description ? '<div class="gh-repo-desc">' + escapeHtml(repoData.description) + '</div>' : '');

    var body = panel.querySelector('.gh-body');
    body.insertBefore(header, body.firstChild);
  }

  function renderBreadcrumb(path) {
    if (!breadcrumbEl) return;
    breadcrumbEl.innerHTML = '';

    // Root
    var rootCrumb = document.createElement('span');
    rootCrumb.className = 'gh-crumb';
    rootCrumb.textContent = currentRepo ? currentRepo.repo : 'root';
    rootCrumb.addEventListener('click', function () { loadContents(''); });
    breadcrumbEl.appendChild(rootCrumb);

    if (!path) return;

    var parts = path.split('/');
    var accumulated = '';
    parts.forEach(function (part, i) {
      var sep = document.createElement('span');
      sep.className = 'gh-crumb-sep';
      sep.textContent = '/';
      breadcrumbEl.appendChild(sep);

      accumulated += (i > 0 ? '/' : '') + part;
      var crumb = document.createElement('span');
      crumb.className = 'gh-crumb' + (i === parts.length - 1 ? ' current' : '');
      crumb.textContent = part;

      var pathCopy = accumulated;
      if (i < parts.length - 1) {
        crumb.addEventListener('click', function () { loadContents(pathCopy); });
      }
      breadcrumbEl.appendChild(crumb);
    });
  }

  function renderFileList(items, path) {
    fileListEl.innerHTML = '';

    // Sort: directories first, then files
    items.sort(function (a, b) {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });

    // Parent directory link
    if (path) {
      var parentPath = path.split('/').slice(0, -1).join('/');
      var parentRow = document.createElement('div');
      parentRow.className = 'gh-file-row';
      parentRow.innerHTML = '<span class="gh-file-icon dir">..</span>' +
        '<span class="gh-file-name">..</span>';
      parentRow.addEventListener('click', function () { loadContents(parentPath); });
      fileListEl.appendChild(parentRow);
    }

    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'gh-file-row';

      var isDir = item.type === 'dir';
      var icon = isDir ? 'dir' : getFileIcon(item.name);

      row.innerHTML =
        '<span class="gh-file-icon ' + icon + '">' + (isDir ? '\u{1F4C1}' : '\u{1F4C4}') + '</span>' +
        '<span class="gh-file-name">' + escapeHtml(item.name) + '</span>' +
        (item.size ? '<span class="gh-file-size">' + formatSize(item.size) + '</span>' : '');

      row.addEventListener('click', function () {
        if (isDir) {
          loadContents(item.path);
        } else {
          currentPath = item.path;
          renderBreadcrumb(item.path);
          loadFilePath(item.path);
        }
      });

      fileListEl.appendChild(row);
    });
  }

  function renderFileContent(filename, content, size) {
    fileViewerEl.innerHTML = '';

    var ext = filename.split('.').pop().toLowerCase();
    var isMarkdown = ext === 'md';
    var isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].indexOf(ext) !== -1;
    var isBinary = ['pdf', 'zip', 'tar', 'gz', 'exe', 'dll', 'woff', 'woff2', 'ttf', 'eot'].indexOf(ext) !== -1;

    // File info bar
    var infoBar = document.createElement('div');
    infoBar.className = 'gh-file-info';
    infoBar.innerHTML = '<span>' + escapeHtml(filename) + '</span>' +
      '<span>' + formatSize(size || content.length) + '</span>' +
      '<span>' + content.split('\n').length + ' lines</span>';
    fileViewerEl.appendChild(infoBar);

    if (isBinary) {
      var notice = document.createElement('div');
      notice.className = 'gh-binary-notice';
      notice.textContent = 'Binary file — cannot display preview.';
      fileViewerEl.appendChild(notice);
      return;
    }

    if (isImage) {
      var img = document.createElement('img');
      img.className = 'gh-image-preview';
      img.alt = filename;
      // Would need download_url for actual preview
      var notice2 = document.createElement('div');
      notice2.className = 'gh-binary-notice';
      notice2.textContent = 'Image file — use GitHub to view.';
      fileViewerEl.appendChild(notice2);
      return;
    }

    // Code/text content
    var pre = document.createElement('pre');
    pre.className = 'gh-code';

    var lines = content.split('\n');
    // Limit display for very large files
    var maxLines = 2000;
    var truncated = lines.length > maxLines;
    var displayLines = truncated ? lines.slice(0, maxLines) : lines;

    displayLines.forEach(function (line, i) {
      var lineEl = document.createElement('div');
      lineEl.className = 'gh-code-line';

      var num = document.createElement('span');
      num.className = 'gh-line-num';
      num.textContent = (i + 1).toString();

      var code = document.createElement('span');
      code.className = 'gh-line-code';
      code.textContent = line;

      lineEl.appendChild(num);
      lineEl.appendChild(code);
      pre.appendChild(lineEl);
    });

    if (truncated) {
      var note = document.createElement('div');
      note.className = 'gh-truncated';
      note.textContent = '... truncated (' + lines.length + ' total lines, showing first ' + maxLines + ')';
      pre.appendChild(note);
    }

    fileViewerEl.appendChild(pre);
  }

  // --- UI helpers ---
  function showFileList() {
    if (fileListEl) fileListEl.style.display = 'block';
    if (fileViewerEl) fileViewerEl.style.display = 'none';
  }

  function showFileViewer() {
    if (fileListEl) fileListEl.style.display = 'none';
    if (fileViewerEl) fileViewerEl.style.display = 'block';
  }

  function setGHStatus(text, type) {
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = 'gh-status ' + (type || '');
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function getFileIcon(name) {
    var ext = name.split('.').pop().toLowerCase();
    var map = {
      js: 'js', ts: 'js', jsx: 'js', tsx: 'js',
      py: 'py', rb: 'py', go: 'py',
      md: 'md', txt: 'md', rst: 'md',
      json: 'json', yaml: 'json', yml: 'json', toml: 'json',
      html: 'html', css: 'html', scss: 'html',
      sh: 'sh', bash: 'sh', zsh: 'sh'
    };
    return map[ext] || 'file';
  }

  function decodeBase64(str) {
    try {
      return decodeURIComponent(atob(str.replace(/\n/g, '')).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      try {
        return atob(str.replace(/\n/g, ''));
      } catch (e2) {
        return '[Could not decode file content]';
      }
    }
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // --- Init ---
  function init() {
    panel = document.getElementById('githubPanel');
    closeBtn = document.getElementById('githubClose');
    repoInput = document.getElementById('githubRepoInput');
    loadBtn = document.getElementById('githubLoadBtn');
    statusEl = document.getElementById('githubStatus');
    breadcrumbEl = document.getElementById('githubBreadcrumb');
    fileListEl = document.getElementById('githubFileList');
    fileViewerEl = document.getElementById('githubFileViewer');
    fileNameEl = document.getElementById('githubFileName');
    backBtn = document.getElementById('githubBack');

    if (!panel) return;

    var toggleBtn = document.getElementById('githubToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        isOpen = !isOpen;
        panel.classList.toggle('open', isOpen);
        if (isOpen && repoInput) repoInput.focus();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        isOpen = false;
        panel.classList.remove('open');
      });
    }

    if (loadBtn) {
      loadBtn.addEventListener('click', function () {
        var parsed = parseRepoInput(repoInput.value);
        if (parsed) {
          loadRepo(parsed.owner, parsed.repo);
        } else {
          setGHStatus('Enter a valid repo: owner/repo or GitHub URL', 'error');
        }
      });
    }

    if (repoInput) {
      repoInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (loadBtn) loadBtn.click();
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (fileViewerEl && fileViewerEl.style.display !== 'none') {
          // Go back to file list
          var parentPath = currentPath.split('/').slice(0, -1).join('/');
          loadContents(parentPath);
        } else if (currentPath) {
          var parent = currentPath.split('/').slice(0, -1).join('/');
          loadContents(parent);
        }
      });
    }

    // Pre-load this repo
    if (repoInput) {
      repoInput.value = 'teslasolar/AirTrekDeliverables';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
