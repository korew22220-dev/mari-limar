const {test}=require('node:test');
const assert=require('node:assert/strict');
const {configured,send}=require('../assets/direct-enquiry.js');
test('endpoint must be HTTPS without embedded credentials or fragments',()=>{
 for(const value of ['',null,'/enquiry','http://example.com','https://key@example.com','https://example.com/#secret'])assert.equal(configured(value),false);
 assert.equal(configured('https://example.com/enquiry'),true);
});
test('direct delivery sends JSON without browser credentials and requires explicit acknowledgement',async()=>{
 let actual;
 const result=await send('https://example.com/enquiry',{name:'Тест'}, {fetch:async(url,options)=>{actual={url,options};return Response.json({ok:true});}});
 assert.equal(result.ok,true);assert.equal(actual.options.credentials,'omit');assert.equal(actual.options.redirect,'error');assert.equal(JSON.parse(actual.options.body).name,'Тест');
 for(const response of [()=>Response.json({ok:false}),()=>Response.json({message:'received'}),()=>Response.json({ok:true},{status:500}),()=>new Response('<html>Error</html>')]){
  await assert.rejects(()=>send('https://example.com/enquiry',{}, {fetch:async()=>response()}),/Не удалось подтвердить/);
 }
 await assert.rejects(()=>send('https://example.com/enquiry',{}, {fetch:async()=>{throw new Error('offline');}}),/Данные сохранены/);
});
