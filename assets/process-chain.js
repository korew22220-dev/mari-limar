/* Progressive enhancement: content is visible without JS; each step starts on entry. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches || !('IntersectionObserver' in window) || !Element.prototype.animate)return;
 const running=new Set();
 const observers=[];
 document.querySelectorAll('[data-process-chain]').forEach(chain=>{
   let nextStart=0;
   const observer=new IntersectionObserver(entries=>{
     entries.filter(e=>e.isIntersecting).sort((a,b)=>[...chain.children].indexOf(a.target)-[...chain.children].indexOf(b.target)).forEach(entry=>{
       observer.unobserve(entry.target);
       if(reduced.matches)return;
       const now=performance.now(),delay=Math.max(0,nextStart-now);
       nextStart=now+delay+240;
       const animation=entry.target.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
       running.add(animation);
       animation.finished.then(()=>{running.delete(animation);animation.cancel();},()=>running.delete(animation));
     });
   },{threshold:.15,rootMargin:'0px 0px -5% 0px'});
   [...chain.children].forEach(step=>observer.observe(step));
   observers.push(observer);
 });
 reduced.addEventListener('change',()=>{if(reduced.matches){observers.forEach(o=>o.disconnect());running.forEach(a=>a.cancel());running.clear();}});
})();
