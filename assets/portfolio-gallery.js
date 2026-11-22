/* Portfolio-only filtering and accessible project preview. No dependencies. */
(() => {
  'use strict';
  const root = document.querySelector('.ml-portfolio-page');
  const data = document.getElementById('portfolio-data');
  if (!root || !data) return;
  const projects = JSON.parse(data.textContent);
  const cards = [...root.querySelectorAll('.port-card')];
  const categories = [...root.querySelectorAll('#category-filters button')];
  const count = document.getElementById('result-count');
  const empty = document.getElementById('empty');
  let category = 'all';
  function applyFilters() {
    let visible = 0;
    cards.forEach(card => {
      card.hidden = !(category === 'all' || card.dataset.category === category);
      if (!card.hidden) visible++;
    });
    categories.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
    count.textContent = 'Показано: ' + visible;
    empty.hidden = visible > 0;
    empty.style.display = visible ? 'none' : 'block';
    document.getElementById('empty-description').textContent = 'В этом направлении пока нет материалов. Выберите другое направление.';
  }
  categories.forEach(button => button.addEventListener('click', () => { category = button.dataset.category; applyFilters(); }));
  document.getElementById('portfolio-reset').addEventListener('click', () => { category = 'all'; applyFilters(); categories[0].focus({preventScroll:true}); });
  const dialog = document.getElementById('project-dialog');
  const close = document.getElementById('dialog-close');
  let lastFocus = null, previousOverflow = '', inactive = [];
  let currentPhotos = [], photoIndex = 0;
  const controls = document.getElementById('photo-controls');
  const caption = document.getElementById('photo-caption');
  const rooms = document.getElementById('photo-room');
  const roomSelect = document.getElementById('photo-room-select');
  const image = document.getElementById('dialog-image');
  const stage = document.getElementById('photo-stage');
  const loading = document.getElementById('photo-loading');
  const error = document.getElementById('photo-error');
  const retry = document.getElementById('photo-retry');
  let loadId = 0, selectedPhoto = null;
  function loadPhoto(photo, retrying = false) {
    selectedPhoto = photo;
    const id = ++loadId;
    stage.setAttribute('aria-busy', 'true');
    stage.classList.remove('has-error');
    loading.hidden = false;
    error.hidden = true;
    if (retrying) close.focus({preventScroll:true});
    const pending = new Image();
    pending.onload = () => {
      if (id !== loadId) return;
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
      image.alt = photo.alt;
      image.width = photo.width;
      image.height = photo.height;
      image.src = pending.currentSrc || pending.src;
      stage.setAttribute('aria-busy', 'false');
      loading.hidden = true;
    };
    pending.onerror = () => {
      if (id !== loadId) return;
      stage.setAttribute('aria-busy', 'false');
      stage.classList.add('has-error');
      loading.hidden = true;
      error.hidden = false;
    };
    if (photo.srcset && !retrying) {
      pending.sizes = '(max-width:1000px) 90vw, 650px';
      pending.srcset = photo.srcset;
    }
    pending.src = photo.image + (retrying ? (photo.image.includes('?') ? '&' : '?') + 'retry=' + Date.now() : '');
  }
  retry.addEventListener('click', () => { if (selectedPhoto) loadPhoto(selectedPhoto, true); });
  function showPhoto(index) {
    if (!currentPhotos.length) return;
    photoIndex = Math.max(0, Math.min(index, currentPhotos.length - 1));
    const photo = currentPhotos[photoIndex];
    loadPhoto(photo);
    document.getElementById('photo-count').textContent = (photoIndex + 1) + ' / ' + currentPhotos.length;
    caption.textContent = photo.caption;
    document.getElementById('photo-prev').disabled = photoIndex === 0;
    document.getElementById('photo-next').disabled = photoIndex === currentPhotos.length - 1;
    roomSelect.value = String(currentPhotos.findIndex(item => item.group === photo.group));
  }
  document.getElementById('photo-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  document.getElementById('photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  roomSelect.addEventListener('change', () => showPhoto(Number(roomSelect.value)));
  function closeProject(restoreFocus = true) {
    if (dialog.hidden) return;
    loadId++;
    dialog.hidden = true;
    dialog.classList.remove('open');
    dialog.setAttribute('aria-hidden', 'true');
    inactive.forEach(([element, value]) => { element.inert = value; });
    inactive = [];
    document.body.style.overflow = previousOverflow;
    if (restoreFocus && lastFocus && lastFocus.isConnected) lastFocus.focus({preventScroll:true});
  }
  root.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
    const project = projects[Number(button.dataset.open)];
    if (!project) return;
    lastFocus = button;
    document.getElementById('dialog-title').textContent = project.title;
    document.getElementById('dialog-kind').textContent = project.kind;
    document.getElementById('dialog-description').textContent = project.description;
    document.getElementById('dialog-status').textContent = 'Статус: ' + project.label;
    document.getElementById('dialog-disclosure').textContent = project.disclosure;
    currentPhotos = Array.isArray(project.photos) ? project.photos : [];
    controls.hidden = caption.hidden = rooms.hidden = currentPhotos.length < 2;
    dialog.classList.toggle('has-photo-gallery', currentPhotos.length > 1);
    const viewerTitle = document.getElementById('photo-project-title');
    viewerTitle.hidden = currentPhotos.length < 2;
    viewerTitle.textContent = project.title;
    roomSelect.replaceChildren();
    if (currentPhotos.length) {
      const seen = new Set();
      currentPhotos.forEach((photo, index) => {
        if (seen.has(photo.group)) return;
        seen.add(photo.group);
        const option = document.createElement('option');
        option.value = String(index); option.textContent = photo.group;
        roomSelect.appendChild(option);
      });
      showPhoto(0);
    } else loadPhoto(project);
    document.getElementById('dialog-enquiry').dataset.mlContext = 'Портфолио — ' + project.title;
    previousOverflow = document.body.style.overflow;
    inactive = [...document.body.children].filter(element => element !== dialog && !['SCRIPT','STYLE'].includes(element.tagName)).map(element => [element, element.inert]);
    inactive.forEach(([element]) => { element.inert = true; });
    dialog.hidden = false;
    dialog.classList.add('open');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    dialog.querySelector('.dialog-inner').scrollTop = 0;
    close.focus({preventScroll:true});
  }));
  close.addEventListener('click', () => closeProject());
  dialog.addEventListener('click', event => { if (event.target === dialog) closeProject(); });
  document.addEventListener('keydown', event => {
    if (dialog.hidden) return;
    if (currentPhotos.length > 1 && !event.target.matches('input,textarea,select,[contenteditable="true"]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      event.preventDefault();
      showPhoto(event.key === 'Home' ? 0 : event.key === 'End' ? currentPhotos.length - 1 : photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
    if (event.key === 'Escape') { event.preventDefault(); closeProject(); }
  });
  document.getElementById('dialog-enquiry').addEventListener('click', () => closeProject(false));
  applyFilters();
})();
