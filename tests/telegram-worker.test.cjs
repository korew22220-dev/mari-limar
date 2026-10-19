const {test}=require('node:test');
const assert=require('node:assert/strict');
const env={ALLOWED_ORIGINS:'https://example.com',TELEGRAM_BOT_TOKEN:'test-only',TELEGRAM_CHAT_ID:'test-chat'};
const draft={name:'Тест',phone:'+79181234567',topic:'cost',comment:'Остров',model:'Луна',context:'Каталог',source:'https://example.com/kitchen-luna.html',website:''};
const request=(data=draft,extra={})=>new Request('https://worker.example/enquiry',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json',...extra},body:JSON.stringify(data)});
test('valid request is delivered as plain text to the server-configured chat',async()=>{
 const {handle}=await import('../server/telegram-worker.mjs');let payload;
 const response=await handle(request(),env,async(url,options)=>{assert.equal(url,'https://api.telegram.org/bottest-only/sendMessage');payload=JSON.parse(options.body);return Response.json({ok:true,result:{message_id:123}});});
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});assert.equal(payload.chat_id,'test-chat');assert.match(payload.text,/Модель: Луна/);assert.match(payload.text,/Телефон: \+79181234567/);assert.equal(payload.parse_mode,undefined);
});
test('untrusted origins, invalid input, honeypots, and oversized bodies never contact Telegram',async()=>{
 const {handle}=await import('../server/telegram-worker.mjs');let calls=0;const noSend=async()=>{calls++;throw Error('must not send');};
 for(const req of [request(draft,{Origin:'https://untrusted.example'}),request({...draft,phone:'123'}),request({...draft,topic:'constructor'}),request({...draft,website:'spam'}),request({...draft,source:'https://other.example/'}),request({...draft,comment:'a'.repeat(15000)})]){
  const response=await handle(req,env,noSend);assert.ok(response.status>=400);
 }
 assert.equal(calls,0);
});
test('missing configuration and Telegram errors never return a success acknowledgement',async()=>{
 const {handle}=await import('../server/telegram-worker.mjs');
 assert.equal((await handle(request(),{ALLOWED_ORIGINS:env.ALLOWED_ORIGINS})).status,503);
 for(const result of [{ok:false},{ok:true,result:{}},{ok:true,result:{message_id:'invalid'}}]){
  const response=await handle(request(),env,async()=>Response.json(result));assert.equal(response.status,502);assert.deepEqual(await response.json(),{ok:false});
 }
 const offline=await handle(request(),env,async()=>{throw Error('offline');});assert.equal(offline.status,502);
});
test('preflight and isolate-local burst limiting are enforced',async()=>{
 const {handle}=await import('../server/telegram-worker.mjs');
 const pre=await handle(new Request('https://worker.example/enquiry',{method:'OPTIONS',headers:{Origin:'https://example.com'}}),env);assert.equal(pre.status,204);assert.equal(pre.headers.get('Access-Control-Allow-Origin'),'https://example.com');
 const transport=async()=>Response.json({ok:true,result:{message_id:42}});
 assert.equal((await handle(request(draft,{'CF-Connecting-IP':'192.0.2.1'}),env,transport)).status,200);
 assert.equal((await handle(request(draft,{'CF-Connecting-IP':'192.0.2.1'}),env,transport)).status,429);
});
