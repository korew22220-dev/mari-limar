const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const api = require('../assets/contact-tools.js');
test('inline form starts with MAX instructions and prepares the selected messenger without sending', () => {
  const nodes = {}, opened=[];
  function node(id) { return nodes[id] ||= { value: '', textContent: '', events: {}, dataset: {},
    addEventListener(k, fn) { this.events[k] = fn; }, setCustomValidity() {},
    reportValidity: () => true, removeAttribute() {}, focus() {}, setAttribute() {} }; }
  const fields = { name: node('name'), phone: node('phone'), comment: node('comment'), channel: node('channel') };
  fields.name.value = 'Саша'; fields.phone.value = '+79181234567'; fields.comment.value = 'Кухня с островом'; fields.channel.value = 'max';
  const form = node('pf-request-form');form.dataset = { leadTopic: 'project', leadContext: 'Главная' };
  form.querySelector=()=>node('submit');form.elements = { namedItem: key => fields[key] };form.reportValidity = () => true;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/portfolio-inline-form.js'), 'utf8'), {
    window: { MariLead: api, open:(...args)=>opened.push(args) }, document: { getElementById: node },
    location: { origin: 'https://studio.test', pathname: '/' }, navigator: {} });
  assert.match(nodes['pf-request-hint'].textContent, /MAX/);assert.equal(opened.length,0);
  form.events.submit({ preventDefault() {} });
  assert.equal(nodes['pf-request-chat'].href, 'https://web.max.ru/');
  assert.match(nodes['pf-request-ready-hint'].textContent, /найдите контакт/);
  assert.match(nodes['pf-request-message'].value, /Кухня с островом/);
  fields.channel.value = 'whatsapp';fields.channel.events.change();
  assert.match(nodes['pf-request-hint'].textContent, /WhatsApp/);
  form.events.submit({ preventDefault() {} });
  assert.equal(new URL(nodes['pf-request-chat'].href).searchParams.get('text'), nodes['pf-request-message'].value);
  assert.equal(opened.length,1);assert.equal(opened[0][0],nodes['pf-request-chat'].href);assert.equal(nodes['pf-request-copy'].hidden,true);assert.equal(nodes['submit'].textContent,'Продолжить в WhatsApp');
});
