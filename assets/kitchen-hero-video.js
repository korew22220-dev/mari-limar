/* One responsive source; posters work without JavaScript or successful autoplay. */
(() => {
  'use strict';
  const video = document.querySelector('[data-kitchen-hero-video]');
  if (!video) return;
  const hero = video.closest('.kh-video-hero');
  const mobile = window.matchMedia('(max-width: 767px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = hero.getBoundingClientRect().bottom > 0 &&
    hero.getBoundingClientRect().top < window.innerHeight;
  let pageActive = true;
  let source = '';
  let generation = 0;
  let failedSource = '';
  let resumeTime = 0;
  let pendingPlay = false;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  const showPoster = () => hero.classList.remove('kh-video-hero--playing');
  const allowed = () => pageActive && !document.hidden && !reduced.matches && inView;
  const play = () => {
    if (!allowed() || !source || failedSource === source || pendingPlay || !video.paused) return;
    const token = generation;
    pendingPlay = true;
    try {
      const attempt = video.play();
      Promise.resolve(attempt).catch(() => {
        if (token === generation) showPoster();
      }).finally(() => {
        if (token === generation) pendingPlay = false;
      });
    } catch (_) {
      pendingPlay = false;
      showPoster();
    }
  };

  const update = () => {
    const next = reduced.matches ? '' : (mobile.matches ? video.dataset.mobileSrc : video.dataset.desktopSrc);
    if (!next) {
      generation++;
      pendingPlay = false;
      video.pause();
      showPoster();
      if (source) {
        resumeTime = video.currentTime || 0;
        source = '';
        video.removeAttribute('src');
        video.load();
      }
      video.removeAttribute('autoplay');
      return;
    }
    if (!allowed()) {
      video.pause();
      // Do not start a second transfer while the page/hero is hidden.
      return;
    }
    if (source !== next) {
      resumeTime = video.currentTime || resumeTime;
      generation++;
      pendingPlay = false;
      video.pause();
      showPoster();
      source = next;
      failedSource = '';
      video.src = next;
      video.load();
    }
    play();
  };

  video.addEventListener('loadedmetadata', () => {
    if (source && Number.isFinite(video.duration) && resumeTime > 0) {
      try { video.currentTime = Math.min(resumeTime, Math.max(0, video.duration - 0.1)); } catch (_) {}
      resumeTime = 0;
    }
  });
  video.addEventListener('playing', () => {
    if (allowed() && source && failedSource !== source && video.readyState >= 2) {
      hero.classList.add('kh-video-hero--playing');
    } else {
      video.pause();
    }
  });
  video.addEventListener('error', () => {
    failedSource = source;
    showPoster();
  });
  video.addEventListener('emptied', showPoster);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', () => { pageActive = false; video.pause(); });
  window.addEventListener('pageshow', () => { pageActive = true; update(); });
  const listen = query => {
    if (query.addEventListener) query.addEventListener('change', update);
    else query.addListener(update);
  };
  listen(mobile);
  listen(reduced);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      update();
    }, { threshold: 0 });
    observer.observe(hero);
  }
  update();
})();
