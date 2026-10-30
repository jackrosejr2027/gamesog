// Bounded local opponents for the original board games.
(() => {
 const R=window.BoardRules,clamp=n=>Math.max(1,Math.min(1000,Math.trunc(Number(n))||1));
 function effort(level){const t=(clamp(level)-1)/999;return {nodes:400+Math.floor(t*t*30000),depth:2+Math.floor(t*7),beam:3+Math.floor(t*7),ms:100+Math.floor(t*1400)}}
 function checkBest(board,side,level=500,seen=new Map()){
  const cfg=effort(level),abort={},deadline=Date.now()+cfg.ms,history=new Map(seen);let nodes=0;
  const key=(b,p)=>p+':'+b.join(',');
  function value(b,p){let n=0;b.forEach((v,i)=>{if(!v)return;const r=i>>3,c=i%8,king=Math.abs(v)===2,advance=v>0?7-r:r;let score=king?205:100+advance*5;score+=(3.5-Math.abs(c-3.5))*(king?4:2);if(!king&&advance===0)score+=9;if(c===0||c===7)score+=3;n+=Math.sign(v)*score});return n*p}
  function ordered(b,p){return R.checkersMoves(b,p).sort((a,c)=>c.captures.length-a.captures.length+(Math.abs(b[c.from])===1&&(c.to<8||c.to>=56)?3:0)-(Math.abs(b[a.from])===1&&(a.to<8||a.to>=56)?3:0))}
  function search(b,p,d,alpha,beta,ply,extra=0){
   if(++nodes>cfg.nodes||(nodes%64===0&&Date.now()>deadline))throw abort;
   const moves=ordered(b,p);if(!moves.length)return -100000+ply;
   if((history.get(key(b,p))||0)>=3)return 0;
   if(d<=0&&(!moves[0].captures.length||extra>=5))return value(b,p);
   let best=-Infinity;
   for(const m of moves){const next=R.checkersApply(b,m),k=key(next,-p),count=history.get(k)||0;history.set(k,count+1);let score;
    try{score=-search(next,-p,d-1,-beta,-alpha,ply+1,d<=0?extra+1:0)}finally{if(count)history.set(k,count);else history.delete(k)}
    best=Math.max(best,score);alpha=Math.max(alpha,score);if(alpha>=beta)break;
   }return best;
  }
  let moves=ordered(board,side),best=moves[0]||null;if(moves.length<2)return best;
  for(let depth=1;depth<=cfg.depth;depth++){let candidate=best,score=-Infinity,alpha=-Infinity;
   try{for(const m of [best,...moves.filter(m=>m!==best)]){const b=R.checkersApply(board,m),k=key(b,-side),count=history.get(k)||0;history.set(k,count+1);let n;try{n=-search(b,-side,depth-1,-Infinity,-alpha,1)}finally{if(count)history.set(k,count);else history.delete(k)}if(n>score){score=n;candidate=m}alpha=Math.max(alpha,n)}}catch(e){if(e!==abort)throw e;break}
   best=candidate;if(score>99000)break;
  }return best;
 }
 function manBest(board,side,level=500){
  const cfg=effort(level),abort={},deadline=Date.now()+cfg.ms;let nodes=0;
  const choices=(b,p)=>Array.from({length:6},(_,i)=>i+(p?7:0)).map(pit=>({pit,next:R.mancalaApply(b,p,pit)})).filter(x=>x.next).sort((a,b)=>(b.next.extra?10:0)+b.next.captured-(a.next.extra?10:0)-a.next.captured);
  function value(b,done=false){const diff=b[13]-b[6];return done?(diff?Math.sign(diff)*10000+diff:0):diff*15+b.slice(7,13).reduce((n,v)=>n+v,0)-b.slice(0,6).reduce((n,v)=>n+v,0)}
  function search(b,p,d,alpha,beta){if(++nodes>cfg.nodes||(nodes%64===0&&Date.now()>deadline))throw abort;const options=choices(b,p);if(!options.length)return value(b,true);if(!d)return value(b);let best=p?-Infinity:Infinity;for(const {next}of options){const n=next.done?value(next.board,true):search(next.board,next.turn,d-1,alpha,beta);if(p){best=Math.max(best,n);alpha=Math.max(alpha,n)}else{best=Math.min(best,n);beta=Math.min(beta,n)}if(alpha>=beta)break}return best}
  const options=choices(board,side);let best=options[0]?.pit??null;
  for(let depth=1;depth<=cfg.depth+3;depth++){let candidate=best,score=side?-Infinity:Infinity;
   try{for(const {pit,next}of options){const n=next.done?value(next.board,true):search(next.board,next.turn,depth-1,-Infinity,Infinity);if(side?n>score:n<score){score=n;candidate=pit}}}catch(e){if(e!==abort)throw e;break}best=candidate;
  }return best;
 }
 const goal=p=>R.camps[p===1?0:3],distance=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));
 function starMoves(board,p){const moves=[];board.forEach((v,from)=>{if(v===p)for(const [to,path]of R.starTargets(board,from,goal(p)))moves.push({from,to,path})});return moves}
 function starBest(board,side,seen=new Map(),level=500){
  const cfg=effort(level),deadline=Date.now()+cfg.ms,cache=new Map(),target=goal(side),other=3-side;
  const moved=(b,m,p)=>{const next=b.slice();next[m.from]=0;next[m.to]=p;return next};
  function cost(b,p){const key=p+':'+b.join(',');if(!cache.has(key))cache.set(key,R.starCost(b,p,goal(p)));return cache.get(key)}
  function ranked(b,p){const center=R.star[goal(p)[0]],options=starMoves(b,p);return options.map(m=>({m,b:moved(b,m,p),gain:distance(R.star[m.from],center)-distance(R.star[m.to],center)+(goal(p).includes(m.to)?1:0)})).sort((a,b)=>b.gain-a.gain).slice(0,12+cfg.beam*2).map(x=>({...x,score:-cost(x.b,p)})).sort((a,b)=>b.score-a.score).slice(0,cfg.beam)}
  const all=starMoves(board,side);if(!all.length)return null;
  // Always notice a finishing move, even at the lowest search setting.
  for(const m of all){const b=moved(board,m,side);if(target.every(i=>b[i]===side))return m}
  const initial=cost(board,side),candidates=ranked(board,side),abort={},replies=new Map();let best=candidates[0]?.m||all[0];
  const checkTime=()=>{if(Date.now()>deadline)throw abort};
  const replyOptions=item=>{const key=item.b.join(',');if(!replies.has(key)){checkTime();replies.set(key,ranked(item.b,other).slice(0,1+Math.floor(cfg.beam/3)))}return replies.get(key)};
  // Compare every candidate at the same depth; retain the previous completed pass on timeout.
  for(let depth=0;depth<=(level>=650?2:level>=200?1:0);depth++){let candidate=best,score=-Infinity;
   try{for(const item of candidates){if(depth)checkTime();let n=initial+item.score-(seen.get(other+':'+item.b.join(','))||0)*8+target.filter(i=>item.b[i]===side).length*.15;
    if(depth){let worst=Infinity;for(const reply of replyOptions(item)){checkTime();if(goal(other).every(i=>reply.b[i]===other)){worst=-10000;break}let v=-cost(reply.b,side)+cost(reply.b,other)*.7;if(depth===2){const continuation=ranked(reply.b,side)[0];checkTime();if(continuation)v=-cost(continuation.b,side)+cost(continuation.b,other)*.7}worst=Math.min(worst,v)}if(Number.isFinite(worst))n+=worst*.65}
    if(n>score){score=n;candidate=item.m}
   }}catch(e){if(e!==abort)throw e;break}best=candidate;
  }return best;
 }
 function difficultyLabel(level){const n=clamp(level);return n<200?'Beginner':n<400?'Casual':n<650?'Challenging':n<850?'Advanced':'Expert'}
 Object.assign(R,{effort,checkBest,manBest,starBest,starMoves,difficultyLabel});
})();
