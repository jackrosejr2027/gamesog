const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
class Element {
  constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.dataset={};this.textContent='';this.disabled=false;this.classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>this.classes.add(x)),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),toggle:(x,on)=>{if(on)this.classes.add(x);else this.classes.delete(x)}};}
  appendChild(x){this.children.push(x);return x}
  append(...xs){this.children.push(...xs)}
  prepend(x){this.children.unshift(x)}
  setAttribute(){}
  addEventListener(){}
  set innerHTML(x){this.html=x;this.children=[]}
  get innerHTML(){return this.html||''}
  querySelector(){if(!this.span)this.span=new Element('span');return this.span}
}
const nodes=new Map();const $=key=>{if(!nodes.has(key))nodes.set(key,new Element());return nodes.get(key)};
const api={remember(){},games:Object.fromEntries(['scoundrel','longroad','savage','quiet','falk'].map(k=>[k,{}])),help:{}};
const M={count:8,captureView(){return {}},restoreView(){},stop(){},list(){M.stopExtra()}};
const ctx={window:{CardArcade:api,MagicArcade:M},$,h:(t,c,x)=>{const e=new Element(t);e.className=c;e.innerHTML=x||'';return e},card:()=>new Element(),R:['2','3','4','5','6','7','8','9','10','J','Q','K','A'],S:['s','h','d','c'],deck52:()=>Array.from({length:52},(_,i)=>({r:i%13,s:Math.floor(i/13)})),shuf:a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a},rnd:n=>Math.floor(Math.random()*n),sv:{coins:0},persist(){},header(){},jingle(){},toast(){},modal(){}};
ctx.window.Tabletop=undefined;vm.createContext(ctx);
function load(path,anchor,expose){let src=fs.readFileSync(path,'utf8');if(anchor){assert(src.includes(anchor),path+' instrumentation anchor');src=src.replace(anchor,expose+'\n'+anchor)}vm.runInContext(src,ctx,{filename:path})}

