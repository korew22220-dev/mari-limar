(function(wp){
const el=wp.element.createElement,Fragment=wp.element.Fragment;
wp.blocks.registerBlockType('marli/section',{
 apiVersion:3,title:'Блок Марли Лимарт',icon:'layout',category:'design',
 attributes:{html:{type:'string',default:''},label:{type:'string',default:'Блок страницы'},hidden:{type:'boolean',default:false}},
 edit:function(props){
 const a=props.attributes, doc=new DOMParser().parseFromString(a.html,'text/html');
 const texts=Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,p,a,figcaption,li,label')).filter(n=>n.textContent.trim()&&!n.querySelector('h1,h2,h3,h4,p,a,li,label,input,select,textarea')).slice(0,100);
 const imgs=Array.from(doc.body.querySelectorAll('img')).slice(0,40);
 const save=()=>props.setAttributes({html:doc.body.innerHTML});
 return el('div',wp.blockEditor.useBlockProps({style:{padding:'20px',border:'1px solid #bbb',opacity:a.hidden?.45:1}}),
 el('strong',{},a.label),el(wp.components.ToggleControl,{label:'Показывать блок',checked:!a.hidden,onChange:v=>props.setAttributes({hidden:!v})}),
 texts.map((n,i)=>el(wp.components.TextareaControl,{key:'t'+i,label:n.tagName.toLowerCase()+' · '+n.textContent.trim().slice(0,45),value:n.innerHTML,onChange:v=>{n.innerHTML=v;save();}})),
 imgs.map((n,i)=>el('div',{key:'i'+i},el('img',{src:n.src.replace(/^assets\//,window.mlThemeUrl+'/assets/'),style:{maxWidth:'180px',height:'90px',objectFit:'cover'}}),el(wp.blockEditor.MediaUploadCheck,{},el(wp.blockEditor.MediaUpload,{allowedTypes:['image'],onSelect:m=>{n.setAttribute('src',m.url);n.removeAttribute('srcset');n.setAttribute('alt',m.alt||'');save();},render:({open})=>el(wp.components.Button,{onClick:open,variant:'secondary'},'Заменить изображение')})),el(wp.components.TextControl,{label:'Описание фотографии',value:n.getAttribute('alt')||'',onChange:v=>{n.setAttribute('alt',v);save();}}))),
 el(wp.components.PanelBody,{title:'HTML блока',initialOpen:false},el(wp.components.TextareaControl,{value:a.html,onChange:v=>props.setAttributes({html:v})})));
 },save:()=>null
});
})(window.wp);

