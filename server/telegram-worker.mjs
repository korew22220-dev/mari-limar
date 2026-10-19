/* Deploy separately from GitHub Pages. Supply credentials as Worker secrets. */
const topics={cost:'Узнать стоимость кухни',project:'Обсудить проект',details:'Узнать подробнее',visit:'Записаться в шоурум',expertise:'Заказать экспертизу мебели'};
const recent=new Map();
function clean(value,max){return typeof value==='string'&&value.length<=max?value.trim():null;}
export function validate(data,origin){
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const name=clean(data.name,80),phone=clean(data.phone,30),comment=clean(data.comment,1500),model=clean(data.model,160),context=clean(data.context,200),source=clean(data.source,300);
 if(!name||!phone||comment===null||model===null||context===null||!source||!Object.hasOwn(topics,data.topic))return null;
 if(!/^\+?[\d\s().-]+$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15)return null;
 try{const url=new URL(source);if(url.origin!==origin||url.search||url.hash||url.username||url.password)return null;}catch(_){return null;}
 return {name,phone,comment,model,context,source,topic:data.topic};
}
export function message(data){
 const lines=['Новая заявка с сайта MARI LIMAR','Тема: '+topics[data.topic]];
 if(data.model)lines.push('Модель: '+data.model);
 if(data.context)lines.push('Раздел: '+data.context);
 lines.push('Имя: '+data.name,'Телефон: '+data.phone);
 if(data.comment)lines.push('Пожелания: '+data.comment);
 lines.push('Страница: '+data.source);
 return lines.join('\n');
}
export async function handle(request,env,transport=fetch){
 const origin=request.headers.get('Origin');
 const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(!origin||!allowed.includes(origin))return reply(403,{ok:false});
 headers['Access-Control-Allow-Origin']=origin;
 headers['Access-Control-Allow-Methods']='POST, OPTIONS';
 headers['Access-Control-Allow-Headers']='Content-Type';
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply(405,{ok:false});
 if(new URL(request.url).pathname!=='/enquiry')return reply(404,{ok:false});
 if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_CHAT_ID)return reply(503,{ok:false});
 if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return reply(415,{ok:false});
 if(Number(request.headers.get('Content-Length'))>12000)return reply(413,{ok:false});
 let raw,data;
 try{
  // Bound the stream as well: a caller can omit Content-Length.
  const reader=request.body?.getReader();if(!reader)return reply(400,{ok:false});
  const chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();return reply(413,{ok:false});}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  raw=JSON.parse(new TextDecoder().decode(bytes));
  if(raw.website)return reply(400,{ok:false});
  data=validate(raw,origin);
 }catch(_){return reply(400,{ok:false});}
 if(!data)return reply(400,{ok:false});
 // Best-effort isolate-local burst guard; also set a Cloudflare edge rate limit before public use.
 const now=Date.now(),ip=request.headers.get('CF-Connecting-IP');
 for(const [key,time] of recent)if(now-time>60000)recent.delete(key);
 if(ip&&recent.has(ip)&&now-recent.get(ip)<10000)return reply(429,{ok:false});
 if(ip){if(recent.size>=10000)recent.delete(recent.keys().next().value);recent.set(ip,now);}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await transport('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:message(data),link_preview_options:{is_disabled:true}}),signal:controller.signal});
  const result=await response.json();
  if(!response.ok||result.ok!==true||!Number.isInteger(result.result?.message_id))return reply(502,{ok:false});
  return reply(200,{ok:true});
 }catch(_){return reply(502,{ok:false});}
 finally{clearTimeout(timer);}
}
export default {fetch(request,env){return handle(request,env);}};
