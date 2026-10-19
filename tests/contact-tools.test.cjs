'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const {formatEnquiry,messageLinks,phoneError}=require('../assets/contact-tools.js');
const code=fs.readFileSync(path.join(root,'assets/contact-tools.js'),'utf8');
function harness({clipboard=true,native=true,direct=null,endpoint=''}={}){
 const nodes={},docHandlers={},winHandlers={};let copied='',active;
 class Node{
  constructor(id){this.id=id;this.listeners={};this.dataset={};this.attrs={};this.hidden=false;this.value='';this.error='';this.isConnected=true;this.textContent='';nodes[id]=this;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  async fire(type,event={}){const e={target:this,button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...event};for(const cb of this.listeners[type]||[])await cb(e);return e;}
  setAttribute(n,v){this.attrs[n]=v;} removeAttribute(n){delete this.attrs[n];}
  setCustomValidity(s){this.error=s;}reportValidity(){return !this.error;}
  focus(){active=this;}select(){this.selected=true;}setSelectionRange(a,b){this.range=[a,b];}
  closest(s){return s==='[data-ml-lead]'&&this.dataset.mlLead?this:null;}
  contains(target){return this===target||target.parent===this;}
 }
 for(const id of ['ml-lead-dialog','ml-lead-form','ml-contact-tools','ml-contact-fab','ml-contact-tray','ml-lead-context','ml-lead-ready','ml-lead-message','ml-lead-open-chat','ml-lead-copy-status','ml-lead-phone-error','ml-lead-title','ml-lead-channel-hint','ml-lead-ready-hint','ml-lead-ready-title','ml-lead-copy','ml-lead-edit','ml-lead-submit','ml-lead-send-error','ml-lead-fallback','ml-lead-delivered','ml-lead-delivered-title','ml-lead-done','ml-lead-intro','channel-label','close'])new Node(id);
 const fields={};for(const name of ['name','phone','topic','comment','channel'])fields[name]=new Node(name);
 fields.name.value='Саша';fields.phone.value='+7 (918) 123-45-67';fields.channel.value='whatsapp';
 const dialog=nodes['ml-lead-dialog'];dialog.open=false;dialog.querySelector=()=>nodes.close;dialog.getBoundingClientRect=()=>({left:20,top:20,right:350,bottom:700});
 if(native)dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.fire('close');};
 fields.channel.closest=()=>nodes['channel-label'];
 const form=nodes['ml-lead-form'];form.dataset.mlEndpoint=endpoint;form.elements={namedItem:n=>fields[n]};form.reportValidity=()=>Object.values(fields).every(n=>!n.error);
 nodes['ml-contact-tray'].hidden=true;
 const document={title:'Кухни — MARI LIMAR',body:{style:{overflow:'auto'}},getElementById:id=>nodes[id],addEventListener:(n,fn)=>{(docHandlers[n]??=[]).push(fn);}};
 const window={MariEnquiry:direct,addEventListener:(n,fn)=>winHandlers[n]=fn};
 const navigator=clipboard?{clipboard:{writeText:async s=>{copied=s;}}}:{};
 vm.runInNewContext(code,{document,window,navigator,location:{origin:'https://example.com',pathname:'/kitchen-luna.html'}});
 async function click(target,options={}){const e={target,button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...options};for(const fn of docHandlers.click)await fn(e);return e;}
 function trigger(intent='cost',model='Кухня «Луна»'){const n=new Node('trigger');n.dataset={mlLead:intent,mlModel:model,mlContext:'Коллекции кухонь'};return n;}
 return {nodes,fields,dialog,document,window,click,trigger,active:()=>active,copied:()=>copied,lifecycle:n=>winHandlers[n](),keydown:async e=>{for(const f of docHandlers.keydown)await f(e);}};
}
test('all model enquiries include correct title, topic, contact and page',()=>{
 const models=JSON.parse(fs.readFileSync(path.join(root,'KITCHEN-MODELS.json')));
 for(const m of models){
  const message=formatEnquiry({name:' Саша ',phone:'+7 918 123-45-67',topic:'cost',model:'Кухня «'+m.name+'»',context:'Каталог',comment:'Размер 3 × 4 м',source:'https://example.com/kitchen-'+m.slug+'.html'});
  assert.ok(message.includes('Модель: Кухня «'+m.name+'»'));assert.ok(message.includes('Узнать стоимость кухни'));assert.ok(message.includes('Имя: Саша'));assert.ok(message.includes('Размер 3 × 4 м'));
  assert.equal(new URL(messageLinks(message).whatsapp).searchParams.get('text'),message);
 }
});
test('phone validation accepts international formatting and rejects empty, short and overlong numbers',()=>{
 for(const n of ['+7 (918) 402-99-32','8 800 201-77-67','+1 202 555 0101'])assert.equal(phoneError(n),'');
 for(const n of ['','123','+1234567890123456','call 123456789'])assert.ok(phoneError(n));
});
test('opening from a block prefills model/topic, preserves draft and locks background',async()=>{
 const h=harness(),trigger=h.trigger();h.fields.comment.value='Мой проект';const e=await h.click(trigger);
 assert.ok(e.defaultPrevented);assert.ok(h.dialog.open);assert.equal(h.fields.topic.value,'cost');assert.equal(h.nodes['ml-lead-context'].textContent,'Кухня «Луна»');assert.equal(h.fields.comment.value,'Мой проект');assert.equal(h.document.body.style.overflow,'hidden');assert.equal(h.active(),h.fields.name);
 await h.nodes.close.fire('click');assert.equal(h.document.body.style.overflow,'auto');assert.equal(h.active(),trigger);
});
test('WhatsApp preparation shows preview and exact encoded message without sending or claiming delivery',async()=>{
 const h=harness();await h.click(h.trigger());await h.nodes['ml-lead-form'].fire('submit');
 assert.ok(h.nodes['ml-lead-form'].hidden);assert.equal(h.nodes['ml-lead-ready'].hidden,false);
 assert.equal(new URL(h.nodes['ml-lead-open-chat'].href).searchParams.get('text'),h.nodes['ml-lead-message'].value);
 assert.equal(h.active(),h.nodes['ml-lead-ready-title']);assert.ok(h.nodes['ml-lead-ready-hint'].textContent.includes('отправьте'));
 await h.nodes['ml-lead-edit'].fire('click');assert.equal(h.nodes['ml-lead-form'].hidden,false);assert.equal(h.fields.name.value,'Саша');
});
test('Telegram uses studio contact, explicit copy and chat steps',async()=>{
 const h=harness();await h.click(h.trigger('visit',''));h.fields.channel.value='telegram';await h.fields.channel.fire('change');
 assert.ok(h.nodes['ml-lead-channel-hint'].textContent.includes('скопируйте'));await h.nodes['ml-lead-form'].fire('submit');
 assert.equal(h.nodes['ml-lead-open-chat'].href,'https://t.me/+79184029932');assert.ok(h.nodes['ml-lead-ready-hint'].textContent.includes('Скопируйте'));
 await h.nodes['ml-lead-copy'].fire('click');assert.equal(h.copied(),h.nodes['ml-lead-message'].value);assert.ok(h.nodes['ml-lead-copy-status'].textContent.includes('скопирован'));
});
test('clipboard rejection leaves selectable message and recovery instructions',async()=>{
 const h=harness({clipboard:false});await h.click(h.trigger());await h.nodes['ml-lead-form'].fire('submit');await h.nodes['ml-lead-copy'].fire('click');
 assert.ok(h.nodes['ml-lead-message'].selected);assert.ok(h.nodes['ml-lead-copy-status'].textContent.includes('вручную'));
});
test('invalid input blocks preview, errors clear on input, whitespace-only names rejected',async()=>{
 const h=harness();await h.click(h.trigger());h.fields.phone.value='123';await h.nodes['ml-lead-form'].fire('submit');assert.ok(h.nodes['ml-lead-phone-error'].textContent);assert.equal(h.nodes['ml-lead-form'].hidden,false);
 h.fields.phone.value='+79184029932';await h.fields.phone.fire('input');assert.equal(h.nodes['ml-lead-phone-error'].textContent,'');
 h.fields.name.value='   ';await h.nodes['ml-lead-form'].fire('submit');assert.ok(h.fields.name.error);
 h.fields.name.value='Марина';await h.fields.name.fire('input');await h.nodes['ml-lead-form'].fire('submit');assert.ok(h.nodes['ml-lead-form'].hidden);
});
test('tray toggle, Escape and outside click close reliably; form returns focus to visible floating button',async()=>{
 const h=harness();await h.nodes['ml-contact-fab'].fire('click');assert.equal(h.nodes['ml-contact-tray'].hidden,false);
 await h.keydown({key:'Escape',preventDefault(){}});assert.ok(h.nodes['ml-contact-tray'].hidden);assert.equal(h.active(),h.nodes['ml-contact-fab']);
 await h.nodes['ml-contact-fab'].fire('click');const t=h.trigger();t.parent=h.nodes['ml-contact-tools'];await h.click(t);assert.ok(h.nodes['ml-contact-tray'].hidden);await h.nodes.close.fire('click');assert.equal(h.active(),h.nodes['ml-contact-fab']);
 await h.nodes['ml-contact-fab'].fire('click');await h.click(h.fields.name);assert.ok(h.nodes['ml-contact-tray'].hidden);
});
test('dialog backdrop needs a complete outside gesture; inside content remains open',async()=>{
 const h=harness();await h.click(h.trigger());await h.dialog.fire('pointerdown',{clientX:50,clientY:50});await h.dialog.fire('click',{clientX:0,clientY:0});assert.ok(h.dialog.open);
 await h.dialog.fire('pointerdown',{clientX:0,clientY:0});await h.dialog.fire('click',{clientX:0,clientY:0});assert.equal(h.dialog.open,false);
});
test('modified clicks and browsers without dialog support retain native fallback links',async()=>{
 const h=harness();for(const options of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1}]){const e=await h.click(h.trigger(),options);assert.equal(e.defaultPrevented,false);assert.equal(h.dialog.open,false);}
 const legacy=harness({native:false});const e=await legacy.click(legacy.trigger());assert.equal(e.defaultPrevented,false);
});
test('pagehide closes transient UI and restores scroll for browser history',async()=>{
 const h=harness();await h.click(h.trigger());h.lifecycle('pagehide');
 assert.equal(h.dialog.open,false);assert.equal(h.document.body.style.overflow,'auto');assert.ok(h.nodes['ml-contact-tray'].hidden);
});

