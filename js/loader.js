/**
 * AirTrek Template Loader
 *
 * Loads HTML templates into slots defined by data-template attributes.
 * Works with static hosting (GitHub Pages) — no server-side rendering needed.
 *
 * Usage in index.html:
 *   <div data-template="templates/header.html"></div>
 *
 * Templates are plain HTML fragments — no special syntax required.
 * The loader fetches each template, injects it, and fires a
 * "templates-loaded" event on document when all are done.
 */
(function () {
  'use strict';

  var CACHE = {};

  /**
   * Fetch a template file with caching.
   * Returns the HTML string or an error comment.
   */
  function fetchTemplate(url) {
    if (CACHE[url]) {
      return Promise.resolve(CACHE[url]);
    }
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return res.text();
    }).then(function (html) {
      CACHE[url] = html;
      return html;
    }).catch(function (err) {
      console.warn('[loader] Failed to load template: ' + url, err);
      return '<!-- template load error: ' + url + ' -->';
    });
  }

  /**
   * Process all elements with data-template attributes.
   * Returns a promise that resolves when every template is injected.
   */
  function loadTemplates(root) {
    root = root || document;
    var slots = root.querySelectorAll('[data-template]');
    if (!slots.length) return Promise.resolve();

    var jobs = [];
    for (var i = 0; i < slots.length; i++) {
      (function (slot) {
        var url = slot.getAttribute('data-template');
        if (!url) return;
        jobs.push(
          fetchTemplate(url).then(function (html) {
            slot.innerHTML = html;
            slot.removeAttribute('data-template');
            slot.setAttribute('data-loaded', url);
            // Recursively load any nested templates
            return loadTemplates(slot);
          })
        );
      })(slots[i]);
    }

    return Promise.all(jobs);
  }

  /**
   * Initialize: load all templates then fire the ready event.
   */
  function init() {
    // Show body (it starts hidden to avoid FOUC)
    var loading = document.querySelector('.template-loading');

    loadTemplates().then(function () {
      if (loading) loading.remove();
      document.body.classList.add('loaded');
      document.dispatchEvent(new CustomEvent('templates-loaded'));
    });
  }

  // Public API for programmatic use
  window.AirTrekLoader = {
    load: loadTemplates,
    fetch: fetchTemplate,
    cache: CACHE
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
