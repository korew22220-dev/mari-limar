/* Load the native-scale provider widget only where it has enough room. */
(() => {
  'use strict';
  const desktop = window.matchMedia('(min-width:701px)');
  function loadMaps() {
    if (!desktop.matches) return;
    document.querySelectorAll('iframe[data-map-src]').forEach(frame => {
      if (!frame.hasAttribute('src')) frame.src = frame.dataset.mapSrc;
    });
  }
  desktop.addEventListener('change', loadMaps);
  loadMaps();
})();
