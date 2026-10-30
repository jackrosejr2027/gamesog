
const $=s=>document.querySelector(s),R=['2','3','4','5','6','7','8','9','10','J','Q','K','A'],S=['♠','♥','♦','♣'];
const h=(t,c,x)=>{const e=document.createElement(t);e.className=c||'';if(x!==undefined)e.innerHTML=x;return e},wait=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=n=>Math.floor(Math.random()*n),RANKS=['Rookie','Hustler','Card Sharp','Dealer\'s Rival','High Roller','Legend'];
let sv={lvl:1,max:1,coins:25,tickets:2,wins:0};
try{if(!window.DemoSession)Object.assign(sv,JSON.parse(localStorage.getItem('ss_save')||'{}'))}catch(e){}
for(const k of ['peek','redraw','boost'])delete sv[k];
sv.max=Math.max(1,Math.min(1000,Number(sv.max)||1));
const persist=()=>{if(window.DemoSession)return;try{localStorage.setItem('ss_save',JSON.stringify(sv))}catch(e){}};
let sel=sv.max,g=null,muted=false,AC;
function sfx(f,d=.12,t='triangle'){if(muted)return;try{AC=AC||new AudioContext();const o=AC.createOscillator(),v=AC.createGain();o.type=t;o.frequency.value=f;v.gain.value=.08;v.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(v);v.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
const jingle=a=>a.forEach((f,i)=>setTimeout(()=>sfx(f,.18,'square'),i*110));
$('#mute').onclick=()=>{muted=!muted;$('#mute').textContent=muted?'🔇':'🔊'};
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(e.t);e.t=setTimeout(()=>e.style.display='none',1800)}
function card(c,up){const d=h('div','card'+(up?' up':''));d.dataset.motionCard=c.r+':'+c.s;d.innerHTML=`<div class=ci><div class=b></div><div class="f ${c.s==1||c.s==2?'red':''}"><span>${R[c.r]}</span><small>${S[c.s]}</small><i class=pip>${S[c.s]}</i></div></div>`;return d}
const rc=(bias=0)=>{let r=rnd(13);if(Math.random()<bias)r=Math.max(r,rnd(13));return{r,s:rnd(4)}};
const rank=l=>l>=1000?'Grand Champion':RANKS[Math.min(5,Math.floor((l-1)/167))];
const conf=(()=>{const c=$('#fx'),x=c.getContext('2d');let P=[],on=0;const rs=()=>{c.width=innerWidth;c.height=innerHeight};rs();onresize=rs;
function loop(){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.vy+=.25;p.x+=p.vx;p.y+=p.vy;p.l--;x.globalAlpha=Math.max(0,p.l/60);x.fillStyle=p.c;x.fillRect(p.x,p.y,p.s,p.s)});P=P.filter(p=>p.l>0);if(P.length)requestAnimationFrame(loop);else on=0}
return(px,py,n,cols)=>{for(let i=0;i<n;i++)P.push({x:px,y:py,vx:(Math.random()-.5)*12,vy:-Math.random()*10,s:4+Math.random()*6,l:50+Math.random()*50,c:cols[rnd(cols.length)]});if(!on){on=1;loop()}}})();
const GOLD=['#ffc94a','#ff7a3d','#fff3b0','#6dff9c','#ff4d6a'];
function fl(t,col,el){const r=el.getBoundingClientRect(),e=h('div','float',t);e.style.cssText=`left:${r.left+20}px;top:${r.top}px;color:${col}`;document.body.appendChild(e);setTimeout(()=>e.remove(),1300)}
let advanceTimer=null;function cancelAdvance(){clearTimeout(advanceTimer);advanceTimer=null}
function header(){$('#hl').textContent='Level '+(g?g.lvl:sv.max)}
function newGame(l){cancelAdvance();const depth=Math.min(7,3+Math.floor(l/200)),bias=Math.min(.55,l/1800);
 g={lvl:l,m:Math.floor(l/200),stacks:[0,1,2,3].map(()=>Array.from({length:depth},()=>rc(bias))),fu:sv.pm==1,tp:sv.pm==2,pl:0,dl:0,combo:0,maxc:0,left:depth*4,cur:null,busy:0,fresh:0,sideMode:!!sv.sideMode,held:null,finished:false};
 $('#modal').style.display='none';render();toast('Level '+l+' – '+rank(l)+(g.fu?' · face-up piles':g.tp?' · top cards face-up':''))}
