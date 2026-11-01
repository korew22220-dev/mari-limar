(function () {
  'use strict';
  var header = document.querySelector('.head');
  var shade = document.querySelector('.ml-mega-shade');
  if (!header || !shade) return;
  var items = Array.from(header.querySelectorAll('[data-ml-mega]'));
  var active = null, closeTimer;
  function desktop() { return window.matchMedia('(min-width:1201px)').matches; }
  function cancelClose() { window.clearTimeout(closeTimer); }
  function close(restoreFocus) {
    cancelClose();
    if (!active) return;
    var button = active.querySelector('.ml-mega-toggle');
    active.querySelector('.ml-mega-panel').hidden = true;
    button.setAttribute('aria-expanded', 'false');
    active.classList.remove('ml-mega-active');
    active = null;
    header.classList.remove('ml-mega-open');
    shade.hidden = true;
    if (restoreFocus) button.focus({ preventScroll: true });
  }
  function open(item) {
    cancelClose();
    if (!desktop() || active === item) return;
    close(false);
    active = item;
    item.querySelector('.ml-mega-panel').hidden = false;
    item.querySelector('.ml-mega-toggle').setAttribute('aria-expanded', 'true');
    item.classList.add('ml-mega-active');
    header.classList.add('ml-mega-open');
    shade.hidden = false;
  }
  function scheduleClose() { cancelClose(); closeTimer = window.setTimeout(function () { close(false); }, 180); }
  items.forEach(function (item) {
    var toggle = item.querySelector('.ml-mega-toggle');
    toggle.hidden = false;
    item.addEventListener('pointerenter', function () {
      if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) open(item);
    });
    item.addEventListener('pointerleave', scheduleClose);
    item.addEventListener('focusin', function (event) { if (event.target !== toggle) open(item); });
    item.addEventListener('focusout', function (event) {
      if (!item.contains(event.relatedTarget)) scheduleClose();
    });
    toggle.addEventListener('click', function () {
      if (active === item) close(false); else open(item);
    });
    toggle.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault(); open(item);
        item.querySelector('.ml-mega-panel a').focus();
      }
    });
  });
  header.classList.add('ml-mega-ready');
  shade.addEventListener('pointerenter', scheduleClose);
  shade.addEventListener('click', function () { close(false); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && active) { event.preventDefault(); close(true); }
  });
  document.addEventListener('click', function (event) {
    if (active && (!header.contains(event.target) || event.target.closest('a[href]'))) close(false);
  });
  document.addEventListener('focusin', function (event) {
    if (active && !header.contains(event.target)) close(false);
  });
  var drawerButton = document.getElementById('open');
  if (drawerButton) drawerButton.addEventListener('click', function () { close(false); });
  window.addEventListener('resize', function () { close(false); });
  window.addEventListener('pagehide', function () { close(false); });
  // Native submenu links can land directly on the matching existing catalog filter.
  var params = new URLSearchParams(window.location.search);
  var collection = params.get('collection');
  if (collection === 'modern' || collection === 'classic') {
    var filter = document.querySelector('.catalog-tab[data-filter="' + collection + '"]');
    if (filter) filter.click();
  }
  var category = params.get('category');
  if (['architecture', 'interior', 'kitchen'].indexOf(category) !== -1) {
    var categoryButton = document.querySelector('#category-filters [data-category="' + category + '"]');
    if (categoryButton) categoryButton.click();
  }
}());
