/* MIT. Group redundant same-design/same-art printings without deleting saved card IDs. */
(function(root){
 function groupPrintings(cards,effects,artFor=root.OrdinaryArtBank?.resolve){const groups=new Map();for(const c of cards){const mortal=['Creature','Planeswalker','Battle'].includes(c.type),key=JSON.stringify([c.type,c.cost,c.type==='Creature'?c.attack:0,mortal?c.health:0,c.type==='Creature'?c.armor:0,c.keywords.slice().sort(),c.effects.map(id=>{const e=effects[id];return [e.trigger,e.op,e.amount,e.scope,e.target||'none']}),c.art,artFor?artFor(c):c.art]);let group=groups.get(key);if(!group){group={card:c,ids:[]};groups.set(key,group)}else if(c.curated&&!group.card.curated)group.card=c;group.ids.push(c.card_id)}return [...groups.values()]}
 root.OrdinaryCatalog={groupPrintings};if(typeof module!=='undefined'&&module.exports)module.exports={groupPrintings};
})(typeof window!=='undefined'?window:globalThis);
