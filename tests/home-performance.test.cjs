'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function webpWidth(buffer){
 assert.equal(buffer.toString('ascii',0,4),'RIFF');assert.equal(buffer.toString('ascii',8,12),'WEBP');
 for(let offset=12;offset+8<=buffer.length;){
  const kind=buffer.toString('ascii',offset,offset+4),length=buffer.readUInt32LE(offset+4),start=offset+8;
  if(kind==='VP8X')return buffer.readUIntLE(start+4,3)+1;
  if(kind==='VP8 ')return buffer.readUInt16LE(start+6)&0x3fff;
  if(kind==='VP8L')return (buffer.readUInt32LE(start+1)&0x3fff)+1;
  offset=start+length+(length%2);
 }
 throw new Error('No WebP image chunk');
}
test('every homepage photograph has local responsive candidates and accurate width descriptors',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const tags=html.match(/<img\b[^>]+>/g);
 for(const tag of tags){
  assert.match(tag,/loading="lazy"/);
  assert.match(tag,/sizes="[^\"]+"/);
  const candidates=tag.match(/srcset="([^\"]+)"/)[1].split(', ');
  assert.ok(candidates.length>=2,'at least two responsive sizes per photo');
  assert.equal(new Set(candidates.map(c=>c.split(' ')[1])).size,candidates.length,'unique width descriptors');
  for(const candidate of candidates){const [file,width]=candidate.split(' ');assert.ok(fs.existsSync(path.join(root,file)),file);assert.match(width,/^\d+w$/);assert.equal(webpWidth(fs.readFileSync(path.join(root,file))),Number(width.slice(0,-1)),file+' actual width');}
 }
});
test('hero video pauses offscreen, hidden and reduced motion, then resumes without resetting time',()=>{
 const source=fs.readFileSync(path.join(root,'assets/site.js'),'utf8');
 const videoBlock=source.slice(source.indexOf("  const video = document.querySelector("),source.lastIndexOf('})();'));
 let plays=0,pauses=0,observer;const documentEvents={},windowEvents={};
 const video={currentTime:12,muted:false,play(){plays++;return Promise.resolve();},pause(){pauses++;}};
 const reduced={matches:false,addEventListener(n,cb){this.change=cb;}};
 const document={hidden:false,querySelector:()=>video,addEventListener:(n,cb)=>documentEvents[n]=cb};
 const window={IntersectionObserver:true,matchMedia:()=>reduced,addEventListener:(n,cb)=>windowEvents[n]=cb};
 class IO{constructor(cb){observer=cb;}observe(){}}
 vm.runInNewContext(videoBlock,{document,window,IntersectionObserver:IO});
 assert.equal(plays,1);observer([{isIntersecting:false}]);assert.equal(pauses,1);
 observer([{isIntersecting:true}]);assert.equal(plays,2);
 document.hidden=true;documentEvents.visibilitychange();assert.equal(pauses,2);
 document.hidden=false;documentEvents.visibilitychange();assert.equal(plays,3);
 reduced.matches=true;reduced.change();assert.equal(pauses,3);
 reduced.matches=false;reduced.change();assert.equal(plays,4);
 windowEvents.pagehide();assert.equal(pauses,4);windowEvents.pageshow();assert.equal(plays,5);
 assert.equal(video.currentTime,12);
});
