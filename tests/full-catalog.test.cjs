'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'kitchens.html'),'utf8');
const cards=[...html.matchAll(/<article class="model-card" id="([^"]+)" data-collection="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)].map(m=>({id:m[1],collection:m[2],html:m[3]}));
const modern=['luna','ferrata','progma','konkretta','esenta','novara','primavera','shika','florida','arona','magna','miami','miami-curved','ora','kristali','kanti','nizza','time'];
const classic=['monticelli','fabiana','lange','maranella','barona','devenport','nikol','avenue'];
test('both source tables of contents are covered once: 18 modern and 8 classic entries',()=>{
 assert.equal(cards.length,26);assert.equal(new Set(cards.map(c=>c.id)).size,26);
 for(const [collection,names] of [['modern',modern],['classic',classic]])assert.deepEqual(cards.filter(c=>c.collection===collection).map(c=>c.id),names.map(n=>'model-'+n));
 assert.match(html,/data-variant-of="model-miami"/);
 assert.match(html,/Все модели <span>26<\/span>/);assert.match(html,/Современные <span>18<\/span>/);assert.match(html,/Классические <span>8<\/span>/);
});
test('model selector has one option per card in exactly the same order',()=>{
 const select=html.match(/<select id="model-selector">([\s\S]*?)<\/select>/)[1];
 const options=[...select.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)];assert.equal(options.length,27);assert.equal(options[0][1],'all');
 cards.forEach((card,i)=>{assert.equal(options[i+1][1],String(i));assert.equal(options[i+1][2],card.html.match(/<h3>([^<]+)<\/h3>/)[1]);});
});
test('all 16 added cards have source provenance and three local lazy-loading image sizes',()=>{
 const sources=JSON.parse(fs.readFileSync(path.join(root,'RIMI-CATALOG-SOURCES.json'),'utf8'));assert.equal(sources.length,16);
 for(const source of sources){
  assert.ok(source.photo_pdf_page>source.title_pdf_page&&source.xref>0);
  const card=cards.find(c=>c.id==='model-'+source.slug);assert.ok(card);
  assert.match(card.html,/loading="lazy"/);assert.match(card.html,/decoding="async"/);
  for(const image of source.sizes){assert.ok(card.html.includes(image.path));assert.ok(fs.statSync(path.join(root,image.path)).size>0);}
 }
});
function filters(){
 const buttons=['all','modern','classic'].map(filter=>({dataset:{filter},attrs:{},classList:{toggle(){}},setAttribute(n,v){this.attrs[n]=v;},addEventListener(n,cb){this.click=cb;}}));
 const nodes=cards.map(c=>({dataset:{collection:c.collection},hidden:false}));
 const select={value:'all',addEventListener(n,cb){this.change=cb;}};
 const document={querySelectorAll:s=>s==='.catalog-tab'?buttons:nodes,getElementById:()=>select};
 const source=fs.readFileSync(path.join(root,'assets/site.js'),'utf8');
 const start=source.indexOf("  document.querySelectorAll('.catalog-tab')");const end=source.indexOf("  const video = document.querySelector(");
 vm.runInNewContext(source.slice(start,end),{document});return {buttons,nodes,select};
}
test('existing filters handle all 26 cards; dropdown selects each card and resets correctly',()=>{
 const h=filters();
 for(const [i,total] of [[1,18],[2,8],[0,26]]){h.buttons[i].click();assert.equal(h.nodes.filter(n=>!n.hidden).length,total);assert.equal(h.select.value,'all');}
 cards.forEach((card,i)=>{h.select.value=String(i);h.select.change();assert.equal(h.nodes.filter(n=>!n.hidden).length,1);assert.equal(h.nodes[i].hidden,false);assert.equal(h.buttons[0].attrs['aria-pressed'],'true');});
 h.select.value='all';h.select.change();assert.equal(h.nodes.filter(n=>!n.hidden).length,26);
 h.select.value='20';h.select.change();h.buttons[1].click();assert.equal(h.select.value,'all');assert.equal(h.nodes.filter(n=>!n.hidden).length,18);
});