function render(){header();$('#sp').textContent=g.pl;$('#sd').textContent=g.dl;$('#cmb').textContent=g.combo>1?'🔥 x'+g.combo:'';
 $('#goal').textContent=g.m?`Lead the dealer by more than ${g.m} to win`:'Beat the dealer to win';
 const box=$('#stacks');box.innerHTML='';
 g.stacks.forEach((st,i)=>{const col=h('div','col'+(g.cur&&st.length?' hot':'')),pile=h('div','pile');
  const vis=g.fu?st:st.slice(-5),stp=vis.length>4?18:26;if(g.fu){col.classList.add('fu');pile.style.marginTop=18+Math.max(0,vis.length-1)*stp+'px'}vis.forEach((c,k,a)=>{const d=card(c,g.fu||(g.tp&&k==a.length-1)),dd=a.length-1-k;d.style.left=g.fu?'0':-dd*2+'px';d.style.top=-dd*(g.fu?stp:3)+'px';if(k==a.length-1)d.id='top'+i;pile.appendChild(d)});
  col.append(pile,h('div','vs'),h('div','cnt',st.length+' cards'));col.onclick=()=>play(i);box.appendChild(col)});
 const dk=$('#deck');dk.innerHTML='';dk.className=!g.cur&&g.left>0&&!g.busy?'pulse':'';
 if(g.left>0){dk.append(card({r:0,s:0},false));dk.appendChild(h('div','',''));const l=h('div','');l.id='deckl';l.innerHTML=g.cur?g.left:'DRAW<br>'+g.left;dk.appendChild(l)}
 dk.onclick=draw;const cu=$('#cur');cu.innerHTML='';
 if(g.cur){const d=card(g.cur,!g.fresh);cu.appendChild(d);if(g.fresh){g.fresh=0;requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('up')))}}
 const pw=$('#pw');pw.innerHTML='';
 const reserve=$('#reserve');reserve.innerHTML='';reserve.hidden=!g.sideMode;if(g.sideMode){const b=h('button','reserve-slot');b.disabled=g.busy||g.finished||!g.held;b.setAttribute('aria-label',g.held?'Recall or swap the sidelined '+R[g.held.c.r]+S[g.held.c.s]:'Empty sideline slot');if(g.held)b.appendChild(card(g.held.c,true));else b.textContent='Empty';b.onclick=reserveCard;reserve.append(b,h('small','',g.held?'Recall / Swap':'Sideline slot'));const park=h('button','alt','Sideline card');park.disabled=g.busy||g.finished||!g.cur||!!g.held;park.onclick=reserveCard;pw.appendChild(park)}
}
function reserveCard(){
 if(!g||!g.sideMode||g.busy||g.finished||$('#modal').style.display==='flex')return;
 if(!g.cur&&!g.held)return;const active=g.cur?{c:g.cur}:null;
 g.cur=g.held?g.held.c:null;g.held=active;g.fresh=0;render();
}
function draw(){if(!g||g.finished||g.busy||g.cur||g.left<=0||$('#modal').style.display=='flex')return;g.cur=rc();g.left--;g.fresh=1;sfx(500);render()}