test('direct delivery waits for acknowledgement and blocks duplicate submits',async()=>{
 let release,calls=0;
 const direct={configured:()=>true,send:()=>{calls++;return new Promise(r=>release=r);}};
 const h=harness({direct,endpoint:'https://worker.example/enquiry'});
 await h.click(h.trigger());const sending=h.nodes['ml-lead-form'].fire('submit');
 assert.equal(h.nodes['ml-lead-submit'].disabled,true);assert.equal(h.nodes['ml-lead-form'].hidden,false);
 await h.nodes['ml-lead-form'].fire('submit');assert.equal(calls,1);
 release({ok:true});await sending;
 assert.equal(h.nodes['ml-lead-delivered'].hidden,false);assert.equal(h.nodes['ml-lead-form'].hidden,true);assert.equal(h.active(),h.nodes['ml-lead-delivered-title']);
 assert.equal(h.nodes['ml-lead-submit'].disabled,false);
});
test('failed delivery preserves the draft and offers working messenger recovery',async()=>{
 const direct={configured:()=>true,send:async()=>{throw new Error('Нет подтверждения отправки');}};
 const h=harness({direct,endpoint:'https://worker.example/enquiry'});await h.click(h.trigger());
 h.fields.comment.value='Остров и встроенная техника';await h.nodes['ml-lead-form'].fire('submit');
 assert.equal(h.nodes['ml-lead-form'].hidden,false);assert.equal(h.nodes['ml-lead-send-error'].hidden,false);assert.equal(h.fields.comment.value,'Остров и встроенная техника');
 await h.nodes['ml-lead-fallback'].fire('click');await h.nodes['ml-lead-form'].fire('submit');
 assert.equal(h.nodes['ml-lead-ready'].hidden,false);assert.match(h.nodes['ml-lead-message'].value,/Остров и встроенная техника/);
});
