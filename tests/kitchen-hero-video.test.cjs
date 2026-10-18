'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'assets/kitchen-hero-video.js'),'utf8');
function setup({width=1440,reduced=false,visible=true,reject=false}={}){
 const events={},docEvents={},winEvents={},classes=new Set(),loads=[];
 let intersection,plays=0,pauses=0;
 const mobile={matches:width<=767,addEventListener:(_,cb)=>mobile.change=cb};
 const motion={matches:reduced,addEventListener:(_,cb)=>motion.change=cb};
 const hero={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},getBoundingClientRect:()=>({top:visible?0:2000,bottom:visible?640:2640})};
 const video={dataset:{desktopSrc:'desktop.mp4',mobileSrc:'mobile.mp4'},paused:true,currentTime:0,duration:27.64,readyState:3,
 closest:()=>hero,addEventListener:(n,cb)=>events[n]=cb,removeAttribute(n){if(n==='src')delete this.src;},
 load(){loads.push(this.src||null);this.currentTime=0;},pause(){this.paused=true;pauses++;},
 play(){plays++;if(reject)return Promise.reject(new Error('Autoplay blocked'));this.paused=false;return Promise.resolve();}};
 const document={hidden:false,querySelector:()=>video,addEventListener:(n,cb)=>docEvents[n]=cb};
 const window={innerHeight:900,IntersectionObserver:true,matchMedia:q=>q.includes('767')?mobile:motion,addEventListener:(n,cb)=>winEvents[n]=cb};
 class IO{constructor(cb){intersection=cb;}observe(){}}
 vm.runInNewContext(code,{document,window,IntersectionObserver:IO,Promise,Number});
 return {video,mobile,motion,document,events,docEvents,winEvents,loads,classes,observe:v=>intersection([{isIntersecting:v}]),plays:()=>plays,pauses:()=>pauses};
}
for(const [width,expected] of [[1920,'desktop.mp4'],[1440,'desktop.mp4'],[768,'desktop.mp4'],[767,'mobile.mp4'],[390,'mobile.mp4'],[375,'mobile.mp4']]){
 test(`width ${width} selects only ${expected}`,()=>{const s=setup({width});assert.deepEqual(s.loads,[expected]);assert.equal(s.video.src,expected);});
}
test('reduced motion starts without downloading a video; toggling unloads it and shows poster',()=>{
 const s=setup({reduced:true});assert.deepEqual(s.loads,[]);assert.equal(s.plays(),0);
 s.motion.matches=false;s.motion.change();assert.deepEqual(s.loads,['desktop.mp4']);
 s.events.playing();assert.ok(s.classes.size);
 s.motion.matches=true;s.motion.change();assert.equal(s.video.src,undefined);assert.equal(s.classes.size,0);assert.equal(s.video.paused,true);
});
test('resize changes a single source, retaining playback position',()=>{
 const s=setup();s.video.currentTime=12;s.mobile.matches=true;s.mobile.change();
 assert.deepEqual(s.loads,['desktop.mp4','mobile.mp4']);s.events.loadedmetadata();assert.equal(s.video.currentTime,12);
 s.events.playing();assert.ok(s.classes.has('kh-video-hero--playing'));
});
test('offscreen start defers transfer, visibility and history lifecycle pause and resume',async()=>{
 const s=setup({visible:false});assert.deepEqual(s.loads,[]);s.observe(true);await new Promise(setImmediate);
 assert.equal(s.plays(),1);s.video.currentTime=9;s.observe(false);assert.ok(s.video.paused);
 s.mobile.matches=true;s.mobile.change();assert.deepEqual(s.loads,['desktop.mp4']);
 s.observe(true);await new Promise(setImmediate);assert.equal(s.video.src,'mobile.mp4');
 s.events.loadedmetadata();assert.equal(s.video.currentTime,9);
 s.document.hidden=true;s.docEvents.visibilitychange();assert.ok(s.video.paused);
 s.document.hidden=false;s.docEvents.visibilitychange();await new Promise(setImmediate);assert.equal(s.video.paused,false);
 s.winEvents.pagehide();assert.ok(s.video.paused);s.winEvents.pageshow();await new Promise(setImmediate);assert.equal(s.video.paused,false);
});
test('blocked autoplay and media error preserve visible fallback',async()=>{
 const s=setup({reject:true});await new Promise(setImmediate);assert.equal(s.classes.size,0);
 const t=setup();t.events.playing();assert.ok(t.classes.size);t.events.error();assert.equal(t.classes.size,0);
 await new Promise(setImmediate);t.observe(false);t.observe(true);assert.equal(t.plays(),1);
});
test('late playing event cannot reveal video after reduced motion was enabled',()=>{
 const s=setup();s.motion.matches=true;s.motion.change();s.events.playing();assert.equal(s.classes.size,0);assert.ok(s.video.paused);
});
test('HTML reserves hero through existing CSS, includes responsive no-JS poster and safe native attributes',()=>{
 const html=fs.readFileSync(path.join(root,'kitchens.html'),'utf8');
 assert.match(html,/<picture class="kh-video-hero__poster"/);
 assert.match(html,/<source media="\(max-width: 767px\)"/);
 const tag=html.match(/<video\b[^>]+>/s)[0];assert.doesNotMatch(tag,/(?<!-)\bsrc=|\bcontrols\b/);
 for(const attr of ['autoplay','muted','loop','playsinline','preload="metadata"'])assert.ok(tag.includes(attr));
 const shared=fs.readFileSync(path.join(root,'assets/site.js'),'utf8');assert.ok(shared.includes("video:not([data-kitchen-hero-video])"));
 for(const file of ['kitchens-rimi-desktop.mp4','kitchens-rimi-mobile.mp4','kitchens-rimi-desktop-poster.webp','kitchens-rimi-mobile-poster.webp'])assert.ok(fs.existsSync(path.join(root,'assets/videos',file)));
});
