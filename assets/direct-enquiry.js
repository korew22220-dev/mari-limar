/* Direct delivery uses a server endpoint. Bot credentials never belong here. */
(function(root){
 'use strict';
 function configured(value){
  try{var url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.hash;}catch(_){return false;}
 }
 async function send(endpoint,data,options){
  if(!configured(endpoint))throw new Error('Отправка с сайта пока не подключена.');
  options=options||{};
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},12000);
  try{
   var response=await (options.fetch||fetch)(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'omit',redirect:'error',signal:controller.signal});
   var result=await response.json();
   if(!response.ok||result.ok!==true)throw new Error('delivery failed');
   return result;
  }catch(_){throw new Error('Не удалось подтвердить отправку. Данные сохранены в форме. Свяжитесь со студией в мессенджере или по телефону.');}
  finally{clearTimeout(timer);}
 }
 var api={configured:configured,send:send};
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MariEnquiry=api;
})(typeof window==='undefined'?globalThis:window);