const timers=new Map();let timerId=0;
ctx.setTimeout=(fn)=>{timers.set(++timerId,fn);return timerId};ctx.clearTimeout=id=>timers.delete(id);
load('js/tabletop.js');
load('js/draw-count.js');vm.runInContext('var DrawCount=window.DrawCount;',ctx);
load('js/rpg.js','  for(const [key,[title,description,rules]]','  window.reviewRpg={start,act,render,get s(){return s},D};');
load('js/solitaire.js','  const definitions=','  window.reviewCards={start,render,bowl,bowlingScore,pinsLeft,get s(){return state}};');
const E=ctx.window.reviewRpg,P=ctx.window.reviewCards,C=(v,s=0)=>({r:v===1?12:v-2,s});
function setup(key,values=[C(13)]){E.start(key);E.s.hand=values;E.s.selected=values.map((_,i)=>i);E.s.field[0]={c:C(5),hp:10};E.s.target=0;}
function unchanged(action,label){const before=JSON.stringify(E.s),coins=ctx.sv.coins;E.act(action);assert.equal(JSON.stringify(E.s),before,label);assert.equal(ctx.sv.coins,coins);}
// Every scenario must reject actions belonging to another game and invalid selections.
for(const key of Object.keys(E.D)){
 setup(key);unchanged('not-an-action',key+' unknown action');
 setup(key,[C(5,1)]);if(!['delver','dragonhunt','vampirecourt'].includes(key))unchanged('mend',key+' cannot use another scenario healing');
 setup(key);E.s.selected=[99];unchanged('not-an-action',key+' invalid index');
}
setup('delver',[C(1)]);E.s.hp=3;E.s.field[0]={c:C(5,1),hp:10};E.act('strike');assert(E.s.done&&!E.s.victory,'Lethal damage is not undone by a Heart door');assert(E.s.hp<=0);
setup('vampirecourt',[C(5,1)]);E.s.turn=5;E.s.hp=10;E.act('mend');assert.equal(E.s.turn,6);assert.equal(E.s.hp,13,'Sixth action drains two HP even when feeding');
setup('vampirecourt',[C(4,2)]);E.s.turn=5;E.s.hp=2;E.s.influence=[10,8,7,8];const fatalCoins=ctx.sv.coins;E.act('influence');assert(E.s.done&&!E.s.victory,'Sixth-action damage resolves before victory');assert.equal(ctx.sv.coins,fatalCoins);
setup('vampirecourt');E.s.turn=35;E.act('influence');assert(E.s.done&&!E.s.victory,'Dawn after action 36');
setup('oraclequest');E.s.turn=23;E.act('fight');assert(E.s.done&&!E.s.victory,'Oracle closes after encounter 24');
setup('starsalvage',[C(4),C(5)]);unchanged('explore','Only one optional escort');
setup('necromancer',[C(4),C(5)]);unchanged('command','Only one optional command card');
setup('caravan',[C(4),C(5)]);unchanged('travel','Only one optional escort on road');
setup('chronomancer',[C(1)]);E.s.hp=1;const before=JSON.stringify(E.s.deck);E.act('cross');assert(E.s.done);E.s.done=false;E.act('rewind');assert.equal(E.s.hp,1);assert.equal(E.s.rewinds,2);assert.equal(JSON.stringify(E.s.deck),before);unchanged('rewind','Cannot reuse the same rewind');
// Memory: colour AND rank, mismatch delay, completion and one payout.
function memoryButtons(){return $('#g2b').children[1].children[0].children;}
P.start('memory');P.s.cards=[C(2),C(2,1),C(2,3),C(2,2),...ctx.deck52().filter(c=>c.r!==0)];
memoryButtons()[0].onclick();memoryButtons()[1].onclick();assert(P.s.busy);memoryButtons()[2].onclick();assert.equal(P.s.open.length,2,'No third flip during mismatch');
for(const fn of [...timers.values()])fn();timers.clear();assert(!P.s.busy);assert.equal(P.s.open.length,0);
const groups=new Map();P.s.cards.forEach((c,i)=>{const key=c.r+':'+(c.s===1||c.s===2);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i)});
const memoryCoins=ctx.sv.coins;for(const [a,b]of groups.values()){memoryButtons()[a].onclick();memoryButtons()[b].onclick();}assert(P.s.done);assert.equal(P.s.matched.size,52);assert.equal(ctx.sv.coins,memoryCoins+30);memoryButtons()[0].onclick();assert.equal(ctx.sv.coins,memoryCoins+30);
// Independent ten-frame scorer, including every possible legal tenth frame.
function reference(frames){return frames.reduce((sum,f,i)=>{if(i===9)return sum+f.reduce((a,b)=>a+b,0);const later=frames.slice(i+1).flat();return sum+f.reduce((a,b)=>a+b,0)+(f[0]===10?later[0]+later[1]:f[0]+f[1]===10?later[0]:0)},0)}
let cases=0;for(let a=0;a<=10;a++)for(let b=0;b<=(a===10?10:10-a);b++){
 const third=a===10||a+b===10;for(let c=0;c<=(third?(a===10&&b!==10?10-b:10):0);c++){
  const tenth=third?[a,b,c]:[a,b];for(const opening of [Array.from({length:9},()=>[0,0]),Array.from({length:9},()=>[10]),Array.from({length:9},()=>[4,6])]){
   const frames=[...opening,tenth];assert.equal(P.bowlingScore(frames.flat()),reference(frames));P.start('bowling');P.s.frames=frames.slice(0,9).map(f=>f.slice());P.s.frames.push([]);P.s.rolls=opening.flat();
   for(const pins of tenth){const left=P.pinsLeft(P.s.frames.at(-1),9);assert(pins<=left);P.s.hand=[C(pins||1)];P.s.marked=new Set(pins?[0]:[]);P.bowl();}
   assert(P.s.done);assert.equal(P.bowlingScore(P.s.rolls),reference(frames));const coins=ctx.sv.coins;P.bowl();assert.equal(ctx.sv.coins,coins);cases++;
  }
 }
}
assert.equal(P.bowlingScore(Array(12).fill(10)),300);
P.start('bowling');P.s.hand=[C(6),C(5),C(3)];P.s.marked=new Set([0,1]);const invalid=JSON.stringify(P.s.rolls);P.bowl();assert.equal(JSON.stringify(P.s.rolls),invalid,'Exceeding standing pins is not a roll');
console.log('PASS: 20 adventure action boundaries, lethal damage, deadlines, optional-card limits and rewind; complete 26-pair memory game; '+cases+' tenth-frame Bowling scoring/completion cases and single payouts.');
