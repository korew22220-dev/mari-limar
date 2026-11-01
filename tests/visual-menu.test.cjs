const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/visual-menu.js'), 'utf8');
function harness(options = {}) {
  function node() {
    const classes = new Set();
    return { hidden: true, attrs: {}, events: {}, classList: { add: x => classes.add(x), remove: x => classes.delete(x) },
      setAttribute(k, v) { this.attrs[k] = v; },
      addEventListener(k, fn) { this.events[k] = fn; } };
  }
  const items = [0, 1].map(() => {
    const item = node(), toggle = node(), panel = node(), link = node();
    item.querySelector = key => key === '.ml-mega-toggle' ? toggle : key === '.ml-mega-panel' ? panel : link;
    item.contains = target => [item, toggle, panel, link].includes(target);
    toggle.focus = () => { toggle.focused = true; item.events.focusin({ target: toggle }); };
    link.focus = () => { link.focused = true; };
    return { item, toggle, panel, link };
  });
  const header = node(), shade = node(), drawer = node();
  header.querySelectorAll = () => items.map(x => x.item);
  header.contains = target => items.some(x => x.item.contains(target));
  const events = {}, winEvents = {}, timers = new Map(); let id = 0;
  const filter = { click() { this.clicked = true; } };
  const doc = { querySelector: key => key === '.head' ? header : key === '.ml-mega-shade' ? shade : filter,
    addEventListener: (key, fn) => { events[key] = fn; }, getElementById: () => drawer };
  vm.runInNewContext(source, { document: doc, URLSearchParams,
    window: { location: { search: options.search || '' },
      matchMedia: q => ({ matches: q.includes('min-width') ? options.desktop !== false : options.hover !== false }),
      addEventListener: (key, fn) => { winEvents[key] = fn; },
      setTimeout(fn) { timers.set(++id, fn); return id; }, clearTimeout(key) { timers.delete(key); } } });
  return { items, header, shade, events, winEvents, drawer, filter,
    runTimers() { const todo = [...timers.values()]; timers.clear(); todo.forEach(fn => fn()); } };
}
test('hover reveals one panel at a time; returning before the close delay keeps navigation usable', () => {
  const h = harness(), [a, b] = h.items;
  a.item.events.pointerenter();
  assert.equal(a.panel.hidden, false); assert.equal(h.shade.hidden, false);
  a.item.events.pointerleave(); a.item.events.pointerenter(); h.runTimers();
  assert.equal(a.panel.hidden, false);
  b.item.events.pointerenter();
  assert.equal(a.panel.hidden, true); assert.equal(b.panel.hidden, false);
  b.item.events.pointerleave(); h.runTimers();
  assert.equal(b.panel.hidden, true); assert.equal(h.shade.hidden, true);
});
test('keyboard disclosure and Escape restore focus without reopening the panel', () => {
  const h = harness(), a = h.items[0];
  a.toggle.events.keydown({ key: 'ArrowDown', preventDefault() {} });
  assert.equal(a.panel.hidden, false); assert.equal(a.link.focused, true);
  h.events.keydown({ key: 'Escape', preventDefault() {} });
  assert.equal(a.panel.hidden, true); assert.equal(a.toggle.attrs['aria-expanded'], 'false');
  assert.equal(a.toggle.focused, true); assert.equal(h.shade.hidden, true);
});
test('touch disclosure works on wide screens and mobile keeps its original drawer', () => {
  const h = harness({ hover: false }), a = h.items[0];
  a.item.events.focusin({ target: a.toggle }); a.toggle.events.click();
  assert.equal(a.panel.hidden, false);
  h.drawer.events.click(); assert.equal(a.panel.hidden, true);
  const mobile = harness({ desktop: false });
  mobile.items[0].toggle.events.click(); assert.equal(mobile.items[0].panel.hidden, true);
});
test('query links apply existing collection/category filters and resizing closes previews', () => {
  assert.equal(harness({ search: '?collection=classic' }).filter.clicked, true);
  assert.equal(harness({ search: '?category=interior' }).filter.clicked, true);
  assert.equal(harness({ search: '?collection=unknown' }).filter.clicked, undefined);
  const h = harness(); h.items[0].item.events.pointerenter(); h.winEvents.resize();
  assert.equal(h.items[0].panel.hidden, true);
});
