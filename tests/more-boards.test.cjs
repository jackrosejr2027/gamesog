const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console};ctx.window=ctx;vm.createContext(ctx);for(const f of ['vendor/chess.js','js/sudoku-data.js','js/more-board-rules.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});const R=ctx.MoreBoardRules,copy=s=>JSON.parse(JSON.stringify(s));
function go(s,m){const original=JSON.stringify(s),move=JSON.stringify(m),n=R.apply(s,m);assert(n,'legal action '+JSON.stringify(m));assert.equal(JSON.stringify(s),original,'Input state immutable');assert.equal(JSON.stringify(m),move,'Input move immutable');return n}
function solveCount(board){const b=board.slice();let count=0;function visit(){let best=-1,options=[];for(let i=0;i<81;i++)if(!b[i]){const r=i/9|0,c=i%9,nums=[];for(let n=1;n<=9;n++){let ok=true;for(let j=0;j<81;j++)if(b[j]===n&&((j/9|0)===r||j%9===c||(j/27|0)===(i/27|0)&&(j%9/3|0)===(c/3|0))){ok=false;break}if(ok)nums.push(n)}if(!nums.length)return;if(best<0||nums.length<options.length){best=i;options=nums;if(nums.length===1)break}}if(best<0){count++;return}for(const n of options){b[best]=n;visit();b[best]=0;if(count>=2)return}}visit();return count}
assert.equal(ctx.SudokuPuzzles.length,1000);assert.equal(new Set(ctx.SudokuPuzzles.map(p=>p.p)).size,1000);
for(let level=1;level<=1000;level++){let s=R.create('sudoku',level);assert.equal(solveCount(s.given),1,'Level '+level+' is uniquely solvable');assert(s.given.every((v,i)=>!v||v===s.solution[i]));assert(s.given.filter(Boolean).length>=25);while(!s.done)s=go(s,R.ai(s));assert.equal(s.winner,0);assert(!R.apply(s,{type:'digit',i:0,n:1}));}
console.log('PASS: all 1,000 distinct Sudoku levels independently verified to have one solution and completed through legal moves.');
// Chess standard legality, Fool mate, special moves and automatic draws.
let s=R.create('chess');assert.equal(R.legal(s).length,20);assert(!R.apply(s,{type:'move',from:'e2',to:'e5'}));
for(const [from,to]of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']])s=go(s,{type:'move',from,to});assert(s.done&&s.winner===1);
s=R.create('chess');s.fen='r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';assert(R.legal(s).some(m=>m.from==='e1'&&m.to==='g1'));s=go(s,{type:'move',from:'e1',to:'g1'});assert(R.chess(s).get('f1').type==='r');
s=R.create('chess');s.fen='4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1';s=go(s,{type:'move',from:'e5',to:'d6'});assert(!R.chess(s).get('d5'));
s=R.create('chess');s.fen='4k3/P7/8/8/8/8/8/4K3 w - - 0 1';assert.equal(R.legal(s).filter(m=>m.from==='a7').length,4);s=go(s,{type:'move',from:'a7',to:'a8',promotion:'n'});assert(s.done&&s.winner===null);
s=R.create('chess');for(let n=0;n<2;n++)for(const [from,to]of [['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8']])s=go(s,{type:'move',from,to});assert(s.done&&s.winner===null,'Threefold repetition');
s=R.create('chess');s.fen='4k3/8/8/8/8/8/8/R3K3 w - - 99 1';s=go(s,{type:'move',from:'a1',to:'a2'});assert(s.done&&s.winner===null,'Fifty move rule');
s=R.create('chess');s.fen='7k/5K2/6Q1/8/8/8/8/8 w - - 0 1';s=go(s,{type:'move',from:'g6',to:'f5'});assert(s.done&&s.winner===null,'Stalemate');
console.log('PASS: chess checkmate, castling, en passant, four promotion choices, insufficient material, fifty moves, repetition and stalemate.');
// Exact terminal lines in all Connect Four directions and gravity.
for(const line of [[35,36,37,38],[0,7,14,21],[0,8,16,24],[3,9,15,21]]){const b=Array(42).fill(0);line.forEach(i=>b[i]=1);assert.equal(R.connectWin(b,6,7,4).player,0)}
s=R.create('connectfour',1000);for(const c of [0,6,1,6,2,5,3])s=go(s,{type:'drop',c});assert(s.done&&s.winner===0);s=R.create('connectfour');for(let n=0;n<6;n++)s=go(s,{type:'drop',c:0});assert(!R.legal(s).some(m=>m.c===0));
s=R.create('othello');assert.equal(R.legal(s).length,4);const first=R.legal(s)[0];s=go(s,first);assert.equal(s.changed.length,1);assert.equal(s.board.filter(v=>v===1).length,4);assert(!R.apply(s,{type:'place',i:0}));
s=R.create('othello');s.board=Array(64).fill(2);s.board[0]=0;s.board[1]=1;s.turn=0;assert.equal(R.legal(s)[0].type,'pass');s=go(s,{type:'pass'});s=go(s,{type:'place',i:0});assert(s.done&&s.winner===1);
// Backgammon: forced bar entry, hits, blocked points, exact/oversize bearoff, higher die, maximal usage.
function bg(){const st=R.create('backgammon');st.board=Array(24).fill(0);st.bar=[0,0];st.off=[0,0];st.turn=0;st.dice=[1,2];return st}
s=bg();s.bar[0]=1;s.board[23]=-2;s.board[22]=-1;s.board[5]=14;let moves=R.legal(s);assert(moves.every(m=>m.from===-1&&m.die===2));s=go(s,moves[0]);assert.equal(s.bar[1],1);assert.equal(s.board[22],1);
s=bg();s.board[0]=1;s.off[0]=14;assert.equal(R.legal(s).length,1);assert.equal(R.legal(s)[0].die,2,'Higher die if only one can be used');s=go(s,R.legal(s)[0]);assert(s.done&&s.winner===0);
s=bg();s.board[5]=1;s.board[0]=14;s.dice=[6,5];assert(!R.bgSteps(s,5).some(m=>m.from===0&&m.to===24),'Cannot oversize bear off below a farther checker');
s=bg();s.bar[0]=1;s.board[23]=-2;s.board[22]=-2;assert.equal(R.legal(s)[0].type,'pass');
s=bg();s.board[10]=15;s.dice=[3,3,3,3];assert(R.bgSequences(s).every(l=>l.length===4),'Doubles use four dice');
s=bg();s.board[7]=1;s.board[5]=-2;s.dice=[1,2];const lines=R.bgSequences(s);assert(lines.every(l=>l.length===2));assert(R.legal(s).every(m=>m.die===1),'Must choose the order that uses both dice');
s=bg();s.board[23]=1;s.dice=[6];assert(!R.bgSteps(s,6).some(m=>m.to===24),'No bearing off before all checkers are home');
console.log('PASS: Connect Four gravity/lines/full columns, Othello flips/pass/end, backgammon bar/hits/blocking/bearoff/higher die/maximum use/doubles.');
// Dots shared fourth sides give two boxes and retain turn.
s=R.create('dotsboxes');const shared=s.edges.findIndex(e=>e.vertical&&e.r===0&&e.c===1);for(let i=0;i<2;i++)for(const e of R.boxEdges(s,i))if(e!==s.edges[shared])e.owner=1;s=go(s,{type:'edge',i:shared});assert.equal(s.boxes.filter(v=>v===0).length,2);assert.equal(s.turn,0);
// Dominoes matching orientation, legal draw-only and blocked scoring.
s=R.create('dominoes');s.chain=[[2,3]];s.hands=[[[1,2],[3,5]],[[6,6]]];s=go(s,R.legal(s).find(m=>m.end==='left'));assert.deepEqual(Array.from(s.chain[0]),[1,2]);s.turn=0;s=go(s,R.legal(s)[0]);assert(s.done&&s.winner===0);
s=R.create('dominoes');s.chain=[[0,0]];s.hands=[[[1,1]],[[2,2]]];s.stock=[];s=go(s,{type:'pass'});s=go(s,{type:'pass'});assert(s.done&&s.winner===0);
// Exhaust every human choice against the tic-tac-toe AI: X must never win.
let ticGames=0;function tic(st){if(st.done){assert.notEqual(st.winner,0,'Perfect-play computer cannot lose');ticGames++;return}if(st.turn===1)tic(go(st,R.ai(st)));else for(const m of R.legal(st))tic(go(st,m))}tic(R.create('tictactoe'));console.log('PASS: domino orientation/draw/pass/blocked scoring, shared box completion, and',ticGames,'exhaustive human tic-tac-toe paths against the computer.');
// Seeded legal self-play and invariants. Higher-level searches are checked separately.
const selfPlaySeeds=Math.max(1,Math.min(20,Number(process.env.BOARD_SELFPLAY_SEEDS)||20));
for(const type of ['connectfour','othello','dominoes','dotsboxes','backgammon'])for(let seed=1;seed<=selfPlaySeeds;seed++){
 let st=R.create(type,1,seed),ply=0;
 while(!st.done&&ply++<2000){const m=R.ai(st);assert(m);const n=go(st,m);if(type==='backgammon')for(let p=0;p<2;p++)assert.equal(n.board.reduce((a,v)=>a+(p===0?Math.max(0,v):Math.max(0,-v)),0)+n.bar[p]+n.off[p],15);if(type==='dominoes'){const tiles=[...n.hands[0],...n.hands[1],...n.stock,...n.chain];assert.equal(tiles.length,28);assert.equal(new Set(tiles.map(t=>t.slice().sort().join(':'))).size,28)}st=n}assert(st.done,type+' terminates');
}
for(const type of ['chess','backgammon','connectfour','othello'])for(const level of [1,250,500,750,1000]){let st=R.create(type,level,981);if(type==='backgammon')st=go(st,{type:'roll'});const m=R.ai(st);assert(R.apply(st,m),type+' AI legal at level '+level)}
console.log('PASS: '+(5*selfPlaySeeds)+' complete self-play games, backgammon checker conservation, domino set conservation and AI legality at five difficulty boundaries.');
