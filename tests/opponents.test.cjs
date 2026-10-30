const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['vendor/chess.js','js/board-rules.js','js/board-ai.js','js/more-board-rules.js','js/gin-rules.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const R=ctx.MoreBoardRules,B=ctx.BoardRules,copy=x=>JSON.parse(JSON.stringify(x));
function decision(s){const before=JSON.stringify(s),m=R.ai(s);assert.equal(JSON.stringify(s),before,'AI does not mutate state');assert(m&&R.apply(s,m),'AI returns a legal move');return m}
for(const level of [1,100,250,500,750,1000]){
 let s=R.create('connectfour',level);s.board[35]=s.board[36]=s.board[37]=2;s.turn=1;assert.equal(decision(s).c,3,'Take an immediate win at every level');
 s=R.create('connectfour',level);s.board[35]=s.board[36]=s.board[37]=1;s.board[41]=2;s.turn=1;assert.equal(decision(s).c,3,'Block an immediate loss at every level');
 s=R.create('chess',level);for(const [from,to]of [['f2','f3'],['e7','e5'],['g2','g4']])s=R.apply(s,{type:'move',from,to});const mate=decision(s);assert.equal(mate.from,'d8');assert.equal(mate.to,'h4');assert(R.apply(s,mate).done);
 let b=Array(64).fill(0);b[42]=b[46]=1;b[35]=b[21]=-1;const old=b.join(','),m=B.checkBest(b,1,level);assert.equal(m.captures.length,2);assert.equal(b.join(','),old);
 b=Array(14).fill(0);b[0]=2;b[5]=2;b[7]=1;b[8]=1;b[12]=1;b[6]=20;b[13]=21;const pit=B.manBest(b,1,level);assert(B.mancalaApply(b,1,pit));
 s=R.create('backgammon',level);s.board=Array(24).fill(0);s.board[23]=-1;s.off=[0,14];s.bar=[0,0];s.dice=[1,2];s.turn=1;const off=decision(s);assert.equal(off.to,24);assert.equal(off.die,2);
 s=R.create('dotsboxes',level);const shared=s.edges.findIndex(e=>e.vertical&&e.r===0&&e.c===1);for(let i=0;i<2;i++)for(const edge of R.boxEdges(s,i))if(edge!==s.edges[shared])edge.owner=1;s.turn=1;assert.equal(decision(s).i,shared,'Take a double-box capture');
 s=R.create('dominoes',level);s.chain=[[1,2]];s.hands=[[[6,6]],[[2,3]]];s.turn=1;assert(R.apply(s,decision(s)).done);
}
for(const config of [B.effort,R.aiEffort]){let last={nodes:0,depth:0,ms:0};for(let level=1;level<=1000;level++){const next=config(level);for(const field of ['nodes','depth','ms'])assert(next[field]>=last[field],field+' scales monotonically');last=next}}
// The stronger checkers player must not offer an undefended king for nothing.
let b=Array(64).fill(0);b[28]=-2;b[46]=2;b[17]=1;const m=B.checkBest(b,-1,1000);assert(B.checkersMoves(b,-1).some(a=>JSON.stringify(a)===JSON.stringify(m)));
// Chinese checkers recognizes camp completion at every difficulty.
for(const level of [1,500,1000]){b=Array(121).fill(0);const target=B.camps[0].find(i=>B.star[i].r===-5);B.camps[0].filter(i=>i!==target).forEach(i=>b[i]=1);let from=-1;for(let i=0;i<121;i++)if(!b[i]&&!B.camps[0].includes(i)){b[i]=1;if(B.starTargets(b,i,B.camps[0]).has(target)){from=i;break}b[i]=0}assert(from>=0);assert.equal(B.starBest(b,1,new Map(),level).to,target)}
// No strategy may inspect hidden domino tiles or hidden Gin stock order.
for(const type of ['dominoes']){let s=R.create(type,1000,977);for(let n=0;n<12&&!s.done;n++){const m=decision(s),hidden=copy(s);hidden.hands[1-s.turn]=[[0,0]];hidden.stock.reverse();assert.equal(JSON.stringify(R.ai(hidden)),JSON.stringify(m));s=R.apply(s,m)}}
assert.equal(ctx.GinRules.ai({...ctx.GinRules.create(),done:true}),null);
console.log('PASS: tactics and legal immutable decisions at six difficulty boundaries; monotonic search budgets; Chinese camp finishes; forced jumps; bearoff; double-box captures; hidden-information safety and terminal guards.');
