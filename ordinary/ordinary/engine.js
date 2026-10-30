/* Ordinary the Scattering engine. MIT; see LICENSE.txt. No DOM, network, clocks or natural-language interpretation. */
(function(root){
'use strict';
function makeEngine(data){
 const cards=Object.fromEntries(data.cards.map(c=>[c.card_id,c])),effects=data.effects,rule=data.rules.constants;
 const copy=x=>JSON.parse(JSON.stringify(x));
 const cardOf=x=>cards[typeof x==='string'?x:x.id];
 const label=p=>p===0?'You':'The computer';
 function log(s,text){s.log.push(text);if(s.log.length>70)s.log.shift()}
 function random(s,n){let x=s.rng;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return Math.floor(s.rng/4294967296*n)}
 function shuffle(s,list){for(let i=list.length-1;i>0;i--){const j=random(s,i+1);[list[i],list[j]]=[list[j],list[i]]}return list}
 const entity=(s,uid)=>{for(let p=0;p<2;p++){const b=s.players[p].field.find(b=>b.uid===uid);if(b)return {p,b,c:cardOf(b)}}return null};
 const isUnit=c=>c.type==='Creature',isMortal=c=>['Creature','Planeswalker','Battle'].includes(c.type);
 function aura(s,p,lane,op){return s.players[p].field.filter(b=>b.lane===lane).reduce((n,b)=>n+cardOf(b).effects.reduce((v,id)=>v+(effects[id].trigger==='aura'&&effects[id].op===op?effects[id].amount:0),0),0)}
 function attack(s,p,b){return Math.max(0,cardOf(b).attack+b.power+aura(s,p,b.lane,'attack_aura'))}
 function armor(s,p,b){return Math.max(0,cardOf(b).armor+b.armor+(isUnit(cardOf(b))?aura(s,p,b.lane,'armor_aura'):0))}
 function hurt(s,target,n){
  if(target.kind==='player'){const p=s.players[target.p],actual=Math.min(Math.max(0,p.hp),n);p.hp-=n;return actual}
  const e=entity(s,target.uid);if(!e)return 0;const damage=Math.max(0,n-armor(s,e.p,e.b)),actual=Math.min(Math.max(0,e.b.hp),damage);e.b.hp-=damage;if(e.c.type==='Battle')e.b.completed=false;return actual;
 }
 function heal(s,p,n){s.players[p].hp=Math.min(rule.composure,s.players[p].hp+n)}
 function draw(s,p,n){for(let i=0;i<n;i++){const player=s.players[p];if(player.deck.length)player.hand.push(player.deck.pop());else{player.fatigue++;player.hp-=player.fatigue;log(s,label(p)+' take '+player.fatigue+' fatigue damage from an empty deck.')}}}
 function targets(s,p,kind){
  const all=s.players.flatMap((player,q)=>player.field.map(b=>({kind:'entity',uid:b.uid,p:q,b,c:cardOf(b)})));
  if(kind==='enemy_any')return [{kind:'player',p:1-p},...all.filter(e=>e.p!==p&&isUnit(e.c)).map(e=>({kind:'entity',uid:e.uid}))];
  const filtered=all.filter(e=>kind==='friendly_creature'?e.p===p&&isUnit(e.c):kind==='enemy_creature'?e.p!==p&&isUnit(e.c):kind==='creature'?isUnit(e.c):kind==='enemy_support'?e.p!==p&&!isUnit(e.c):false);
  return filtered.map(e=>({kind:'entity',uid:e.uid}));
 }
 const same=(a,b)=>a===b||!!a&&!!b&&typeof a==='object'&&typeof b==='object'&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
 function remove(s,e,zone){s.players[e.p].field=s.players[e.p].field.filter(b=>b.uid!==e.b.uid);s.players[e.p][zone].push(e.b.id)}
 function apply(s,p,id,target){
  const e=effects[id],n=e.amount,t=e.scope==='self'?{kind:'player',p}:e.scope==='enemy'?{kind:'player',p:1-p}:target;
  if(e.op==='draw_cards')draw(s,p,n);
  else if(e.op==='heal')heal(s,p,n);
  else if(e.op==='deal_damage')hurt(s,t,n);
  else if(e.op==='sweep')s.players[1-p].field.filter(b=>isUnit(cardOf(b))).forEach(b=>hurt(s,{kind:'entity',uid:b.uid},n));
  else if(e.op==='roll'){s.die=1+random(s,n);log(s,label(p)+' roll '+s.die+' on a d6.');if(s.die<=2)heal(s,p,3);else if(s.die<=4)draw(s,p,1);else hurt(s,{kind:'player',p:1-p},3)}
  else if(e.op==='accord'){s.players[p].accord+=n;draw(s,p,1)}
  else if(['gain_armor','grow','exhaust','recall','exile'].includes(e.op)){
   const found=t&&t.kind==='entity'?entity(s,t.uid):null;if(!found)return;
   if(e.op==='gain_armor')found.b.armor+=n;
   if(e.op==='grow'){found.b.power+=n;found.b.maxhp+=n;found.b.hp+=n}
   if(e.op==='exhaust')found.b.exhausted=true;
   if(e.op==='recall'){remove(s,found,'hand');log(s,found.c.name+' return to hand.')}
   if(e.op==='exile')remove(s,found,'exile');
  }
 }
 function triggered(s,p,c,when,target){for(const id of c.effects)if(effects[id].trigger===when)apply(s,p,id,target)}
 function checkWinner(s){
  const win=[s.players[1].hp<=0||s.players[0].accord>=rule.accord_goal,s.players[0].hp<=0||s.players[1].accord>=rule.accord_goal];
  if(win[0]||win[1]){s.winner=win[0]&&win[1]?'draw':win[0]?0:1;s.phase='over';s.pending=null;log(s,s.winner==='draw'?'The scattering is a draw.':label(s.winner)+' win the scattering!')}
 }
 function settle(s){
  for(let pass=0;pass<20;pass++){
   const dead=s.players.flatMap((player,p)=>player.field.filter(b=>isMortal(cardOf(b))&&b.hp<=0).map(b=>({p,b,c:cardOf(b)}))).sort((a,b)=>a.b.uid-b.b.uid);if(!dead.length)break;
   for(const e of dead){remove(s,e,'discard');log(s,e.c.name+' is scattered.')}
   for(const e of dead)triggered(s,e.p,e.c,e.c.type==='Battle'?(e.b.completed?'complete':'never'):'death');
  }
  if(s.pending&&!entity(s,s.pending.attacker)){s.pending=null;s.phase='main';log(s,'The attacker left play; the attack ends.')}
  checkWinner(s);
 }
 function begin(s,p){
  s.active=p;s.phase='main';s.turn++;s.pending=null;const player=s.players[p];player.base=Math.min(rule.base_focus_cap,player.base+1);player.focus=player.base+player.lands.length;player.landPlayed=false;
  for(const b of player.field){b.exhausted=false;b.arrived=false;b.attacked=false;b.used=false}
  for(const b of [...player.field])triggered(s,p,cardOf(b),'start');
  for(const id of player.lands)triggered(s,p,cardOf(id),'start');
  if(s.turn>1)draw(s,p,1);log(s,'Turn '+s.turn+': '+label(p)+' refresh '+player.focus+' focus.');settle(s);
 }
 function deckError(deck){if(!Array.isArray(deck)||deck.length!==rule.deck_size)return 'A deck must contain exactly '+rule.deck_size+' cards.';const counts={};for(const id of deck){if(!cards[id])return 'Unknown card: '+id;counts[id]=(counts[id]||0)+1;if(counts[id]>rule.duplicates)return 'At most '+rule.duplicates+' copies of each card ID.'}return null}
 function randomDecks(seed=1){
  const rng={rng:Number(seed)>>>0||1},pool=data.cards.filter(c=>c.curated),pick=(filter,n,exclude=[])=>shuffle(rng,pool.filter(c=>filter(c)&&!exclude.includes(c.card_id))).slice(0,n).map(c=>c.card_id);
  const build=()=>{const early=pick(c=>c.type==='Creature'&&c.cost<=3,3),neighbors=[...early,...pick(c=>c.type==='Creature',2,early)],ids=[...neighbors,...pick(c=>c.type==='Instant',3),...pick(c=>c.type==='Sorcery',2),...pick(c=>['Artifact','Enchantment'].includes(c.type),1),...pick(c=>c.type==='Planeswalker',1),...pick(c=>c.type==='Battle',1),...pick(c=>c.type==='Land',2)];const deck=ids.flatMap(id=>[id,id]);const error=deckError(deck);if(error)throw Error(error);return shuffle(rng,deck)};
  const first=build();let second=build();for(let i=0;i<8&&first.slice().sort().join(',')===second.slice().sort().join(',');i++)second=build();return [first,second];
 }
 function create(decks,seed=1){
  if(!Array.isArray(decks)||decks.length!==2)throw Error('Exactly two decks are required.');
  for(const deck of decks){const error=deckError(deck);if(error)throw Error(error)}
  const s={version:1,rng:(Number(seed)>>>0)||1,seed:(Number(seed)>>>0)||1,turn:0,active:0,phase:'opening',pending:null,winner:null,uid:0,die:null,log:[],players:decks.map(deck=>({hp:rule.composure,accord:0,base:0,focus:0,deck:deck.slice(),hand:[],field:[],lands:[],discard:[],exile:[],fatigue:0,landPlayed:false}))};
  s.first=random(s,2);for(let p=0;p<2;p++){shuffle(s,s.players[p].deck);draw(s,p,rule.opening_hand)}log(s,'Opening hands dealt. '+label(s.first)+' will begin.');return s;
 }
 function guards(s,p,lane){return s.players[p].field.filter(b=>isUnit(cardOf(b))&&b.lane===lane&&!b.exhausted&&cardOf(b).keywords.includes('Guard'))}
 function legal(s,p){
  if(s.phase==='over')return [];
  if(s.phase==='opening')return p===0?[{type:'keep'},{type:'mulligan'}]:[];
  if(s.phase==='discard')return p===s.active?s.players[p].hand.map((_,i)=>({type:'discard',index:i})):[];
  const main=s.phase==='main'&&s.active===p,defend=s.phase==='defend'&&s.active!==p;
  if(!main&&!defend)return [];
  const actions=[],player=s.players[p];
  player.hand.forEach((id,index)=>{
   const c=cards[id];if(!main&&c.type!=='Instant'||c.cost>player.focus)return;
   if(c.type==='Land'){if(main&&!player.landPlayed&&player.lands.length<rule.homestead_cap)actions.push({type:'play',index,lane:0});return}
   const lanes=['Instant','Sorcery'].includes(c.type)?[0]:[0,1];
   for(const lane of lanes){
    if(isUnit(c)&&player.field.filter(b=>isUnit(cardOf(b))&&b.lane===lane).length>=rule.unit_lane_cap)continue;
    if(!['Creature','Instant','Sorcery'].includes(c.type)&&player.field.filter(b=>!isUnit(cardOf(b))).length>=rule.support_cap)continue;
    const ts=c.target_rules==='none'?[null]:targets(s,p,c.target_rules);
    for(const target of ts){const a={type:'play',index,lane};if(target)a.target=target;actions.push(a)}
   }
  });
  if(main){
   for(const b of player.field){
    const c=cardOf(b);
    if(!b.used&&player.focus>=1&&c.effects.some(id=>effects[id].trigger==='activate'))actions.push({type:'activate',uid:b.uid});
    if(!isUnit(c)||b.exhausted||b.attacked||b.arrived&&!c.keywords.includes('Quick'))continue;
    actions.push({type:'attack',uid:b.uid,target:{kind:'player',p:1-p}});
    for(const target of s.players[1-p].field.filter(t=>t.lane===b.lane&&['Battle','Planeswalker'].includes(cardOf(t).type)))actions.push({type:'attack',uid:b.uid,target:{kind:'entity',uid:target.uid}});
    for(const target of player.field.filter(t=>t.lane===b.lane&&cardOf(t).type==='Battle'))actions.push({type:'work',uid:b.uid,target:{kind:'entity',uid:target.uid}});
   }
   actions.push({type:'end'});
  }else{
   const pending=s.pending,attacker=entity(s,pending.attacker),lane=attacker?.b.lane;
   const forced=guards(s,p,lane),blockers=forced.length?forced:player.field.filter(b=>isUnit(cardOf(b))&&!b.exhausted&&b.lane===lane);
   for(const b of blockers)actions.push({type:'block',uid:b.uid});if(!forced.length)actions.push({type:'allow'});
  }
  return actions;
 }
 function combat(s,blockerUid){
  const pending=s.pending,from=entity(s,pending.attacker);s.pending=null;s.phase='main';if(!from)return;
  const power=attack(s,from.p,from.b),keyword=from.c.keywords;let actual=0,retaliation=0;
  if(blockerUid){
   const to=entity(s,blockerUid),defPower=attack(s,to.p,to.b),overflow=Math.max(0,power-armor(s,to.p,to.b)-Math.max(0,to.b.hp));to.b.exhausted=true;
   actual=hurt(s,{kind:'entity',uid:to.b.uid},power);retaliation=hurt(s,{kind:'entity',uid:from.b.uid},defPower);
   if(keyword.includes('Pierce')&&overflow)actual+=hurt(s,{kind:'player',p:to.p},overflow);
   if(to.c.keywords.includes('Siphon'))heal(s,to.p,retaliation);
   log(s,from.c.name+' and '+to.c.name+' exchange '+actual+' / '+retaliation+' damage simultaneously.');
  }else{actual=hurt(s,pending.target,power);log(s,from.c.name+' deals '+actual+' damage unblocked.')}
  if(keyword.includes('Siphon'))heal(s,from.p,actual);settle(s);
 }
 function transition(state,p,action){
  if(!legal(state,p).some(a=>same(a,action)))return {ok:false,error:'That action is not legal in this position.',state};
  const s=copy(state),player=s.players[p];
  if(action.type==='keep'||action.type==='mulligan'){
   if(action.type==='mulligan'){player.deck.push(...player.hand);player.hand=[];shuffle(s,player.deck);draw(s,p,rule.opening_hand);log(s,'You take the one free full-hand mulligan.')}begin(s,s.first);
  }else if(action.type==='play'){
   const id=player.hand.splice(action.index,1)[0],c=cardOf(id);player.focus-=c.cost;
   if(c.type==='Land'){player.lands.push(id);player.landPlayed=true;player.focus++;triggered(s,p,c,'play',action.target)}
   else if(['Instant','Sorcery'].includes(c.type)){player.discard.push(id);triggered(s,p,c,'play',action.target)}
   else{const b={uid:++s.uid,id,lane:action.lane,hp:c.health,maxhp:c.health,armor:0,power:0,exhausted:false,arrived:true,attacked:false,used:false};player.field.push(b);triggered(s,p,c,'play',action.target)}
   log(s,label(p)+' play '+c.name+'.');settle(s);
  }else if(action.type==='activate'){
   const e=entity(s,action.uid);player.focus--;e.b.used=true;triggered(s,p,e.c,'activate');log(s,label(p)+' activate '+e.c.name+'.');settle(s);
  }else if(action.type==='attack'||action.type==='work'){
   const e=entity(s,action.uid);e.b.attacked=true;if(!e.c.keywords.includes('Steady'))e.b.exhausted=true;
   if(action.type==='work'){const target=entity(s,action.target.uid);const n=hurt(s,action.target,attack(s,p,e.b));target.b.completed=true;log(s,e.c.name+' contributes '+n+' work to '+target.c.name+'.');settle(s)}
   else{s.pending={attacker:action.uid,target:action.target};s.phase='defend';log(s,e.c.name+' attacks. Defender may play Sparks, then choose a block.')}
  }else if(action.type==='block')combat(s,action.uid);
  else if(action.type==='allow')combat(s,null);
  else if(action.type==='discard'){const id=player.hand.splice(action.index,1)[0];player.discard.push(id);log(s,label(p)+' discard '+cardOf(id).name+'.');if(player.hand.length<=rule.hand_limit)end(s)}
  else if(action.type==='end'){if(player.hand.length>rule.hand_limit){s.phase='discard';log(s,'Discard down to '+rule.hand_limit+' cards.')}else end(s)}
  return {ok:true,state:s};
 }
 function end(s){
  if(s.turn>=rule.turn_limit){const points=s.players.map(p=>p.hp+3*p.accord);s.winner=points[0]===points[1]?'draw':points[0]>points[1]?0:1;s.phase='over';log(s,'Turn limit: composure + 3 × accord scores '+points.join(' : ')+'.');return}
  begin(s,1-s.active);
 }
 function ai(s,p){
  const options=legal(s,p);if(!options.length)return null;
  const player=s.players[p],other=s.players[1-p];let best=options[0],value=-Infinity;
  for(const a of options){let score=0;
   if(a.type==='keep')score=2;
   if(a.type==='mulligan')score=player.hand.filter(id=>cards[id].cost<=3).length<2?10:-10;
   if(a.type==='end')score=-20;
   if(a.type==='discard'){const c=cards[player.hand[a.index]];score=c.type==='Land'&&player.lands.length>=3?30:c.cost}
   if(a.type==='play'){
    const c=cards[player.hand[a.index]];score=c.type==='Land'?50:c.type==='Creature'?18+c.attack+c.health-c.cost:8;
    if(c.type==='Creature')score-=player.field.filter(b=>isUnit(cardOf(b))&&b.lane===a.lane).length*2;
    if(c.type==='Battle')score+=player.field.filter(b=>isUnit(cardOf(b))&&b.lane===a.lane).length*2;
    for(const id of c.effects){const e=effects[id];if(e.op==='heal')score+=Math.min(e.amount,24-player.hp)*2;if(e.op==='draw_cards')score+=player.deck.length?5:-30;if(e.op==='deal_damage'&&a.target){if(a.target.kind==='player')score+=other.hp<=e.amount?200:e.amount;else{const t=entity(s,a.target.uid);score+=e.amount>=t.b.hp+armor(s,t.p,t.b)?14:3}}if(e.op==='recall'&&a.target){const t=entity(s,a.target.uid);score+=t.p===p?-20:6+t.c.cost}if(e.op==='exhaust'&&s.phase==='defend')score=-50;if(e.op==='gain_armor'||e.op==='grow')score+=8;}
   }
   if(a.type==='activate'){const e=entity(s,a.uid);score=e.c.effects.some(id=>effects[id].op==='heal')?Math.min(3,24-player.hp)*2-1:12}
   if(a.type==='attack'){const e=entity(s,a.uid),pow=attack(s,p,e.b);score=9+pow;if(a.target.kind==='player'&&pow>=other.hp&&!other.field.some(b=>isUnit(cardOf(b))&&!b.exhausted&&b.lane===e.b.lane))score=250;const blockers=other.field.filter(b=>isUnit(cardOf(b))&&!b.exhausted&&b.lane===e.b.lane);if(blockers.some(b=>attack(s,1-p,b)>=e.b.hp+armor(s,p,e.b)&&b.hp+armor(s,1-p,b)>pow))score=-30;}
   if(a.type==='work'){const e=entity(s,a.uid),t=entity(s,a.target.uid);score=14+(attack(s,p,e.b)>=t.b.hp?14:0)+(player.accord>=6?25:0)}
   if(a.type==='allow'){score=0;const att=entity(s,s.pending.attacker);if(s.pending.target.kind==='player'&&attack(s,att.p,att.b)>=player.hp)score=-10000;}
   if(a.type==='block'){const e=entity(s,a.uid),att=entity(s,s.pending.attacker),pow=attack(s,att.p,att.b),ret=attack(s,p,e.b);score=pow+ (ret>=att.b.hp+armor(s,att.p,att.b)?12:0)-(pow>=e.b.hp+armor(s,p,e.b)?e.c.cost+4:0);if(s.pending.target.kind==='player'&&pow>=player.hp)score+=100;}
   if(a.type==='play'){const c=cards[player.hand[a.index]];for(const id of c.effects){const e=effects[id];if(e.op==='heal'&&player.hp>=rule.composure)score-=30;if(e.op==='draw_cards'&&player.deck.length<e.amount)score-=40;if(e.op==='exhaust'&&a.target){const t=entity(s,a.target.uid);if(t?.b.exhausted)score-=25}if(e.op==='exile'&&a.target){const t=entity(s,a.target.uid);if(t)score+=t.p===p?-100:20+t.c.cost*3}if(e.op==='sweep'){score+=other.field.filter(b=>isUnit(cardOf(b))&&b.hp+armor(s,1-p,b)<=e.amount).length*16}}}
   if(a.type==='block'){const defender=entity(s,a.uid),attacker=entity(s,s.pending.attacker),incoming=Math.max(0,attack(s,attacker.p,attacker.b)-armor(s,p,defender.b)),outgoing=Math.max(0,attack(s,p,defender.b)-armor(s,attacker.p,attacker.b));score-=incoming>=defender.b.hp?(defender.c.cost+defender.c.attack)*2:0;score+=outgoing>=attacker.b.hp?attacker.c.cost*3:0;if(s.pending.target.kind==='player'&&attack(s,attacker.p,attacker.b)>=player.hp)score+=1000;if(attacker.c.keywords.includes('Pierce')&&Math.max(0,incoming-defender.b.hp)>=player.hp)score-=2000}
   if(score>value){value=score;best=a}
  }
  return best;
 }
 return {create,randomDecks,transition,legal,ai,deckError,cards,effects,rule,entity,attack,armor,targets};
}
root.OrdinaryEngine={makeEngine};if(typeof module!=='undefined'&&module.exports)module.exports={makeEngine};
})(typeof window!=='undefined'?window:globalThis);
