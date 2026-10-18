/* Local enquiry preparation: only the visitor sends the message in their messenger. */
(function () {
 'use strict';
 var phone='79184029932';
 var topics={cost:'Узнать стоимость кухни',project:'Обсудить проект',details:'Узнать подробнее',visit:'Записаться в шоурум',expertise:'Заказать экспертизу мебели'};
 function phoneError(value){var digits=String(value).replace(/\D/g,'');return digits.length<7||digits.length>15||!/^\+?[\d\s().-]+$/.test(String(value))?'Проверьте номер телефона: укажите от 7 до 15 цифр.':'';}
 function formatEnquiry(data){
  var lines=['Здравствуйте! Обращение с сайта MARI LIMAR.','Тема: '+(topics[data.topic]||topics.project)];
  if(data.model)lines.push('Модель: '+data.model);
  if(data.context&&data.context!==data.model)lines.push('Раздел: '+data.context);
  lines.push('Имя: '+data.name.trim(),'Телефон: '+data.phone.trim());
  if(data.comment.trim())lines.push('Пожелания: '+data.comment.trim());
  if(data.source)lines.push('Страница: '+data.source);
  return lines.join('\n');
 }
 function messageLinks(message){return {whatsapp:'https://wa.me/'+phone+'?text='+encodeURIComponent(message),telegram:'https://t.me/+'+phone};}
 if(typeof module==='object'&&module.exports)module.exports={formatEnquiry:formatEnquiry,messageLinks:messageLinks,phoneError:phoneError};
 if(typeof document==='undefined')return;
 var dialog=document.getElementById('ml-lead-dialog'),form=document.getElementById('ml-lead-form');
 var tools=document.getElementById('ml-contact-tools'),fab=document.getElementById('ml-contact-fab'),tray=document.getElementById('ml-contact-tray');
 if(!dialog||!form||!tools||!fab||!tray)return;
 var fields={name:form.elements.namedItem('name'),phone:form.elements.namedItem('phone'),topic:form.elements.namedItem('topic'),comment:form.elements.namedItem('comment'),channel:form.elements.namedItem('channel')};
 var contextNode=document.getElementById('ml-lead-context'),ready=document.getElementById('ml-lead-ready');
 var preview=document.getElementById('ml-lead-message'),chat=document.getElementById('ml-lead-open-chat');
 var copyStatus=document.getElementById('ml-lead-copy-status'),phoneStatus=document.getElementById('ml-lead-phone-error');
 var previousFocus=null,previousOverflow='',model='',context='',outsidePointer=false;
 tools.hidden=false;
 function setTray(open,restore){tray.hidden=!open;fab.setAttribute('aria-expanded',String(open));if(!open&&restore)fab.focus({preventScroll:true});}
 function channelHint(){document.getElementById('ml-lead-channel-hint').textContent=fields.channel.value==='telegram'?'Для Telegram скопируйте готовый текст и вставьте его в чат.':'В WhatsApp текст обращения подставится автоматически.';}
 function edit(){form.hidden=false;ready.hidden=true;copyStatus.textContent='';}
 function openForm(trigger){
  if(typeof dialog.showModal!=='function')return false;
  previousFocus=tools.contains(trigger)?fab:trigger;model=trigger.dataset.mlModel||'';context=trigger.dataset.mlContext||document.title.replace(/ — MARI LIMAR$/,'');
  fields.topic.value=topics[trigger.dataset.mlLead]?trigger.dataset.mlLead:'project';
  contextNode.textContent=model||context;contextNode.hidden=!contextNode.textContent;
  document.getElementById('ml-lead-title').textContent=fields.topic.value==='cost'?'Рассчитаем вашу кухню':fields.topic.value==='visit'?'Встретимся в шоуруме':fields.topic.value==='expertise'?'Обсудим экспертизу мебели':'Обсудим вашу задачу';
  edit();channelHint();setTray(false,false);
  if(!dialog.open){previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';}
  fields.name.focus({preventScroll:true});
  return true;
 }
 fab.addEventListener('click',function(){setTray(tray.hidden,false);});
 document.addEventListener('click',function(event){
  var trigger=event.target.closest?event.target.closest('[data-ml-lead]'):null;
  if(trigger&&!event.defaultPrevented&&event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey&&(!trigger.target||trigger.target==='_self')){
   if(openForm(trigger))event.preventDefault();
  }
  if(!tools.contains(event.target))setTray(false,false);
 },true);
 document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!tray.hidden){setTray(false,true);event.preventDefault();}});
 dialog.querySelector('[data-ml-lead-close]').addEventListener('click',function(){dialog.close();});
 function outside(event){var r=dialog.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;}
 dialog.addEventListener('pointerdown',function(event){outsidePointer=event.target===dialog&&outside(event);});
 dialog.addEventListener('click',function(event){if(outsidePointer&&event.target===dialog&&outside(event))dialog.close();outsidePointer=false;});
 dialog.addEventListener('close',function(){document.body.style.overflow=previousOverflow;outsidePointer=false;if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});});
 fields.channel.addEventListener('change',channelHint);
 fields.name.addEventListener('input',function(){fields.name.setCustomValidity('');});
 fields.phone.addEventListener('input',function(){fields.phone.setCustomValidity('');fields.phone.removeAttribute('aria-invalid');phoneStatus.textContent='';});
 form.addEventListener('submit',function(event){
  event.preventDefault();
  fields.name.setCustomValidity(fields.name.value.trim()?'':'Укажите ваше имя.');
  if(!fields.name.reportValidity())return;
  var error=phoneError(fields.phone.value);fields.phone.setCustomValidity(error);phoneStatus.textContent=error;
  if(error){fields.phone.setAttribute('aria-invalid','true');fields.phone.focus();fields.phone.reportValidity();return;}
  if(!form.reportValidity())return;
  var message=formatEnquiry({name:fields.name.value,phone:fields.phone.value,topic:fields.topic.value,comment:fields.comment.value,model:model,context:context,source:location.origin+location.pathname});
  var links=messageLinks(message),telegram=fields.channel.value==='telegram';
  preview.value=message;chat.href=telegram?links.telegram:links.whatsapp;chat.textContent=telegram?'Открыть Telegram':'Открыть WhatsApp';
  document.getElementById('ml-lead-ready-hint').textContent=telegram?'Скопируйте текст, откройте Telegram и отправьте его в чат студии.':'Откройте WhatsApp и отправьте подготовленное сообщение в чат студии.';
  copyStatus.textContent='';form.hidden=true;ready.hidden=false;
  document.getElementById('ml-lead-ready-title').focus({preventScroll:true});
 });
 document.getElementById('ml-lead-copy').addEventListener('click',async function(){
  try{
   if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('clipboard unavailable');
   await navigator.clipboard.writeText(preview.value);copyStatus.textContent='Текст скопирован. Вставьте его в чат.';
  }catch(_){preview.focus();preview.select();preview.setSelectionRange(0,preview.value.length);copyStatus.textContent='Не удалось скопировать автоматически. Выделенный текст можно скопировать вручную.';}
 });
 document.getElementById('ml-lead-edit').addEventListener('click',function(){edit();fields.name.focus({preventScroll:true});});
 window.addEventListener('pagehide',function(){setTray(false,false);if(dialog.open)dialog.close();});
})();
