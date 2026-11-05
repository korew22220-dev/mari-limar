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
  function closeProject(restoreFocus = true) {
    if (dialog.hidden) return;
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
    const image = document.getElementById('dialog-image');
    image.srcset = project.srcset;
    image.sizes = '(max-width: 1000px) 90vw, 650px';
    image.src = project.image;
    image.alt = project.alt;
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
    if (event.key === 'Escape') { event.preventDefault(); closeProject(); }
  });
  document.getElementById('dialog-enquiry').addEventListener('click', () => closeProject(false));
  applyFilters();
})();

