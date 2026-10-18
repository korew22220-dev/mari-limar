'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/premium-motion.js'),'utf8');
// Deterministic DOM boundary harness, not a visual/browser emulator.
function harness(options={}){
 const docEvents={},winEvents={},timers=new Map(),storage=new Map(),rootClasses=new Set(),animations=[];
 let timerId=0,io,vtCalls=0;
 if(options.marker)storage.set('mari-limar-motion-transfer-v1',JSON.stringify(options.marker));
 class Element{
  constructor(attrs={}){this.attrs=attrs;this.tagName=attrs.tagName||'A';this.isConnected=true;this.hidden=false;this.classList={contains:c=>(attrs.className||'').split(' ').includes(c)};this.relList={contains:r=>(attrs.rel||'').split(' ').includes(r)};}
  closest(selector){if(selector==='a[href]')return this.tagName==='A'?this:null;if(selector.includes('[hidden]'))return this.attrs.excluded?this:null;return null;}
  getAttribute(name){return this.attrs[name]??null;}
  hasAttribute(name){return Object.hasOwn(this.attrs,name);}
  get href(){return this.attrs.href;}
  matches(s){return s==='.overline,.eyebrow'&&this.attrs.kind==='label';}
  getClientRects(){return [{}];}
  getBoundingClientRect(){return {top:this.attrs.top??20,bottom:this.attrs.bottom??100};}
  animate(frames,config){const a={frames,config,cancelled:false,finished:new Promise(()=>{}),cancel(){this.cancelled=true;}};animations.push(a);return a;}
  querySelector(){return null;}
 }
 const nodes=(options.targets||[]).map(x=>new Element(x));
 const main={querySelectorAll:()=>nodes};
 const curtain=new Element({tagName:'DIV'});curtain.hidden=true;
 const root={classList:{add:(...cs)=>cs.forEach(x=>rootClasses.add(x)),remove:(...cs)=>cs.forEach(x=>rootClasses.delete(x))}};
 const doc={documentElement:root,currentScript:{src:'https://studio.test/mari-limar/assets/premium-motion.js'},readyState:'complete',addEventListener:(n,fn)=>docEvents[n]=fn,querySelector:s=>s==='.pm-curtain'?curtain:s==='main'?main:null};
 if(options.vt)doc.startViewTransition=fn=>{vtCalls++;if(options.vt==='throw')throw Error('not available');fn();return {ready:Promise.resolve(),finished:Promise.resolve(),skipTransition(){}};};
 const reduced={matches:!!options.reduced,addEventListener(n,f){this.onchange=f;}};
 const mobile={matches:!!options.mobile};
 const raf=[];
 const win={innerHeight:800,innerWidth:options.mobile?390:1366,matchMedia:q=>q.includes('reduced')?reduced:mobile,setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),addEventListener:(n,fn)=>winEvents[n]=fn};
 const navigations=[];
 const location={origin:'https://studio.test',pathname:'/mari-limar/index.html',search:'',href:'https://studio.test/mari-limar/index.html',assign:url=>{if(options.assignFails)throw Error('offline');navigations.push(url);}};
 const sessionStorage={getItem:k=>{if(options.storageFails)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(options.storageFails)throw Error('blocked');storage.set(k,v);},removeItem:k=>storage.delete(k)};
 class IO{constructor(cb){this.cb=cb;this.targets=new Set();io=this;}observe(el){this.targets.add(el);}unobserve(el){this.targets.delete(el);}disconnect(){this.targets.clear();}}
 win.IntersectionObserver=IO;
 vm.runInNewContext(source,{document:doc,window:win,location,sessionStorage,URL,Element,Set,WeakSet,WeakMap,Date,JSON,Math,IntersectionObserver:IO,getComputedStyle:()=>({position:options.cssMissing?'static':'fixed'}),requestAnimationFrame:fn=>raf.push(fn)});
 function click(href,attrs={},eventAttrs={}){const anchor=new Element({href,...attrs});const e={button:0,target:anchor,prevented:false,preventDefault(){this.defaultPrevented=true;this.prevented=true;},...eventAttrs};docEvents.click?.(e);return e;}
 function run(ms){for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}}
 function frames(){for(let i=0;i<4&&raf.length;i++){const q=raf.splice(0);q.forEach(f=>f());}}
 return {click,run,frames,rootClasses,navigations,timers,storage,curtain,reduced,winEvents,nodes,animations,get io(){return io;},get vtCalls(){return vtCalls;}};
}
test('all twelve internal HTML routes navigate through native location.assign',()=>{
 for(const name of ['index.html','kitchens.html','architecture-design.html','portfolio.html','expertise.html','about.html','contacts.html','blog.html','blog-kitchen-planning.html','blog-interior-materials.html','blog-furniture-architecture.html','blog-furniture-check.html']){
  const h=harness();const same=name==='index.html';assert.equal(h.click('https://studio.test/mari-limar/'+name).prevented,!same);h.run(380);assert.equal(h.navigations.length,same?0:1);
 }
});
test('external, telephone, messenger, downloads, anchors, modifiers and new tabs are never captured',()=>{
 const cases=[['https://outside.test/about.html'],['tel:+78002017767'],['mailto:studio@example.test'],['https://t.me/+79184029932'],['https://wa.me/79184029932'],['https://studio.test/mari-limar/index.html#services'],['https://studio.test/mari-limar/file.pdf'],['https://studio.test/other/about.html'],['https://studio.test/mari-limar/kitchens.html',{download:''}],['https://studio.test/mari-limar/kitchens.html',{target:'_blank'}],['https://studio.test/mari-limar/kitchens.html',{rel:'external'}],['https://studio.test/mari-limar/kitchens.html',{'data-no-transition':''}]];
 for(const [href,attrs] of cases){assert.equal(harness().click(href,attrs).prevented,false,href);}
 for(const e of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}])assert.equal(harness().click('https://studio.test/mari-limar/kitchens.html',{},e).prevented,false);
});
test('View Transitions and CSS fallback both navigate; rejected API cannot stall navigation',()=>{
 for(const vt of [false,true,'throw']){const h=harness({vt});h.click('https://studio.test/mari-limar/about.html');assert.ok(h.rootClasses.has('pm-exit'));h.run(380);assert.equal(h.navigations.length,1);}
});
test('double clicks do not schedule multiple navigations',()=>{const h=harness();h.click('https://studio.test/mari-limar/about.html');h.click('https://studio.test/mari-limar/blog.html');h.run(380);assert.equal(h.navigations.length,1);assert.match(h.navigations[0],/about.html$/);});
test('watchdog, failed assignment, and BFCache restore release the cover',()=>{
 for(const mode of ['watchdog','assignment','bfcache']){const h=harness({assignFails:mode==='assignment'});h.click('https://studio.test/mari-limar/about.html');if(mode==='watchdog')h.run(1800);if(mode==='assignment')h.run(380);if(mode==='bfcache')h.winEvents.pageshow({persisted:true});assert.equal(h.rootClasses.has('pm-exit'),false);}
});
test('reduced motion and missing stylesheet keep fully native navigation',()=>{for(const opts of [{reduced:true},{cssMissing:true}]){const h=harness(opts);assert.equal(h.click('https://studio.test/mari-limar/about.html').prevented,false);}});
test('blocked sessionStorage still permits CSS fallback and navigation',()=>{const h=harness({storageFails:true});assert.equal(h.click('https://studio.test/mari-limar/about.html').prevented,true);h.run(380);assert.equal(h.navigations.length,1);});
test('arrival marker only matches its destination and expires safely',()=>{
 const marker={path:'/mari-limar/index.html',search:'',time:Date.now()};const h=harness({marker});assert.ok(h.rootClasses.has('pm-arrival'));h.frames();assert.ok(h.rootClasses.has('pm-enter'));h.run(520);assert.equal(h.rootClasses.size,0);
 for(const patch of [{path:'/mari-limar/about.html'},{time:Date.now()-10000},{search:'?different'}])assert.equal(harness({marker:{...marker,...patch}}).rootClasses.has('pm-arrival'),false);
});
test('text animates once; all photos remain immediately visible and are never observed',()=>{
 const h=harness({targets:[{tagName:'H2'},{tagName:'IMG',complete:true},{tagName:'IMG',excluded:true},{tagName:'P',top:900,bottom:1000}]});
 // complete is a DOM property, not an HTML attribute.
 h.nodes.forEach(n=>{n.complete=true;});
 const entries=h.nodes.map(target=>({target,isIntersecting:true}));h.io.cb(entries.filter(e=>h.io.targets.has(e.target)));assert.equal(h.animations.length,1);assert.equal(h.io.targets.has(h.nodes[1]),false);assert.equal(h.io.targets.has(h.nodes[2]),false);h.io.cb(entries.filter(e=>h.io.targets.has(e.target)));assert.equal(h.animations.length,1);
 h.reduced.matches=true;h.reduced.onchange();assert.ok(h.animations.every(a=>a.cancelled));
});
test('mobile timing is shorter and a changed preference preserves accepted navigation',()=>{const h=harness({mobile:true});h.click('https://studio.test/mari-limar/about.html');h.reduced.matches=true;h.reduced.onchange();h.run(300);assert.equal(h.navigations.length,1);});
