// Original PullCrest deterministic engine. MIT; see LICENSE.txt.
(function(root){
 function make(data){const C=Object.fromEntries(data.cards.map(c=>[c.card_id,c])),F=data.effects,K=data.rules.constants,copy=x=>JSON.parse(JSON.stringify(x));
 function random(s,n){let x=s.seed;x^=x<<13;x^=x>>>17;x^=x<<5;s.seed=x>>>0;return Math.floor(s.seed/4294967296*n)}
 function shuffle(s,a){for(let i=a.length-1;i>0;i--){const j=random(s,i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
 const definition=b=>C[b.stack.at(-1)],health=b=>Math.max(0,definition(b).hp-b.damage);
 function log(s,t){s.log.push(t);if(s.log.length>50)s.log.shift()}
 function unit(id,turn){return {stack:[id],energy:[],tool:null,damage:0,toxin:false,shield:0,entered:turn,evolved:0,used:false}}
 function deckError(deck){if(!Array.isArray(deck)||deck.length!==K.deck_size)return 'A deck must contain exactly 40 cards.';const counts={};let basics=0;for(const id of deck){const c=C[id];if(!c)return 'Unknown card: '+id;counts[id]=(counts[id]||0)+1;if(c.card_type!=='Energy'&&counts[id]>K.copies)return 'At most three copies of each non-Energy card ID.';if(c.card_type==='Creature'&&c.stage===0)basics++}return basics<6?'Include at least six base creatures.':null}
 function draw(s,p,n){const q=s.players[p];for(let i=0;i<n;i++)if(q.deck.length)q.hand.push(q.deck.pop());else{q.fatigue++;if(q.field[0])q.field[0].damage+=10*q.fatigue;log(s,(p?'Computer':'You')+' take '+10*q.fatigue+' fatigue.')}}
 function scores(s){return s.players.map(p=>100*p.crests+p.field.reduce((n,b)=>n+(b?health(b)+5*b.energy.length:0),0))}
 function finish(s,w,text){s.done=true;s.phase='over';s.winner=w;log(s,text||(w===null?'Draw.':w===0?'You win!':'Computer wins!'))}
 function settle(s){
  const knocked=[];s.players.forEach((p,i)=>p.field.forEach((b,j)=>{if(b&&health(b)<=0)knocked.push({p:i,slot:j,b})}));
  for(const {p,slot,b}of knocked){s.players[p].discard.push(...b.stack,...b.energy,...(b.tool?[b.tool]:[]));s.players[p].field[slot]=null;s.players[1-p].crests+=definition(b).stage>=3?2:1;log(s,definition(b).name+' is scattered; '+(1-p===0?'you gain':'computer gains')+' crest(s).')}
  const wins=s.players.map((p,i)=>p.crests>=K.crest_goal||!s.players[1-i].field.some(Boolean));
  if(wins.some(Boolean)){finish(s,wins[0]&&wins[1]?null:wins[0]?0:1);return}
  const needs=s.players.findIndex(p=>!p.field[0]);if(needs>=0){s.phase='promote';s.actor=needs}else{s.phase='main';s.actor=s.turn}
 }
 function begin(s,p){s.turn=p;s.actor=p;s.phase='main';s.ownTurns[p]++;s.ply++;const q=s.players[p];q.attached=false;q.guide=false;q.retreated=false;q.field.forEach(b=>{if(b)b.used=false});if(s.ply>1)draw(s,p,1);log(s,'Turn '+s.ply+': '+(p?'computer':'you')+'.');settle(s)}
 function create(decks,seed=1){decks.forEach(d=>{const err=deckError(d);if(err)throw Error(err)});const s={seed:seed>>>0||1,turn:0,actor:0,phase:'main',done:false,winner:null,ply:0,ownTurns:[0,0],afterPromote:null,players:decks.map(deck=>({deck:deck.slice(),hand:[],field:[null,null,null,null],discard:[],crests:0,fatigue:0,attached:false,guide:false,retreated:false})),log:[]};for(let p=0;p<2;p++){const q=s.players[p];shuffle(s,q.deck);const at=q.deck.findIndex(id=>C[id].card_type==='Creature'&&C[id].stage===0);q.field[0]=unit(q.deck.splice(at,1)[0],0);draw(s,p,K.opening)}begin(s,0);return s}
 function canPay(b,cost,extra=0){const pool=b.energy.map(id=>C[id].element);for(const [e,n]of Object.entries(cost))if(e!=='generic')for(let i=0;i<n;i++){const at=pool.indexOf(e);if(at<0)return false;pool.splice(at,1)}return pool.length>=(cost.generic||0)&&b.energy.length>=extra}
 function targets(s,p,rule){const q=s.players[p];if(rule==='own_creature')return q.field.flatMap((b,i)=>b?[i]:[]);if(rule==='own_reserve')return q.field.flatMap((b,i)=>b&&i>0?[i]:[]);if(rule==='basic_in_deck'||rule==='evolution_in_deck')return [...new Set(q.deck.filter(id=>C[id].card_type==='Creature'&&(rule==='basic_in_deck'?C[id].stage===0:C[id].stage>0)))];if(rule==='energy_in_discard')return [...new Set(q.discard.filter(id=>C[id].card_type==='Energy'))];return [null]}
 function legal(s){if(s.done)return [];const p=s.actor,q=s.players[p],moves=[];if(s.phase==='promote')return q.field.flatMap((b,i)=>b&&i?[{type:'promote',slot:i}]:[]);
  q.hand.forEach((id,index)=>{const c=C[id];if(c.card_type==='Creature'){
   if(c.stage===0)q.field.forEach((b,slot)=>{if(!b&&slot>0)moves.push({type:'deploy',index,slot})});
   else q.field.forEach((b,slot)=>{if(b&&definition(b).family===c.family&&definition(b).stage===c.stage-1&&s.ownTurns[p]>1&&b.entered<s.ownTurns[p]&&b.evolved<s.ownTurns[p])moves.push({type:'evolve',index,slot})});
  }else if(c.card_type==='Energy'){if(!q.attached)q.field.forEach((b,slot)=>{if(b)moves.push({type:'attach',index,slot})})}
  else if(c.card_type==='Tool'){q.field.forEach((b,slot)=>{if(b&&!b.tool)moves.push({type:'tool',index,slot})})}
  else if(!q.guide)for(const target of targets(s,p,c.target_rules))moves.push({type:'guide',index,target});
  });
  q.field.forEach((b,slot)=>{if(b&&!b.used&&definition(b).abilities.length)moves.push({type:'ability',slot})});const active=q.field[0];
  if(active){if(!(s.ply===1&&p===0))definition(active).attacks.forEach((a,index)=>{if(canPay(active,a.cost,a.extra_cost))moves.push({type:'attack',index})});if(!q.retreated&&active.energy.length>=definition(active).retreat_cost)q.field.forEach((b,slot)=>{if(slot&&b)moves.push({type:'retreat',slot})})}
  moves.push({type:'end'});return moves;
 }
 function effect(s,p,id,target){const e=F[id],q=s.players[p],b=typeof target==='number'?q.field[target]:null;if(e.op==='heal')b.damage=Math.max(0,b.damage-e.amount);if(e.op==='cleanse'){b.toxin=false;b.damage=Math.max(0,b.damage-e.amount)}if(e.op==='shield')b.shield=Math.max(b.shield,e.amount);if(e.op==='draw')draw(s,p,e.amount);if(e.op==='search'){const at=q.deck.indexOf(target);q.hand.push(q.deck.splice(at,1)[0]);shuffle(s,q.deck)}if(e.op==='recover'){q.discard.splice(q.discard.indexOf(target),1);q.hand.push(target)}if(e.op==='switch'){[q.field[0],q.field[target]]=[q.field[target],q.field[0]];q.field[target].toxin=false}if(e.op==='disrupt'){const other=s.players[1-p];if(other.hand.length){other.deck.push(other.hand.splice(random(s,other.hand.length),1)[0]);shuffle(s,other.deck);draw(s,1-p,1)}}}
 function damage(s,p,index){const a=s.players[p].field[0],b=s.players[1-p].field[0],card=definition(a),def=definition(b),attack=card.attacks[index];const bonus=a.tool?C[a.tool].effects.reduce((n,id)=>n+(F[id].op==='attack_bonus'?F[id].amount:0),0):0,armor=b.tool?C[b.tool].effects.reduce((n,id)=>n+(F[id].op==='armor'?F[id].amount:0),0):0;return Math.max(0,attack.damage+bonus+(def.weakness===card.element?20:0)-(def.resistance===card.element?20:0)-armor-b.shield)}
 function endTurn(s){const p=s.turn;s.players[p].field.forEach(b=>{if(b&&b.toxin)b.damage+=10});settle(s);if(s.done)return;if(s.ply>=K.turn_limit){const points=scores(s);finish(s,points[0]===points[1]?null:points[0]>points[1]?0:1,'Turn limit scores '+points.join(' : ')+'.');return}if(s.phase==='promote')s.afterPromote=1-p;else begin(s,1-p)}
 const equal=(a,b)=>a&&b&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>a[k]===b[k]);
 function apply(state,m){if(!legal(state).some(a=>equal(a,m)))return null;const s=copy(state),p=s.actor,q=s.players[p];
  if(m.type==='promote'){[q.field[0],q.field[m.slot]]=[q.field[m.slot],null];log(s,(p?'Computer':'You')+' promote '+definition(q.field[0]).name+'.');settle(s);if(!s.done&&s.phase!=='promote'&&s.afterPromote!==null){const next=s.afterPromote;s.afterPromote=null;begin(s,next)}return s}
  if(['deploy','evolve','attach','tool','guide'].includes(m.type)){const id=q.hand.splice(m.index,1)[0],c=C[id],b=q.field[m.slot];if(m.type==='deploy')q.field[m.slot]=unit(id,s.ownTurns[p]);if(m.type==='evolve'){b.stack.push(id);b.evolved=s.ownTurns[p];b.toxin=false}if(m.type==='attach'){b.energy.push(id);q.attached=true}if(m.type==='tool')b.tool=id;if(m.type==='guide'){q.guide=true;q.discard.push(id);for(const fx of c.effects)effect(s,p,fx,m.target)}log(s,(p?'Computer':'You')+' '+m.type+' '+c.name+'.');settle(s)}
  else if(m.type==='ability'){const b=q.field[m.slot],kind=definition(b).abilities[0];b.used=true;if(kind==='nurture')b.damage=Math.max(0,b.damage-10);if(kind==='ward')b.shield=Math.max(b.shield,10);if(kind==='insight')draw(s,p,1);log(s,definition(b).name+' uses '+kind+'.');settle(s)}
  else if(m.type==='retreat'){const b=q.field[0],count=definition(b).retreat_cost;q.discard.push(...b.energy.splice(0,count));b.toxin=false;[q.field[0],q.field[m.slot]]=[q.field[m.slot],b];q.retreated=true;log(s,'Retreat: discard '+count+' energy and switch active creature.');}
  else if(m.type==='attack'){const a=q.field[0],b=s.players[1-p].field[0],attack=definition(a).attacks[m.index],n=damage(s,p,m.index);q.discard.push(...a.energy.splice(0,attack.extra_cost));b.damage+=n;b.shield=0;for(const fx of attack.effects){if(fx==='toxin')b.toxin=true;if(fx==='self_heal')a.damage=Math.max(0,a.damage-10);if(fx==='recoil')a.damage+=10;if(fx==='draw_one')draw(s,p,1)}log(s,definition(a).name+' uses '+attack.name+' for '+n+' damage.');endTurn(s)}
  else if(m.type==='end'){log(s,(p?'Computer':'You')+' end the turn.');endTurn(s)}return s;
 }
 function ai(s){const options=legal(s);if(!options.length)return null;const p=s.actor,q=s.players[p],other=s.players[1-p];
  const ready=b=>{if(!b)return 0;const view={...s,players:s.players.map((x,i)=>i===p?{...x,field:[b,...x.field.slice(1)]}:x)};return Math.max(0,...definition(b).attacks.map((a,i)=>canPay(b,a.cost,a.extra_cost)?damage(view,p,i):0))};
  let best=options[0],score=-Infinity;for(const m of options){let n=-20;if(m.type==='promote')n=health(q.field[m.slot])+20*q.field[m.slot].energy.length;if(m.type==='deploy')n=80;if(m.type==='evolve')n=90;if(m.type==='attach')n=m.slot===0?75:40;if(m.type==='tool')n=m.slot===0?55:30;if(m.type==='guide'){const c=C[q.hand[m.index]],fx=F[c.effects[0]],b=q.field[m.target];n=10;if(fx.op==='heal'||fx.op==='cleanse')n=b?Math.min(b.damage,fx.amount):0;if(fx.op==='shield')n=b&&b.shield<fx.amount?30:0;if(fx.op==='draw')n=q.deck.length>=fx.amount&&q.hand.length<10?50:-30;if(fx.op==='search'){const found=C[m.target];n=found.stage===0?(q.field.filter(Boolean).length<3?65:5):q.field.some(b=>b&&definition(b).family===found.family&&definition(b).stage===found.stage-1)?70:2}if(fx.op==='switch')n=-30;if(fx.op==='recover')n=q.hand.some(id=>C[id].card_type==='Energy')?2:60}
   if(m.type==='ability'){const b=q.field[m.slot],kind=definition(b).abilities[0];n=kind==='nurture'?Math.min(10,b.damage):kind==='ward'?(b.shield<10?20:0):q.deck.length&&q.hand.length<10?35:-30}
   if(m.type==='retreat')n=health(q.field[0])<25&&health(q.field[m.slot])>health(q.field[0])&&q.field[m.slot].energy.length?45:-40;
   if(m.type==='promote'){const b=q.field[m.slot];n=ready(b)*2+health(b)*.4+(b.toxin?-15:0)}
   if(m.type==='deploy')n=q.field.filter(Boolean).length===1?190:95;
   if(m.type==='evolve'){const b=q.field[m.slot],c=C[q.hand[m.index]],evolved={...b,stack:[...b.stack,c.card_id]};n=health(evolved)<=0?-1000:125+(health(evolved)-health(b))*.4+(ready(evolved)-ready(b))*2}
   if(m.type==='attach'){const b=q.field[m.slot],c=C[q.hand[m.index]],next={...b,energy:[...b.energy,c.card_id]},gain=ready(next)-ready(b),useful=definition(b).attacks.some(a=>(a.cost[c.element]||0)>b.energy.filter(id=>C[id].element===c.element).length||a.cost.generic);n=(m.slot===0?110:70)+gain*3+(useful?15:-70)-b.energy.length*7}
   if(m.type==='tool')n=110+(m.slot===0?20:0);
   if(m.type==='ability'){const b=q.field[m.slot],kind=definition(b).abilities[0];if(kind==='nurture')n=b.damage?140+Math.min(10,b.damage):-40;if(kind==='ward')n=b.shield<10?135:-40;if(kind==='insight')n=q.deck.length&&q.hand.length<10?145:-50}
   if(m.type==='retreat'){const current=q.field[0],reserve=q.field[m.slot],threat=other.field[0]?Math.max(...definition(other.field[0]).attacks.filter(a=>canPay(other.field[0],a.cost,a.extra_cost)).map(a=>a.damage),0):0;n=health(current)<=threat&&health(reserve)>threat?150+ready(reserve)-ready(current):ready(reserve)-ready(current)-40}
   if(m.type==='attack'){const active=q.field[0],a=definition(active).attacks[m.index],hit=damage(s,p,m.index),kill=hit>=health(other.field[0]),recoil=a.effects.includes('recoil')?10:0,selfHeal=a.effects.includes('self_heal')?10:0,fatal=health(active)+selfHeal<=recoil+(active.toxin?10:0),winning=kill&&(other.field.filter(Boolean).length===1||q.crests+(definition(other.field[0]).stage>=3?2:1)>=K.crest_goal);n=50+hit+(kill?220:0)-a.extra_cost*12-(fatal?250:0);if(winning&&!fatal)n=10000}
   if(m.type==='guide'){const c=C[q.hand[m.index]],fx=F[c.effects[0]],b=q.field[m.target];if(['heal','cleanse'].includes(fx.op))n=b&&(b.damage||b.toxin)?130+Math.min(b.damage,fx.amount):-40;if(fx.op==='shield')n=b&&b.shield<fx.amount?130:-40;if(fx.op==='draw')n=q.deck.length>=fx.amount&&q.hand.length<10?130:-100}
   if(m.type==='end')n=-10;
   if(n>score){score=n;best=m}
  }return best;
 }
 return {create,legal,apply,ai,deckError,health,definition,damage,canPay,cards:C,unit};
 }
 root.PullCrestEngine={make};
})(typeof window!=='undefined'?window:globalThis);
