(function(wp){
'use strict';
const el=wp.element.createElement,Fragment=wp.element.Fragment;
const {useRef,useState,useEffect,useCallback}=wp.element;
const config=window.mlVisual||{},base=(config.themeUrl||'')+'/';
const textSelector='h1,h2,h3,h4,h5,h6,p,a,li,figcaption,blockquote,dt,dd,span,button';
const previewCSS=`html{scroll-behavior:auto!important}body{margin:0!important;min-height:0!important}main{margin:0!important}*,*::before,*::after{animation:none!important;transition:none!important;cursor:default} [style*="opacity: 0"],.reveal,.pm-reveal,[data-reveal]{opacity:1!important;transform:none!important;visibility:visible!important} [data-mlv-text]:hover{outline:1px dashed #72aee6;outline-offset:4px;cursor:text} [data-mlv-text]:focus{outline:2px solid #2271b1;outline-offset:4px;cursor:text}img,video{cursor:pointer!important}img:hover,video:hover{outline:3px solid #2271b1;outline-offset:-3px}form{pointer-events:none} [data-mlv-selected]{outline:4px solid #2271b1!important;outline-offset:-4px!important} .pm-curtain{display:none!important}`;
function previewDocument(html){
 const escapedBase=base.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
 return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><base href="'+escapedBase+'">'+(config.styles||'')+'<style>'+previewCSS+'</style></head><body class="'+(config.bodyClass||'').replace(/[^\w -]/g,'')+'"><main id="mlv-root">'+html+'</main></body></html>';
}
function Edit(props){
 const {attributes:a,setAttributes}=props,frame=useRef(),stage=useRef(),root=useRef(),last=useRef(a.html),dirty=useRef(false),selection=useRef(null),cleanup=useRef(()=>{});
 const [source,setSource]=useState(()=>previewDocument(a.html)),[media,setMedia]=useState(null),[height,setHeight]=useState(450),[width,setWidth]=useState(1100),[mobile,setMobile]=useState(false);
 const commit=useCallback(()=>{
  if(!dirty.current||!root.current)return;
  const clone=root.current.cloneNode(true);
  clone.querySelectorAll('[data-mlv-text]').forEach(n=>{n.removeAttribute('data-mlv-text');n.removeAttribute('contenteditable');n.removeAttribute('spellcheck');});
  clone.querySelectorAll('[data-mlv-selected]').forEach(n=>n.removeAttribute('data-mlv-selected'));
  const html=clone.innerHTML;last.current=html;dirty.current=false;setAttributes({html});
 },[setAttributes]);
 useEffect(()=>{if(a.html!==last.current){last.current=a.html;setSource(previewDocument(a.html));setMedia(null);}},[a.html]);
 useEffect(()=>{const observer=new ResizeObserver(entries=>setWidth(Math.max(280,entries[0].contentRect.width)));if(stage.current)observer.observe(stage.current);return()=>observer.disconnect();},[]);
 useEffect(()=>()=>cleanup.current(),[]);
 function chooseMedia(node){
  const r=root.current;if(!r)return;
  r.querySelectorAll('[data-mlv-selected]').forEach(n=>n.removeAttribute('data-mlv-selected'));
  node.setAttribute('data-mlv-selected','');selection.current=node;
  setMedia({type:node.tagName.toLowerCase(),src:node.tagName==='IMG'?node.src:node.poster,alt:node.getAttribute('alt')||'',url:node.tagName==='VIDEO'?(node.currentSrc||node.querySelector('source')?.src||node.src):''});
 }
 function updateMedia(file){
  const node=selection.current;if(!node)return;
  if(node.tagName==='IMG'){node.setAttribute('src',file.url);node.removeAttribute('srcset');node.removeAttribute('sizes');node.setAttribute('alt',file.alt||'');node.removeAttribute('width');node.removeAttribute('height');}
  else{node.setAttribute('poster',file.url);}
  dirty.current=true;commit();chooseMedia(node);
 }
 function attach(){
  cleanup.current();const doc=frame.current.contentDocument,r=doc.getElementById('mlv-root');if(!r)return;root.current=r;
  const size=()=>setHeight(Math.max(100,Math.min(2600,Math.ceil(r.getBoundingClientRect().height))));
  r.querySelectorAll(textSelector).forEach(n=>{
   if(!n.textContent.trim()||n.querySelector(textSelector)||n.closest('svg,script,style,form')||n.querySelector('img,video,input,select,textarea'))return;
   n.setAttribute('data-mlv-text','');n.setAttribute('contenteditable','true');n.setAttribute('spellcheck','true');
  });
  const clicked=e=>{wp.data.dispatch('core/block-editor').selectBlock(props.clientId);if(e.target.closest('a,button'))e.preventDefault();const node=e.target.closest('img,video');if(node){e.preventDefault();chooseMedia(node);} };
  const input=()=>{dirty.current=true;commit();size();};
  const paste=e=>{if(!e.target.closest('[data-mlv-text]'))return;e.preventDefault();doc.execCommand('insertText',false,e.clipboardData.getData('text/plain'));};
  r.addEventListener('click',clicked);r.addEventListener('input',input);r.addEventListener('paste',paste);r.addEventListener('focusout',commit);
  r.querySelectorAll('video').forEach(v=>{v.pause();});
  const observer=new ResizeObserver(size);observer.observe(r);doc.fonts?.ready.then(size);size();
  cleanup.current=()=>{observer.disconnect();r.removeEventListener('click',clicked);r.removeEventListener('input',input);r.removeEventListener('paste',paste);r.removeEventListener('focusout',commit);};
 }
 const canvas=mobile?390:1100,scale=Math.min(1,width/canvas);
 return el(Fragment,{},
  el(wp.blockEditor.InspectorControls,{},
   el(wp.components.PanelBody,{title:'Блок страницы',initialOpen:true},
    el(wp.components.TextControl,{label:'Название блока',value:a.label,onChange:label=>setAttributes({label})}),
    el(wp.components.ToggleControl,{label:'Показывать на сайте',checked:!a.hidden,onChange:v=>setAttributes({hidden:!v})}),
    el('p',{},'Нажмите на текст в макете, чтобы изменить его. Нажмите на фотографию, чтобы заменить её.')),
   media&&el(wp.components.PanelBody,{title:media.type==='img'?'Выбранная фотография':'Фоновое видео',initialOpen:true,className:'ml-visual-inspector'},
    media.src&&el('img',{className:'ml-visual-media',src:media.src,alt:media.alt}),
    el(wp.blockEditor.MediaUploadCheck,{},el(wp.blockEditor.MediaUpload,{allowedTypes:['image'],onSelect:updateMedia,render:({open})=>el(wp.components.Button,{onClick:open,variant:'primary'},media.type==='img'?'Заменить фотографию':'Заменить обложку видео')})),
    media.type==='img'&&el(wp.components.TextControl,{label:'Описание фотографии',value:media.alt,onChange:alt=>{selection.current?.setAttribute('alt',alt);dirty.current=true;commit();setMedia({...media,alt});}}),
    media.type==='video'&&el(wp.blockEditor.MediaUploadCheck,{},el(wp.blockEditor.MediaUpload,{allowedTypes:['video'],onSelect:file=>{const n=selection.current;n.querySelectorAll('source').forEach(s=>s.remove());n.setAttribute('src',file.url);dirty.current=true;commit();chooseMedia(n);},render:({open})=>el(wp.components.Button,{onClick:open,variant:'secondary'},'Заменить видео')})))),
  el('div',wp.blockEditor.useBlockProps({className:'ml-visual-block'+(a.hidden?' ml-visual-hidden':'')}),
   el('div',{className:'ml-visual-bar'},el('strong',{},a.label),el('span',{},a.hidden?'Скрыт на сайте':'Текст — нажмите и пишите · Фото — нажмите для замены'),media&&el(wp.blockEditor.MediaUpload,{allowedTypes:['image'],onSelect:updateMedia,render:({open})=>el(wp.components.Button,{onClick:open,variant:'primary'},media.type==='img'?'Заменить фото':'Обложка видео')}),el(wp.components.Button,{onClick:()=>{commit();setMobile(!mobile);},isPressed:mobile,label:'Вид на телефоне',icon:mobile?'desktop':'smartphone'})),
   el('div',{className:'ml-visual-stage',ref:stage,style:{height:height*scale}},el('iframe',{ref:frame,title:'Визуальное редактирование: '+a.label,sandbox:'allow-same-origin',srcDoc:source,onLoad:attach,style:{width:canvas,height:height,transform:'scale('+scale+')'},onFocus:()=>props.onFocus?.()}))));
}
wp.blocks.registerBlockType('marli/section',{apiVersion:3,title:'Блок Марли Лимарт',icon:'layout',category:'design',attributes:{html:{type:'string',default:''},label:{type:'string',default:'Блок страницы'},hidden:{type:'boolean',default:false}},edit:Edit,save:()=>null});
})(window.wp);



