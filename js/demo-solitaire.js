(() => {
 const D=window.DemoSession,V=c=>c.r===12?1:c.r+2,N=c=>R[c.r]+S[c.s],top=a=>a[a.length-1];
 D.name=N;D.value=V;
 D.action=pattern=>{const b=[...document.querySelectorAll('#g2b button')].find(b=>!b.disabled&&pattern.test(b.textContent));if(!b)return false;b.click();return true};
 D.freshMove=(state,moves)=>{const stamp=JSON.stringify(state,(k,v)=>['sel','selected','history'].includes(k)?undefined:v instanceof Set?[...v]:v);const m=moves.find(m=>!D.seen.has(stamp+'|'+m.text));if(m){D.seen.add(stamp+'|'+m.text);m.run();return m.text}return null};
 D.adapters.solitaire=key=>{
  const E=D.solitaire,s=E.s;if(s.done)return null;const moves=[],add=(text,run)=>moves.push({text,run});
  if(key==='clock'){const i=s.active;E.clockFlip(i);return 'Turn the highlighted '+(i===12?'King':i===0?'Ace':i+1)+' pile. The revealed rank chooses the next pile; there is no strategic alternative.'}
  if(key==='memory'){
   if(s.busy)return false;
   D.memory=D.memory||new Map();let index=-1;
   if(s.open.length){const a=s.open[0],c=s.cards[a],known=D.memory.get(c.r+':'+(c.s===1||c.s===2));if(known)index=known.find(i=>i!==a&&!s.matched.has(i))??-1}
   if(index<0)index=s.cards.findIndex((c,i)=>!s.matched.has(i)&&!s.open.includes(i)&&![...D.memory.values()].some(ids=>ids.includes(i)));
   if(index<0)index=s.cards.findIndex((c,i)=>!s.matched.has(i)&&!s.open.includes(i));if(index<0)return null;
   const c=s.cards[index],id=c.r+':'+(c.s===1||c.s===2),ids=D.memory.get(id)||[];if(!ids.includes(index))ids.push(index);D.memory.set(id,ids);
   document.querySelectorAll('.sol-memory .sol-card')[index].click();return 'Reveal card '+(index+1)+': '+N(c)+'. Remember its position; a pair must match both rank and colour.';
  }
  if(key==='bowling'){
   const left=E.pinsLeft(top(s.frames),s.frames.length-1);let best=0,mask=0;
   for(let m=1;m<8;m++){const sum=s.hand.reduce((n,c,i)=>n+((m>>i)&1?Math.min(10,V(c)):0),0);if(sum<=left&&sum>best){best=sum;mask=m}}
   s.marked=new Set(s.hand.map((_,i)=>i).filter(i=>(mask>>i)&1));E.bowl();return 'Roll '+best+' of the '+left+' standing pins using the largest legal hand total. All three cards are then discarded.';
  }
  if(key==='pyramid'){
   const free=s.table.map((c,i)=>c&&E.pyramidFree(i)?i:null).filter(i=>i!==null);if(s.waste.length)free.push(-1);const get=i=>i===-1?top(s.waste):s.table[i];
   for(const i of free){if(V(get(i))===13)add('Remove the uncovered '+N(get(i))+' alone: a King already totals thirteen.',()=>{s.sel=null;E.pyramidClick(i)});for(const j of free)if(j>i&&V(get(i))+V(get(j))===13)add('Remove '+N(get(i))+' with '+N(get(j))+': their values total thirteen.',()=>{s.sel=null;E.pyramidClick(i);E.pyramidClick(j)})}
  }else if(key==='golf'||key==='tripeaks'){
   if(key==='golf')s.piles.forEach((p,col)=>{if(p.length&&E.adjacent(top(p),top(s.waste),false))add('Play '+N(top(p))+' onto '+N(top(s.waste))+': one rank apart, without King/Ace wrapping.',()=>document.querySelectorAll('.sol-column')[col].lastElementChild.click())});
   else s.table.forEach(t=>{if(E.peakFree(t)&&E.adjacent(t.c,top(s.waste),true))add('Remove uncovered '+N(t.c)+' onto '+N(top(s.waste))+'. Adjacent ranks, including King/Ace, are legal here.',()=>{const i=s.table.filter(x=>!x.removed).indexOf(t);document.querySelectorAll('.sol-peaks .sol-card')[i].click()})});
  }else if(key==='accordion'){
   s.piles.forEach((p,i)=>{for(const j of [i-3,i-1])if(j>=0&&E.accordionLegal(i,j))add('Move '+N(top(p))+' from pile '+(i+1)+' to pile '+(j+1)+': same rank or suit, '+(i-j)+' places left.',()=>{s.sel=null;const click=n=>document.querySelectorAll('.sol-accordion .sol-card')[n].click();click(i);click(j)})});
  }else if(key==='montecarlo'){
   s.table.forEach((c,i)=>{if(c)s.table.forEach((d,j)=>{if(j>i&&E.montePair(i,j))add('Remove neighbouring '+N(c)+' and '+N(d)+': their ranks match and their grid cells touch.',()=>{s.sel=null;const click=n=>{const idx=s.table.slice(0,n).filter(Boolean).length;document.querySelectorAll('.sol-grid .sol-card')[idx].click()};click(i);click(j)})})});
  }else if(key==='spider'){
   s.piles.forEach((p,col)=>p.forEach((o,i)=>{if(!E.spiderRun(p,i))return;s.piles.forEach((q,to)=>{if(to!==col&&(!q.length||V(top(q).c)===V(o.c)+1)&&(!(!q.length&&i===0)))add('Move the descending run headed by '+N(o.c)+' from column '+(col+1)+' to '+(to+1)+'. This frees covered cards and preserves the run.',()=>{s.sel=null;E.spiderClick(col,i);E.spiderClick(to,q.length-1)})})}));
  }else{
   const sources=s.piles.map((p,col)=>p.length?{c:top(p),col}:null).filter(Boolean);if(s.waste&&s.waste.length)sources.unshift({c:top(s.waste),col:-1});
   for(const q of sources)for(let f=0;f<4;f++)if(E.foundationFits(q.c,f))add('Send '+N(q.c)+' to foundation '+(f+1)+'. '+(key==='calculation'?'It is the next rank in the +'+(f+1)+' sequence.':'It is the next card of its suit.'),()=>{s.sel={col:q.col};E.foundationClick(f)});
   for(const q of sources)s.piles.forEach((p,to)=>{if(q.col===to)return;const ok=key==='calculation'?q.col===-1:(!p.length?key==='castle':V(top(p))===V(q.c)+1&&(key!=='lucie'||top(p).s===q.c.s));if(ok)add('Move '+N(q.c)+' to work '+(key==='lucie'?'fan ':'column ')+(to+1)+'. '+(key==='calculation'?'Keep later-needed ranks beneath earlier ones.':'This follows the descending build rule.'),()=>{s.sel={col:q.col};E.foundationColumn(to,p.length-1)})});
  }
  const moved=D.freshMove(s,moves);if(moved)return moved;
  const actions=key==='montecarlo'?/Gather & refill/:key==='spider'?/Deal 10/:/Draw card|Recycle waste/;
  if(D.action(actions))return key==='montecarlo'?'Gather surviving cards in reading order and refill from stock; new neighbours can make new pairs.':'No unused useful move is available. '+(key==='spider'?'Deal one card onto each occupied column.':'Advance the stock or use an allowed recycle to expose another card.');
  return null;
 };
 D.adapters.more=key=>{
  const E=D.more,s=E.s;if(s.done)return null;const moves=[],add=(text,run)=>moves.push({text,run});
  if(key==='gaps'){
   s.grid.forEach((c,from)=>{if(c)s.grid.forEach((d,to)=>{if(!d&&E.gapLegal(from,to))add('Place '+N(c)+' into gap '+(to+1)+'. '+(to%13===0?'A Two starts a suit row.':'It follows the previous rank of the same suit.'),()=>{s.sel=from;document.querySelectorAll('.gaps-board > *')[to].click()})})});
   const moved=D.freshMove(s,moves);if(moved)return moved;if(s.redeals){E.gapRedeal();return 'Use one redeal: retain the correctly ordered suit prefixes and reshuffle the unsequenced cards.'}return null;
  }
  if(key==='acesup'){
   s.p.forEach((p,col)=>{if(E.aceLegal(col))add('Discard '+N(top(p))+': another exposed card of its suit is higher. Aces are high.',()=>E.acesMove(col))});
   if(!moves.length)s.p.forEach((p,from)=>{if(p.length>1)s.p.forEach((q,to)=>{if(!q.length)add('Move '+N(top(p))+' to empty pile '+(to+1)+' to expose the card below it.',()=>{s.sel=from;E.acesMove(to)})})});
   const moved=D.freshMove(s,moves);if(moved)return moved;if(D.action(/Deal four/))return 'Deal four cards, one onto each pile, to expose new same-suit comparisons.';return null;
  }
  const sources=[];s.p.forEach((p,col)=>p.forEach((o,index)=>{if(E.selectable(col,index))sources.push({type:'p',col,index})}));s.cells.forEach((c,col)=>{if(c)sources.push({type:'cell',col})});s.bouquet.forEach((c,col)=>sources.push({type:'bouquet',col}));for(const type of ['reserve','waste'])s[type].forEach((p,col)=>{if(p.length)sources.push({type,col})});
  if(key==='nestor'){
   const tops=sources.filter(q=>q.type!=='p'||q.index===s.p[q.col].length-1);
   tops.forEach((a,i)=>tops.forEach((b,j)=>{if(j>i&&E.source(a)[0].r===E.source(b)[0].r)add('Pair exposed '+N(E.source(a)[0])+' and '+N(E.source(b)[0])+'. Nestor removes equal ranks without moving other cards.',()=>{s.sel=a;E.choose(b.type,b.col,b.index)})}));
  }else for(const q of sources){
   const cs=E.source(q),c=cs[0];if(!c)continue;
   if(!s.cfg.runs&&cs.length===1&&(s.base!==null||q.type==='reserve'))s.f.forEach((_,f)=>{if(E.foundationFits(c,f))add('Build '+N(c)+' onto foundation '+(f+1)+'. '+(s.base===null?'This reserve card sets the base rank.':'It fits this game foundation sequence.'),()=>{s.sel=q;E.foundation(f)})});
   s.p.forEach((p,to)=>{if(q.type==='p'&&q.col===to)return;const cfg=s.cfg,empty=!p.length,fit=empty?(cfg.empty==='any'||cfg.empty==='king'&&V(c)===13||cfg.empty==='reserve'&&!s.reserve[0].length):E.relation(top(p).c,c,cfg.build),capacity=!cfg.cells||cs.length<=(s.cells.filter(c=>!c).length+1)*2**(cfg.empty==='any'?s.p.filter((p,i)=>!p.length&&i!==to).length:0);
    if(fit&&capacity&&!(empty&&q.type==='p'&&q.index===0))add('Move '+N(c)+(cs.length>1?' with '+(cs.length-1)+' following cards':'')+' to column '+(to+1)+'. '+(empty?'An empty column accepts this card in this variant.':'The leading card satisfies the '+cfg.build+' build rule.'),()=>{s.sel=q;E.choose('p',to,p.length-1)})});
   if(cs.length===1&&q.type==='p'&&s.p[q.col].length>1){const cell=s.cells.findIndex(c=>!c);if(cell>=0)add('Temporarily store '+N(c)+' in free cell '+(cell+1)+' to release the card below. Keep cells clear when possible.',()=>{s.sel=q;E.choose('cell',cell)})}
  }
  const moved=D.freshMove(s,moves);if(moved)return moved;
  if(D.action(/^Draw|^Recycle/))return 'Expose the next stock card or use this variant permitted recycle. Check it for foundation and tableau moves before drawing again.';return null;
 };
})();
