// Deterministic rules for the new board collection. Chess move legality: local chess.js, BSD-2-Clause.
(() => {
 const copy=s=>JSON.parse(JSON.stringify(s));
 function random(s,n){let x=s.seed;x^=x<<13;x^=x>>>17;x^=x<<5;s.seed=x>>>0;return Math.floor(s.seed/4294967296*n)}
 function shuffle(s,a){for(let i=a.length-1;i>0;i--){const j=random(s,i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
 const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
 const opponent=p=>1-p;
 function create(type,level=type==='tictactoe'?1000:1,seed=12345){
  const s={type,level:Math.max(1,Math.min(1000,Math.trunc(level)||1)),seed:seed>>>0||1,turn:0,done:false,winner:null,selected:null,ply:0,notice:'',last:null};
  if(type==='sudoku'){const d=window.SudokuPuzzles[s.level-1];s.given=Array.from(d.p,Number);s.board=s.given.slice();s.solution=Array.from(d.s,Number);s.history=[];s.selected=s.board.findIndex(v=>!v)}
  if(type==='chess'){const c=new window.ChessLibrary.Chess();s.fen=c.fen();s.positions=[s.fen.split(' ').slice(0,4).join(' ')];s.promotion='q'}
  if(type==='connectfour')s.board=Array(42).fill(0);
  if(type==='othello'){s.board=Array(64).fill(0);s.board[27]=s.board[36]=2;s.board[28]=s.board[35]=1}
  if(type==='tictactoe')s.board=Array(9).fill(0);
  if(type==='backgammon'){s.board=Array(24).fill(0);s.board[23]=2;s.board[12]=5;s.board[7]=3;s.board[5]=5;s.board[0]=-2;s.board[11]=-5;s.board[16]=-3;s.board[18]=-5;s.bar=[0,0];s.off=[0,0];s.dice=[];s.rolled=[];s.turn=random(s,2);s.notice=(s.turn?'Computer':'You')+' won the starting coin toss. Roll to begin.'}
  if(type==='dominoes'){const pool=[];for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)pool.push([a,b]);shuffle(s,pool);s.hands=[pool.splice(0,7),pool.splice(0,7)];s.stock=pool;s.chain=[];s.passes=0}
  if(type==='dotsboxes'){s.edges=[];for(let r=0;r<5;r++)for(let c=0;c<4;c++)s.edges.push({r,c,vertical:false,owner:-1});for(let r=0;r<4;r++)for(let c=0;c<5;c++)s.edges.push({r,c,vertical:true,owner:-1});s.boxes=Array(16).fill(-1)}
  return s;
 }
 function complete(s,winner,text){s.done=true;s.winner=winner;s.notice=text|| (winner===null?'Draw.':winner===0?'You win!':'Computer wins.')}
 function connectWin(b,rows,cols,needed){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(b[r*cols+c])for(const [dr,dc]of [[0,1],[1,0],[1,1],[1,-1]]){const line=[];for(let n=0;n<needed;n++){const y=r+dr*n,x=c+dc*n;if(y<0||y>=rows||x<0||x>=cols||b[y*cols+x]!==b[r*cols+c])break;line.push(y*cols+x)}if(line.length===needed)return {player:b[r*cols+c]-1,line}}return null}
 function flips(b,p,i){if(b[i])return [];const own=p+1,r=i>>3,c=i%8,out=[];for(const [dr,dc]of dirs){let rr=r+dr,cc=c+dc,line=[];while(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===2-p){line.push(rr*8+cc);rr+=dr;cc+=dc}if(line.length&&rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===own)out.push(...line)}return out}
 function oMoves(b,p){const a=[];for(let i=0;i<64;i++)if(flips(b,p,i).length)a.push({type:'place',i});return a}
 function chess(s){return new window.ChessLibrary.Chess(s.fen)}
 function chessMoves(c){return c.moves({verbose:true}).map(m=>({type:'move',from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion}:{})}))}
 const bgSign=p=>p===0?1:-1;
 function bgSteps(s,die){
  const p=s.turn,sign=bgSign(p),froms=s.bar[p]?[-1]:s.board.map((v,i)=>v*sign>0?i:-2).filter(i=>i>=0),moves=[];
  const home=!s.bar[p]&&s.board.every((v,i)=>v*sign<=0||(p===0?i<6:i>17));
  for(const from of froms){const to=from===-1?(p===0?24-die:die-1):from+(p===0?-die:die);
   if(to>=0&&to<24){if(s.board[to]*sign>=-1)moves.push({type:'move',from,to,die})}
   else if(home&&from!==-1){const distance=p===0?from+1:24-from;const further=s.board.some((v,i)=>v*sign>0&&(p===0?i>from:i<from));if(die===distance||die>distance&&!further)moves.push({type:'move',from,to:24,die})}
  }return moves;
 }
 function bgStep(s,m){const p=s.turn,sign=bgSign(p);if(m.from===-1)s.bar[p]--;else s.board[m.from]-=sign;if(m.to===24)s.off[p]++;else{if(s.board[m.to]===-sign){s.board[m.to]=0;s.bar[1-p]++}s.board[m.to]+=sign}s.dice.splice(s.dice.indexOf(m.die),1);}
 // Legal-turn enumeration is reused by rendering, move validation and AI.
 const bgSequenceCache=new Map();
 function bgSequences(s){
  const cacheKey=s.turn+'|'+s.board.join(',')+'|'+s.bar.join(',')+'|'+s.off.join(',')+'|'+s.dice.join(',');
  const duplicate=lines=>lines.map(line=>line.map(move=>({...move})));
  if(bgSequenceCache.has(cacheKey))return duplicate(bgSequenceCache.get(cacheKey));
  const results=new Map(),visited=new Set();let max=-1;
  function visit(st,line){
   const first=line.length?JSON.stringify(line[0]):'',tag=st.board.join(',')+'|'+st.bar+'|'+st.off+'|'+st.dice.slice().sort()+'|'+first;
   if(visited.has(tag))return;visited.add(tag);let continued=false;
   for(const die of new Set(st.dice))for(const m of bgSteps(st,die)){continued=true;const next={...st,board:st.board.slice(),bar:st.bar.slice(),off:st.off.slice(),dice:st.dice.slice()};bgStep(next,m);visit(next,[...line,m])}
   if(!continued){if(line.length>max){max=line.length;results.clear()}if(line.length===max)results.set(st.board.join(',')+'|'+st.bar+'|'+st.off+'|'+first,line)}
  }
  visit(s,[]);let lines=[...results.values()];
  if(max===1&&s.dice.length===2&&s.dice[0]!==s.dice[1]){const high=lines.reduce((n,l)=>Math.max(n,l[0].die),0);lines=lines.filter(l=>l[0].die===high)}
  if(bgSequenceCache.size>=64)bgSequenceCache.delete(bgSequenceCache.keys().next().value);
  bgSequenceCache.set(cacheKey,duplicate(lines));return lines;
 }
 function boxEdges(s,i){const r=i>>2,c=i%4;return s.edges.filter(e=>!e.vertical&&e.c===c&&(e.r===r||e.r===r+1)||e.vertical&&e.r===r&&(e.c===c||e.c===c+1))}
 function legal(s){
  if(s.done)return [];
  if(s.type==='sudoku')return s.board.flatMap((v,i)=>s.given[i]?[]:Array.from({length:10},(_,n)=>({type:'digit',i,n})).filter(a=>a.n!==v));
  if(s.type==='chess')return chessMoves(chess(s));
  if(s.type==='connectfour')return Array.from({length:7},(_,c)=>({type:'drop',c})).filter(m=>!s.board[m.c]);
  if(s.type==='tictactoe')return s.board.flatMap((v,i)=>v?[]:[{type:'place',i}]);
  if(s.type==='othello'){const m=oMoves(s.board,s.turn);return m.length?m:[{type:'pass'}]}
  if(s.type==='backgammon'){if(!s.dice.length)return [{type:'roll'}];const lines=bgSequences(s),unique=new Map();for(const l of lines)if(l.length)unique.set(JSON.stringify(l[0]),l[0]);return unique.size?[...unique.values()]:[{type:'pass'}]}
  if(s.type==='dotsboxes')return s.edges.flatMap((e,i)=>e.owner<0?[{type:'edge',i}]:[]);
  if(s.type==='dominoes'){
   const moves=[];s.hands[s.turn].forEach(([a,b],i)=>{if(!s.chain.length){moves.push({type:'tile',i,end:'right',flip:false});return}for(const end of ['left','right']){const target=end==='left'?s.chain[0][0]:s.chain.at(-1)[1];if(a===target)moves.push({type:'tile',i,end,flip:end==='left'});if(b===target&&a!==b)moves.push({type:'tile',i,end,flip:end==='right'})}});return moves.length?moves:[{type:s.stock.length?'draw':'pass'}];
  }return [];
 }
 const equal=(a,b)=>a&&b&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>a[k]===b[k]);
 function apply(state,move){
  if(!legal(state).some(m=>equal(m,move)))return null;
  const s=copy(state),p=s.turn;s.last=copy(move);s.ply++;
  if(s.type==='sudoku'){s.history.push([move.i,s.board[move.i]]);s.board[move.i]=move.n;if(s.board.every((v,i)=>v===s.solution[i]))complete(s,0,'Level '+s.level+' solved!');return s}
  if(s.type==='chess'){
   const c=chess(s);const played=c.move(move);s.fen=c.fen();s.san=played.san;s.turn=c.turn()==='w'?0:1;const pos=s.fen.split(' ').slice(0,4).join(' ');s.positions.push(pos);
   if(c.isCheckmate())complete(s,p,'Checkmate. '+(p===0?'You win!':'Computer wins.'));
   else if(c.isStalemate()||c.isInsufficientMaterial()||c.isDrawByFiftyMoves()||s.positions.filter(x=>x===pos).length>=3)complete(s,null,'Draw by stalemate, material, repetition or the fifty-move rule.');
   else s.notice=c.isCheck()?'Check!':'';return s;
  }
  if(s.type==='connectfour'||s.type==='tictactoe'){
   let i=move.i;if(s.type==='connectfour'){i=35+move.c;while(s.board[i])i-=7}s.board[i]=p+1;s.last.i=i;s.turn=1-p;const win=connectWin(s.board,s.type==='connectfour'?6:3,s.type==='connectfour'?7:3,s.type==='connectfour'?4:3);if(win){s.line=win.line;complete(s,p)}else if(s.board.every(Boolean))complete(s,null);return s;
  }
  if(s.type==='othello'){
   if(move.type==='place'){const changed=flips(s.board,p,move.i);changed.forEach(i=>s.board[i]=p+1);s.board[move.i]=p+1;s.changed=changed;s.notice='Flipped '+changed.length+' disc(s).'}else s.notice=(p?'Computer':'You')+' pass: no legal square.';
   s.turn=1-p;if(!oMoves(s.board,0).length&&!oMoves(s.board,1).length){const a=s.board.filter(v=>v===1).length,b=s.board.filter(v=>v===2).length;complete(s,a===b?null:a>b?0:1,'Final discs: you '+a+', computer '+b+'. '+(a===b?'Draw.':a>b?'You win!':'Computer wins.'))}return s;
  }
  if(s.type==='backgammon'){
   if(move.type==='roll'){const a=1+random(s,6),b=1+random(s,6);s.rolled=[a,b];s.dice=a===b?[a,a,a,a]:[a,b];s.notice='Rolled '+a+' and '+b+(a===b?' — doubles, four moves.':'.')}
   else if(move.type==='pass'){s.dice=[];s.turn=1-p;s.notice='No playable die. Turn passed.'}
   else{bgStep(s,move);if(s.off[p]===15)complete(s,p);else if(!s.dice.length)s.turn=1-p;}
   return s;
  }
  if(s.type==='dotsboxes'){
   s.edges[move.i].owner=p;let earned=0;for(let i=0;i<16;i++)if(s.boxes[i]<0&&boxEdges(s,i).every(e=>e.owner>=0)){s.boxes[i]=p;earned++}s.turn=earned?p:1-p;s.notice=earned?'Closed '+earned+' box(es). Take another edge.':'';if(s.boxes.every(v=>v>=0)){const a=s.boxes.filter(v=>v===0).length;complete(s,a===8?null:a>8?0:1,'Boxes: you '+a+', computer '+(16-a)+'.')}return s;
  }
  if(s.type==='dominoes'){
   if(move.type==='draw'){s.hands[p].push(s.stock.pop());s.notice=(p?'Computer':'You')+' drew a tile; the same turn continues.';return s}
   if(move.type==='pass'){s.passes++;s.turn=1-p;s.notice='No matching tile. Pass.'}else{let tile=s.hands[p].splice(move.i,1)[0];if(move.flip)tile.reverse();if(move.end==='left')s.chain.unshift(tile);else s.chain.push(tile);s.passes=0;s.turn=1-p;if(!s.hands[p].length)complete(s,p)}
   if(!s.done&&s.passes>=2){const sums=s.hands.map(hand=>hand.reduce((n,t)=>n+t[0]+t[1],0));complete(s,sums[0]===sums[1]?null:sums[0]<sums[1]?0:1,'Blocked: remaining pips '+sums[0]+' : '+sums[1]+'. Lowest total wins; equal totals draw.')}return s;
  }
  return s;
 }
 function cValue(b){const win=connectWin(b,6,7,4);if(win)return win.player===0?100000:-100000;let n=0;for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const [dr,dc]of [[0,1],[1,0],[1,1],[1,-1]]){let a=0,z=0,valid=true;for(let k=0;k<4;k++){const y=r+dr*k,x=c+dc*k;if(y<0||y>=6||x<0||x>=7){valid=false;break}if(b[y*7+x]===1)a++;if(b[y*7+x]===2)z++}if(valid){if(!z)n+=[0,1,8,65,100000][a];if(!a)n-=[0,1,8,65,100000][z]}}return n}
 function oValue(b){
  const empty=b.filter(v=>!v).length,sign=v=>v===1?1:v===2?-1:0;let score=0,frontier=0,stable=new Set();
  for(const corner of [0,7,56,63]){if(b[corner]){score+=sign(b[corner])*180;stable.add(corner);for(const step of [corner%8===0?1:-1,corner<8?8:-8])for(let n=1;n<8;n++){const i=corner+step*n;if(b[i]!==b[corner])break;stable.add(i)}}else{const r=corner>>3,c=corner%8;for(const [dr,dc]of [[r? -1:1,0],[0,c?-1:1],[r?-1:1,c?-1:1]])score-=sign(b[(r+dr)*8+c+dc])*(dr&&dc?65:25)}}
  for(let i=0;i<64;i++){if(!b[i])continue;const r=i>>3,c=i%8;if(stable.has(i))score+=sign(b[i])*20;if(dirs.some(([dr,dc])=>r+dr>=0&&r+dr<8&&c+dc>=0&&c+dc<8&&!b[(r+dr)*8+c+dc]))frontier-=sign(b[i]);score+=sign(b[i])*(empty<12?12:empty<30?2:-1)}
  return score+frontier*5+(oMoves(b,0).length-oMoves(b,1).length)*(empty<12?3:12);
 }
 function aiEffort(level){const t=(Math.max(1,Math.min(1000,Math.trunc(Number(level))||1))-1)/999;return {nodes:180+Math.floor(t*t*42000),depth:2+Math.floor(t*8),ms:60+Math.floor(t*1740),candidates:4+Math.floor(t*32)}}
 function boardAI(s){
  if(s.type==='tictactoe'){
   const depth=s.level<200?1:s.level<400?2:s.level<650?3:9,memo=new Map();
   const moves=legal(s).sort((a,b)=>(a.i===4?-2:a.i%2===0?-1:0)-(b.i===4?-2:b.i%2===0?-1:0));
   // Even a beginner recognizes a completed line or an immediate threat.
   for(const m of moves){const next=apply(s,m);if(next.done&&next.winner===s.turn)return m}
   const safe=moves.filter(m=>{const next=apply(s,m);return next.done||!legal(next).some(reply=>{const after=apply(next,reply);return after.done&&after.winner===next.turn})});
   function solve(st,d){if(st.done)return st.winner===null?0:st.winner===s.turn?100-st.ply:st.ply-100;if(d<=0)return 0;const key=st.board.join('')+st.turn+':'+d;if(memo.has(key))return memo.get(key);const values=legal(st).map(m=>solve(apply(st,m),d-1)),n=st.turn===s.turn?Math.max(...values):Math.min(...values);memo.set(key,n);return n}
   let best,score=-Infinity;for(const m of safe.length?safe:moves){const n=solve(apply(s,m),depth-1);if(n>score){score=n;best=m}}return best;
  }
  const cfg=aiEffort(s.level),abort={},deadline=Date.now()+cfg.ms,table=new Map();let nodes=0;
  function next(st,m){const b=st.board.slice(),p=st.turn;if(st.type==='connectfour'){let i=35+m.c;while(b[i])i-=7;b[i]=p+1;const win=connectWin(b,6,7,4);return {...st,board:b,turn:1-p,done:!!win||b.every(Boolean),winner:win?win.player:null}}if(m.type==='place'){for(const i of flips(b,p,m.i))b[i]=p+1;b[m.i]=p+1}const done=!oMoves(b,0).length&&!oMoves(b,1).length,diff=b.filter(v=>v===1).length-b.filter(v=>v===2).length;return {...st,board:b,turn:1-p,done,winner:done&&diff?diff>0?0:1:null}}
  const value=(st,ply)=>st.done?(st.winner===null?0:st.winner===0?100000-ply:-100000+ply):st.type==='connectfour'?cValue(st.board):oValue(st.board);
  function options(st,preferred){return legal(st).sort((a,b)=>{const score=m=>JSON.stringify(m)===preferred?10000:st.type==='connectfour'?7-Math.abs(m.c-3):[0,7,56,63].includes(m.i)?100:[9,14,49,54].includes(m.i)?-40:[1,6,8,15,48,55,57,62].includes(m.i)?-15:0;return score(b)-score(a)})}
  function search(st,d,alpha,beta,ply){
   if(++nodes>cfg.nodes||(nodes%32===0&&Date.now()>deadline))throw abort;
   if(st.done||d<=0)return value(st,ply);
   const key=st.board.join('')+':'+st.turn,entry=table.get(key),a=alpha,b=beta;
   if(entry&&entry.depth>=d){if(entry.flag==='exact')return entry.value;if(entry.flag==='lower')alpha=Math.max(alpha,entry.value);else beta=Math.min(beta,entry.value);if(alpha>=beta)return entry.value}
   let best=st.turn===0?-Infinity:Infinity,chosen;
   for(const m of options(st,entry?.move)){const n=search(next(st,m),d-1,alpha,beta,ply+1);if(st.turn===0?n>best:n<best){best=n;chosen=m}if(st.turn===0)alpha=Math.max(alpha,n);else beta=Math.min(beta,n);if(alpha>=beta)break}
   table.set(key,{depth:d,value:best,flag:best<=a?'upper':best>=b?'lower':'exact',move:JSON.stringify(chosen)});return best;
  }
  let moves=options(s),best=moves[0];if(moves.length<2)return best;
  // Immediate wins and forced defenses are never replaced with random mistakes.
  for(const m of moves){const st=next(s,m);if(st.done&&st.winner===s.turn)return m}
  if(s.type==='connectfour'){const safe=moves.filter(m=>{const st=next(s,m);return !legal(st).some(reply=>{const n=next(st,reply);return n.done&&n.winner===st.turn})});if(safe.length){moves=safe;best=safe[0]}}
  const maxDepth=s.type==='othello'?Math.min(8,cfg.depth):cfg.depth;
  for(let depth=1;depth<=maxDepth;depth++){let candidate=best,score=s.turn===0?-Infinity:Infinity,alpha=-Infinity,beta=Infinity;
   try{for(const m of [best,...moves.filter(m=>m!==best)]){const n=search(next(s,m),depth-1,alpha,beta,1);if(s.turn===0?n>score:n<score){score=n;candidate=m}if(s.turn===0)alpha=Math.max(alpha,n);else beta=Math.min(beta,n)}}catch(e){if(e!==abort)throw e;break}
   best=candidate;if(Math.abs(score)>99000)break;
  }return best;
 }
 function chessAI(s){
  const c=chess(s),values={p:100,n:320,b:335,r:500,q:900,k:0},history=new Map(),budget={},cfg=aiEffort(s.level),limit=600+cfg.nodes,maxDepth=2+Math.floor((s.level-1)*3/999),deadline=Date.now()+cfg.ms;let nodes=0;
  const position=()=>c.fen().split(' ').slice(0,4).join(' ');for(const key of s.positions||[])history.set(key,(history.get(key)||0)+1);
  function evaluate(){let value=0,phase=0;const board=c.board().flat().filter(Boolean);for(const p of board)if(!['p','k'].includes(p.type))phase+=values[p.type];for(const p of board){const file=p.square.charCodeAt(0)-97,rank=Number(p.square[1]),advance=p.color==='w'?rank-2:7-rank,center=7-Math.abs(file-3.5)-Math.abs(rank-4.5);let bonus=p.type==='p'?advance*9+center*2:p.type==='n'?center*12:p.type==='b'?center*7:p.type==='r'?advance*2:p.type==='q'?center*2:phase<2000?center*10:([1,8].includes(rank)?18:0)-center*8;if(p.type==='k'&&phase>=2000&&['g1','c1','g8','c8'].includes(p.square))bonus+=35;value+=(p.color==='w'?1:-1)*(values[p.type]+bonus)}return value*(c.turn()==='w'?1:-1)}
  const priority=m=>(m.captured?10*values[m.captured]-values[m.piece]:0)+(m.promotion?values[m.promotion]:0)+(m.flags.includes('k')||m.flags.includes('q')?80:0)+(m.san.includes('+')?25:0);
  function visit(m,fn){c.move(m);const key=position();history.set(key,(history.get(key)||0)+1);try{return fn(key)}finally{const count=history.get(key)-1;if(count)history.set(key,count);else history.delete(key);c.undo()}}
  function search(depth,alpha,beta,ply,qdepth=0){
   if(++nodes>limit||(nodes%32===0&&Date.now()>deadline))throw budget;
   if((history.get(position())||0)>=3||c.isInsufficientMaterial()||c.isDrawByFiftyMoves())return 0;
   const check=c.isCheck(),moves=c.moves({verbose:true});if(!moves.length)return check?-100000+ply:0;
   if(depth<=0){const stand=evaluate();if(!check){if(stand>=beta)return stand;alpha=Math.max(alpha,stand)}if(qdepth>=2)return check?stand-60:stand;const forcing=check?moves:moves.filter(m=>m.captured||m.promotion);forcing.sort((a,b)=>priority(b)-priority(a));for(const m of forcing){const score=visit(m,()=>-search(0,-beta,-alpha,ply+1,qdepth+1));if(score>=beta)return score;alpha=Math.max(alpha,score)}return alpha}
   moves.sort((a,b)=>priority(b)-priority(a));for(const m of moves){const score=visit(m,()=>-search(depth-1,-beta,-alpha,ply+1));if(score>=beta)return score;alpha=Math.max(alpha,score)}return alpha;
  }
  const moves=c.moves({verbose:true}).sort((a,b)=>priority(b)-priority(a));if(!moves.length)return null;let best=moves[0],staticBest=-Infinity;
  for(const m of moves){const n=visit(m,()=>c.isCheckmate()?100000:-evaluate());if(n>staticBest){staticBest=n;best=m}if(n===100000)return {type:'move',from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion}:{})};}
  // A completed iteration is retained if the next depth reaches its node budget.
  for(let depth=1;depth<=maxDepth;depth++){let candidate=best,value=-Infinity,alpha=-Infinity,complete=true;const ordered=[best,...moves.filter(m=>m.from!==best.from||m.to!==best.to||m.promotion!==best.promotion)];
   try{for(const m of ordered){const score=visit(m,key=>{const repeated=(history.get(key)||0)-1;let score=-search(depth-1,-Infinity,-alpha,1);if(repeated&&score>-200&&Math.abs(score)<90000)score-=repeated*45;return score});if(score>value){value=score;candidate=m}alpha=Math.max(alpha,score)}}catch(e){if(e!==budget)throw e;complete=false}
   if(!complete)break;best=candidate;if(value>99000)break;
  }
  return {type:'move',from:best.from,to:best.to,...(best.promotion?{promotion:best.promotion}:{})};
 }
 function bgValue(s,p){
  const sign=bgSign(p);let n=s.off[p]*130-s.bar[p]*35,run=0;
  for(let i=0;i<24;i++){const count=s.board[i]*sign;if(count<=0){run=0;continue}n-=count*(p===0?i+1:24-i);if(count>=2){run++;n+=7+Math.min(run,5)*3;if(p===0?i<6:i>17)n+=8;if(count>4)n-=(count-4)*3}else{run=0;n-=3}}
  return n;
 }
 function bgRisk(s,p){
  const attacker=1-p,sign=bgSign(attacker);let risk=0;
  for(let die=1;die<=6;die++){const hits=new Set();for(const m of bgSteps({...s,turn:attacker},die))if(m.to!==24&&s.board[m.to]===-sign)hits.add(m.to);for(const to of hits)risk+=(p===0?to+1:24-to)+12}
  return risk/6;
 }
 function backgammonAI(s){
  const cfg=aiEffort(s.level),p=s.turn,lines=bgSequences(s),unique=new Map();
  for(const line of lines){if(!line.length)continue;const next={...s,board:s.board.slice(),bar:s.bar.slice(),off:s.off.slice(),dice:s.dice.slice()};for(const m of line)bgStep(next,m);if(next.off[p]===15)return line[0];const key=next.board.join(',')+'|'+next.bar+'|'+next.off;if(!unique.has(key))unique.set(key,{line,next,score:bgValue(next,p)-bgValue(next,1-p)})}
  const candidates=[...unique.values()].sort((a,b)=>b.score-a.score);let best=candidates[0],value=-Infinity;
  // Rank complete turns before selecting candidates, rather than truncating move order.
  for(const item of candidates.slice(0,cfg.candidates)){const risk=bgRisk(item.next,p),n=item.score-risk*(.5+s.level/1000);if(n>value){value=n;best=item}}
  return best?.line[0]||legal(s)[0];
 }
 function dotsAI(s){
  const cfg=aiEffort(s.level),abort={},deadline=Date.now()+cfg.ms;let nodes=0;
  const options=st=>st.edges.flatMap((e,i)=>e.owner<0?[{type:'edge',i}]:[]);
  function step(st,m){const next={...st,edges:st.edges.map(e=>({...e})),boxes:st.boxes.slice()};next.edges[m.i].owner=st.turn;let gain=0;for(let i=0;i<16;i++)if(next.boxes[i]<0&&boxEdges(next,i).every(e=>e.owner>=0)){next.boxes[i]=st.turn;gain++}next.turn=gain?st.turn:1-st.turn;return next}
  const count=st=>st.boxes.reduce((n,p)=>n+(p===0?1:p===1?-1:0),0);
  function evaluate(st){let next=st;for(let i=0;i<16;i++){const capture=options(next).find(m=>{const e=next.edges[m.i];return next.boxes.some((p,j)=>p<0&&boxEdges(next,j).includes(e)&&boxEdges(next,j).filter(e=>e.owner<0).length===1)});if(!capture)break;next=step(next,capture)}return count(next)}
  function ordered(st){return options(st).map(m=>{const n=step(st,m),gain=Math.abs(count(n)-count(st)),risk=n.boxes.filter((p,i)=>p<0&&boxEdges(n,i).filter(e=>e.owner>=0).length===3).length;return {m,n,rank:gain*100-risk*5}}).sort((a,b)=>b.rank-a.rank)}
  function search(st,d,alpha,beta){if(++nodes>cfg.nodes||(nodes%32===0&&Date.now()>deadline))throw abort;if(!d||st.boxes.every(p=>p>=0))return evaluate(st);let best=st.turn===0?-Infinity:Infinity;for(const {n}of ordered(st)){const v=search(n,d-1,alpha,beta);if(st.turn===0){best=Math.max(best,v);alpha=Math.max(alpha,v)}else{best=Math.min(best,v);beta=Math.min(beta,v)}if(alpha>=beta)break}return best}
  const moves=ordered(s);let best=moves[0]?.m;
  for(let depth=1;depth<=(s.level<100?1:Math.min(12,cfg.depth));depth++){let candidate=best,score=s.turn===0?-Infinity:Infinity;try{for(const {m,n}of moves){const v=search(n,depth-1,-Infinity,Infinity);if(s.turn===0?v>score:v<score){score=v;candidate=m}}}catch(e){if(e!==abort)throw e;break}best=candidate}return best;
 }
 function dominoAI(s,moves){
  const p=s.turn,hand=s.hands[p],known=[...hand,...s.chain],remaining=Array(7).fill(0);
  for(let a=0;a<7;a++)for(let b=a;b<7;b++)if(!known.some(t=>t[0]===a&&t[1]===b||t[0]===b&&t[1]===a)){remaining[a]++;if(b!==a)remaining[b]++}
  let best=moves[0],value=-Infinity;
  for(const m of moves){if(m.type!=='tile')return m;const tile=hand[m.i],left=hand.filter((_,i)=>i!==m.i);if(!left.length)return m;const chain=s.chain.map(t=>t.slice()),placed=m.flip?tile.slice().reverse():tile.slice();if(m.end==='left')chain.unshift(placed);else chain.push(placed);const ends=[chain[0][0],chain.at(-1)[1]],coverage=left.filter(t=>ends.some(e=>t.includes(e))).length,own=ends.reduce((n,e)=>n+left.filter(t=>t.includes(e)).length,0);const n=tile[0]+tile[1]+(tile[0]===tile[1]?2:0)+(s.level/1000)*(coverage*7+own*3-(remaining[ends[0]]+remaining[ends[1]])*1.5);if(n>value){value=n;best=m}}
  return best;
 }
 function ai(s){
  const moves=legal(s);if(!moves.length)return null;
  if(s.type==='sudoku'){const i=s.board.findIndex((v,i)=>v!==s.solution[i]);return i<0?null:{type:'digit',i,n:s.solution[i]}}
  if(s.type==='chess')return chessAI(s);
  if(['connectfour','othello','tictactoe'].includes(s.type))return boardAI(s);
  if(s.type==='backgammon')return moves[0].type==='move'?backgammonAI(s):moves[0];
  if(s.type==='dominoes')return dominoAI(s,moves);
  if(s.type==='dotsboxes')return dotsAI(s);
  return moves[0];
 }
 function describe(s,m,next){
  const who=s.turn===0?'You':'Computer';
  if(s.type==='sudoku')return 'Write '+m.n+' in row '+(Math.floor(m.i/9)+1)+', column '+(m.i%9+1)+'. The unique solution respects every row, column and 3 by 3 box.';
  if(s.type==='chess')return who+' play '+next.san+' ('+m.from+' to '+m.to+'). '+(next.notice||'Protect the king, develop pieces, and look for the reply.');
  if(s.type==='connectfour')return who+' drop into column '+(m.c+1)+'. Gravity places the disc in the lowest free row; connect four horizontally, vertically or diagonally.';
  if(s.type==='othello')return m.type==='pass'?who+' pass because no legal bracketing move exists.':who+' bracket and flip '+next.changed.length+' opposing discs at row '+(Math.floor(m.i/8)+1)+', column '+(m.i%8+1)+'. Corners are stable anchors.';
  if(s.type==='backgammon')return who+' '+(m.type==='roll'?'roll '+next.rolled.join(' and ')+'. Doubles are played four times.':m.type==='pass'?'pass because every remaining die is blocked.':'move '+(m.from===-1?'from the bar':'from point '+(m.from+1))+' '+(m.to===24?'off the board':'to point '+(m.to+1))+' using '+m.die+'. Use the maximum possible number of dice.');
  if(s.type==='dominoes')return who+' '+(m.type==='tile'?'play '+s.hands[s.turn][m.i].join(' | ')+' at the '+m.end+' end, matching the exposed pip value.':m.type==='draw'?'draw a hidden tile from the boneyard because no matching tile is playable.':'pass with no matching tile and an empty boneyard.');
  if(s.type==='dotsboxes')return who+' add an edge. '+(next.turn===s.turn?'Completing a box earns it and keeps the turn.':'Avoid offering a third side unless a longer sacrifice is worthwhile.');
  return who+' place '+(s.turn?'O':'X')+' in square '+(m.i+1)+'. Make three in a row while blocking immediate threats.';
 }
 window.MoreBoardRules={create,legal,apply,ai,aiEffort,describe,flips,connectWin,bgSteps,bgSequences,bgStep,boxEdges,chess,random};
})();
