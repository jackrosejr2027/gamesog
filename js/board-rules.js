// Pure rules used by the boards, computer players, and regression tests.
(() => {
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  function checkersMoves(board,side){
    const jumps=[],quiet=[];
    const directions=p=>Math.abs(p)===2?[[-1,-1],[-1,1],[1,-1],[1,1]]:[[p>0?-1:1,-1],[p>0?-1:1,1]];
    const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
    function search(b,at,p,path,captured){
      let continued=false;
      for(const [dr,dc]of directions(p)){
        const r=at>>3,c=at%8,mr=r+dr,mc=c+dc,nr=r+dr*2,nc=c+dc*2;
        if(!inside(nr,nc)||!inside(mr,mc))continue;
        const middle=mr*8+mc,to=nr*8+nc;
        if(b[middle]*side>=0||b[to])continue;
        const next=b.slice();next[at]=0;next[middle]=0;next[to]=p;continued=true;
        const crowned=Math.abs(p)===1&&(nr===0&&side===1||nr===7&&side===-1);
        if(crowned)jumps.push({from:path[0],to,path:[...path,to],captures:[...captured,middle]});
        else search(next,to,p,[...path,to],[...captured,middle]);
      }
      if(!continued&&captured.length)jumps.push({from:path[0],to:at,path,captures:captured});
    }
    board.forEach((p,from)=>{if(p*side<=0)return;search(board,from,p,[from],[]);for(const [dr,dc]of directions(p)){const r=(from>>3)+dr,c=from%8+dc;if(inside(r,c)&&!board[r*8+c])quiet.push({from,to:r*8+c,path:[from,r*8+c],captures:[]})}});
    return jumps.length?jumps:quiet;
  }
  function checkersApply(board,move){const next=board.slice(),p=next[move.from];next[move.from]=0;move.captures.forEach(i=>next[i]=0);next[move.to]=Math.abs(p)===1&&(move.to<8&&p>0||move.to>=56&&p<0)?p*2:p;return next}
  function mancalaApply(board,side,pit){
    const own=side===0?6:13,other=side===0?13:6,start=side===0?0:7;
    if(pit<start||pit>start+5||!board[pit])return null;
    const next=board.slice();let stones=next[pit],at=pit;next[pit]=0;
    while(stones){at=(at+1)%14;if(at===other)continue;next[at]++;stones--}
    let captured=0;
    if(at>=start&&at<start+6&&next[at]===1&&next[12-at]>0){captured=next[12-at]+1;next[own]+=captured;next[at]=0;next[12-at]=0}
    const emptyA=next.slice(0,6).every(n=>!n),emptyB=next.slice(7,13).every(n=>!n),done=emptyA||emptyB;
    if(done){next[6]+=next.slice(0,6).reduce((a,b)=>a+b,0);next[13]+=next.slice(7,13).reduce((a,b)=>a+b,0);for(let i=0;i<14;i++)if(i!==6&&i!==13)next[i]=0}
    return {board:next,turn:at===own?side:1-side,extra:at===own&&!done,captured,done};
  }
  const key=(q,r)=>q+','+r;
  const star=[];for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=4)star.push({q,r,arm:-1});
  const camps=Array.from({length:6},()=>[]);
  for(let r=-8;r<=-5;r++)for(let q=-r-4;q<=4;q++){
    let x=q,y=r;for(let arm=0;arm<6;arm++){camps[arm].push(star.length);star.push({q:x,r:y,arm});[x,y]=[-y,x+y]}
  }
  const lookup=new Map(star.map((p,i)=>[key(p.q,p.r),i]));
  function starTargets(board,from,goal){
    if(!board[from])return new Map();const result=new Map(),goals=new Set(goal),origin=star[from],started=goals.has(from);
    for(const [dq,dr]of dirs){const id=lookup.get(key(origin.q+dq,origin.r+dr));if(id!==undefined&&!board[id]&&(!started||goals.has(id)))result.set(id,[from,id])}
    const queue=[{at:from,path:[from],entered:started}],seen=new Set([from+':'+started]);
    for(let n=0;n<queue.length;n++){
      const {at,path,entered}=queue[n],p=star[at];
      for(const [dq,dr]of dirs){const middle=lookup.get(key(p.q+dq,p.r+dr)),to=lookup.get(key(p.q+dq*2,p.r+dr*2));
        if(middle===undefined||to===undefined||middle===from||!board[middle]||board[to]&&to!==from||path.includes(to)||entered&&!goals.has(to))continue;
        const nextPath=[...path,to],inGoal=entered||goals.has(to),tag=to+':'+inGoal;if(!result.has(to))result.set(to,nextPath);if(!seen.has(tag)){seen.add(tag);queue.push({at:to,path:nextPath,entered:inGoal})}
      }
    }
    result.delete(from);return result;
  }
  function starCost(board,side,goal){
    const pieces=[];board.forEach((p,i)=>{if(p===side)pieces.push(star[i])});if(pieces.length!==goal.length)return Infinity;
    const n=goal.length,size=1<<n,dp=new Float64Array(size);dp.fill(Infinity);dp[0]=0;
    for(let mask=0;mask<size;mask++){if(!Number.isFinite(dp[mask]))continue;let used=0;for(let m=mask;m;m&=m-1)used++;if(used>=n)continue;const p=pieces[used];for(let j=0;j<n;j++)if(!(mask&(1<<j))){const t=star[goal[j]],d=Math.max(Math.abs(p.q-t.q),Math.abs(p.r-t.r),Math.abs(p.q+p.r-t.q-t.r)),next=mask|(1<<j);dp[next]=Math.min(dp[next],dp[mask]+d)}}
    return dp[size-1];
  }
  function mahFree(tiles,id){const t=tiles[id];if(!t||t.gone)return false;let left=false,right=false;for(const o of tiles){if(o.gone||o.id===id)continue;if(o.x===t.x&&o.y===t.y&&o.z>t.z)return false;if(o.z===t.z&&o.y===t.y){if(o.x===t.x-1)left=true;if(o.x===t.x+1)right=true}}return !left||!right}
  function mahPairs(tiles){const free=tiles.filter(t=>mahFree(tiles,t.id)),pairs=[];for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++)if(free[i].face===free[j].face)pairs.push([free[i].id,free[j].id]);return pairs}
  const mahRng=seed=>{seed>>>=0;return()=>{seed=(seed+0x6D2B79F5)>>>0;let t=Math.imul(seed^(seed>>>15),seed|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}};
  // Ten shape families. u and v are normalised distances from the board centre; y is the row (0 at top); b is a per-layer variant value in [0,1).
  const mahShapes=[
    (u,v,y,b)=>Math.max(u*(0.7+0.6*b),v),
    (u,v,y,b)=>u*(0.6+0.8*b)+v,
    (u,v,y,b)=>(u*(0.6+0.8*b))**2+v*v,
    (u,v,y,b)=>Math.min(u/(0.4+b),v),
    (u,v,y,b)=>Math.abs((u*(0.7+0.6*b))**2+v*v-(0.25+0.4*b)),
    (u,v,y,b)=>Math.abs(u*(0.5+b)-v)+0.05*u,
    (u,v,y,b)=>u/(y+1+2*b),
    (u,v,y,b)=>v*(1+b)+0.05*u,
    (u,v,y,b)=>Math.abs(u-(0.3+0.6*b))+0.1*v,
    (u,v,y,b)=>{const n=Math.sin(u*12.9898+y*78.233+b*37.719)*43758.5453;return n-Math.floor(n)+0.2*u}
  ];
  // 100 fixed board templates (family = t % 10, variant = t / 10). Each is a stack of up to five mirror-symmetric layers on the left half (x 0-4, y 0-7); the right half mirrors it at x 9-x.
  // Layer k is the lowest-scoring K[k] cells of layer k-1, so every raised tile has a tile under it.
  const mahTemplates=new Map();
  function mahBuild(t,salt){
    const rnd=mahRng((Math.imul(t+1,2246822519)^0x5bd1e995)+Math.imul(salt,0x9E3779B9)),fam=mahShapes[t%10],b=[rnd(),rnd(),rnd(),rnd(),rnd()];
    const K=[36+Math.floor(rnd()*5),20+Math.floor(rnd()*7),10+Math.floor(rnd()*5),5+Math.floor(rnd()*4),3+Math.floor(rnd()*3)];
    const order=(list,k)=>list.map(([x,y])=>({x,y,s:fam(Math.abs(x-4.5)/4.5,Math.abs(y-3.5)/3.5,y,b[k])})).sort((p,q)=>p.s-q.s||p.y-q.y||p.x-q.x).map(c=>[c.x,c.y]);
    const all=[];for(let x=0;x<5;x++)for(let y=0;y<8;y++)all.push([x,y]);
    const ground=order(all,0),rank=new Map(ground.map(([x,y],i)=>[x*8+y,i]));
    let layer=ground.slice(0,K[0]);const cells=layer.map(([x,y])=>({x,y,z:0,p:rank.get(x*8+y)}));
    for(let k=1;k<5;k++){layer=order(layer,k).slice(0,K[k]);layer.forEach(([x,y])=>cells.push({x,y,z:k,p:k*100+rank.get(x*8+y)}))}
    cells.sort((p,q)=>p.p-q.p||p.z-q.z);
    return cells;
  }
  // Template t is deterministic. If its cell layout repeats an earlier template, it is re-rolled with the next salt.
  function mahTemplate(t){
    if(mahTemplates.has(t))return mahTemplates.get(t);
    for(let salt=0;salt<1000;salt++){
      const cells=mahBuild(t,salt),key=cells.slice(0,71).map(c=>c.x+','+c.y+','+c.z).join(';');
      if(Array.from({length:t},(_,u)=>mahTemplate(u)).some(o=>o.key===key))continue;
      const result={cells,key};mahTemplates.set(t,result);return result;
    }
    throw Error('No distinct Mahjong template '+t);
  }
  function mahDeal(level,seed=(level*2654435761)>>>0){
    level=Math.max(1,Math.min(1000,Math.trunc(Number(level))||1));
    seed=Number(seed)>>>0;const random=mahRng(seed);
    const layers=1+Math.floor((level-1)/200),count=24+2*Math.floor((level-1)*60/999),pairs=count/2;
    const {cells}=mahTemplate((level-1)%100);
    const slots=cells.filter(c=>c.z<layers).slice(0,pairs).flatMap(c=>[{x:c.x,y:c.y,z:c.z},{x:9-c.x,y:c.y,z:c.z}]);
    if(slots.length!==count)throw Error('Mahjong template has too few tiles for level '+level);
    // Geometry may be symmetric; face assignments and removable pairs must not be.
    // Precompute blockers so random solution construction stays inexpensive.
    const blockers=slots.map(t=>({above:[],left:[],right:[]}));
    slots.forEach((t,i)=>slots.forEach((o,j)=>{if(i===j)return;const b=blockers[i];if(o.x===t.x&&o.y===t.y&&o.z>t.z)b.above.push(j);if(o.z===t.z&&o.y===t.y){if(o.x===t.x-1)b.left.push(j);if(o.x===t.x+1)b.right.push(j)}}));
    const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
    // At most four copies of a face. Shuffle the pair pool too, rather than
    // assigning every outer row from the same ordered section of the deck.
    const pool=shuffle([...shuffle(Array.from({length:36},(_,i)=>i)),...shuffle(Array.from({length:36},(_,i)=>i))].slice(0,pairs));
    for(let attempt=0;attempt<500;attempt++){
      const tiles=slots.map((p,id)=>({...p,id,face:-1,gone:false})),solution=[];
      const free=i=>{const b=blockers[i];return !tiles[i].gone&&!b.above.some(j=>!tiles[j].gone)&&(!b.left.some(j=>!tiles[j].gone)||!b.right.some(j=>!tiles[j].gone))};
      while(solution.length<pairs){
        const available=tiles.filter(t=>free(t.id)).map(t=>t.id);
        if(available.length<2)break;
        const ai=Math.floor(random()*available.length),a=available.splice(ai,1)[0],b=available[Math.floor(random()*available.length)],face=pool[solution.length];
        tiles[a].face=tiles[b].face=face;tiles[a].gone=tiles[b].gone=true;solution.push([a,b]);
      }
      if(solution.length===pairs){tiles.forEach(t=>t.gone=false);return {tiles,solution,layers,count,seed}}
    }
    throw Error('Mahjong layout could not be dealt for level '+level);
  }
  window.BoardRules={checkersMoves,checkersApply,mancalaApply,star, camps,starTargets,starCost,mahFree,mahPairs,mahDeal};
})();
