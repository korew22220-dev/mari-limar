(() => {
  const panel = document.querySelector('#panel, #mobile-panel');
  const opener = document.querySelector('#open, #open-menu');
  const closer = document.querySelector('#close, #close-menu');
  opener.setAttribute('aria-controls', panel.id);
  opener.setAttribute('aria-expanded', 'false');
  const backdrop = document.querySelector('.ml-drawer-backdrop');
  let previousOverflow = '';
  let inactive = [];
  panel.inert = true;
  const setMenu = (open) => {
    if (open === panel.classList.contains('open')) return;
    if (open) {
      previousOverflow = document.body.style.overflow;
      inactive = [...document.body.children].filter(el => el !== panel && el !== backdrop && !['SCRIPT','STYLE'].includes(el.tagName)).map(el => [el, el.inert]);
      inactive.forEach(([el]) => { el.inert = true; });
    } else {
      inactive.forEach(([el, value]) => { el.inert = value; });
      inactive = [];
    }
    panel.inert = !open;
    backdrop.classList.toggle('open', open);
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    opener.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : previousOverflow;
    requestAnimationFrame(() => {
      if (panel.classList.contains('open') === open) (open ? closer : opener).focus({preventScroll:true});
    });
  };
  panel.addEventListener('transitionend', e => {
    if (e.target === panel && panel.classList.contains('open') && !panel.contains(document.activeElement)) closer.focus({preventScroll:true});
  });
  opener.onclick = () => setMenu(true);
  closer.onclick = () => setMenu(false);
  backdrop.onclick = () => setMenu(false);
  panel.querySelectorAll('a').forEach(a => a.onclick = () => setMenu(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) setMenu(false);
    if (e.key !== 'Tab') return;
    const modal = panel.classList.contains('open') ? panel : document.querySelector('#project-dialog.open');
    if (!modal) return;
    const nodes = [...modal.querySelectorAll('a[href],button:not([disabled]),select,[tabindex="0"]')];
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), {threshold: .08});
    reveals.forEach(e => io.observe(e));
  } else reveals.forEach(e => e.classList.add('visible'));
  document.querySelectorAll('.catalog-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.catalog-tab').forEach(b => {
      b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn));
    });
    document.querySelectorAll('.model-card').forEach(card => {
      card.hidden = btn.dataset.filter !== 'all' && card.dataset.collection !== btn.dataset.filter;
    });
    const selector = document.getElementById('model-selector');
    if (selector) selector.value = 'all';
  }));
  const selector = document.getElementById('model-selector');
  if (selector) selector.addEventListener('change', () => {
    document.querySelectorAll('.catalog-tab').forEach(b => {
      const active = b.dataset.filter === 'all';
      b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.model-card').forEach((card, i) => card.hidden = selector.value !== 'all' && String(i) !== selector.value);
  });
  const video = document.querySelector('video:not([data-kitchen-hero-video])');
  if (video) {
    video.muted = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = true;
    const updateVideo = () => {
      if (document.hidden || reduced.matches || !inView) video.pause();
      else video.play().catch(() => { /* Native poster remains visible if autoplay is blocked. */ });
    };
    if ('IntersectionObserver' in window) {
      const visibility = new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        updateVideo();
      }, {threshold: 0});
      visibility.observe(video);
    }
    document.addEventListener('visibilitychange', updateVideo);
    window.addEventListener('pagehide', () => video.pause());
    window.addEventListener('pageshow', updateVideo);
    reduced.addEventListener('change', updateVideo);
    updateVideo();
  }
})();
