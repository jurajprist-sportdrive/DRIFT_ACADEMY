const {store,json,authenticated}=require('./_shared');
exports.handler=async e=>{try{
 const db=store();
 if(e.httpMethod==='GET'){
  const events=await db.get('calendar',{type:'json'});
  return json(200,Array.isArray(events)?events:[]);
 }
 if(e.httpMethod==='PUT'){
  if(!authenticated(e))return json(401,{error:'Prístup zamietnutý.'});
  const events=JSON.parse(e.body||'null');
  if(!Array.isArray(events)||events.length>250)return json(400,{error:'Neplatný kalendár.'});
  for(const x of events){if(!x||typeof x!=='object'||typeof x.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||typeof x.title!=='string'||x.title.length>150||typeof x.location!=='string'||x.location.length>250|| (x.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)))return json(400,{error:'Neplatná položka kalendára.'})}
  await db.setJSON('calendar',events);
  return json(200,events);
 }
 return json(405,{error:'Nepodporovaná metóda.'});
}catch(err){console.error('calendar',err);return json(500,{error:'Serverová chyba.'})}};
