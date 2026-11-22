/* One first-screen entrance; native links navigate without an artificial delay. */
(() => {
 'use strict';
 const root=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let entrance=null;
 function reset(){
  root.classList.remove('pm-arrival','pm-enter','pm-exit','pm-vt');
  try{sessionStorage.removeItem('mari-limar-motion-transfer-v1');}catch(_){}
 }
 reset();
 function init(){
  const curtain=document.querySelector('.pm-curtain');
  if(curtain)curtain.hidden=true;
  if(reduced.matches||!Element.prototype.animate)return;
  const navigation=performance.getEntriesByType('navigation')[0];
  if(navigation&&navigation.type==='back_forward')return;
  const title=document.querySelector('main h1');
  if(!title)return;
  const copy=title.closest('.hero-inner,.hero-content,.ex-hero-copy,.ab-hero-copy')||title;
  const rect=copy.getBoundingClientRect();
  if(rect.bottom<=0||rect.top>=innerHeight)return;
  entrance=copy.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.16,1,.3,1)'});
  entrance.finished.then(()=>{entrance=null;},()=>{entrance=null;});
 }
 reduced.addEventListener('change',()=>{if(reduced.matches&&entrance)entrance.cancel();});
 window.addEventListener('pageshow',reset);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
