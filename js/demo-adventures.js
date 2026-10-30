(() => {
 const D=window.DemoSession,V=D.value,N=D.name,red=c=>c.s===1||c.s===2;
 D.adapters.rpg=key=>{
  const E=D.rpg,s=E.s;if(s.done)return null;const moves=[],add=(action,ids,target,score,why)=>moves.push({action,ids,target,score,why});
  const hand=s.hand,high=hand.reduce((a,c,i)=>V(c)>V(hand[a])?i:a,0),low=hand.reduce((a,c,i)=>V(c)<V(hand[a])?i:a,0);
  const one=(a,i,t,score,why)=>add(a,[i],t,score,why);
  if(['delver','dragonhunt','vampirecourt'].includes(key)&&s.hp<15)hand.forEach((c,i)=>{if(c.s===1)one('mend',i,0,70+Math.min(V(c),24-s.hp),'Spend a Heart to recover health before the next risky action.')});
  if(key==='delver'||key==='chronomancer')s.field.forEach((e,t)=>hand.forEach((c,i)=>one(key==='delver'?'strike':'cross',i,t,40-Math.max(1,V(e.c)-V(c)-s.weapon+1)+(e.c.s===1&&s.hp<20?4:0),'Choose a manageable challenge and a strong card to limit health loss.')));
  else if(key==='dragonhunt'){
   hand.forEach((c,i)=>{one('strike',i,0,V(c),'Strike with a strong card. Every third attack costs extra health.');hand.forEach((d,j)=>{if(j>i&&c.s===d.s)add('strike',[i,j],0,V(c)+V(d)+5,'Combine two cards of the same suit for five bonus damage.')})});
  }else if(key==='soulcrypt')add(s.haul>=18?'bank':'venture',[],0,1,s.haul>=18?'Bank this haul before a black high card can erase it.':'Venture for another card. Black Tens and face cards risk the entire unbanked haul.');
  else if(key==='spellforge'||key==='alchemist'){
   const target=key==='spellforge'?s.spell:13;hand.forEach((c,i)=>{if(key==='spellforge'&&V(c)===target)one('cast',i,0,50,'One card exactly meets the spell target.');hand.forEach((d,j)=>{if(j>i&&V(c)+V(d)===target)add(key==='spellforge'?'cast':'brew',[i,j],0,60,'These two values total '+target+' exactly. The successful craft also heals you.')})});one(key==='spellforge'?'vent':'distill',low,0,-1,'No exact combination is available. Discard a low ingredient to find a new option, costing one HP.');
  }else if(key==='shieldwall')s.field.forEach((e,t)=>{if(!s.blocked.includes(t))hand.forEach((c,i)=>one('defend',i,t,30-Math.abs(V(e.c)-V(c)-(c.s===3?3:0)),'Assign a defender close to this lane strength. Clubs add three defence.'))});
  else if(key==='vampirecourt')hand.forEach((c,i)=>one('influence',i,0,30-s.influence[c.s]*2+Math.ceil(V(c)/2),'Improve a weak house while remembering its opposite house loses two influence.'));
  else if(key==='starsalvage'){
   if(s.salvage>=40)add('extract',[],0,100,'The salvage goal is met. Extract now rather than risk more oxygen.');
   if(s.salvage>=2&&(s.oxygen<=6||s.hp<13))one('repair',high,0,80,'Spend two salvage and this card to repair hull and restore oxygen.');
   s.field.forEach((e,t)=>one('explore',high,t,V(e.c)-Math.max(0,Math.ceil(V(e.c)/3)-Math.floor(V(hand[high])/3))*2,'Use a strong escort while exploring a valuable wreck. Exploration always spends two oxygen.'));
  }else if(key==='corsair'){
   const total=s.broadside.reduce((a,c)=>a+Math.min(10,V(c)),0);add(total>=15?'fire':'draw',[],0,1,total>=15?'Fire this safe broadside instead of risking a bust above twenty-one.':'Draw another broadside card. Faces count ten and Aces count one.');
  }else if(key==='wildtrail'){
   hand.forEach((c,i)=>{if(c.s===s.trail[s.progress])one('track',i,0,20,'Follow the next required suit marker. A matching Heart also heals you.')});one('scout',low,0,-1,'Scout with an unwanted card to search for the next required suit, paying one HP.');
  }else if(key==='necromancer'){
   hand.forEach((c,i)=>{if(!red(c)&&s.mana>=3)one('recruit',i,0,Math.ceil(V(c)/2)+(s.army<8?20:0),'Recruit a black card for permanent army strength at a cost of three mana.');if(red(c))one('sacrifice',i,0,s.mana<3?50:0,'Sacrifice a red card to restore mana and two health.');s.field.forEach((e,t)=>{if(s.army+V(c)>=V(e.c))one('command',i,t,30,'Combine the legion and this card to defeat a guardian, paying two health and one army strength.')})});
  }else if(key==='ironarena')s.field.forEach((e,t)=>{one(s.stamina>=2?'strike':'guard',high,t,30-V(e.c),'Choose a low retaliation challenge. '+(s.stamina>=2?'Strike spends two stamina.':'Guard restores stamina and halves incoming damage.'))});
  else if(key==='moonheist')s.field.forEach((e,t)=>hand.forEach((c,i)=>{if(c.s===e.c.s&&V(c)>=V(e.c))one('pick',i,t,40,'Use a sufficiently high card matching the lock suit to avoid raising Alarm.');hand.forEach((d,j)=>{if(j>i)add('improvise',[i,j],t,V(c)+V(d)>=V(e.c)+5?20:-10,'Improvise using two cards. This always adds two Alarm, even on success.')})}));
  else if(key==='village'){
   if(s.gold>=8)add('hire',[],s.target,60,'Hire permanent guard strength for eight gold to improve defence and Spade attacks.');
   hand.forEach((c,i)=>s.field.forEach((e,t)=>one('play',i,t,c.s===0?V(c)+s.guard+(V(c)+s.guard>=e.hp?30:0):c.s===3?V(c)+(s.barrier<8?15:0):c.s===1?Math.min(V(c),24-s.hp)*2:V(c),'Play '+N(c)+': '+['damage the raider','restore health','earn gold for guards','strengthen the temporary wall'][c.s]+'. A surviving raider retaliates.')));
  }else if(key==='bounty')s.field.forEach((e,t)=>hand.forEach((c,i)=>{const n=V(c)+(c.s===e.c.s?4:0);one('attack',i,t,n+(n>=e.hp?30:0),'Attack a contract, adding four for a suit match. Finishing it prevents retaliation and earns gold.')}));
  else if(key==='relicvault'){
   if(s.progress>=10)add('escape',[],0,100,'Ten relics are secured. Escape alive now.');s.field.forEach((e,t)=>one('claim',high,t,red(e.c)?50:30-V(e.c),'Prefer a red healing relic; otherwise use a strong ward against its curse.'));
  }else if(key==='caravan'){
   D.marketTrades=D.marketTrades||new Set();const stamp=s.progress+':';
   s.field.forEach((e,t)=>{const price=Math.ceil(V(e.c)/2),good=e.c.s;if(!D.marketTrades.has(stamp+good)){if(s.cargo[good]&&price>=4)add('sell',[],t,40+price,'Sell cargo at a favourable market price before travelling.');else if(price<=2&&s.gold>=price&&s.cargo[good]<3)add('buy',[],t,30-price,'Buy one inexpensive good for a later market or the final four-gold liquidation.')}});
   one('travel',high,0,1,'Travel with a high escort card to reduce road damage. The market changes after every leg.');
  }else if(key==='skyspire'){
   hand.forEach((c,i)=>{if(V(c)>s.height||V(c)===s.height&&c.s===s.lastsuit)one('climb',i,0,30-V(c),'Climb using the smallest eligible rank to preserve higher cards for later floors.')});one('portal',low,0,-1,'No higher card remains. Spend a low card and two HP to reset the rank ladder.');
  }else if(key==='oraclequest')s.field.forEach((e,t)=>hand.forEach((c,i)=>one(['fight','parley','study','sneak'][c.s],i,t,(V(c)+5>=V(e.c)?30:0)+(s.sigils[e.c.s]<2?20:0)+V(c),'Choose the skill matching this card for +5, and favour a sigil suit still needed.')));
  moves.sort((a,b)=>b.score-a.score);const m=moves[0];if(!m)return null;
  if(key==='caravan'&&m.action!=='travel')D.marketTrades.add(s.progress+':'+s.field[m.target].c.s);
  s.selected=m.ids;s.target=m.target;const before=s.turn;E.act(m.action);if(s.turn===before&&!s.done)return null;
  return m.why+' '+s.log[s.log.length-1];
 };
 D.adapters.legacy=key=>{
  const E=D.legacy;
  if(key==='scoundrel'){
   const s=E.SC;if(s.done)return null;let choice=0,best=-Infinity;
   s.room.forEach((c,i)=>{const v=c.r+2,score=c.s===2?20+v:c.s===1?(s.pot?-20:Math.min(20-s.hp,v)*2):-(s.uw&&s.w&&v<=s.last?Math.max(0,v-s.w):v);if(score>best){best=score;choice=i}});
   const c=s.room[choice];E.scp(choice);return 'Resolve '+N(c)+': '+(c.s===2?'equip a weapon for later monsters.':c.s===1?'heal if this room potion allowance remains.':'fight with the equipped weapon when its rank limit permits, otherwise take full damage.');
  }
  if(key==='longroad'){
   if(E.L.done)return null;const b=E.best(E.L.h);E.lrst();return 'Strike with the best five-card subset: '+b.n+', '+b.dm+' damage. Printed Hearts heal and Clubs reduce retaliation.';
  }
  if(key==='savage'){
   const s=E.SW;if(s.done)return null;const who=s.q[s.i].n;E.swn();return 'Resolve '+who+' in initiative order. '+s.log.filter(x=>x&&!x.includes('New round')).slice(-1)[0];
  }
  if(key==='quiet'){
   if(E.Q.closed)return null;
   const responses=['The neighbours share tools and repair the meeting hall.','A small expedition searches for supplies while elders keep watch.','The community holds a council and agrees on the next shared project.','Families record what happened and prepare a reserve for winter.'];
   const text=responses[E.Q.wk%responses.length];$('#qt').value=text;const week=E.Q.wk;E.qd();return week?'Write the response for week '+week+': “'+text+'” Then log it and draw the next prompt.':'Draw the first weekly prompt. This is collaborative storytelling, not a points challenge.';
  }
  if(key==='falk'){
   const s=E.FK;if(s.done)return null;let i=0;s.h.forEach((c,j)=>{const value=x=>x.r+2+(x.s===s.a?3:0);if(value(c)>value(s.h[i]))i=j});const c=s.h[i],n=c.r+2+(c.s===s.a?3:0),target=s.df;
   document.querySelectorAll('#fh .pl')[i].querySelector('.card').click();return 'Play '+N(c)+' for '+n+' against difficulty '+target+'. A matching action suit adds three; four successes win before three failures.';
  }
  const free=key==='freecell',s=free?E.F:E.K;if(s.done)return null;const piles=free?s.c:s.t,moves=[],sources=[],add=(text,run)=>moves.push({text,run}),rank=c=>(c.r+1)%13,colour=c=>c.s===1||c.s===2;
  piles.forEach((p,col)=>p.forEach((o,index)=>{if(free?E.seq(p,index):o.up)sources.push({s:(free?'c':'t')+col,i:index,c:free?o:o.c,cs:free?p.slice(index):p.slice(index).map(o=>o.c)})}));
  if(free)s.x.forEach((c,col)=>{if(c)sources.push({s:'x'+col,i:0,c,cs:[c]})});else if(s.w.length)sources.push({s:'w',i:s.w.length-1,c:s.w[s.w.length-1],cs:[s.w[s.w.length-1]]});
  const click=free?E.fc:E.kc;
  for(const q of sources){
   if(q.cs.length===1&&s.f[q.c.s].length===rank(q.c))add('Build '+N(q.c)+' onto its suit foundation, releasing its source position.',()=>{s.sel=q;click('f'+q.c.s,0)});
   piles.forEach((p,col)=>{const to=(free?'c':'t')+col,tp=p.length?(free?p[p.length-1]:p[p.length-1].c):null;if(to===q.s)return;const fits=tp?colour(tp)!==colour(q.c)&&rank(tp)===rank(q.c)+1:free||rank(q.c)===12;
    const capacity=!free||q.cs.length<=(s.x.filter(c=>!c).length+1)*2**piles.filter((p,i)=>!p.length&&i!==col).length;
    if(fits&&capacity&&!(q.i===0&&!tp&&q.s[0]===(free?'c':'t')))add('Move '+N(q.c)+(q.cs.length>1?' and its descending run':'')+' to column '+(col+1)+'. Build down in alternating colours'+(free?' within free-cell capacity.':'; only Kings fill empty columns.'),()=>{s.sel=q;click(to,p.length-1)})});
   if(free&&q.cs.length===1&&q.s[0]==='c'&&piles[+q.s.slice(1)].length>1){const cell=s.x.findIndex(c=>!c);if(cell>=0)add('Store '+N(q.c)+' in a free cell to expose the next card. This reduces available run-moving capacity.',()=>{s.sel=q;click('x'+cell,0)})}
  }
  const moved=D.freshMove(s,moves);if(moved)return moved;
  if(!free&&(s.st.length||s.w.length)){E.kc('st',0);return 'Draw the next stock card, or recycle the waste when the stock is empty. Look for foundation progress before drawing again.'}return null;
 };
})();
