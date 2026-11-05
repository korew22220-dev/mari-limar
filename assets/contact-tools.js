/* Direct server delivery when configured; messenger preparation remains the fallback. */
(function () {
 'use strict';
 var phone='79184029932';
 var topics={cost:'Узнать стоимость кухни',project:'Обсудить проект',details:'Узнать подробнее',visit:'Записаться в шоурум',expertise:'Заказать экспертизу мебели'};
 function phoneError(value){var digits=String(value).replace(/\D/g,'');return digits.length<7||digits.length>15||!/^\+?[\d\s().-]+$/.test(String(value))?'Проверьте номер телефона: укажите от 7 до 15 цифр.':'';}
 function formatEnquiry(data){
  var lines=['Здравствуйте! Обращение с сайта Марли Лимарт.','Тема: '+(topics[data.topic]||topics.project)];
  if(data.model)lines.push('Модель: '+data.model);
  if(data.context&&data.context!==data.model)lines.push('Раздел: '+data.context);
  lines.push('Имя: '+data.name.trim(),'Телефон: '+data.phone.trim());
  if(data.comment.trim())lines.push('Пожелания: '+data.comment.trim());
  if(data.source)lines.push('Страница: '+data.source);
  if(data.privacyConsent===true)lines.push('Согласие на обработку персональных данных: дано для ответа на обращение.','Редакция согласия: 2026-11-05.','Дата отметки: '+data.consentAt,'Документ: https://korew22220-dev.github.io/mari-limar/personal-data-consent.html');
  return lines.join('\n');
 }
 function messageLinks(message){return {whatsapp:'https://wa.me/'+phone+'?text='+encodeURIComponent(message),telegram:'https://t.me/+'+phone,max:'https://web.max.ru/'};}
 function messenger(channel,message){
  var links=messageLinks(message||'');
  if(channel==='whatsapp')return {href:links.whatsapp,label:'Открыть WhatsApp с сообщением',hint:'Откроется WhatsApp с готовым текстом. Проверьте сообщение и отправьте его в чат студии.',readyHint:'В WhatsApp подготовлен текст обращения. Отправьте его в чат студии. Если приложение не открылось, нажмите кнопку ниже.'};
  if(channel==='telegram')return {href:links.telegram,label:'Открыть Telegram',hint:'Для Telegram скопируйте готовый текст и вставьте его в чат.',readyHint:'Скопируйте текст, откройте Telegram и отправьте его в чат студии.'};
  return {href:links.max,label:'Открыть MAX',hint:'Для MAX скопируйте готовый текст и найдите студию по номеру +7 (918) 402-99-32.',readyHint:'Скопируйте текст. В MAX найдите контакт +7 (918) 402-99-32 и вставьте сообщение в чат. Если поиск по номеру недоступен, выберите другой мессенджер.'};
 }
 if(typeof module==='object'&&module.exports)module.exports={formatEnquiry:formatEnquiry,messageLinks:messageLinks,phoneError:phoneError,messenger:messenger};
 if(typeof window!=='undefined')window.MariLead={formatEnquiry:formatEnquiry,messageLinks:messageLinks,phoneError:phoneError,messenger:messenger};
 if(typeof document==='undefined')return;
 var dialog=document.getElementById('ml-lead-dialog'),form=document.getElementById('ml-lead-form');
 var tools=document.getElementById('ml-contact-tools'),fab=document.getElementById('ml-contact-fab'),tray=document.getElementById('ml-contact-tray');
 if(!dialog||!form||!tools||!fab||!tray)return;
 var fields={name:form.elements.namedItem('name'),phone:form.elements.namedItem('phone'),topic:form.elements.namedItem('topic'),comment:form.elements.namedItem('comment'),channel:form.elements.namedItem('channel')};
 var privacyConsent=form.elements.namedItem('privacyConsent');
 if(privacyConsent)privacyConsent.addEventListener('change',function(){privacyConsent.setCustomValidity('');});
 var contextNode=document.getElementById('ml-lead-context'),ready=document.getElementById('ml-lead-ready');
 var preview=document.getElementById('ml-lead-message'),chat=document.getElementById('ml-lead-open-chat');
 var copyStatus=document.getElementById('ml-lead-copy-status'),phoneStatus=document.getElementById('ml-lead-phone-error');
 var previousFocus=null,previousOverflow='',model='',context='',outsidePointer=false;
 var direct=window.MariEnquiry,endpoint=form.dataset.mlEndpoint||'',useDirect=!!(direct&&direct.configured(endpoint)),sending=false;
 var submitButton=document.getElementById('ml-lead-submit'),sendError=document.getElementById('ml-lead-send-error'),fallbackButton=document.getElementById('ml-lead-fallback'),delivered=document.getElementById('ml-lead-delivered');
 function directMode(){
  if(!direct||!direct.configured(endpoint))return;
  document.getElementById('ml-lead-intro').textContent=useDirect?'Оставьте имя и телефон — студия получит заявку и свяжется с вами.':'Заполните форму и выберите мессенджер. Сообщение вы отправите в открывшемся чате.';
  fields.channel.closest('label').hidden=useDirect;
  document.getElementById('ml-lead-channel-hint').hidden=useDirect;
  submitButton.textContent=useDirect?'Отправить заявку':fields.channel.value==='whatsapp'?'Продолжить в WhatsApp':'Подготовить сообщение';
 }
 if(fallbackButton)fallbackButton.addEventListener('click',function(){useDirect=false;directMode();sendError.hidden=true;fallbackButton.hidden=true;});
 var doneButton=document.getElementById('ml-lead-done');if(doneButton)doneButton.addEventListener('click',function(){dialog.close();});
 tools.hidden=false;
 var toolsHome=document.createComment('Contact controls desktop position');
 tools.before(toolsHome);
 var compactHeader=matchMedia('(max-width: 700px)');
 function placeContactTools(){
  setTray(false,false);
  var header=document.querySelector('.head'),menuButton=document.querySelector('#open, #open-menu');
  if(compactHeader.matches&&header&&menuButton)header.insertBefore(tools,menuButton);
  else toolsHome.after(tools);
 }
 placeContactTools();
 compactHeader.addEventListener('change',placeContactTools);
 function setTray(open,restore){tray.hidden=!open;fab.setAttribute('aria-expanded',String(open));if(!open&&restore)fab.focus({preventScroll:true});}
 function channelHint(){document.getElementById('ml-lead-channel-hint').textContent=messenger(fields.channel.value,'').hint;if(!useDirect)submitButton.textContent=fields.channel.value==='whatsapp'?'Продолжить в WhatsApp':'Подготовить сообщение';}
 function edit(){form.hidden=false;ready.hidden=true;if(delivered)delivered.hidden=true;copyStatus.textContent='';}
 function openForm(trigger){
  if(typeof dialog.showModal!=='function')return false;
  previousFocus=tools.contains(trigger)?fab:trigger;model=trigger.dataset.mlModel||'';context=trigger.dataset.mlContext||document.title.replace(/ — (MARI LIMAR|Марли Лимарт)$/,'');
  fields.topic.value=topics[trigger.dataset.mlLead]?trigger.dataset.mlLead:'project';
  contextNode.textContent=model||context;contextNode.hidden=!contextNode.textContent;
  document.getElementById('ml-lead-title').textContent=fields.topic.value==='cost'?'Рассчитаем вашу кухню':fields.topic.value==='visit'?'Встретимся в шоуруме':fields.topic.value==='expertise'?'Обсудим экспертизу мебели':'Обсудим вашу задачу';
  edit();channelHint();directMode();setTray(false,false);
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
 form.addEventListener('submit',async function(event){
  event.preventDefault();
  if(sending)return;
  fields.name.setCustomValidity(fields.name.value.trim()?'':'Укажите ваше имя.');
  if(!fields.name.reportValidity())return;
  var error=phoneError(fields.phone.value);fields.phone.setCustomValidity(error);phoneStatus.textContent=error;
  if(error){fields.phone.setAttribute('aria-invalid','true');fields.phone.focus();fields.phone.reportValidity();return;}
  if(!form.reportValidity())return;
  if(!privacyConsent||!privacyConsent.checked){if(privacyConsent){privacyConsent.setCustomValidity('Подтвердите согласие на обработку персональных данных.');privacyConsent.reportValidity();privacyConsent.focus();}return;}
  var data={privacyConsent:true,consentAt:new Date().toISOString(),name:fields.name.value,phone:fields.phone.value,topic:fields.topic.value,comment:fields.comment.value,model:model,context:context,source:location.origin+location.pathname,website:form.elements.namedItem('website')?.value||''};
  if(useDirect){
   sending=true;submitButton.disabled=true;submitButton.textContent='Отправляем…';form.setAttribute('aria-busy','true');sendError.hidden=true;fallbackButton.hidden=true;
   try{
    await direct.send(endpoint,data);
    form.hidden=true;ready.hidden=true;delivered.hidden=false;
    document.getElementById('ml-lead-delivered-title').focus({preventScroll:true});
   }catch(error){sendError.textContent=error.message;sendError.hidden=false;fallbackButton.hidden=false;}
   finally{sending=false;submitButton.disabled=false;form.removeAttribute('aria-busy');directMode();}
   return;
  }
  var message=formatEnquiry(data);
  var selectedChannel=messenger(fields.channel.value,message);
  preview.value=message;chat.href=selectedChannel.href;chat.textContent=selectedChannel.label;
  document.getElementById('ml-lead-ready-hint').textContent=selectedChannel.readyHint;
  copyStatus.textContent='';form.hidden=true;ready.hidden=false;
  document.getElementById('ml-lead-copy').hidden=fields.channel.value==='whatsapp';
  document.getElementById('ml-lead-ready-title').focus({preventScroll:true});
  if(fields.channel.value==='whatsapp')window.open(selectedChannel.href,'_blank','noopener,noreferrer');
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