async function play(i){if(!g||g.finished||g.busy||$('#modal').style.display=='flex')return;const round=g,st=g.stacks[i];if(!st||!st.length)return;
 
 if(!g.cur)return toast('Draw a card first');g.busy=1;
 const dc=st[st.length-1],pc=g.cur,col=$('#stacks').children[i],pv=pc.r+2,dv=dc.r+2,pts=pv+dv;
 $('#top'+i).classList.add('up');sfx(300);const mine=card(pc,true);mine.style.animation='drop .45s';col.querySelector('.vs').appendChild(mine);g.cur=null;$('#cur').innerHTML='';$('#deck').className='';
 await wait(850);if(g!==round)return;const win=pv>dv;let bonus=0;
 if(win){g.combo++;g.maxc=Math.max(g.maxc,g.combo);bonus=g.combo>2?(g.combo-2)*2:0;g.pl+=pts+bonus;mine.classList.add('win');jingle([520,660,790]);}
 else{g.combo=0;g.dl+=pts;col.querySelector('.pile .card:last-child').classList.add('lose');sfx(150,.35,'sawtooth')}
 const r=mine.getBoundingClientRect();fl((win?'+':'-')+(pts+bonus),win?'#6dff9c':'#ff4d6a',mine);conf(r.left+40,r.top+60,win?40+g.combo*8:10,win?GOLD:['#ff4d6a','#552']);
 $('#sp').textContent=g.pl;$('#sd').textContent=g.dl;await wait(900);if(g!==round)return;
 st.pop();g.busy=0;if(g.stacks.every(s=>!s.length))return finish();render()}
function finish(){if(g.finished)return;g.finished=true;const win=g.pl>g.dl+g.m,l=g.lvl;let ct='';
 if(win){const c=10+Math.floor(l/25)+g.maxc*2,t=l%10==0?3:1;sv.coins+=c;sv.tickets+=t;sv.wins++;if(l==sv.max&&l<1000)sv.max++;sel=Math.min(1000,l+1);ct=`<p>+🪙 ${c} &nbsp; +🎟 ${t}</p><p>Best combo: ${g.maxc}</p>`;if(l<1000){cancelAdvance();advanceTimer=setTimeout(()=>{advanceTimer=null;if(g&&g.finished&&g.lvl===l)newGame(l+1)},2200)}jingle([523,659,784,1047]);for(let k=0;k<6;k++)setTimeout(()=>conf(innerWidth*Math.random(),innerHeight*.4,60,GOLD),k*200)}
 else{sv.coins+=3;ct='<p>+🪙 3 for trying</p>';sfx(120,.6,'sawtooth')}persist();header();
 modal(`<h2>${win?(l>=1000?'🏆 Grand Champion!':'You win!'):'Dealer wins'}</h2><div class=big>${g.pl} : ${g.dl}</div>${ct}<div class=row>${win&&l<1000?'<button data-a=next>Next level</button>':''}<button data-a=retry>${win?'Replay':'Try again'}</button><button class=alt data-a=menu>Menu</button></div>`)}
function modal(x){$('#box').innerHTML=x;$('#modal').style.display='flex'}
$('#box').onclick=e=>{const a=e.target.dataset.a;if(a&&A[a])A[a](e.target.dataset.v)};$('#hm').onclick=menu;$('#modal').addEventListener('click',cancelAdvance);
function menu(){cancelAdvance();stackMenu()}
function stackMenu(){sel=Math.max(1,Math.min(sel,sv.max));header();const sk=(k,n,p)=>`<button class=alt data-a=buy data-v="${k},${p}">${n} 🪙${p}</button>`;
 modal(`<h2 style="font-size:34px;color:var(--gold)">Stack Showdown</h2><p>${rank(sel)} · ${sv.wins} wins</p>
 <div class=row style="align-items:center"><button class=alt data-a=lv data-v=-10>−10</button><button class=alt data-a=lv data-v=-1>◀</button><div style="min-width:130px"><div class=big>${sel}</div><small>of 1000</small></div><button class=alt data-a=lv data-v=1>▶</button><button class=alt data-a=lv data-v=10>+10</button></div>
 <div class=bar><i style="width:${sv.max/10}%"></i></div><small>Unlocked up to level ${sv.max}</small>
 <p><button class=alt data-a=smode>Play mode: ${sv.sideMode?'One-card sideline':'Classic'}</button></p>
 <p><button data-a=play style="font-size:20px;padding:12px 36px">Play level ${sel}</button></p>
 <p>Side games (🎟 ${sv.tickets})</p><div class=row><button data-a=hilo>High-Low Streak</button></div>
 <p><button class=alt data-a=fu>Piles: ${['Face down','Face up (all)','Face up (top only)'][sv.pm|0]}</button> <button data-a=magic>🎩 Card Tricks</button> <button data-a=more>🃏 More Games</button></p><p><button class=alt data-a=how data-v=stack>📖 How to play</button> <button class=alt data-a=io>💾 Save / Load</button> <button class=alt data-a=about>ℹ About</button> <button class=alt data-a=notes>📋 Release notes</button></p><p>Shop (🪙 ${sv.coins})</p><div class=row>${sk('tickets','🎟 Ticket',25)}</div>
 ${g&&g.left>=0&&g.stacks.some(s=>s.length)?'<p><button class=alt data-a=close>Back to game</button></p>':''}`)}
