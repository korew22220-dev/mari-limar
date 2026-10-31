(function () {
  'use strict';
  var dialog = document.querySelector('[data-model-lightbox]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var track = dialog.querySelector('.ml-photo-viewer-track');
  var counter = dialog.querySelector('.ml-photo-viewer-counter');
  var title = dialog.querySelector('.ml-photo-viewer-title');
  var close = dialog.querySelector('.ml-photo-viewer-close');
  var links = [], thumbs = [], selected = 0, previousOverflow = '', frame = 0;

  function update(index) {
    selected = index;
    counter.textContent = (index + 1) + ' / ' + links.length;
  }
  function go(index) {
    var target = (index + links.length) % links.length;
    track.scrollTo({ left: target * track.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    update(target);
  }
  function open(carousel, index) {
    links = Array.from(carousel.querySelectorAll('.wd-carousel-slide .wd-photo-link'));
    thumbs = Array.from(carousel.querySelectorAll('[data-wd-slide]'));
    track.replaceChildren();
    links.forEach(function (link, i) {
      var source = link.querySelector('img');
      var slide = document.createElement('figure');
      slide.className = 'ml-photo-viewer-slide';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-label', (i + 1) + ' из ' + links.length);
      var image = document.createElement('img');
      image.src = link.href;
      image.alt = source.alt;
      image.loading = i === index ? 'eager' : 'lazy';
      image.decoding = 'async';
      slide.appendChild(image);
      track.appendChild(slide);
    });
    title.textContent = carousel.getAttribute('aria-label') || 'Фотографии';
    update(index);
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    track.scrollTo({ left: index * track.clientWidth, behavior: 'instant' });
    close.focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-wd-carousel]').forEach(function (carousel) {
    carousel.querySelectorAll('.wd-carousel-slide .wd-photo-link').forEach(function (link, index) {
      link.addEventListener('click', function (event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
        event.preventDefault();
        open(carousel, index);
      });
    });
  });
  close.addEventListener('click', function () { dialog.close(); });
  dialog.querySelector('.ml-photo-viewer-prev').addEventListener('click', function () { go(selected - 1); });
  dialog.querySelector('.ml-photo-viewer-next').addEventListener('click', function () { go(selected + 1); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(selected - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); go(selected + 1); }
    else if (event.key === 'Home') { event.preventDefault(); go(0); }
    else if (event.key === 'End') { event.preventDefault(); go(links.length - 1); }
    // Escape is handled by the native modal dialog.
  });
  track.addEventListener('scroll', function () {
    if (frame || !dialog.open) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      if (dialog.open && track.clientWidth) update(Math.max(0, Math.min(links.length - 1, Math.round(track.scrollLeft / track.clientWidth))));
    });
  }, { passive: true });
  window.addEventListener('resize', function () {
    if (dialog.open) track.scrollTo({ left: selected * track.clientWidth, behavior: 'instant' });
  });
  dialog.addEventListener('close', function () {
    document.body.style.overflow = previousOverflow;
    if (thumbs[selected]) thumbs[selected].click();
    if (links[selected]) links[selected].focus({ preventScroll: true });
  });
  window.addEventListener('pagehide', function () { if (dialog.open) dialog.close(); });
}());
