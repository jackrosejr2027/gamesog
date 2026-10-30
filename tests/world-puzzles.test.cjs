const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/world-puzzle-rules.js','utf8'),ctx);const E=ctx.window.WorldPuzzleRules;
const types=['hitori','kakuro','nonogram','hanayama','ur','senet','alquerque','morris','foxgeese'];
for(const type of types){let longest=0;const starts=new Set();for(let level=1;level<=100;level++){
 let s=E.create(type,level);assert.equal(s.level,level);assert(!s.done);const initial=JSON.stringify(s);assert.equal(JSON.stringify(E.create(type,level)),initial,'Stable seed '+type+level);starts.add(initial);assert.equal(E.apply(s,{type:'invalid'}),null);let count=0;
 while(!s.done&&count<2000){const m=E.ai(s);assert(m,'Solution continuation '+type+' '+level);const next=E.apply(s,m);assert(next,'Legal solution '+type+' '+level+' '+JSON.stringify(m));s=next;count++}
 assert(s.win,'Solved '+type+' '+level+': '+s.notice);assert.equal(E.legal(s).length,0);assert.equal(E.apply(s,{}),null);longest=Math.max(longest,count);
 }console.log('PASS '+type+': 100 deterministic solvable levels; longest witness '+longest+' moves.');assert.equal(starts.size,100)}
for(const type of types){assert.equal(E.create(type,-8).level,1);assert.equal(E.create(type,101).level,100)}
let h=E.create('hitori',100);h.board=h.solution.slice();assert(E.hitoriValid(h));h.board.fill(1);assert(!E.hitoriValid(h));h.board.fill(2);assert(!E.hitoriValid(h));
let k=E.create('kakuro',100);k.board=k.solution.slice();assert(E.kakuroValid(k));const run=k.runs[0];k.board[run.cells[1]]=k.board[run.cells[0]];assert(!E.kakuroValid(k));k.board.fill(0);assert(!E.kakuroValid(k));
let n=E.create('nonogram',100);n.board=n.solution.slice();assert(E.nonogramValid(n));n.board[0]=n.board[0]===1?2:1;assert(!E.nonogramValid(n));
let senet=E.create('senet',1);senet.board=[26,0];senet.throws=[1];senet.at=0;assert(E.legal(senet).some(m=>m.from===0&&m.to===15),'Water returns to rebirth');senet.board=[26,15];assert(!E.legal(senet).some(m=>m.from===0),'Occupied rebirth blocks water');senet.board=[28,0];senet.throws=[2];assert(!E.legal(senet).some(m=>m.from===0),'Exact exit from 28');senet.throws=[3];assert(E.legal(senet).some(m=>m.from===0&&m.to===31));
let mor=E.create('morris',1);mor.board=Array(24).fill(0);[0,1,14].forEach(i=>mor.board[i]=1);[3,4,5,6].forEach(i=>mor.board[i]=2);let captures=E.legal(mor).filter(m=>m.from===14&&m.to===2);assert.equal(captures.length,1);assert.equal(captures[0].take,6,'Nonmill enemy must be captured first');mor.board[6]=0;captures=E.legal(mor).filter(m=>m.from===14&&m.to===2);assert.equal(captures.length,3,'All enemy mills allow any capture');
let fox=E.create('foxgeese',1);const jump=E.fox.jumps[0];fox.board.fill(0);fox.board[jump.from]=1;fox.board[jump.over]=2;assert(E.legal(fox).some(m=>m.type==='jump'&&m.from===jump.from&&m.to===jump.to));const jumped=E.apply(fox,jump);assert(jumped.win&&jumped.board[jump.to]===1&&!jumped.board[jump.over]);
console.log('PASS validation rejects invalid grids, handles exact Senet exits/water, protected Morris mills and asymmetric fox captures.');
