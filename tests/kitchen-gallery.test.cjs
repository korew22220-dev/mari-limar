'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/kitchen-gallery.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
// Boundary harness for interaction state, not a rendering engine or touch-device emulator.
function harness(){
 const timers=new Map();let seq=0,observer;
 class E{
  constructor(kind){this.kind=kind;this.events={};this.attrs={};this.style={};this.hidden=true;this.dataset={};this.classList={add(){},toggle(){}};}
  addEventListener(n,f){(this.events[n]??=[]).push(f);}
  removeEventListener(n,f){this.events[n]=(this.events[n]||[]).filter(fn=>fn!==f);}
  fire(n,extra={}){for(const f of this.events[n]||[])f({target:this,...extra});}
  closest(s){return s.split(',').some(x=>x.trim()===this.kind)?this:null;}
  getAttribute(n){return this.attrs[n];}setAttribute(n,v){this.attrs[n]=v;}
  matches(){return false;}focus(){doc.activeElement=this;}
 }
 const gallery=new E('.kg-gallery'),track=new E('.kg-track'),count=new E(),progress=new E(),prev=new E(),next=new E(),play=new E();
 track.scrollLeft=0;track.clientWidth=1200;track.getBoundingClientRect=()=>({left:0});
 track.scrollTo=({left})=>{track.scrollLeft=left;};
 const slides=Array.from({length:5},(_,i)=>{
  const el=new E('.kg-slide');el.getBoundingClientRect=()=>({left:i*1022-track.scrollLeft});el.img=new E();el.img.complete=true;el.img.naturalWidth=1492;el.querySelector=()=>el.img;return el;
 });
 const cards=slides.map((_,i)=>{
  const el=new E('.kg-detail');el.id='card'+i;el.title=new E();el.body=new E();
  el.querySelector=s=>s==='strong'?el.title:el.body;return el;
 });
 const close=new E('.kg-close');
 const dots=slides.flatMap((_,i)=>Array.from({length:3},(_,j)=>{
  const el=new E('.kg-dot');el.attrs['aria-controls']='card'+i;el.style.left=(j*30+20)+'%';el.parentSlide=slides[i];el.closest=s=>s==='\.kg-slide'?el.parentSlide:E.prototype.closest.call(el,s);el.dataset={title:`${i}-${j}`,body:`Body ${i}-${j}`};return el;
 }));
 gallery.querySelector=s=>({'.kg-track':track,'.kg-play':play,'.kg-count':count,'.kg-progress span':progress,'[data-kg-prev]':prev,'[data-kg-next]':next}[s]);
 gallery.querySelectorAll=s=>s==='.kg-detail'?cards:dots;
 gallery.contains=el=>[gallery,track,prev,next,play,close,...dots,...cards].includes(el);
 track.querySelectorAll=()=>slides;
 const doc=new E();doc.querySelectorAll=()=>[gallery];doc.getElementById=id=>cards.find(c=>c.id===id);doc.hidden=false;
 const win=new E();win.IntersectionObserver=true;
 const reduced={matches:false,addEventListener(n,fn){this.change=fn;}};
 class IO{constructor(fn,options){if(!options.rootMargin)observer=fn;}observe(){}disconnect(){}}
 class RO{constructor(fn){this.fn=fn;}observe(){}}
 vm.runInNewContext(source,{document:doc,window:win,matchMedia:()=>reduced,IntersectionObserver:IO,ResizeObserver:RO,requestAnimationFrame:fn=>fn(),setTimeout:(fn,ms)=>{timers.set(++seq,{fn,ms});return seq;},clearTimeout:id=>timers.delete(id)});
 const pending=()=>[...timers.values()].some(t=>t.ms===4700);
 const run=ms=>{for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}};
 const click=el=>{el.fire('click');gallery.fire('click',{target:el});doc.fire('click',{target:el});};
 return {slides,gallery,track,count,prev,next,play,cards,dots,close,doc,reduced,win,pending,run,click,visible:v=>observer([{isIntersecting:v}])};
}
test('five original photographs, fifteen fixed markers, no editor, valid catalog links',()=>{
 const positions=['55.43,42.06','89.13,41.55','34.2,74.19','49.96,63.84','9.96,34.11','89.29,46.85','54.64,38.13','90.07,32.16','35.94,61.33','27.06,58.88','78.19,21.8','60.9,42.17','68.75,39.18','10.56,56.86','46.9,50.66'];
 assert.deepEqual([...html.matchAll(/class="kg-dot" style="left:([0-9.]+)%;top:([0-9.]+)%"/g)].map(m=>m[1]+','+m[2]),positions);
 assert.equal((html.match(/class="kg-dot"/g)||[]).length,15);
 for(const slug of ['luna','ferrata','progma','monticelli','lange']){
  assert.match(html,new RegExp(`src="assets/${slug}\\.webp"`));
  assert.ok(fs.existsSync(path.join(root,'assets',slug+'.webp')));
  assert.ok(fs.readFileSync(path.join(root,'kitchens.html'),'utf8').includes(`id="model-${slug}"`));
  assert.ok(html.includes(`href="kitchens.html#model-${slug}"`));
 }
 assert.doesNotMatch(source,/localStorage\.|editHotspots|exportHotspots/);
});
test('autoplay waits for visibility, advances at 4700ms, wraps to first',()=>{
 const h=harness();assert.ok(!h.pending());h.visible(true);assert.ok(h.pending());
 for(let i=1;i<=5;i++){h.run(4700);assert.equal(h.count.textContent,`${String(i%5+1).padStart(2,'0')} / 05`);}
});
test('all 15 cards show their own description and toggle closed',()=>{
 const h=harness();h.visible(true);
 h.dots.forEach((dot,i)=>{h.click(dot);const card=h.cards[Math.floor(i/3)];assert.equal(card.title.textContent,dot.dataset.title);assert.equal(card.body.textContent,dot.dataset.body);assert.ok(!card.hidden);assert.ok(!h.pending());h.click(dot);assert.ok(card.hidden);assert.ok(h.pending());});
});
test('switch point, interact with card text, close outside, cross and Escape',()=>{
 const h=harness();h.visible(true);h.click(h.dots[0]);h.click(h.dots[4]);assert.ok(h.cards[0].hidden);assert.ok(!h.cards[1].hidden);
 h.doc.fire('click',{target:h.cards[1]});assert.ok(!h.cards[1].hidden);
 h.doc.fire('click',{target:h.track});assert.ok(h.cards[1].hidden);
 h.click(h.dots[8]);h.click(h.close);assert.ok(h.cards[2].hidden);
 h.click(h.dots[12]);h.doc.fire('keydown',{key:'Escape',preventDefault(){}});assert.ok(h.cards[4].hidden);
});
test('multiple pause reasons never resume prematurely',()=>{
 const h=harness();h.visible(true);h.gallery.fire('pointerenter',{pointerType:'mouse'});h.click(h.dots[0]);
 h.gallery.fire('pointerleave',{pointerType:'mouse'});assert.ok(!h.pending());
 h.visible(false);h.click(h.dots[0]);assert.ok(!h.pending());h.visible(true);assert.ok(h.pending());
 h.doc.hidden=true;h.doc.fire('visibilitychange');assert.ok(!h.pending());h.doc.hidden=false;h.doc.fire('visibilitychange');assert.ok(h.pending());
 h.reduced.matches=true;h.reduced.change();assert.ok(!h.pending());h.reduced.matches=false;h.reduced.change();assert.ok(h.pending());
 h.click(h.play);assert.ok(!h.pending());h.click(h.play);assert.ok(h.pending());
});
test('arrows, keyboard and native swipe scroll update the model',()=>{
 const h=harness();h.visible(true);h.click(h.next);assert.equal(h.count.textContent,'02 / 05');h.click(h.prev);assert.equal(h.count.textContent,'01 / 05');
 h.doc.activeElement=h.track;h.doc.fire('keydown',{target:h.track,key:'ArrowLeft',preventDefault(){}});assert.equal(h.count.textContent,'05 / 05');
 h.track.fire('touchstart');assert.ok(!h.pending());h.track.scrollLeft=2044;h.track.fire('scroll');h.track.fire('touchend');h.run(180);assert.equal(h.count.textContent,'03 / 05');assert.ok(!h.pending());h.run(400);assert.ok(h.pending());
});

test('a cold slide loads before navigation, and loading errors do not trap controls',()=>{
 const h=harness();h.visible(true);h.slides[1].img.complete=false;h.slides[1].img.naturalWidth=0;
 h.click(h.next);assert.equal(h.count.textContent,'01 / 05');assert.equal(h.slides[1].img.loading,'eager');assert.ok(!h.pending());
 h.slides[1].img.fire('error');assert.equal(h.count.textContent,'01 / 05');assert.ok(h.pending());
 h.click(h.next);h.slides[1].img.fire('load');assert.equal(h.count.textContent,'02 / 05');
});
test('late automatic image loading respects hover and touch cancellation',()=>{
 const h=harness();h.visible(true);h.slides[1].img.complete=false;h.slides[1].img.naturalWidth=0;
 h.run(4700);h.gallery.fire('pointerenter',{pointerType:'mouse'});h.slides[1].img.fire('load');assert.equal(h.count.textContent,'01 / 05');
 h.gallery.fire('pointerleave',{pointerType:'mouse'});h.click(h.next);h.track.fire('touchstart');h.slides[1].img.fire('load');assert.equal(h.count.textContent,'01 / 05');
});
