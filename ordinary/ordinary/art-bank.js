/* MIT. Additive illustration routing. Catalog records and game rules are never mutated. */
(function(root){
 const types=['Creature','Instant','Sorcery','Artifact','Enchantment','Land','Planeswalker','Battle'];
 const legacy=Array.from({length:6},(_,f)=>types.map((type,t)=>Object.freeze({id:'folk-'+f+'-'+t,art:'art/'+f+'-'+t+'.webp',type,circle:f,kind:'folk'}))).flat();
 const additions=Array.from({length:150},(_,i)=>Object.freeze({id:'field-'+String(i).padStart(3,'0'),art:'art-bank/neighbor-'+String(i).padStart(3,'0')+'.webp',type:'Creature',circle:Math.floor(i/25),kind:'field-guide'}));
 const plates=Object.freeze([...legacy,...additions]);
 const typePools=Object.fromEntries(types.map(type=>[type,legacy.filter(p=>p.type===type)]));
 const neighbors=Array.from({length:6},(_,f)=>[legacy.find(p=>p.type==='Creature'&&p.circle===f),...additions.filter(p=>p.circle===f)]);
 function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
 function resolve(card){
  if(!card||card.curated||!card.card_id)return card?.art;
  const pool=card.type==='Creature'?neighbors[card.faction]:typePools[card.type];
  if(!pool?.length)return card.art;
  return pool[hash('ordinary-illustrations-v1:'+card.card_id)%pool.length].art;
 }
 const bank=Object.freeze({edition:'field-guide-1',count:plates.length,retained:legacy.length,added:additions.length,plates,resolve});
 root.OrdinaryArtBank=bank;
 if(typeof module!=='undefined'&&module.exports)module.exports=bank;
})(typeof window!=='undefined'?window:globalThis);
