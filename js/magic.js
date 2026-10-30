
//ENGINE
const deck52=()=>{const d=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({r,s});return d};
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const mdeal=(d,k)=>{const c=Array.from({length:k},()=>[]);d.forEach((x,i)=>c[i%k].push(x));return c};
const mgather=(c,p)=>{const o=c.map((_,i)=>i).filter(i=>i!=p),m=c.length>>1;return[...o.slice(0,m),p,...o.slice(m)].flatMap(i=>c[i])};
const mverify=(n,k,r)=>{let ok=0;for(let s=0;s<n;s++){let d=[...Array(n).keys()];for(let i=0;i<r;i++){const c=mdeal(d,k);d=mgather(c,c.findIndex(x=>x.includes(s)))}if(d[n>>1]===s)ok++}return ok};
//ENDENGINE
(()=>{
const B=o=>({n:21,k:3,r:3,kind:'std',...o}),C={
classic:B({t:'1. Classic Three-Column',d:'21 cards, 3 columns, 3 rounds. Tap the column holding the card you’re thinking of.'}),
pred:B({t:'2. The Prediction',d:'A sealed prediction is locked in before you choose anything.',x:'The prediction is the card’s final position, not its identity. The maths guarantees that position before anything is chosen.'}),
noq:B({t:'3. No Questions Asked',d:'I never ask which column. Just press the button when your card lights up.',kind:'flash',x:'Your button press tells me which column was lit when you saw your card. It is the same information as an answer, gathered by timing instead of a question.'}),
one:B({t:'4. One Round',d:'Seven columns of three, one deal. Two taps and I know it.',k:7,r:1,kind:'one',x:'No counting trick here. Your two taps (column, then card) carry the information, disguised as part of the performance.'}),
spec:B({t:'5. You Deal',d:'You deal and gather every card yourself. I only guide you.',kind:'spec',x:'Same maths, but your hands do the work. The glowing pile tells you the gather order, and wrong piles are refused.'}),
ment:B({t:'6. Silent Mind Reading',d:'Think. Say nothing. Same engine, dressed as mentalism.',kind:'ment',x:'Pure presentation: the engine is identical to variation 1. The silent method still needs your tap on a column.'}),
big:B({t:'7a. Bigger Deck',d:'27 cards, still three rounds, landing in the exact centre.',n:27}),
wide:B({t:'7b. Wider Table',d:'25 cards in 5 piles. Only two rounds.',n:25,k:5,r:2})};
let T,FT,flashResume=null;const sessions=new Map();
function stop(){const M=window.MagicArcade;if(!window.DemoSession&&T&&C[M?.current])sessions.set(M.current,{token:T,view:M.captureView(),flashResume,resumes:[]});T=null;clearInterval(FT);FT=null;flashResume=null;if(M)M.current=null}
const W=ms=>{const token=T;return new Promise(resolve=>setTimeout(()=>{if(T===token)return resolve();const saved=[...sessions.values()].find(s=>s.token===token);if(saved)saved.resumes.push(resolve)},ms))},say=t=>$('#mmsg').textContent=t,acts=$('#mact');
const ask=o=>new Promise(res=>{acts.innerHTML='';o.forEach(([l,v,a])=>{const b=h('button',a?'alt':'',l);b.onclick=()=>{acts.innerHTML='';res(v)};acts.appendChild(b)})});
function cols(c,o={}){if(window.DemoSession)window.DemoSession.magic.columns=c;const box=$('#mcols');box.innerHTML='';return c.map((cl,i)=>{const e=h('div','mcol'+(o.pick?' hot':''));e.style.height=`calc(${Math.max(cl.length,1)-1}*var(--ov) + var(--ch))`;
 cl.forEach((x,j)=>{const d=card(x,true);d.style.top=`calc(${j}*var(--ov))`;if(o.anim)d.style.animation=`pop .3s ${(j*c.length+i)*25}ms backwards`;e.appendChild(d)});
 if(o.labels)e.appendChild(h('div','mlab','Pile '+(i+1)));if(o.pick)e.onclick=()=>{sfx(500,.06);o.pick(i)};box.appendChild(e);return e})}
function flash(els,label){return new Promise(res=>{let i=0;const set=()=>els.forEach((e,j)=>e.classList.toggle('dim',j!=i));set();let t;flashResume=()=>{t=FT=setInterval(()=>{i=(i+1)%els.length;set();sfx(300+i*40,.05)},1500)};flashResume();ask([[label,1]]).then(()=>{clearInterval(t);flashResume=null;els.forEach(e=>e.classList.remove('dim'));res(i)})})}
async function specDeal(d,k,ok){const cl=Array.from({length:k},()=>[]);let i=0;while(i<d.length){cols(cl,{labels:1});say(`Deal a row: one card onto each pile (${(d.length-i)/k} rows left).`);await ask([['Deal a row',1]]);if(!ok())return;for(let j=0;j<k;j++)cl[j].push(d[i++]);sfx(400,.05)}cols(cl,{labels:1});return cl}
async function specGather(cl,p,ok){const m=cl.length>>1,o=cl.map((_,i)=>i).filter(i=>i!=p),order=[...o.slice(0,m),p,...o.slice(m)],done=new Set();
 for(const want of order){await new Promise(res=>{const els=cols(cl,{labels:1,pick:i=>{if(i==want)res();else{toast('Not that pile. Tap the glowing one.');sfx(130,.2,'sawtooth')}}});els.forEach((e,i)=>{e.classList.toggle('dim',done.has(i));e.classList.toggle('on',i==want)});say(done.size?'Put the glowing pile underneath the ones you hold.':'Pick up the glowing pile.')});if(!ok())return;done.add(want);sfx(450,.06)}}
async function reveal(list,idx,c,ok,id){if(!ok())return;const box=$('#mcols'),step=Math.max(8,Math.min(34,Math.floor((innerWidth-120)/list.length))),els=[];box.innerHTML='';
 const fan=h('div');fan.style.cssText=`position:relative;height:calc(var(--ch) + 60px);width:calc(${step*(list.length-1)}px + var(--cw));margin-top:20px`;
 list.forEach((x,i)=>{const d=card(x,false);d.style.left=i*step+'px';d.style.top='45px';d.style.animation=`pop .3s ${i*30}ms backwards`;fan.appendChild(d);els.push(d)});box.appendChild(fan);
 say(id=='one'?'Three cards left. One of them is yours…':'All that shuffling… and your card is now exactly in the middle.');await W(1500);
 for(let i=0;i<=idx;i++){if(!ok())return;els[i].classList.add('glow');els[i].style.top='35px';sfx(300+i*30,.05);await W(i<idx?150:400)}
 say('…');await W(900);if(!ok())return;const e=els[idx],x=list[idx];e.style.transition='transform .7s';e.style.zIndex=9;e.style.transform='translateY(-30px) scale(1.8)';e.classList.add('up');jingle([523,659,784,1047]);const r=e.getBoundingClientRect();conf(r.left+30,r.top+40,90,GOLD);
 say(`Was your card the ${R[x.r]} of ${['spades','hearts','diamonds','clubs'][x.s]}?`);if(id=='pred'){$('#menv').textContent=`✉ Prediction: “Your card will be number ${idx+1}.”`}
 while(1){const a=await ask([['Play again',1],['How did it work?',2,1],['Back to tricks',3,1]]);if(!ok())return;if(a==1)return run(id,true);if(a==3){T=null;sessions.delete(id);return list0()}
  say(`Your column is always gathered in the middle, so your card drifts toward the centre. With ${c.k} piles over ${c.r} rounds it can only end at position ${(c.n>>1)+1}. ${c.kind=='one'?'':'This app just verified all '+c.n+' starting positions with the exact deal and gather code it ran. '}${c.x||''}`)}}
async function one(d,ok,c){const cl=mdeal(d,7);say('Seven columns of three. Tap the column that holds your card.');const p=await new Promise(res=>cols(cl,{anim:1,labels:1,pick:res}));if(!ok())return;
 say('Now watch the three. Press when yours lights up.');await W(500);const row=await flash(cols(cl[p].map(x=>[x])),'That’s my card!');await reveal(cl[p],row,c,ok,'one')}
function grid(d){const box=$('#mcols');box.innerHTML='';d.forEach((x,i)=>{const w=h('div');w.style.cssText='position:relative;width:var(--cw);height:var(--ch);margin:4px';const c=card(x,true);c.style.animation=`pop .3s ${i*25}ms backwards`;w.appendChild(c);box.appendChild(w)})}
async function run(id,fresh=false){stop();const M=window.MagicArcade;M.stopExtra?.();if(!window.DemoSession&&!fresh&&sessions.has(id)){const saved=sessions.get(id);sessions.delete(id);T=saved.token;M.current=id;M.restoreView(saved.view);flashResume=saved.flashResume;flashResume?.();saved.resumes.forEach(resolve=>resolve());return}sessions.delete(id);M.current=id;const c=C[id],tok=T=Symbol(),ok=()=>T==tok,mind=c.kind=='ment';$('#mlist').style.display='none';$('#mplay').style.display='flex';
 $('#menv').style.display=id=='pred'?'block':'none';$('#menv').textContent='✉ Sealed prediction: “Your card will end up in one exact place.”';
 $('#mver').textContent=c.kind=='one'?'':`✔ verified: ${mverify(c.n,c.k,c.r)}/${c.n} starting positions`;
 let d=shuf(deck52()).slice(0,c.n);if(window.DemoSession)window.DemoSession.magic.card=d[0];$('#mcols').innerHTML='';say(mind?'Think of one card. Say nothing. Just think.':'Look at the cards. Think of one and remember it. Don’t tell me!');
 grid(d);
 await ask([['I’m thinking of a card',1]]);if(!ok())return;say('Shuffling…');sfx(220,.3);await W(900);if(!ok())return;shuf(d);if(c.kind=='one')return one(d,ok,c);
 for(let r=0;r<c.r;r++){let cl=c.kind=='spec'?await specDeal(d,c.k,ok):mdeal(d,c.k);if(!ok())return;let p;
  if(c.kind=='flash'){const els=cols(cl,{anim:1,labels:1});say('I won’t ask where it is. Press the button the moment your card lights up.');p=await flash(els,'That’s my card!')}
  else{cols(cl,{anim:c.kind!='spec',labels:1});if(mind){say('Concentrate. Hold the picture clearly…');await W(1800)}say(mind?'I can almost see it. Tap the pile your mind is drawn to.':['Which column is your card in?','Where is it now?','Once more. Where is your card?'][Math.min(r,2)]);p=await new Promise(res=>cols(cl,{labels:1,pick:res}))}
  if(!ok())return;$('#mcols').children[p].classList.add('on');await W(600);
  if(c.kind=='spec')await specGather(cl,p,ok);else{say('Gathering up, your column goes in the middle…');sfx(260,.2);await W(1000)}
  if(!ok())return;d=mgather(cl,p)}
 await reveal(d,d.length>>1,c,ok,id)}
function list0(){stop();if(window.MagicArcade&&window.MagicArcade.stopExtra)window.MagicArcade.stopExtra();$('#mplay').style.display='none';$('#mlist').style.display='grid';$('#mver').textContent=''}
$('#mlist').innerHTML=Object.entries(C).map(([id,c])=>`<button class=alt data-id=${id}><b>${c.t}</b><br><small>${c.d}</small></button>`).join('');
$('#mlist').onclick=e=>{const b=e.target.closest('button');if(b&&C[b.dataset.id])run(b.dataset.id)};
if(window.DemoSession)window.DemoSession.magic={run,get T(){return T}};
window.MagicArcade={count:8,list:list0,stop,guides:Object.fromEntries(Object.entries(C).map(([k,c])=>[k,{t:c.t,d:c.d,rules:c.d}]))};
window.MagicArcade.captureView=()=>({parts:['menv','mmsg','mcols','mact','mver'].map(id=>{const el=$('#'+id);return {id,nodes:[...el.childNodes],style:el.getAttribute('style')}}),extra:$('#mplay').classList.contains('extra-magic')});
window.MagicArcade.restoreView=view=>{for(const p of view.parts){const el=$('#'+p.id);el.replaceChildren(...p.nodes);if(p.style===null)el.removeAttribute('style');else el.setAttribute('style',p.style)}$('#mplay').classList.toggle('extra-magic',view.extra);$('#mplay').style.display='flex';$('#mlist').style.display='none'};
$('#mx').onclick=()=>{stop();if(window.MagicArcade.stopExtra)window.MagicArcade.stopExtra();$('#magic').style.display='none'};
A.magic=()=>{$('#modal').style.display='none';list0();$('#magic').style.display='flex'};
A.fu=()=>{sv.fu=!sv.fu;persist();menu()};
})();
