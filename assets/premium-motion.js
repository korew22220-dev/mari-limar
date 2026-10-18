/* MARI LIMAR premium motion: no dependencies, no DOM swaps or history rewrites. */
(function(){
  'use strict';
  var root=document.documentElement;
  var script=document.currentScript;
  var base=new URL('../',script.src);
  var key='mari-limar-motion-transfer-v1';
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile=window.matchMedia('(max-width: 650px)');
  var pages=new Set(['index.html','kitchens.html','architecture-design.html','portfolio.html','expertise.html','about.html','contacts.html','blog.html','blog-kitchen-planning.html','blog-interior-materials.html','blog-furniture-architecture.html','blog-furniture-check.html']);
  var arrival=false, busy=false, curtain=null, observer=null, transfer=null;
  var navigationTimer=0, recoveryTimer=0, arrivalTimer=0;
  var running=new Set();
  var seen=new WeakSet();
  function clearMarker(){try{sessionStorage.removeItem(key);}catch(_){}}
  try{
    var pending=JSON.parse(sessionStorage.getItem(key)||'null');
    arrival=!!pending&&!reduced.matches&&pending.path===location.pathname&&pending.search===location.search&&Date.now()-pending.time>=0&&Date.now()-pending.time<8000;
    clearMarker();
  }catch(_){clearMarker();}
  if(arrival){
    root.classList.add('pm-arrival');
    // Even a failed/aborted document parse cannot leave the curtain in place.
    arrivalTimer=window.setTimeout(function(){root.classList.remove('pm-arrival','pm-enter');},1200);
  }
  function reset(){
    window.clearTimeout(navigationTimer);window.clearTimeout(recoveryTimer);window.clearTimeout(arrivalTimer);
    if(transfer){try{transfer.skipTransition();}catch(_){}transfer=null;}
    root.classList.remove('pm-arrival','pm-enter','pm-exit','pm-vt');
    busy=false;
  }
  function validLink(event){
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return null;
    var anchor=event.target instanceof Element?event.target.closest('a[href]'):null;
    if(!anchor||anchor.hasAttribute('download')||anchor.hasAttribute('data-no-transition')||anchor.relList.contains('external'))return null;
    var target=anchor.getAttribute('target');
    if(target&&target.toLowerCase()!=='_self')return null;
    var url;
    try{url=new URL(anchor.href,location.href);}catch(_){return null;}
    if(url.origin!==location.origin||url.username||url.password||!/^https?:$/.test(url.protocol)||!url.pathname.startsWith(base.pathname))return null;
    if(url.pathname===location.pathname&&url.search===location.search)return null;
    var relative=url.pathname.slice(base.pathname.length)||'index.html';
    if(!pages.has(relative))return null;
    return url;
  }
  function leave(event){
    if(reduced.matches||!curtain||getComputedStyle(curtain).position!=='fixed')return;
    var url=validLink(event);
    if(!url)return;
    event.preventDefault();
    if(busy)return;
    busy=true;
    var duration=mobile.matches?300:380;
    try{sessionStorage.setItem(key,JSON.stringify({path:url.pathname,search:url.search,time:Date.now()}));}catch(_){}
    // Navigation and recovery never depend on the View Transition promise.
    recoveryTimer=window.setTimeout(function(){reset();clearMarker();},1800);
    navigationTimer=window.setTimeout(function(){
      try{location.assign(url.href);}catch(_){reset();clearMarker();}
    },duration);
    var cover=function(){root.classList.add('pm-exit');};
    if(typeof document.startViewTransition==='function'){
      try{
        root.classList.add('pm-vt');
        transfer=document.startViewTransition(cover);
        transfer.ready.catch(function(){cover();});
        transfer.finished.catch(function(){});
      }catch(_){root.classList.remove('pm-vt');cover();}
    }else cover();
  }
  function isVisible(element){
    if(!element.isConnected||element.closest('[hidden],.dialog,.ml-compare')||!element.getClientRects().length)return false;
    var rect=element.getBoundingClientRect();
    return rect.bottom>0&&rect.top<window.innerHeight;
  }
  function play(element,kind,delay){
    if(reduced.matches||typeof element.animate!=='function'||!isVisible(element))return;
    var small=mobile.matches;
    var duration=kind==='photo'?(small?780:1120):kind==='heading'?(small?720:960):(small?520:700);
    var distance=kind==='heading'?(small?22:34):(small?14:22);
    var frames;
    if(kind==='photo')frames=[
      {opacity:0,transform:'scale(1.06)',clipPath:'inset(100% 3% 3% 3%)'},
      {opacity:1,offset:.4},
      {opacity:1,transform:'scale(1)',clipPath:'inset(0% 0% 0% 0%)'}
    ];
    else if(kind==='heading')frames=[{opacity:0,transform:'translateY('+distance+'px)',clipPath:'inset(100% 0 0 0)'},{opacity:1,transform:'translateY(0)',clipPath:'inset(0% 0 0 0)'}];
    else frames=[{opacity:0,transform:'translateY('+distance+'px)'},{opacity:1,transform:'translateY(0)'}];
    try{
      var animation=element.animate(frames,{duration:duration,delay:delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
      running.add(animation);
      animation.finished.then(function(){running.delete(animation);animation.cancel();},function(){running.delete(animation);});
    }catch(_){/* Visible base styles are the fallback, never a hidden class. */}
  }
  function setupScroll(){
    if(reduced.matches||!('IntersectionObserver' in window)||!Element.prototype.animate)return;
    var main=document.querySelector('main');
    if(!main)return;
    var targets=main.querySelectorAll('.overline,.eyebrow,h1,h2,h3,p,img,.ml-button');
    var ranks={label:0,heading:100,copy:220,photo:320,button:420};
    var targetsData=new WeakMap();
    var cardSelector='.ml-direction,.ml-kitchen-preview,.blog-card,.ml-journal-card,.model-card,.port-card,.concept-card,.arch-value,.step,.expertise-item,.contact-option';
    observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        var el=entry.target;
        // Hidden filters, modal photos, and initially unloaded lazy images stay intact.
        if(el.closest('[hidden]'))return;
        observer.unobserve(el);
        if(seen.has(el))return;
        seen.add(el);
        var data=targetsData.get(el);
        if(el.tagName==='IMG'&&!el.complete){
          el.addEventListener('load',function(){play(el,data.kind,0);},{once:true});
          return;
        }
        play(el,data.kind,data.delay);
      });
    },{threshold:.08,rootMargin:'0px 0px -3% 0px'});
    targets.forEach(function(el){
      if(el.closest('.ml-compare,.dialog')||(el.tagName==='IMG'&&el.closest('.hero'))||el.classList.contains('sr-only')||el.closest('.sr-only'))return;
      if(el.tagName==='P'&&el.querySelector('.ml-button'))return;
      var kind=el.tagName==='IMG'?'photo':/^H[1-3]$/.test(el.tagName)?'heading':el.classList.contains('ml-button')?'button':el.matches('.overline,.eyebrow')?'label':'copy';
      var card=el.closest(cardSelector),index=0;
      if(card&&card.parentElement)index=Math.max(0,[...card.parentElement.children].filter(function(x){return x.matches(cardSelector);}).indexOf(card));
      // Stagger columns, without accumulating seconds of delay in long catalogues.
      var columns=mobile.matches?1:window.innerWidth<1100?2:4;
      var offset=(index%columns)*90;
      var delay=Math.round((ranks[kind]+offset)*(mobile.matches?.65:1));
      if(arrival&&isVisible(el))delay+=mobile.matches?180:260;
      targetsData.set(el,{kind:kind,delay:delay});observer.observe(el);
    });
  }
  function init(){
    curtain=document.querySelector('.pm-curtain');
    if(curtain&&getComputedStyle(curtain).position==='fixed'){
      curtain.hidden=false;
      document.addEventListener('click',leave);
      if(arrival&&!reduced.matches){
        requestAnimationFrame(function(){requestAnimationFrame(function(){
          root.classList.add('pm-enter');root.classList.remove('pm-arrival');
          window.clearTimeout(arrivalTimer);
          arrivalTimer=window.setTimeout(function(){root.classList.remove('pm-enter');},520);
        });});
      }else reset();
    }else{curtain=null;reset();}
    setupScroll();
  }
  window.addEventListener('pageshow',function(event){if(event.persisted){reset();clearMarker();}});
  window.addEventListener('pagehide',function(){window.clearTimeout(navigationTimer);window.clearTimeout(recoveryTimer);});
  function preferenceChanged(){
    if(!reduced.matches)return;
    if(observer)observer.disconnect();
    running.forEach(function(a){a.cancel();});running.clear();
    // Let an already accepted navigation complete; only skip its animation.
    if(busy){root.classList.remove('pm-exit','pm-vt');if(transfer)try{transfer.skipTransition();}catch(_){} }
    else reset();
  }
  if(reduced.addEventListener)reduced.addEventListener('change',preferenceChanged);
  else if(reduced.addListener)reduced.addListener(preferenceChanged);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}());
