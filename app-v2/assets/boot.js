/* Starts the page: loads the catalog from the database when one is configured, then the page's own scripts in order.
 * Without configuration (assets/config.js left empty) or if the catalog can't be loaded, the built-in demo data is used,
 * so the page always opens.
 *   <script src="assets/config.js"></script>
 *   <script src="assets/boot.js" data-scripts="assets/data.js,v2.js"></script> */
(function () {
  var me = document.currentScript;
  var list = (me.getAttribute('data-scripts') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var cfg = window.DOABNO_CONFIG || {};

  function loadScripts() {
    var i = 0;
    (function next() {
      if (i >= list.length) return;
      var s = document.createElement('script');
      s.src = list[i++];
      s.onload = next;
      s.onerror = function () { console.error('Could not load ' + s.src); next(); };
      document.body.appendChild(s);
    })();
  }

  // A signed-in person's own token (saved by assets/account.js). Admins then also receive hidden products and paused stores;
  // everyone else gets the same public catalog as a visitor.
  function savedToken() {
    try {
      const s = JSON.parse(localStorage.getItem(window.DOABNO_AUTH_KEY || 'doabno.auth'));
      return s && s.access_token && s.expires_at - Date.now() > 30000 ? s.access_token : null;
    } catch (e) { return null; }
  }

  function fetchCatalog() {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 8000) : null;
    var req;
    if (cfg.supabaseUrl && cfg.anonKey) {
      // The database function get_catalog() returns the whole public catalog as one JSON document.
      req = fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/get_catalog', {
        method: 'POST',
        headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + (window.__CATALOG_AUTH ? savedToken() : cfg.anonKey), 'Content-Type': 'application/json' },
        body: '{}',
        signal: ctl ? ctl.signal : undefined
      });
    } else if (cfg.catalogUrl) {
      req = fetch(cfg.catalogUrl, { signal: ctl ? ctl.signal : undefined });
    } else {
      return Promise.resolve(null);
    }
    return req.then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      if (timer) clearTimeout(timer);
      if (!j || !Array.isArray(j.products) || !j.products.length) throw new Error('empty catalog');
      return j;
    }).catch(function (e) {
      if (timer) clearTimeout(timer);
      console.warn('Catalog not loaded (' + e.message + '). Showing demo data.');
      return null;
    });
  }

  window.__CATALOG_AUTH = !!savedToken();   // true when the catalog is requested with a signed-in token
  fetchCatalog().then(function (cat) {
    if (cat) window.__CATALOG = cat;
    loadScripts();
  });
})();
