const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);for(const file of ['js/classic-rules.js','js/classic-levels.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});const E=ctx.window.ClassicRules;
const types=['triangle','hanoi','fifteen','cube','snake','tangram','pyramid','rings','mastermind','battleship','litebrite','etch','simon','merlin','football','microvision','gamewatch','pocket15','tetris','lightsout','pegged','klotski','billiards'];
function layout(s){const copy=JSON.parse(JSON.stringify(s));for(const k of ['seed','level','profile','pace'])delete copy[k];return JSON.stringify(copy)}
for(const type of types){const setups=new Set();for(let level=1;level<=100;level++){
 const s=E.create(type,level,1234);assert.equal(s.level,level);assert(!s.done);assert(s.profile.length>0);assert.equal(JSON.stringify(s),JSON.stringify(E.create(type,level,1234)));setups.add(layout(s));
 const fresh=E.create(type,level,987654);assert.notEqual(layout(s),layout(fresh),type+' fresh configuration at '+level);
 if(['triangle','pegged','hanoi','rings','fifteen','pocket15','cube','lightsout'].includes(type)){
  let next=s,steps=0;while(!next.done&&steps++<1500){const m=E.hint(next);assert(m,type+' hint at '+level);const after=E.apply(next,m);assert(after,type+' legal solution at '+level);next=after}assert(next.done,type+' solvable at '+level);
 }
 if(type==='battleship'){for(const f of s.fleets){assert.equal(f.board.filter(Boolean).length,17);assert.equal(f.ships.length,5)}const hidden=JSON.parse(JSON.stringify(s));hidden.fleets=[];assert.deepEqual(E.battleshipAI(s),E.battleshipAI(hidden));}
 if(type==='litebrite'){let n=s;for(let i=0;i<400;i++)if(s.target[i]>=0)n=E.apply(n,{type:'paint',i,color:s.target[i]});assert(n.done);}
 if(type==='etch'){let n=s;for(const p of s.target.slice(1)){n=E.apply(n,{type:'draw',dx:p[0]-n.pen[0],dy:p[1]-n.pen[1]});assert(n)}assert(n.done);}
 if(type==='snake'){let n=s;for(let i=0;i<23;i++)while(n.angles[i]!==n.target[i]){n=E.apply(n,{type:'joint',i,dir:1});assert(n)}assert(n.done);}
 if(type==='pyramid'){let n=s;for(let i=0;i<4;i++)n=E.apply(n,{type:'pack',i:n.parts[n.piece][0]});assert(n.done);}
 if(type==='klotski'){assert(E.legal(s).length);const cells=new Set();for(const b of s.blocks)for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){assert(x>=0&&x<4&&y>=0&&y<5);assert(!cells.has(y*4+x));cells.add(y*4+x)}}
 }assert(setups.size>=50,type+' has varied level configurations, got '+setups.size);console.log('PASS',type,'100 playable, deterministic profiles and fresh variants');}
assert(E.create('tetris',100,4).pace<E.create('tetris',1,4).pace);
assert(E.create('mastermind',100,4).maxGuesses<E.create('mastermind',1,4).maxGuesses);
console.log('PASS: 2,300 Classic profiles, solution paths, target completion, geometry and hidden-information safety.');
