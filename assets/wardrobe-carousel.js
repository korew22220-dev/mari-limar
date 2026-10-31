(function () {
  'use strict';
  document.querySelectorAll('[data-wd-carousel]').forEach(function (carousel) {
    var track = carousel.querySelector('.wd-carousel-track');
    var slides = Array.from(track.children);
    var thumbs = Array.from(carousel.querySelectorAll('[data-wd-slide]'));
    var counter = carousel.querySelector('.wd-carousel-counter');
    var index = 0;
    var frame = 0;
    function update(next) {
      index = next;
      counter.textContent = (index + 1) + ' / ' + slides.length;
      thumbs.forEach(function (thumb, i) {
        if (i === index) thumb.setAttribute('aria-current', 'true');
        else thumb.removeAttribute('aria-current');
      });
      // Keep the selected preview visible without scrolling the page vertically.
      var active = thumbs[index];
      var strip = active.parentElement;
      if (active.offsetLeft < strip.scrollLeft) strip.scrollLeft = active.offsetLeft;
      else if (active.offsetLeft + active.offsetWidth > strip.scrollLeft + strip.clientWidth) {
        strip.scrollLeft = active.offsetLeft + active.offsetWidth - strip.clientWidth;
      }
    }
    function go(next) {
      var target = (next + slides.length) % slides.length;
      track.scrollTo({
        left: target * track.clientWidth,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
      update(target);
    }
    carousel.querySelector('.wd-carousel-prev').addEventListener('click', function () { go(index - 1); });
    carousel.querySelector('.wd-carousel-next').addEventListener('click', function () { go(index + 1); });
    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function () { go(i); });
    });
    track.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowRight') next = index + 1;
      else if (event.key === 'ArrowLeft') next = index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = slides.length - 1;
      else return;
      event.preventDefault();
      go(next);
    });
    track.addEventListener('scroll', function () {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        if (track.clientWidth) update(Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth))));
      });
    }, { passive: true });
    window.addEventListener('resize', function () {
      track.scrollTo({ left: index * track.clientWidth, behavior: 'instant' });
    });
    carousel.querySelector('.wd-carousel-controls').hidden = false;
    carousel.querySelector('.wd-carousel-thumbs').hidden = false;
    update(0);
  });
}());
