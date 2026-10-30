const fs=require('fs'),vm=require('vm'),assert=require('assert'),ctx={};ctx.window=ctx;vm.createContext(ctx);for(const f of ['js/puzzle-rules.js','js/solo-data.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);const E=ctx.SoloPuzzleRules;
function go(s,m){const before=JSON.stringify(s),action=JSON.stringify(m),n=E.apply(s,m);assert(n,s.type+' legal move '+action);assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(m),action);return n}
assert.equal(ctx.SoloPuzzleData.tchuka.length,1000);assert.equal(new Set(ctx.SoloPuzzleData.tchuka.map(d=>d.board.join(','))).size,1000);assert.equal(ctx.SoloPuzzleData.nuri.length,1000);assert.equal(E.starPoints.length,10);assert.equal(E.starLines.length,5);assert(E.starLines.every(l=>l.length===4));
for(let level=1;level<=1000;level++){
 let s=E.create('tchukaruma',level),sum=s.board.reduce((a,b)=>a+b,0);while(!s.done){const m=E.ai(s);assert(m);s=go(s,m);assert.equal(s.board.reduce((a,b)=>a+b,0),sum)}assert(s.win,'Tchuka level '+level);
 s=E.create('pegsolitaire',level);let count=s.board.filter(Boolean).length;while(!s.done){s=go(s,E.ai(s));assert.equal(s.board.filter(Boolean).length,--count)}assert(s.win&&count===1,'Peg level '+level);
 s=E.create('pentalpha',level);let steps=0;while(!s.done&&steps++<10)s=go(s,E.ai(s));assert(s.win&&!s.board[s.target],'Pentalpha level '+level);
 s=E.create('nurikabe',level);assert(E.nuriValid(s.solution,s.clues,s.n),'Nurikabe known solution '+level);assert(!E.nuriValid(s.board,s.clues,s.n));if(level<=10||level===1000){while(!s.done)s=go(s,E.ai(s));assert(s.win)}
 s=E.create('minesweeper',level);s=go(s,{type:'reveal',i:0});assert(!s.done||s.win);assert(!s.mines[0]&&E.mineNeighbors(0,s.n).every(i=>!s.mines[i]));assert.equal(s.mines.filter(Boolean).length,s.mineCount);for(let i=0;i<s.board.length;i++)assert.equal(s.counts[i],E.mineNeighbors(i,s.n).filter(j=>s.mines[j]).length);if(level<=10){while(!s.done)s=go(s,E.ai(s));assert(s.win)}
 s=E.create('shutbox',level);steps=0;while(!s.done&&steps++<30){const m=E.ai(s),old=s.open.filter(Boolean).length;s=go(s,m);if(m.type==='close')assert(s.open.filter(Boolean).length<old)}assert(s.done);assert(s.n>=9&&s.n<=12);
 s=E.create('2048',level);assert.equal(s.board.filter(Boolean).length,2);assert.deepEqual(JSON.parse(JSON.stringify(s)),JSON.parse(JSON.stringify(E.create('2048',level))));
}
assert(!E.apply(E.create('pegsolitaire'),{type:'jump',from:0,over:1,to:2}));
const relay=E.tchukaMove([1,0,0,0,0],0);assert(relay.lost,'Ending in an empty ordinary pit loses');
let board=[2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],sl=E.slide(board,4,'left');assert.deepEqual(Array.from(sl.board.slice(0,4)),[4,4,0,0]);assert.equal(sl.gain,8);sl=E.slide([2,2,4,0,...Array(12).fill(0)],4,'left');assert.deepEqual(Array.from(sl.board.slice(0,4)),[4,4,0,0],'Merged tile cannot merge again');
for(let level=1;level<=20;level++){let s=E.create('2048',level),steps=0;while(!s.done&&steps++<3000)s=go(s,E.ai(s));assert(s.done,'2048 terminates')}
let s=E.create('minesweeper');s=go(s,{type:'flag',i:4});assert(!E.apply(s,{type:'reveal',i:4}));s=go(s,{type:'flag',i:4});assert(!s.flags[4]);
console.log('PASS: 1000 solvable Tchuka starts with seed conservation, 1000 one-peg paths, 1000 target-correct Pentalpha finishes, 1000 valid Nurikabe solutions, 1000 safe-first-click minefields/counts, 1000 finite Shut the Box rounds, 1000 deterministic 2048 starts, merge-once rules, flags and invalid-action immutability.');