const A={smode:()=>{sv.sideMode=!sv.sideMode;persist();stackMenu()},close:()=>$('#modal').style.display='none',lv:v=>{sel=Math.max(1,Math.min(sv.max,sel+ +v));sfx(400,.05);stackMenu()},play:()=>newGame(sel),next:()=>newGame(Math.min(1000,g.lvl+1)),retry:()=>newGame(g.lvl),menu,
 buy:v=>{const[k,p]=v.split(',');if(sv.coins<+p){sfx(120);return toast('Not enough coins')}sv.coins-=+p;sv[k]++;persist();sfx(800);stackMenu()},
 hilo:()=>{if(hl&&hl.active)return hlv();if(sv.tickets<1)return toast('Need a 🎟 ticket');sv.tickets--;persist();hl={c:rc(),n:0,active:true};header();hlv()},hi:()=>hg(1),lo:()=>hg(-1),
 cash:()=>{if(!hl||!hl.active||!hl.n)return;hl.active=false;const w=hl.n*(hl.n+1)*2;sv.coins+=w;persist();jingle([600,800,1000]);conf(innerWidth/2,300,80,GOLD);menu();toast('Cashed out +🪙'+w)}};
let hl;
function hlv(){modal(`<h2>High-Low Streak</h2><button class=alt data-a=how data-v=hilo>Rules & Strategy</button><p>Is the next card higher or lower?<br><small>Ties are a push. Cash out value grows fast.</small></p><div id=hc2 style="position:relative;width:84px;height:120px;margin:14px auto"></div><p>Streak <b>${hl.n}</b> · Cash out: 🪙 ${hl.n*(hl.n+1)*2}</p><div class=row><button data-a=hi>▲ Higher</button><button data-a=lo>▼ Lower</button><button class=alt data-a=cash ${hl.n?'':'disabled'}>Cash out</button><button class=alt data-a=menu>Arcade</button></div>`);$('#hc2').appendChild(card(hl.c,true))}
function hg(d){if(!hl||!hl.active)return;const n=rc();if(n.r==hl.c.r){hl.c=n;toast('Push!');return hlv()}if((n.r-hl.c.r)*d>0){hl.n++;hl.c=n;sfx(600+hl.n*60);hlv()}else{hl.active=false;jingle([200,150]);modal(`<h2>Busted!</h2><p>It was ${R[n.r]}${S[n.s]}. Streak lost.</p><div class=row><button data-a=hilo>Again (🎟1)</button><button class=alt data-a=menu>Menu</button></div>`)}}
addEventListener('keydown',e=>{if($('#g2').style.display=='flex'||$('#magic').style.display=='flex'||/INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.code=='Space'){e.preventDefault();draw()}if(e.key>='1'&&e.key<='4'&&g&&$('#modal').style.display!='flex')play(+e.key-1)});
g={lvl:sv.max,stacks:[[],[],[],[]],pl:0,dl:0,combo:0,left:-1,cur:null,busy:0,m:0};render();menu();
