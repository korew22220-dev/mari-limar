(() => {
  'use strict';

  const project = document.querySelector('.arch-project');
  const image = project?.querySelector('.arch-project-image');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!image || reducedMotion.matches || !('IntersectionObserver' in window) || !image.decode) return;

  function showFinalFrame() {
    observer.disconnect();
    delete project.dataset.motion;
    reducedMotion.removeEventListener('change', showFinalFrame);
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    image.decode().then(() => {
      if (project.dataset.motion !== 'waiting') return;
      image.addEventListener('animationend', showFinalFrame, { once: true });
      project.dataset.motion = 'playing';
    }).catch(showFinalFrame);
  }, { threshold: .25 });

  project.dataset.motion = 'waiting';
  reducedMotion.addEventListener('change', showFinalFrame);
  observer.observe(image);
})();
