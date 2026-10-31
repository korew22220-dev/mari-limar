const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/model-lightbox.js'), 'utf8');

function harness(reducedMotion = false) {
  function node() {
    return { children: [], attrs: {}, events: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      addEventListener(k, fn) { this.events[k] = fn; },
      appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      focus() { this.focused = true; }
    };
  }
  const track = Object.assign(node(), { clientWidth: 900, scrollLeft: 0,
    scrollTo(options) { this.lastScroll = options; this.scrollLeft = options.left; } });
  const counter = node(), title = node(), close = node(), prev = node(), next = node();
  const nodes = { '.ml-photo-viewer-track': track, '.ml-photo-viewer-counter': counter,
    '.ml-photo-viewer-title': title, '.ml-photo-viewer-close': close,
    '.ml-photo-viewer-prev': prev, '.ml-photo-viewer-next': next };
  const dialog = Object.assign(node(), {
    open: false, querySelector: key => nodes[key],
    showModal() { this.open = true; },
    close() { this.open = false; this.events.close(); }
  });
  const links = Array.from({ length: 4 }, (_, i) => Object.assign(node(), {
    href: 'https://site.test/full-' + i + '.webp',
    querySelector: () => ({ alt: 'Кухня — фото ' + (i + 1) })
  }));
  const thumbs = links.map(() => ({ click() { this.clicked = true; } }));
  const carousel = { getAttribute: () => 'Фотографии кухни',
    querySelectorAll: key => key === '[data-wd-slide]' ? thumbs : links };
  const body = { style: { overflow: 'auto' } }, windowEvents = {};
  let frame;
  vm.runInNewContext(source, {
    document: { body, querySelector: () => dialog, querySelectorAll: () => [carousel], createElement: node },
    window: { matchMedia: () => ({ matches: reducedMotion }),
      requestAnimationFrame(fn) { frame = fn; return 1; },
      addEventListener(k, fn) { windowEvents[k] = fn; } }
  });
  return { dialog, track, counter, title, close, prev, next, links, thumbs, body, windowEvents,
    open(index) { let prevented = false; links[index].events.click({ button: 0, preventDefault() { prevented = true; } }); return prevented; },
    swipe(index) { track.scrollLeft = index * track.clientWidth; track.events.scroll(); frame(); } };
}

test('click opens selected full-size photo in a modal, without following the image link', () => {
  const h = harness();
  assert.equal(h.open(2), true);
  assert.equal(h.dialog.open, true);
  assert.equal(h.track.children.length, 4);
  assert.equal(h.track.children[2].children[0].src, h.links[2].href);
  assert.equal(h.track.children[2].children[0].loading, 'eager');
  assert.equal(h.counter.textContent, '3 / 4');
  assert.equal(h.track.lastScroll.left, 1800);
  assert.equal(h.body.style.overflow, 'hidden');
  assert.equal(h.close.focused, true);
});

test('fullscreen arrows, swipe and keyboard navigate; close restores page scroll and selected carousel photo', () => {
  const h = harness(true);
  h.open(0);
  h.prev.events.click();
  assert.equal(h.counter.textContent, '4 / 4');
  assert.equal(h.track.lastScroll.behavior, 'auto');
  h.next.events.click();
  assert.equal(h.counter.textContent, '1 / 4');
  h.swipe(2);
  assert.equal(h.counter.textContent, '3 / 4');
  h.dialog.events.keydown({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(h.counter.textContent, '2 / 4');
  h.track.clientWidth = 400;
  h.windowEvents.resize();
  assert.equal(h.track.lastScroll.left, 400);
  h.close.events.click();
  assert.equal(h.dialog.open, false);
  assert.equal(h.body.style.overflow, 'auto');
  assert.equal(h.thumbs[1].clicked, true);
  assert.equal(h.links[1].focused, true);
});

test('native close and page navigation release scroll lock; reopening starts at the clicked photo', () => {
  const h = harness();
  h.open(3);
  h.dialog.close(); // Native Escape triggers the same close event.
  assert.equal(h.body.style.overflow, 'auto');
  h.open(1);
  assert.equal(h.counter.textContent, '2 / 4');
  h.windowEvents.pagehide();
  assert.equal(h.dialog.open, false);
  assert.equal(h.body.style.overflow, 'auto');
  let prevented = false;
  h.links[0].events.click({ ctrlKey: true, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
});
