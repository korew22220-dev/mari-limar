'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const models=JSON.parse(fs.readFileSync(path.join(root,'KITCHEN-MODELS.json'),'utf8'));
const catalog=fs.readFileSync(path.join(root,'kitchens.html'),'utf8');
test('all 26 catalog cards have unique keyboard-native links to their own static details',()=>{
 assert.equal(models.length,26);assert.equal(new Set(models.map(m=>m.slug)).size,26);
 for(const m of models){
  const card=catalog.match(new RegExp('<article class="model-card" id="model-'+m.slug+'"[\\s\\S]*?</article>'))[0];
  assert.ok(card.includes('class="ml-kitchen-link" href="kitchen-'+m.slug+'.html"'));
  assert.ok(fs.existsSync(path.join(root,'kitchen-'+m.slug+'.html')));
  assert.equal((card.match(/<a\b/g)||[]).length,1);
 }
});
test('each model page uses its actual photo, sourced description, all features and model-aware CTAs',()=>{
 for(const m of models){
  const s=fs.readFileSync(path.join(root,'kitchen-'+m.slug+'.html'),'utf8');
  assert.ok(s.includes('id="model-title">'+m.name+'</h1>'));
  assert.ok(s.includes('src="'+m.image.src+'"'));assert.ok(fs.existsSync(path.join(root,m.image.src)));
  assert.ok(s.includes(m.description));for(const feature of m.features)assert.ok(s.includes('<li>'+feature+'</li>'));
  assert.equal((s.match(/data-ml-model=/g)||[]).length,4);
  for(const intent of ['cost','project','visit'])assert.ok(s.includes('data-ml-lead="'+intent+'"'));
  assert.ok(s.includes('kitchens.html#model-'+m.slug));assert.ok(m.source_pdf_page>0);assert.ok(s.includes('с. '+m.source_printed_pages));
  assert.doesNotMatch(s,/\d[\d ]*\s*[₽]/);
 }
});
test('all HTML routes include one accessible form, one contact widget and native contact fallbacks',()=>{
 const files=fs.readdirSync(root).filter(n=>n.endsWith('.html'));assert.ok(files.includes('index.html'));assert.ok(files.includes('wardrobes.html'));for(const m of models)assert.ok(files.includes('kitchen-'+m.slug+'.html'));
 for(const name of files){
  const s=fs.readFileSync(path.join(root,name),'utf8');
  assert.equal((s.match(/id="ml-lead-dialog"/g)||[]).length,1,name);
  assert.equal((s.match(/id="ml-contact-tools"/g)||[]).length,1,name);
  assert.match(s,/assets\/contact-tools\.js\?v=[\w-]+/);assert.match(s,/assets\/contact-tools\.css\?v=\d+/);
  assert.ok((s.match(/<dialog\b[^>]*>/g)||[]).some(tag=>/\bclass="ml-lead-dialog"/.test(tag)),name+' accessible dialog');
  assert.ok(s.includes('aria-labelledby="ml-lead-title"'));assert.ok(s.includes('method="dialog"'));
  assert.ok((s.match(/<a\b[^>]*>/g)||[]).some(tag=>/href="contacts.html#request"/.test(tag)&&/data-ml-lead=/.test(tag)),name+' native enquiry fallback');
  const ids=[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,name+' duplicate IDs');
 }
});
test('new UI keeps reduced motion, safe-area placement, readable mobile form fields and full uncropped model photos',()=>{
 const tools=fs.readFileSync(path.join(root,'assets/contact-tools.css'),'utf8');
 const css=fs.readFileSync(path.join(root,'assets/kitchen-model.css'),'utf8');
 assert.match(tools,/prefers-reduced-motion:reduce/);assert.match(tools,/safe-area-inset-right/);assert.match(tools,/safe-area-inset-left/);
 assert.match(tools,/font:400 16px\/1.5/);assert.match(tools,/\.ml-lead-fields\{grid-template-columns:1fr/);
 assert.match(css,/\.ml-model-photo img\{[^}]*height:auto;object-fit:contain/);
});
