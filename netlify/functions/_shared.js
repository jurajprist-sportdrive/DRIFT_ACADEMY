const crypto=require('crypto');
const {getStore}=require('@netlify/blobs');
const defaults={emailTemplates:{},experienceTypes:['DRIFT BASIC','DRIFT SEMI-PRO','DRIFT PRO'],notificationEmail:process.env.NOTIFICATION_EMAIL || '',prices:{'DRIFT BASIC':259,'DRIFT SEMI-PRO':449,'DRIFT PRO':599}};
// Netlify builds normally inject the Blobs connection automatically.
// For manual/legacy deploys, explicit site credentials are supported.
const store=()=>{
 const siteID=process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
 const token=process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;
 return siteID && token
   ? getStore({name:'drift-academy-settings',siteID,token})
   : getStore('drift-academy-settings');
};
async function settings(){const saved=await store().get('config',{type:'json'});return {...defaults,...saved,experienceTypes:Array.isArray(saved?.experienceTypes)?saved.experienceTypes:defaults.experienceTypes,prices:{...defaults.prices,...(saved?.prices||{})}}}
function json(statusCode,data,headers={}){return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers},body:JSON.stringify(data)}}
function token(){const expires=Date.now()+8*3600*1000;const payload=String(expires);const signature=crypto.createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex');return `${payload}.${signature}`}
function authenticated(event){if(!process.env.ADMIN_SESSION_SECRET)return false;const cookie=event.headers.cookie||event.headers.Cookie||'';const match=cookie.match(/(?:^|;\s*)da_admin=([^;]+)/);if(!match)return false;const [exp,sig]=match[1].split('.');if(!exp||!sig||Number(exp)<Date.now()||!/^\d+$/.test(exp))return false;const expected=crypto.createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(exp).digest('hex');return sig.length===expected.length&&crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))}
module.exports={settings,store,json,token,authenticated};
