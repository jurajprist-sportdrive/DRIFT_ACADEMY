const nodemailer = require('nodemailer');
const {settings}=require('./_shared');
const {templates}=require('./email-templates');
function render(t,vars){return String(t).replace(/\{([a-z_]+)\}/g,(m,k)=>Object.prototype.hasOwnProperty.call(vars,k)?String(vars[k]):m)}
function template(cfg,key,vars){const t={...templates[key],...(cfg.emailTemplates?.[key]||{})};return {subject:render(t.subject,vars),body:render(t.body,vars)}}
const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=v=>String(v??'').replace(/[<>\r\n]/g,' ').slice(0,500);
function transport(){
 const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASSWORD}=process.env;
 if(!SMTP_HOST||!SMTP_USER||!SMTP_PASSWORD)throw new Error('SMTP_NOT_CONFIGURED');
 const port=Number(SMTP_PORT||465);
 return nodemailer.createTransport({host:SMTP_HOST,port,secure:port===465,auth:{user:SMTP_USER,pass:SMTP_PASSWORD},connectionTimeout:12000,greetingTimeout:12000,socketTimeout:20000});
}
async function send(to,subject,text,replyTo){
 if(!emailRe.test(String(to||'')))throw new Error('INVALID_RECIPIENT');
 const from=process.env.SMTP_FROM||process.env.SMTP_USER;
 const opts={from:`"DRIFT ACADEMY" <${from}>`,to,subject,text};
 if(replyTo&&emailRe.test(replyTo))opts.replyTo=replyTo;
 return transport().sendMail(opts);
}
function details(record){
 const names={typ:'Typ',zazitok:'Zážitok',meno:'Meno',priezvisko:'Priezvisko',email:'E-mail',telefon:'Telefón',poznamka:'Poznámka',cislo_voucheru:'Číslo voucheru',platnost_voucheru:'Platnosť voucheru',event_date:'Termín',event_time:'Čas',event_location:'Miesto'};
 return Object.entries(names).filter(([key])=>record[key]).map(([key,label])=>`${label}: ${clean(record[key])}`).join('\n');
}
async function notifyNew(record,booking){
 const cfg=await settings();const recipient=process.env.NOTIFICATION_EMAIL||cfg.notificationEmail;
 const vars={id:clean(record.id),meno:clean(record.meno),priezvisko:clean(record.priezvisko),typ:booking?'Nová rezervácia':'Nový dopyt',detaily:details(record),admin_url:'https://boisterous-babka-80850c.netlify.app/admin'};
 const admin=template(cfg,'adminNew',vars),customer=template(cfg,booking?'customerBooking':'customerOrder',vars);
 const results=await Promise.allSettled([send(recipient,admin.subject,admin.body,record.email),send(record.email,customer.subject,customer.body)]);
 results.forEach((r,i)=>{if(r.status==='rejected')console.error('SMTP notification failure',i===0?'admin':'customer',r.reason)});
 return {admin:results[0].status==='fulfilled',customer:results[1].status==='fulfilled'};
}
async function notifyConfirmed(record){
 const cfg=await settings();const vars={id:clean(record.id),meno:clean(record.meno),priezvisko:clean(record.priezvisko),detaily:details(record),admin_url:'https://boisterous-babka-80850c.netlify.app/admin'};
 const t=template(cfg,'confirmation',vars);await send(record.email,t.subject,t.body);
}
module.exports={notifyNew,notifyConfirmed};
