/* No global state; pointer capture keeps dragging active outside the image. */
(() => {
  'use strict';
  document.querySelectorAll('[data-ml-compare]').forEach(frame => {
    const handle = frame.querySelector('[role="slider"]');
    if (!handle) return;
    let position = 50;
    let activePointer = null;
    const update = value => {
      position = Math.max(0, Math.min(100, value));
      frame.style.setProperty('--ml-compare-position', `${position}%`);
      handle.setAttribute('aria-valuenow', String(Math.round(position)));
      handle.setAttribute('aria-valuetext', `До — ${Math.round(position)}%; После — ${100 - Math.round(position)}%`);
    };
    const updateFromPointer = event => {
      const rect = frame.getBoundingClientRect();
      if (rect.width > 0) update((event.clientX - rect.left) / rect.width * 100);
    };
    frame.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || activePointer !== null) return;
      activePointer = event.pointerId;
      frame.setPointerCapture(event.pointerId);
      frame.setAttribute('data-dragging', '');
      handle.focus({preventScroll: true});
      updateFromPointer(event);
    });
    frame.addEventListener('pointermove', event => {
      if (event.pointerId === activePointer) updateFromPointer(event);
    });
    const stop = event => {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      frame.removeAttribute('data-dragging');
      if (frame.hasPointerCapture(event.pointerId)) frame.releasePointerCapture(event.pointerId);
    };
    frame.addEventListener('pointerup', stop);
    frame.addEventListener('pointercancel', stop);
    frame.addEventListener('lostpointercapture', stop);
    frame.addEventListener('dragstart', event => event.preventDefault());
    handle.addEventListener('keydown', event => {
      const step = event.shiftKey ? 10 : 1;
      let next;
      switch (event.key) {
        case 'ArrowLeft': next = position - step; break;
        case 'ArrowRight': next = position + step; break;
        case 'Home': next = 0; break;
        case 'End': next = 100; break;
        default: return;
      }
      event.preventDefault();
      update(next);
    });
    update(position);
  });
})();
