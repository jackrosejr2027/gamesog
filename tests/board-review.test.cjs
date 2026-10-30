// Targeted experience/difficulty audit, in addition to the exhaustive rule suites.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['vendor/chess.js','js/board-rules.js','js/board-ai.js','js/more-board-rules.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const R=ctx.MoreBoardRules,B=ctx.BoardRules;
function outcomes(level){let wins=0,draws=0,losses=0,witness;
 function visit(s,path=[]){if(s.done){if(s.winner===0){wins++;witness??=path}else if(s.winner===1)losses++;else draws++;return}
 if(s.turn===1){const move=R.ai(s),before=JSON.stringify(s);assert(R.legal(s).some(m=>JSON.stringify(m)===JSON.stringify(move)));const next=R.apply(s,move);assert.equal(JSON.stringify(s),before);visit(next,[...path,move.i+1])}else for(const move of R.legal(s))visit(R.apply(s,move),[...path,move.i+1]);}
 visit(R.create('tictactoe',level));return {wins,draws,losses,witness};}
const easy=outcomes(1),casual=outcomes(250),hard=outcomes(650),expert=outcomes(1000);
assert(easy.wins>0,'Beginner is beatable by exploiting a fork');assert.equal(hard.wins,0);assert.equal(expert.wins,0);assert(expert.draws>0);
assert.equal(R.create('tictactoe').level,1000,'Preserve perfect-play default');
for(const level of [1,250,500,650,1000]){let s=R.create('tictactoe',level);s.board=[1,1,0,2,0,0,0,0,0];s.turn=1;assert.equal(R.ai(s).i,2,'All settings block an immediate loss');s.board=[2,2,0,1,0,1,0,0,0];assert.equal(R.ai(s).i,2,'All settings take an immediate win');}
console.log('PASS tic-tac-toe difficulty:',JSON.stringify({easy,casual,hard,expert}));
// Caching must never leak mutable turn sequences, or survive a changed board/dice.
let s=R.create('backgammon',1,976);s.turn=0;s.dice=[3,3,3,3];const initial=JSON.stringify(s),lines=R.bgSequences(s),expected=JSON.stringify(lines);assert(lines.length);lines[0][0].from=999;lines.push([]);assert.equal(JSON.stringify(R.bgSequences(s)),expected);assert.equal(JSON.stringify(s),initial);s.dice=[1,2];assert(R.bgSequences(s).every(line=>line.every(m=>m.die===1||m.die===2)));
// Short, reproducible complete matches; conservation and terminal guards on every turn.
for(const type of ['connectfour','othello','dominoes','dotsboxes','backgammon']){let max=0;for(let seed=1;seed<=2;seed++){
 let s=R.create(type,1,seed),turns=0;
 while(!s.done&&turns<1200){const before=JSON.stringify(s),m=R.ai(s);assert(m,type+' has a response');const next=R.apply(s,m);assert(next,type+' move is legal');assert.equal(JSON.stringify(s),before,'Search must not change the board');
 if(type==='backgammon')for(let p=0;p<2;p++)assert.equal(next.board.reduce((n,v)=>n+(p===0?Math.max(v,0):Math.max(-v,0)),0)+next.bar[p]+next.off[p],15);
 if(type==='dominoes'){const tiles=[...next.hands[0],...next.hands[1],...next.stock,...next.chain];assert.equal(tiles.length,28);assert.equal(new Set(tiles.map(t=>t.slice().sort().join(':'))).size,28)}
 s=next;turns++;}
 assert(s.done,type+' reaches a result');assert.equal(R.legal(s).length,0);assert.equal(R.ai(s),null);max=Math.max(max,turns);
 }console.log('PASS '+type+': two complete legal matches; longest '+max+' actions.');}
for(const effort of [B.effort,R.aiEffort])assert(effort(1000).nodes>effort(1).nodes*10);
assert.equal(B.difficultyLabel(1),'Beginner');assert.equal(B.difficultyLabel(1000),'Expert');
console.log('PASS genuine search-budget variation and terminal guards.');
