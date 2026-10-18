/* Apply stored palette before the first paint. Light remains the default. */
(function () {
  'use strict';
  var key = 'mari-limar-theme';
  var root = document.documentElement;
  try { if (localStorage.getItem(key) === 'dark') root.dataset.mlTheme = 'dark'; } catch (_) {}
  function init() {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'ml-theme-toggle';
    button.setAttribute('aria-label', 'Тёмный фон сайта');
    var moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 13.3A8.6 8.6 0 0 1 10.7 3.5a8.6 8.6 0 1 0 9.8 9.8Z"/></svg>';
    var sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
    function render() {
      var dark = root.dataset.mlTheme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.innerHTML = (dark ? sun : moon) + '<span>' + (dark ? 'Светлый фон' : 'Тёмный фон') + '</span>';
      button.title = dark ? 'Включить светлый фон' : 'Включить тёмный фон';
    }
    button.addEventListener('click', function () {
      var theme = root.dataset.mlTheme === 'dark' ? 'light' : 'dark';
      root.dataset.mlTheme = theme;
      try { localStorage.setItem(key, theme); } catch (_) {}
      render();
    });
    window.addEventListener('storage', function (event) {
      if (event.key === key) { root.dataset.mlTheme = event.newValue === 'dark' ? 'dark' : 'light'; render(); }
    });
    render();
    document.body.appendChild(button);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
}());
