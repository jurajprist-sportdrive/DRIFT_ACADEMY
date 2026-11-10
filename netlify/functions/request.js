const crypto=require('crypto');
const {store,json,settings}=require('./_shared');
const {notifyNew}=require('./_mail');
const validEmail=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const str=(x,max=250)=>typeof x==='string'?x.trim().slice(0,max):'';
exports.handler=async e=>{try{
 if(e.httpMethod!=='POST')return json(405,{error:'Nepodporovaná metóda.'});
 if((e.body||'').length>16000)return json(413,{error:'Príliš veľká požiadavka.'});
 let d;try{d=JSON.parse(e.body||'{}')}catch{return json(400,{error:'Neplatný formulár.'})}
 const typ=str(d.typ,60),meno=str(d.meno,80),priezvisko=str(d.priezvisko,80),email=str(d.email,254),telefon=str(d.telefon,40),zazitok=str(d.zazitok,150);
 if(!['Objednávka poukazu','Rezervácia voucheru','Dopyt'].includes(typ)||!meno||!priezvisko||!validEmail(email)||!telefon||!zazitok||d.privacy_acknowledgement!=='on')return json(400,{error:'Skontrolujte povinné údaje formulára.'});
 const cfg=await settings();
 if(typ==='Objednávka poukazu'&&!cfg.experienceTypes.includes(zazitok))return json(400,{error:'Neplatný druh zážitku.'});
 if(typ==='Rezervácia voucheru'&&(!str(d.cislo_voucheru,100)||!/^\d{4}-\d{2}-\d{2}$/.test(str(d.platnost_voucheru,10))))return json(400,{error:'Vyplňte číslo a platnosť voucheru.'});
 if(typ==='Objednávka poukazu'&&!['reservation_99','full'].includes(d.payment_option))return json(400,{error:'Vyberte spôsob platby.'});
 const id=crypto.randomUUID();
 const rec={id,createdAt:new Date().toISOString(),typ,meno,priezvisko,email,telefon,zazitok,poznamka:str(d.poznamka,2000),gift_wish:str(d.gift_wish,400),marketing_consent:d.marketing_consent==='yes',privacy_acknowledgement:true,status:'Čakajúca',druh:'Interný',partner:'',cislo_voucheru:str(d.cislo_voucheru,100),platnost_voucheru:str(d.platnost_voucheru,10),event_id:str(d.event_id,100),event_date:str(d.event_date,10),event_time:str(d.event_time,5),event_location:str(d.event_location,250)};
 if(typ==='Objednávka poukazu'){
  rec.payment_option=d.payment_option;
  rec.total_experience_price=Number(cfg.prices[zazitok]||0);
  rec.payment_amount=d.payment_option==='reservation_99'?99:rec.total_experience_price;
 }
 await store().setJSON('order-'+id,rec);
 let warning;
 try{const sent=await notifyNew(rec,typ==='Rezervácia voucheru');if(!sent.admin||!sent.customer)warning='Niektoré potvrdzovacie e-maily sa nepodarilo odoslať.'}catch(mailError){console.error('request mail',mailError);warning='Potvrdzovacie e-maily sa nepodarilo odoslať.'}
 return json(201,{ok:true,id,...(warning?{warning}:{})});
}catch(err){console.error('public request',err);return json(500,{error:'Požiadavku sa nepodarilo uložiť.'})}};
