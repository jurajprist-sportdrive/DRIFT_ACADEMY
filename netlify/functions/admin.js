const crypto=require('crypto');
const {settings,store,json,token,authenticated}=require('./_shared');
exports.handler=async(event)=>{try{
 const method=event.httpMethod;
 if(method==='POST'&&event.queryStringParameters?.action==='login'){
  const password=JSON.parse(event.body||'{}').password||'';const expected=process.env.ADMIN_PASSWORD||'';
  if(!expected||!process.env.ADMIN_SESSION_SECRET)return json(503,{error:'Administrácia nie je nakonfigurovaná.'});
  const a=crypto.createHash('sha256').update(String(password)).digest();const b=crypto.createHash('sha256').update(expected).digest();
  if(!crypto.timingSafeEqual(a,b))return json(401,{error:'Nesprávne heslo.'});
  return json(200,{ok:true},{'Set-Cookie':`da_admin=${token()}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=28800`});
 }
 if(method==='POST'&&event.queryStringParameters?.action==='logout')return json(200,{ok:true},{'Set-Cookie':'da_admin=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0'});
 if(!authenticated(event))return json(401,{error:'Prístup zamietnutý.'});
 if(method==='GET')return json(200,await settings());
 if(method==='PUT'){
  const input=JSON.parse(event.body||'{}');const email=String(input.notificationEmail||'').trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return json(400,{error:'Neplatný e-mail.'});
  const prices={};for(const name of ['DRIFT BASIC','DRIFT SEMI-PRO','DRIFT PRO']){const p=input.prices?.[name];if(typeof p!=='number'||!Number.isFinite(p)||p<0||p>100000)return json(400,{error:`Neplatná cena: ${name}`});prices[name]=Math.round(p*100)/100}
  const types=input.experienceTypes; if(!Array.isArray(types)||types.length<1||types.length>60||types.some(t=>typeof t!=='string'||!t.trim()||t.length>120)||new Set(types.map(t=>t.trim().toLowerCase())).size!==types.length)return json(400,{error:'Neplatný zoznam druhov zážitkov.'});const previous=await settings();const config={...previous,notificationEmail:email,prices,experienceTypes:types.map(t=>t.trim())};await store().setJSON('config',config);return json(200,config);
 }
 return json(405,{error:'Nepodporovaná metóda.'});
}catch(e){console.error(e);return json(500,{error:'Serverová chyba.'})}};
