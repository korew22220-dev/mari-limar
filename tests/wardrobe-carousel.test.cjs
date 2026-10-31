const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/wardrobe-carousel.js'), 'utf8');

function setup(count, reducedMotion = false) {
  const callbacks = {};
  const windowEvents = {};
  let pendingFrame;
  const strip = { scrollLeft: 0, clientWidth: 180 };
  const thumbs = Array.from({ length: count }, (_, i) => ({
    parentElement: strip, offsetLeft: i * 86, offsetWidth: 76, attributes: {},
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; },
    addEventListener(event, fn) { callbacks['thumb' + i] = fn; }
  }));
  const track = {
    children: Array.from({ length: count }, () => ({})), clientWidth: 600, scrollLeft: 0,
    addEventListener(event, fn) { callbacks[event] = fn; },
    scrollTo(options) { this.lastScroll = options; this.scrollLeft = options.left; }
  };
  const counter = {};
  const controls = { hidden: true };
  const previews = { hidden: true };
  const nodes = {
    '.wd-carousel-track': track, '.wd-carousel-counter': counter,
    '.wd-carousel-controls': controls, '.wd-carousel-thumbs': previews,
    '.wd-carousel-prev': { addEventListener(event, fn) { callbacks.prev = fn; } },
    '.wd-carousel-next': { addEventListener(event, fn) { callbacks.next = fn; } }
  };
  vm.runInNewContext(source, {
    document: { querySelectorAll: () => [{ querySelector: s => nodes[s], querySelectorAll: () => thumbs }] },
    window: {
      matchMedia: () => ({ matches: reducedMotion }),
      requestAnimationFrame(fn) { pendingFrame = fn; return 1; },
      addEventListener(event, fn) { windowEvents[event] = fn; }
    }
  });
  return { callbacks, windowEvents, track, counter, thumbs, strip, controls, previews,
    flushScroll() { callbacks.scroll(); pendingFrame(); } };
}

test('arrows loop through every model photo and previews select the requested image', () => {
  const c = setup(8);
  assert.equal(c.controls.hidden, false);
  assert.equal(c.previews.hidden, false);
  c.callbacks.prev();
  assert.equal(c.counter.textContent, '8 / 8');
  assert.equal(c.track.lastScroll.left, 4200);
  assert.equal(c.thumbs[7].attributes['aria-current'], 'true');
  assert.equal(c.thumbs[0].attributes['aria-current'], undefined);
  assert.ok(c.strip.scrollLeft > 0);
  c.callbacks.next();
  assert.equal(c.counter.textContent, '1 / 8');
  c.callbacks.thumb3();
  assert.equal(c.counter.textContent, '4 / 8');
  assert.equal(c.track.lastScroll.left, 1800);
});

test('swiping updates selection, keyboard navigation respects reduced motion, and resize preserves the slide', () => {
  const c = setup(5, true);
  c.track.scrollLeft = 1200;
  c.flushScroll();
  assert.equal(c.counter.textContent, '3 / 5');
  let prevented = false;
  c.callbacks.keydown({ key: 'End', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(c.counter.textContent, '5 / 5');
  assert.equal(c.track.lastScroll.behavior, 'auto');
  c.track.clientWidth = 320;
  c.windowEvents.resize();
  assert.equal(c.track.lastScroll.left, 1280);
  c.callbacks.keydown({ key: 'Home', preventDefault() {} });
  assert.equal(c.counter.textContent, '1 / 5');
});
