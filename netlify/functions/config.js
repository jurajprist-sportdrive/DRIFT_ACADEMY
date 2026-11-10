const {settings,json}=require('./_shared');
exports.handler=async e=>{try{
 if(e.httpMethod!=='GET')return json(405,{error:'Nepodporovaná metóda.'});
 const cfg=await settings();
 return json(200,{prices:cfg.prices,experienceTypes:cfg.experienceTypes});
}catch(err){console.error('public config',err);return json(500,{error:'Konfiguráciu sa nepodarilo načítať.'})}};
