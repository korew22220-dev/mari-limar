'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'kitchens.html'),'utf8');
const cards=[...html.matchAll(/<article class="model-card" id="([^"]+)" data-collection="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)].map(m=>({id:m[1],collection:m[2],html:m[3]}));
const modern=['luna','ferrata','progma','primavera','magna','arona','konkretta','esenta','novara','shika','florida','miami','miami-curved','ora','kristali','kanti','nizza','time','nikol','avenue'];
const classic=['monticelli','fabiana','lange','maranella','barona','devenport','tivoli'];
test('current manufacturer catalog is covered once: 20 modern and 7 classic entries',()=>{
 assert.equal(cards.length,27);assert.equal(new Set(cards.map(c=>c.id)).size,27);
 for(const [collection,names] of [['modern',modern],['classic',classic]])assert.deepEqual(cards.filter(c=>c.collection===collection).map(c=>c.id),names.map(n=>'model-'+n));
 assert.match(html,/data-variant-of="model-miami"/);
 assert.match(html,/Все модели <span>27<\/span>/);assert.match(html,/Современные <span>20<\/span>/);assert.match(html,/Классические <span>7<\/span>/);
});
test('model selector has one option per card in exactly the same order',()=>{
 const select=html.match(/<select id="model-selector">([\s\S]*?)<\/select>/)[1];
 const options=[...select.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)];assert.equal(options.length,28);assert.equal(options[0][1],'all');
 cards.forEach((card,i)=>{assert.equal(options[i+1][1],String(i));assert.equal(options[i+1][2],card.html.match(/<h3>([^<]+)<\/h3>/)[1]);});
});
test('all collection covers and carousel photos use downloaded manufacturer images',()=>{
 const modernSources=JSON.parse(fs.readFileSync(path.join(root,'KITCHEN-MODERN-SOURCES.json'),'utf8'));
 const classicSources=JSON.parse(fs.readFileSync(path.join(root,'KITCHEN-CLASSIC-SOURCES.json'),'utf8'));
 assert.equal(modernSources.models.length,20);assert.equal(modernSources.model_photo_count,214);assert.deepEqual(modernSources.download_failures,[]);
 assert.equal(classicSources.models.length,7);assert.equal(classicSources.model_photo_count,80);assert.deepEqual(classicSources.download_failures,[]);
 const current={models:[...modernSources.models,...classicSources.models]};
 for(const model of current.models){
  const card=cards.find(c=>c.id==='model-'+model.slug);assert.ok(card);
  assert.match(card.html,/loading="lazy"/);assert.match(card.html,/decoding="async"/);
  for(const image of model.images[0].variants){assert.ok(card.html.includes(image.path));assert.ok(fs.statSync(path.join(root,image.path)).size>0);}
  const page=fs.readFileSync(path.join(root,'kitchen-'+model.slug+'.html'),'utf8');
  assert.equal((page.match(/class="wd-carousel-slide"/g)||[]).length,model.images.length);
  assert.ok(page.includes(model.description));assert.doesNotMatch(page,/href="https:\/\/rimi-mebel/);
  for(const image of model.images) for(const variant of image.variants) assert.ok(fs.statSync(path.join(root,variant.path)).size>0);
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
test('existing filters handle all 27 cards; dropdown selects each card and resets correctly',()=>{
 const h=filters();
 for(const [i,total] of [[1,20],[2,7],[0,27]]){h.buttons[i].click();assert.equal(h.nodes.filter(n=>!n.hidden).length,total);assert.equal(h.select.value,'all');}
 cards.forEach((card,i)=>{h.select.value=String(i);h.select.change();assert.equal(h.nodes.filter(n=>!n.hidden).length,1);assert.equal(h.nodes[i].hidden,false);assert.equal(h.buttons[0].attrs['aria-pressed'],'true');});
 h.select.value='all';h.select.change();assert.equal(h.nodes.filter(n=>!n.hidden).length,27);
 h.select.value='20';h.select.change();h.buttons[1].click();assert.equal(h.select.value,'all');assert.equal(h.nodes.filter(n=>!n.hidden).length,20);
});
