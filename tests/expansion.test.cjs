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
load('js/tabletop.js');
load('js/draw-count.js');
vm.runInContext('var DrawCount=window.DrawCount;',ctx);
load('js/solitaire-more.js','  for(const [key,[title,description,cfg]]', '  window.testSol={start,choose,draw,resolve,gapLegal,gapRedeal,gapsWon,aceLegal,nestor,foundation,foundationFits,get s(){return s},defs};');
load('js/rpg.js','  for(const [key,[title,description,rules]]', '  window.testRpg={start,act,render,get s(){return s},D};');
load('js/magic-more.js','  M.stopExtra=','  window.testMagic={hamming,endpoint,survivor,outshuffle,courierEncode,rankCard,begin:key=>begin(key,true),get s(){return s},C};');
const sol=ctx.window.testSol,rpg=ctx.window.testRpg,magic=ctx.window.testMagic,deck=ctx.deck52,V=c=>c.r===12?1:c.r+2,C=(v,s=0)=>({r:v===1?12:v-2,s}),O=(v,s=0)=>({c:C(v,s),up:true});
assert.equal(Object.keys(sol.defs).length,20);assert.equal(Object.keys(rpg.D).length,20);assert.equal(Object.keys(magic.C).length,20);assert.equal(M.count,28);
function solCards(s){if(s.grid)return s.grid.filter(Boolean);return [...s.p.flat().map(o=>o.c||o),...s.f.flat(),...s.cells.filter(Boolean),...s.reserve.flat(),...s.bouquet,...s.stock,...s.waste.flat()]}
for(let run=0;run<30;run++)for(const key of Object.keys(sol.defs)){
  sol.start(key);const s=sol.s,cards=solCards(s);assert.equal(cards.length,key==='gaps'?48:(s.cfg.decks||1)*52,key+' card count');const frequencies={};for(const c of cards){assert(c&&Number.isInteger(c.r)&&c.r>=0&&c.r<13&&c.s>=0&&c.s<4,key+' valid card');const id=c.r+':'+c.s;frequencies[id]=(frequencies[id]||0)+1}assert(Object.values(frequencies).every(n=>n<=(s.cfg.decks||1)),key+' unique cards');
  if(key==='nestor')assert(s.p.every(p=>new Set(p.map(o=>o.c.r)).size===8),'Nestor no repeated rank in a column');
  if(s.stock.length&&!s.cfg.special){sol.draw();assert.equal(solCards(s).length,(s.cfg.decks||1)*52,key+' conserved after drawing')}
}
sol.start('yukon');sol.s.p=[[O(5),O(9,2)],[O(6,1)]];sol.choose('p',0,0);sol.choose('p',1,0);assert.equal(sol.s.p[1].length,3,'Yukon unordered group');
sol.start('russian');sol.s.p=[[O(5),O(9,2)],[O(6)]];sol.choose('p',0,0);sol.choose('p',1,0);assert.equal(sol.s.p[1].length,3,'Russian unordered group');
sol.start('josephine');sol.s.p=[[O(5),O(4)],[O(6)]];sol.choose('p',0,0);sol.choose('p',1,0);assert.equal(sol.s.p[1].length,3,'Josephine suited run');
sol.start('fortythieves');sol.s.p=[[O(5),O(4)],[O(6)]];sol.choose('p',0,0);assert.equal(sol.s.sel,null,'Forty Thieves single cards only');
sol.start('bakersgame');sol.s.cells=[C(2),C(3),C(4),C(5)];sol.s.p=[[O(5),O(4)],[O(6)],[O(8)]];sol.choose('p',0,0);sol.choose('p',1,0);assert.equal(sol.s.p[0].length,2,'Free-cell capacity enforced');
sol.start('canfield');sol.s.p[0]=[];const reserve=sol.s.reserve[0].length;sol.resolve();assert.equal(sol.s.reserve[0].length,reserve-1);assert.equal(sol.s.p[0].length,1,'Canfield empty column refill');
sol.start('nestor');sol.s.p=[[O(4)],[O(5)]];sol.s.bouquet=[C(4,1),C(5,2)];sol.choose('p',0,0);sol.choose('bouquet',0);assert.equal(sol.s.p[0].length,0);assert.equal(sol.s.bouquet.length,1,'Nestor pair removal');
sol.start('scorpion');sol.s.p=[Array.from({length:13},(_,i)=>O(13-i))];sol.resolve();assert.equal(sol.s.sets,1);assert.equal(sol.s.p[0].length,0,'Scorpion completed run');
sol.start('gaps');for(let n=0;n<3;n++){sol.gapRedeal();assert.equal(solCards(sol.s).length,48);assert.equal(sol.s.grid.filter(c=>!c).length,4)}
sol.s.grid=Array.from({length:4},(_,s)=>[...Array.from({length:12},(_,i)=>C(i+2,s)),null]).flat();assert(sol.gapsWon());assert(!sol.gapLegal(0,12),'Nothing follows King');
sol.start('acesup');sol.s.p=[[C(13)],[C(1)],[],[]];assert(sol.aceLegal(0));assert(!sol.aceLegal(1),'Ace is high');
for(let i=0;i<16;i++){const original=magic.hamming(i);for(let err=-1;err<7;err++){const answer=Array.from(original);if(err>=0)answer[err]^=1;const distances=Array.from({length:16},(_,j)=>magic.hamming(j).reduce((sum,x,k)=>sum+(x!==answer[k]),0));assert.equal(distances.indexOf(Math.min(...distances)),i,'One-lie correction')}}
for(let n=0;n<10000;n++){let text=String(n).padStart(4,'0');if(new Set(text).size===1)continue;let steps=0;while(text!=='6174'&&steps<8){const hi=Number(text.split('').sort().reverse().join('')),lo=Number(text.split('').sort().join(''));text=String(hi-lo).padStart(4,'0');steps++}assert.equal(text,'6174');assert(steps<=7)}
for(let n=100;n<1000;n++){const text=String(n);if(Math.abs(+text[0]-+text[2])<2)continue;const diff=Math.abs(n-Number(text.split('').reverse().join('')));assert.equal(diff+Number(String(diff).padStart(3,'0').split('').reverse().join('')),1089)}
let d=deck();for(let i=0;i<8;i++)d=magic.outshuffle(d);assert.deepEqual(d,deck(),'Eight faros restore the deck');
for(let n=2;n<=52;n++){const q=Array.from({length:n},(_,i)=>i);while(q.length>1){q.push(q.shift());q.shift()}assert.equal(magic.survivor(n),q[0])}
for(let cut=2;cut<52;cut+=2)for(let trial=0;trial<25;trial++){const alternating=Array.from({length:52},(_,i)=>i%2),left=alternating.slice(0,cut).reverse(),right=alternating.slice(cut),out=[];while(left.length||right.length){const from=!right.length?left:!left.length?right:Math.random()<.5?left:right;out.push(from.shift())}assert(out.every((x,i)=>i%2||x!==out[i+1]),'Gilbreath arbitrary riffle')}
for(let i=0;i<1000;i++){const cards=ctx.shuf(deck()).slice(0,5),encoded=magic.courierEncode(cards);assert(encoded.distance>=1&&encoded.distance<=6);assert.equal(encoded.anchor.s,encoded.hidden.s);assert.equal((V(encoded.anchor)+encoded.distance-1)%13+1,V(encoded.hidden));assert.equal(new Set([encoded.anchor,...encoded.shown,encoded.hidden]).size,5)}
for(let rank=1;rank<=13;rank++)for(let suit=0;suit<4;suit++){const answer=(rank*5+6)*2+suit,code=answer-12;assert.equal(Math.floor(code/10),rank);assert.equal(code%10,suit)}
function permutations(a){if(!a.length)return [[]];return a.flatMap((x,i)=>permutations(a.filter((_,j)=>i!==j)).map(p=>[x,...p]))}
for(const cols of permutations([0,1,2,3]))assert.equal(cols.reduce((sum,c,r)=>sum+c+r+1,0),16);
for(const key of Object.keys(magic.C)){magic.begin(key);assert($('#mmsg').textContent.length>0);assert($('#mplay').classes.has('extra-magic'));M.stopExtra();assert.equal(magic.s,null)}
for(const key of Object.keys(rpg.D)){rpg.start(key);const s=rpg.s;assert.equal(s.hand.length,5);assert.equal(s.hp,24);assert(api.help[key]);}
function setup(key,cards=[C(13)]){rpg.start(key);rpg.s.hand=cards;rpg.s.selected=cards.map((_,i)=>i);rpg.s.field=[{c:C(4),hp:8},{c:C(5,1),hp:10},{c:C(6,2),hp:12}];return rpg.s}
let a=setup('delver');rpg.act('strike');assert.equal(a.progress,1);
a=setup('dragonhunt',[C(6),C(7)]);rpg.act('strike');assert.equal(a.dragon,62);
a=setup('soulcrypt');a.haul=60;rpg.act('bank');assert(a.done&&a.victory);
a=setup('spellforge',[C(5),C(7)]);a.spell=12;rpg.act('cast');assert.equal(a.progress,1);
a=setup('shieldwall');rpg.act('defend');assert.equal(a.blocked.length,1);
a=setup('vampirecourt',[C(10,2)]);rpg.act('influence');assert.equal(a.influence[2],5);
a=setup('starsalvage',[]);rpg.act('explore');assert.equal(a.salvage,4);assert.equal(a.oxygen,16);
a=setup('corsair');a.broadside=[C(10),C(10),C(1)];rpg.act('fire');assert.equal(a.shipenemy,31);
a=setup('wildtrail',[C(4,2)]);a.trail[0]=2;rpg.act('track');assert.equal(a.progress,1);
a=setup('alchemist',[C(6),C(7)]);rpg.act('brew');assert.equal(a.progress,1);
a=setup('necromancer',[C(10)]);rpg.act('recruit');assert.equal(a.army,5);assert.equal(a.mana,9);
a=setup('ironarena',[C(10)]);rpg.act('strike');assert.equal(a.champion,17);assert.equal(a.stamina,6);
a=setup('moonheist',[C(5)]);rpg.act('pick');assert.equal(a.progress,1);
a=setup('village',[C(10,2)]);rpg.act('play');assert.equal(a.gold,30);
a=setup('chronomancer',[C(3)]);const initial=a.hand[0];rpg.act('cross');assert.equal(a.progress,1);rpg.act('rewind');assert.equal(rpg.s.progress,0);assert.equal(rpg.s.hp,24);assert.equal(rpg.s.rewinds,2);assert.equal(rpg.s.hand[0].r,initial.r);
a=setup('bounty',[C(10)]);rpg.act('attack');assert.equal(a.gold,24);
a=setup('relicvault',[C(13)]);rpg.act('claim');assert.equal(a.progress,1);assert.equal(a.curses,1);
a=setup('caravan');rpg.act('buy');assert.equal(a.cargo[0],1);assert.equal(a.gold,18);rpg.act('sell');assert.equal(a.cargo[0],0);assert.equal(a.gold,20);
a=setup('skyspire',[C(5)]);rpg.act('climb');assert.equal(a.progress,1);assert.equal(a.height,5);
a=setup('oraclequest',[C(1)]);rpg.act('fight');assert.equal(a.sigils[0],1);
function magicClick(label){const b=$('#mact').children.find(b=>b.innerHTML===label);assert(b&&!b.disabled,'Available magic button: '+label);b.onclick()}
function magicInput(value){const input=$('#mact').children.find(e=>e.tag==='input');assert(input);input.value=value;magicClick('Continue')}
function magicPick(index){const b=$('#mcols').children[index].children[0];assert(!b.disabled,'Magic choice is enabled');b.onclick()}
const same=(a,b)=>a.r===b.r&&a.s===b.s;
magic.begin('binary');let target=magic.s.cards[23];magicClick('I have a card in mind');for(let bit=0;bit<5;bit++)magicClick((23>>bit)&1?'Yes':'No');assert(same(magic.s.final.cards[0],target));
magic.begin('liar');target=magic.s.cards[7];const code=Array.from(magic.hamming(7));code[4]^=1;magicClick('I have a card in mind');for(const bit of code)magicClick(bit?'Yes':'No');assert(same(magic.s.final.cards[0],target));
magic.begin('vault1089');magicInput('741');magicClick('Reverse that difference and add');assert(magic.s.finished);
magic.begin('kaprekar');magicInput('3524');while(!magic.s.finished)magicClick('Subtract');assert.equal(magic.s.number,'6174');
magic.begin('kruskal');magicPick(3);for(let i=0;!magic.s.finished&&i<52;i++)magicClick('Count forward');assert(magic.s.finished);
magic.begin('downunder');while(!magic.s.finished)magicClick('Under / discard');assert(same(magic.s.final.cards[0],magic.s.final.cards[1]));
magic.begin('gilbreath');magicClick('Cut at 16');while(!magic.s.finished)magicClick(magic.s.left.length?'Take 3 left':'Take 5 right');assert(magic.s.final.text.includes('All 26 pairs'));
magic.begin('intuition');for(let i=0;i<12;i++)magicClick('Red');assert(magic.s.finished);
magic.begin('acesassembly');magicClick('Rotate rows');magicClick('Rotate all columns');magicClick('Mirror columns');magicClick('Gather columns');assert(magic.s.finished);
magic.begin('transversal');for(const [r,col]of [2,0,3,1].entries())magicPick(r*4+col);assert.equal(magic.s.final.cards.reduce((sum,c)=>sum+V(c),0),16);
magic.begin('stebbins');magicInput('51');magicClick('Predict the top');assert(same(magic.s.final.cards[0].c,magic.s.final.cards[1].c));
magic.begin('faro');target=magic.s.cards[37];magicPick(37);for(let i=0;i<8;i++)magicClick('Perfect out-shuffle');assert(same(magic.s.final.cards[0],target));
magic.begin('parity');magicClick('Exchange 3');magicClick('Exchange 5');magicClick('Reveal balance');assert.equal(magic.s.left.filter(c=>c.s===1||c.s===2).length,magic.s.right.filter(c=>c.s===0||c.s===3).length);
magic.begin('missing');magicClick('I have the total');magicInput('48');assert.equal(V(magic.s.final.cards[0]),7);
magic.begin('rankcode');magicInput('145');assert.equal(V(magic.s.final.cards[0]),13);assert.equal(magic.s.final.cards[0].s,3);
magic.begin('fitch');for(const i of [1,3,7,11,15])magicPick(i);magicClick('+'+magic.s.code.distance);assert(same(magic.s.final.cards[0].c,magic.s.code.hidden));
magic.begin('keycard');target=magic.s.cards[11];magicPick(11);magicClick('Cut 3');magicClick('Cut 7');magicClick('Find my card');assert(same(magic.s.final.cards[1].c,target));
magic.begin('nines');magicInput('27');assert.equal(V(magic.s.final.cards[0]),9);
magic.begin('rewind');magicClick('Reverse deck');magicClick('Rotate quarter');magicClick('Swap halves');magicClick('Begin rewind');while(!magic.s.finished)magicClick('Reverse the last operation');assert(same(magic.s.final.cards[0],magic.s.final.cards[1]));
magic.begin('choice');magicClick('Choose left');magicClick('Choose right');magicClick('Choose left');assert(same(magic.s.final.cards[0],magic.s.final.cards[1]));
const victoryCases={
  delver:[()=>{rpg.s.progress=11},'strike',[C(13)]],
  dragonhunt:[()=>{rpg.s.dragon=1},'strike',[C(13)]],
  soulcrypt:[()=>{rpg.s.haul=60},'bank',[]],
  spellforge:[()=>{rpg.s.progress=5;rpg.s.spell=13},'cast',[C(6),C(7)]],
  shieldwall:[()=>{rpg.s.wave=6;rpg.s.blocked=[1,2]},'defend',[C(13)]],
  vampirecourt:[()=>{rpg.s.influence=[10,8,7,8]},'influence',[C(4,2)]],
  starsalvage:[()=>{rpg.s.salvage=40},'extract',[]],
  corsair:[()=>{rpg.s.shipenemy=1;rpg.s.broadside=[C(10)]},'fire',[]],
  wildtrail:[()=>{rpg.s.progress=11;rpg.s.trail[11]=0},'track',[C(13)]],
  alchemist:[()=>{rpg.s.progress=5},'brew',[C(6),C(7)]],
  necromancer:[()=>{rpg.s.progress=7;rpg.s.army=20},'command',[C(13)]],
  ironarena:[()=>{rpg.s.progress=2;rpg.s.champion=1},'strike',[C(13)]],
  moonheist:[()=>{rpg.s.progress=8},'pick',[C(13)]],
  village:[()=>{rpg.s.progress=5;rpg.s.field[0].hp=1},'play',[C(13)]],
  chronomancer:[()=>{rpg.s.progress=9},'cross',[C(13)]],
  bounty:[()=>{rpg.s.gold=79},'attack',[C(13)]],
  relicvault:[()=>{rpg.s.progress=10},'escape',[]],
  caravan:[()=>{rpg.s.progress=9;rpg.s.gold=40},'travel',[C(13)]],
  skyspire:[()=>{rpg.s.progress=19},'climb',[C(13)]],
  oraclequest:[()=>{rpg.s.sigils=[1,2,2,2]},'fight',[C(13)]]
};
for(const [key,[prepare,action,cards]]of Object.entries(victoryCases)){setup(key,cards);prepare();const coins=ctx.sv.coins;rpg.act(action);assert(rpg.s.done&&rpg.s.victory,key+' victory');assert.equal(ctx.sv.coins,coins+50,key+' reward once');rpg.act(action);assert.equal(ctx.sv.coins,coins+50,key+' blocks post-game actions')}
setup('chronomancer',[C(1)]);rpg.s.hp=1;rpg.s.field[0]={c:C(13),hp:26};const coins=ctx.sv.coins;rpg.act('cross');assert(rpg.s.done&&!rpg.s.victory);rpg.s.done=false;rpg.act('rewind');assert.equal(rpg.s.hp,1);assert.equal(rpg.s.rewinds,2);assert.equal(ctx.sv.coins,coins);
for(let trial=0;trial<25;trial++){rpg.start('caravan');assert.equal(new Set(rpg.s.field.map(e=>e.c.s)).size,4,'One market per good prevents same-town arbitrage')}
api.onOpen('delver');assert.equal($('#g2t').querySelector('span').children[0].hidden,false);$('#g2t').querySelector('span').children[0].onclick();assert.equal(ctx.sv.dungeon,true);assert($('#g2').classes.has('dungeon-scene'));api.onOpen('yukon');assert(!$('#g2').classes.has('dungeon-scene'));api.onOpen('scoundrel');assert($('#g2').classes.has('dungeon-scene'));api.leave();assert(!$('#g2').classes.has('dungeon-scene'));assert.equal(ctx.sv.dungeon,true);
for(const file of fs.readdirSync('js'))new vm.Script(fs.readFileSync('js/'+file,'utf8'),{filename:file});new vm.Script(fs.readFileSync('sw.js','utf8'));
const html=fs.readFileSync('index.html','utf8');for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert(fs.existsSync(match[1]),'Linked asset '+match[1]);
const cached=JSON.parse(fs.readFileSync('sw.js','utf8').match(/const FILES = (\[[^;]+\])/)[1].replaceAll("'",'"'));for(const file of cached)assert(fs.existsSync(file),'Cached asset '+file);for(const file of ['js/tabletop.js','js/solitaire-more.js','js/rpg.js','js/magic-more.js','expansion.css','img/dungeon.webp'])assert(cached.includes(file),file+' precached');
console.log('PASS: all twenty RPG victories and single rewards; death rewind; offline asset list; final syntax; twenty complete magic interaction sequences; 20+20+20 registrations; 600 solitaire deals and conservation checks; variant move rules; all 9990 Kaprekar inputs; 1089 inputs; every single-error Hamming answer; 625 Gilbreath shuffles; 1000 courier hands; faro cycle; elimination survivors; arithmetic encodings; all 20 magic initial screens; all 20 RPG initial screens and scenario-specific actions.');
