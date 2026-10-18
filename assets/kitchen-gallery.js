/* Approved demo interactions; fixed coordinates are rendered in index.html, without saved overrides. */
(function () {
 'use strict';
 document.querySelectorAll('[data-kitchen-gallery]').forEach(function (gallery) {
  var track=gallery.querySelector('.kg-track');
  var slides=Array.from(track.querySelectorAll('.kg-slide'));
  if (!slides.length) return;
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var reasons=new Set(['offscreen']);
  var active=0, timer=0, scrollTimer=0, touchTimer=0, selected=null;
  var play=gallery.querySelector('.kg-play');
  function stop(){clearTimeout(timer);timer=0;}
  function schedule(){
   stop();
   if(!reduced.matches&&!document.hidden&&!reasons.size)timer=setTimeout(function(){go((active+1)%slides.length);},4700);
  }
  function pause(reason){reasons.add(reason);stop();}
  function resume(reason){reasons.delete(reason);schedule();}
  function closeDetails(restoreFocus){
   var previous=selected;
   gallery.querySelectorAll('.kg-detail').forEach(function(card){card.hidden=true;});
   gallery.querySelectorAll('.kg-dot').forEach(function(dot){dot.setAttribute('aria-expanded','false');});
   selected=null;
   if(restoreFocus&&previous)previous.focus({preventScroll:true});
   resume('detail');
  }
  function setActive(index){
   active=index;
   slides.forEach(function(slide,i){slide.classList.toggle('kg-active',i===active);});
   gallery.querySelector('.kg-count').textContent=String(active+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
   gallery.querySelector('.kg-progress span').style.width=((active+1)/slides.length*100)+'%';
  }
  function targetLeft(slide){return track.scrollLeft+slide.getBoundingClientRect().left-track.getBoundingClientRect().left;}
  function go(index){
   closeDetails(false);
   index=(index+slides.length)%slides.length;
   setActive(index);
   track.scrollTo({left:targetLeft(slides[index]),behavior:reduced.matches?'auto':'smooth'});
   schedule();
  }
  function settled(){
   clearTimeout(scrollTimer);
   var nearest=0,distance=Infinity;
   slides.forEach(function(slide,i){var d=Math.abs(slide.getBoundingClientRect().left-track.getBoundingClientRect().left);if(d<distance){distance=d;nearest=i;}});
   if(nearest!==active){closeDetails(false);setActive(nearest);}
   resume('scroll');
  }
  gallery.addEventListener('click',function(event){
   var dot=event.target.closest('.kg-dot');
   if(dot&&gallery.contains(dot)){
    var wasSelected=dot===selected;
    var slideIndex=slides.indexOf(dot.closest('.kg-slide'));
    if(slideIndex>=0&&slideIndex!==active)go(slideIndex);
    closeDetails(false);
    if(wasSelected)return;
    var card=document.getElementById(dot.getAttribute('aria-controls'));
    card.querySelector('strong').textContent=dot.dataset.title;
    card.querySelector('p').textContent=dot.dataset.body;
    // Opposite side keeps the selected marker available for a second click.
    card.style.left=parseFloat(dot.style.left)>=50?'3%':'auto';
    card.style.right=parseFloat(dot.style.left)>=50?'auto':'3%';
    card.hidden=false;selected=dot;dot.setAttribute('aria-expanded','true');pause('detail');
   }else if(event.target.closest('.kg-close'))closeDetails(true);
  });
  document.addEventListener('click',function(event){
   if(selected&&!event.target.closest('.kg-detail,.kg-dot'))closeDetails(false);
  });
  document.addEventListener('keydown',function(event){
   if(event.key==='Escape'&&selected){closeDetails(true);event.preventDefault();return;}
   if(!gallery.contains(document.activeElement))return;
   // A focused card may contain selectable, scrollable text; leave its keys alone.
   if(event.target.closest('.kg-detail'))return;
   if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
    event.preventDefault();go(active+(event.key==='ArrowRight'?1:-1));
   }
  });
  gallery.querySelector('[data-kg-prev]').addEventListener('click',function(){go(active-1);});
  gallery.querySelector('[data-kg-next]').addEventListener('click',function(){go(active+1);});
  play.addEventListener('click',function(){
   var paused=!reasons.has('manual');
   play.setAttribute('aria-pressed',String(paused));
   play.setAttribute('aria-label',paused?'Возобновить автопоказ':'Приостановить автопоказ');
   play.textContent=paused?'Продолжить':'Пауза';
   if(paused)pause('manual');else resume('manual');
  });
  gallery.addEventListener('pointerenter',function(event){if(event.pointerType==='mouse'||event.pointerType==='pen')pause('hover');});
  gallery.addEventListener('pointerleave',function(event){if(event.pointerType==='mouse'||event.pointerType==='pen')resume('hover');});
  gallery.addEventListener('focusin',function(event){if(event.target.matches(':focus-visible'))pause('focus');});
  gallery.addEventListener('focusout',function(){requestAnimationFrame(function(){if(!gallery.contains(document.activeElement))resume('focus');});});
  track.addEventListener('touchstart',function(){clearTimeout(touchTimer);pause('touch');},{passive:true});
  track.addEventListener('touchend',function(){touchTimer=setTimeout(function(){resume('touch');},400);},{passive:true});
  track.addEventListener('touchcancel',function(){resume('touch');},{passive:true});
  track.addEventListener('scroll',function(){pause('scroll');clearTimeout(scrollTimer);scrollTimer=setTimeout(settled,180);},{passive:true});
  track.addEventListener('scrollend',settled,{passive:true});
  document.addEventListener('visibilitychange',schedule);
  window.addEventListener('pagehide',stop);
  window.addEventListener('pageshow',schedule);
  reduced.addEventListener('change',schedule);
  if('IntersectionObserver' in window){
   var visibility=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting)resume('offscreen');else pause('offscreen');});},{threshold:.28});
   visibility.observe(gallery);
  }else resume('offscreen');
  // Keep the same model aligned after rotation/resizing, without altering any marker coordinates.
  var width=track.clientWidth;
  if('ResizeObserver' in window)new ResizeObserver(function(){
   if(track.clientWidth!==width){width=track.clientWidth;track.scrollTo({left:targetLeft(slides[active]),behavior:'instant'});}
  }).observe(track);
  setActive(0);gallery.classList.add('kg-ready');schedule();
 });
}());
