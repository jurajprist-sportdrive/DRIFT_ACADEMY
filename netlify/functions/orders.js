const crypto=require('crypto');
const {store,json,authenticated}=require('./_shared');
const statuses=['Čakajúca','Potvrdená','Zrušená','Uplatnená'];
const partners=['Zľavomat','Najzážitky','Zľavadňa','Adrop'];
const old={'nová':'Čakajúca','vybavuje sa':'Čakajúca','voucher odoslaný':'Potvrdená','rezervované':'Potvrdená','vybavené':'Uplatnená'};
const normalize=r=>({...r,status:old[r.status]||r.status||'Čakajúca',druh:r.druh||'Interný',partner:r.partner||''});
const validDate=s=>!s||/^\d{4}-\d{2}-\d{2}$/.test(s);
exports.handler=async e=>{try{
 if(!authenticated(e))return json(401,{error:'Prístup zamietnutý'});
 const db=store();
 if(e.httpMethod==='GET'){
  const rows=[];let cursor;
  do{const page=await db.list({prefix:'order-',...(cursor?{cursor}:{})});for(const item of page.blobs||[]){const rec=await db.get(item.key,{type:'json'});if(rec)rows.push(normalize(rec))}cursor=page.cursor}while(cursor);
  rows.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  return json(200,rows);
 }
 if(e.httpMethod==='POST'){
  const d=JSON.parse(e.body||'{}');
  for(const f of ['meno','priezvisko','email','telefon','zazitok','platnost_voucheru'])if(typeof d[f]!=='string'||!d[f].trim())return json(400,{error:'Chýba povinné pole: '+f});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)||!validDate(d.platnost_voucheru)||!statuses.includes(d.status||'Čakajúca'))return json(400,{error:'Neplatné údaje voucheru'});
  const {settings}=require('./_shared');const cfg=await settings();if(!cfg.experienceTypes.includes(d.zazitok))return json(400,{error:'Neplatný druh zážitku'});
  const id=crypto.randomUUID();const number=String(d.cislo_voucheru||'DA-'+crypto.randomBytes(5).toString('hex').toUpperCase()).trim().slice(0,120);
  const rec={id,createdAt:new Date().toISOString(),typ:'Manuálny voucher',meno:d.meno.slice(0,120),priezvisko:d.priezvisko.slice(0,120),email:d.email.slice(0,254),telefon:d.telefon.slice(0,80),zazitok:d.zazitok.slice(0,150),cislo_voucheru:number,platnost_voucheru:d.platnost_voucheru,status:d.status||'Čakajúca',druh:'Interný',partner:'',poznamka:String(d.poznamka||'').slice(0,2000)};
  await db.setJSON('order-'+id,rec);return json(201,normalize(rec));
 }
 if(!['PATCH','DELETE'].includes(e.httpMethod))return json(405,{error:'Nepodporovaná metóda'});
 const d=JSON.parse(e.body||'{}');
 if(!/^[a-f0-9-]{36}$/i.test(String(d.id||'')))return json(400,{error:'Neplatné ID'});
 const key='order-'+d.id, rec=await db.get(key,{type:'json'});
 if(!rec)return json(404,{error:'Objednávka neexistuje'});
 if(e.httpMethod==='DELETE'){
  if(d.confirm!==true)return json(400,{error:'Potvrďte odstránenie'});
  await db.delete(key);return json(200,{ok:true,id:d.id});
 }
 if(d.meno!==undefined){if(typeof d.meno!=='string'||!d.meno.trim()||d.meno.length>120)return json(400,{error:'Neplatné meno'});rec.meno=d.meno.trim()}
 if(d.priezvisko!==undefined){if(typeof d.priezvisko!=='string'||!d.priezvisko.trim()||d.priezvisko.length>120)return json(400,{error:'Neplatné priezvisko'});rec.priezvisko=d.priezvisko.trim()}
 if(d.email!==undefined){if(typeof d.email!=='string'||d.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))return json(400,{error:'Neplatný e-mail'});rec.email=d.email.trim()}
 if(d.telefon!==undefined){if(typeof d.telefon!=='string'||!d.telefon.trim()||d.telefon.length>80)return json(400,{error:'Neplatný telefón'});rec.telefon=d.telefon.trim()}
 if(d.zazitok!==undefined){const {settings}=require('./_shared');const cfg=await settings();if(typeof d.zazitok!=='string'||!cfg.experienceTypes.includes(d.zazitok))return json(400,{error:'Neplatný druh zážitku'});rec.zazitok=d.zazitok}
 if(d.status!==undefined){if(!statuses.includes(d.status))return json(400,{error:'Neplatný stav'});rec.status=d.status}
 if(d.druh!==undefined){if(!['Interný','Externý'].includes(d.druh))return json(400,{error:'Neplatný druh'});rec.druh=d.druh;if(d.druh==='Interný')rec.partner=''}
 if(d.partner!==undefined){if(d.partner&&!partners.includes(d.partner))return json(400,{error:'Neplatný partner'});rec.partner=d.partner}
 if(d.event_date!==undefined){if(!validDate(d.event_date))return json(400,{error:'Neplatný termín'});rec.event_date=d.event_date}
 if(d.platnost_voucheru!==undefined){if(!validDate(d.platnost_voucheru))return json(400,{error:'Neplatná platnosť'});rec.platnost_voucheru=d.platnost_voucheru}
 if(d.poznamka!==undefined)rec.poznamka=String(d.poznamka).slice(0,2000);
 if(d.cislo_voucheru!==undefined)rec.cislo_voucheru=String(d.cislo_voucheru).slice(0,120);
 await db.setJSON(key,rec);return json(200,normalize(rec));
}catch(err){console.error('orders',err);return json(500,{error:'Serverová chyba'})}};
