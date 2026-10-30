(() => {
  const api=window.CardArcade,R=window.BoardRules,U=window.Tabletop,{button,frame,row}=U;
  let s,timer,worker,watchdog,advance,epoch=0,levels={};
  if(!window.DemoSession)try{levels=JSON.parse(localStorage.getItem('arcade_classic_levels')||'{}')||{}}catch(e){}
  function cancel(){epoch++;clearTimeout(timer);clearTimeout(watchdog);clearTimeout(advance);if(worker)worker.terminate();worker=null}
  function computer(fn){
    const current=s,ply=s.ply,token=epoch;let settled=false;
    const valid=()=>!settled&&s===current&&s.ply===ply&&epoch===token&&!s.done;
    const legal=()=>s.type==='checkers'?R.checkersMoves(s.board,s.turn):s.type==='mancala'?Array.from({length:6},(_,i)=>i+7).filter(i=>s.board[i]):R.starMoves(s.board,s.turn);
    function finish(move){if(!valid())return;const options=legal(),chosen=options.find(m=>JSON.stringify(m)===JSON.stringify(move));if(chosen===undefined)return recover();settled=true;clearTimeout(watchdog);if(worker)worker.terminate();worker=null;fn(chosen)}
    function recover(){if(!valid())return;clearTimeout(watchdog);if(worker)worker.terminate();worker=null;let move;try{move=s.type==='checkers'?R.checkBest(s.board,s.turn,1,s.seen):s.type==='mancala'?R.manBest(s.board,s.turn,1):R.starBest(s.board,s.turn,s.seen,1)}catch(e){console.warn('Computer recovery:',e)}const options=legal();settled=true;if(options.length)fn(options.find(m=>JSON.stringify(m)===JSON.stringify(move))??options[0])}
    if(typeof Worker==='undefined'){let move;try{move=s.type==='checkers'?checkBest(s.board,s.turn):s.type==='mancala'?manBest(s.board,s.turn):starBest(s.board,s.turn,s.seen)}catch(e){return recover()}finish(move);return}
    try{worker=new Worker('js/board-worker.js');const job=worker;job.onmessage=event=>{if(worker!==job)return;finish(event.data?.move)};job.onerror=recover;watchdog=setTimeout(recover,5000);job.postMessage({type:s.type,board:s.board,turn:s.turn,level:s.level,seen:s.seen})}catch(e){recover()}
  }
  const local=()=>!!window.LocalPlay?.local;
  const previousOpen=api.onOpen,previousLeave=api.leave;
  api.onOpen=key=>{cancel();previousOpen(key)};api.leave=()=>{cancel();previousLeave()};
  function later(fn){if(window.DemoSession||local())return;const current=s,token=epoch,ply=s.ply,turn=s.turn;clearTimeout(timer);timer=setTimeout(()=>{if(s===current&&token===epoch&&s.ply===ply&&s.turn===turn&&!s.done)fn()},s.type==='mancala'?2250:240)}
  function finish(text,win){if(s.done)return;s.done=true;s.result=text;if(win&&!local()){sv.coins+=40;persist();header();jingle([523,659,784,1047]);toast('Victory! +40 coins')}}
  function start(type,level,fresh=false){
    cancel();const difficulty=Math.max(1,Math.min(1000,Math.trunc(Number(level||levels[type]||500))||1));
    if(type!=='mahjong'){levels[type]=difficulty;if(!window.DemoSession)try{localStorage.setItem('arcade_classic_levels',JSON.stringify(levels))}catch(e){}}
    s={type,level:difficulty,done:false,result:'',selected:null,prefix:[],ply:0,quiet:0,seen:new Map(),last:null};
    if(type==='checkers'){s.board=Array(64).fill(0);for(let r=0;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2&&(r<3||r>4))s.board[r*8+c]=r<3?-1:1;s.turn=1;checkTurn()}
    else if(type==='mancala'){s.board=Array(14).fill(4);s.board[6]=s.board[13]=0;s.turn=0;s.notice='Your turn';render()}
    else if(type==='chinesecheckers'){s.board=Array(121).fill(0);R.camps[3].forEach(i=>s.board[i]=1);R.camps[0].forEach(i=>s.board[i]=2);s.turn=1;s.targets=new Map();starTurn()}
    else {s.level=Math.max(1,Math.min(1000,Math.trunc(Number(level||sv.mahLevel)||1)));const seed=window.DemoSession?(s.level*2654435761)>>>0:window.crypto?.getRandomValues?window.crypto.getRandomValues(new Uint32Array(1))[0]:Math.floor(Math.random()*4294967296);const deal=R.mahDeal(s.level,seed);s.seed=deal.seed;s.tiles=deal.tiles;s.solution=deal.solution;s.history=[];s.hint=null;sv.mahLevel=s.level;persist();render()}
  }
  function notePosition(){const key=s.turn+':'+s.board.join(',');s.seen.set(key,(s.seen.get(key)||0)+1);return s.seen.get(key)>=3}
  function checkTurn(){
    s.moves=R.checkersMoves(s.board,s.turn);s.selected=null;s.prefix=[];
    if(!s.moves.length)finish(s.turn===1?'No legal move. The computer wins.':'The computer has no legal move. You win!',s.turn===-1);
    else if(s.quiet>=80||notePosition())finish('Draw by repetition or forty moves without a capture or a move by an uncrowned man.',false);
    render();if(!s.done&&s.turn===-1)later(checkCpu);
  }
  function checkCommit(move){const p=s.board[move.from];s.board=R.checkersApply(s.board,move);s.quiet=move.captures.length||Math.abs(p)===1?0:s.quiet+1;s.last=move;s.turn=-s.turn;s.ply++;checkTurn()}
  const checkBest=(board,side,level=s?.level||500)=>R.checkBest(board,side,level,s?.seen);
  function checkCpu(){computer(checkCommit)}
  function checkClick(id){
    if(s.done||!local()&&s.turn!==1)return;
    const candidates=s.moves.filter(m=>s.prefix.every((p,i)=>m.path[i]===p)),next=candidates.filter(m=>m.path[s.prefix.length]===id);
    if(s.prefix.length&&next.length){s.prefix.push(id);const done=next.find(m=>m.path.length===s.prefix.length);if(done)return checkCommit(done);return render()}
    if(s.prefix.length>1)return toast('Continue the jump with the same piece');
    if(s.moves.some(m=>m.from===id)){s.selected=id;s.prefix=[id];render()}else if(s.board[id]>0)toast('A capture elsewhere is compulsory, or this piece is blocked');
  }
  function renderCheckers(area){
    const board=h('div','check-board');board.setAttribute('role','group');board.setAttribute('aria-label','Checkers board');area.appendChild(board);
    const preview=s.board.slice();for(let i=1;i<s.prefix.length;i++){const a=s.prefix[i-1],b=s.prefix[i],p=preview[a];preview[a]=0;preview[b]=p;if(Math.abs((a>>3)-(b>>3))===2)preview[(((a>>3)+(b>>3))/2)*8+((a%8+b%8)/2)]=0}
    const next=new Set(s.prefix.length?s.moves.filter(m=>s.prefix.every((p,i)=>m.path[i]===p)).map(m=>m.path[s.prefix.length]):[]);
    preview.forEach((p,i)=>{const dark=((i>>3)+i%8)%2,b=h('button','check-square '+(dark?'dark':'light')+(next.has(i)?' legal':'')+(s.prefix.includes(i)?' selected':''));b.setAttribute('aria-label',String.fromCharCode(97+i%8)+(8-(i>>3))+': '+(p?(p>0?'Your ':'Computer ')+(Math.abs(p)===2?'king':'piece'):'empty')+(next.has(i)?', legal destination':''));b.disabled=!dark||s.done||!local()&&s.turn!==1;b.onclick=()=>checkClick(i);if(p){const piece=h('span','checker '+(p>0?'human':'computer'));if(Math.abs(p)===2)piece.textContent='K';b.appendChild(piece)}board.appendChild(b)});
  }
  const manBest=(board,side,level=s?.level||500)=>R.manBest(board,side,level);
  function manMove(pit){if(s.done)return;const next=R.mancalaApply(s.board,s.turn,pit);if(!next)return;s.sow={pit,turn:s.turn,count:s.board[pit],captured:next.captured};s.board=next.board;s.turn=next.turn;s.ply++;s.notice=next.captured?'Captured '+next.captured+' stones. ':'';if(next.extra)s.notice+='Extra turn. ';s.notice+=s.turn===0?'Your turn':'Computer thinking';if(next.done){const you=s.board[6],cpu=s.board[13];finish(you===cpu?'Draw, '+you+' each.':you>cpu?'You win '+you+' to '+cpu+'!':'Computer wins '+cpu+' to '+you+'.',you>cpu)}render();if(!s.done&&s.turn===1)later(()=>computer(manMove))}
  function stones(bin,count,id){
    bin.dataset.pit=id;const layer=h('span','mancala-stones');layer.setAttribute('aria-hidden','true');
    for(let n=0;n<count;n++){const stone=h('i','glass-stone tone-'+n%3);stone.style.left=(9+(n*37+id*13)%73)+'%';stone.style.top=(8+(n*29+id*17)%72)+'%';stone.style.setProperty('--angle',(n*47)%180+'deg');stone.style.animationDelay=Math.min(n*.015,.4)+'s';layer.appendChild(stone)}bin.prepend(layer);
  }
  function animateSow(wrap){
    const sow=s.sow;s.sow=null;if(!sow||typeof wrap.getBoundingClientRect!=='function')return;
    const rect=wrap.getBoundingClientRect(),source=wrap.querySelector('[data-pit="'+sow.pit+'"]');if(!source)return;const start=source.getBoundingClientRect();let at=sow.pit;const visited=[];
    for(let n=0;n<sow.count;n++){do{at=(at+1)%14}while(at===(sow.turn===0?13:6));visited.push(at)}
    const flight=(from,to,delay)=>{const origin=wrap.querySelector('[data-pit="'+from+'"]'),dest=wrap.querySelector('[data-pit="'+to+'"]');if(!origin||!dest)return;const a=origin.getBoundingClientRect(),b=dest.getBoundingClientRect(),stone=h('i','glass-stone mancala-flight');stone.style.left=a.left+a.width/2-rect.left+'px';stone.style.top=a.top+a.height/2-rect.top+'px';stone.style.setProperty('--dx',b.left+b.width/2-a.left-a.width/2+'px');stone.style.setProperty('--dy',b.top+b.height/2-a.top-a.height/2+'px');stone.style.setProperty('--delay',delay+'s');stone.addEventListener('animationend',()=>stone.remove(),{once:true});wrap.appendChild(stone)};
    visited.forEach((to,n)=>flight(sow.pit,to,n*Math.min(.07,1.6/sow.count)));
    if(sow.captured){const store=sow.turn===0?6:13;flight(at,store,1.7);flight(12-at,store,1.8)}
  }
  function renderMancala(area){
    const wrap=h('div','mancala-wrap');area.appendChild(wrap);const cpuStore=h('div','mancala-store');cpuStore.append(h('small','',local()?'Player 2':'Computer'),h('b','',s.board[13]));stones(cpuStore,s.board[13],13);wrap.appendChild(cpuStore);
    const middle=h('div','mancala-pits');wrap.appendChild(middle);
    for(const i of [12,11,10,9,8,7,0,1,2,3,4,5]){const b=h('button','mancala-pit'+(i<6?' human-pit':''));b.append(h('b','',s.board[i]),h('small','',i<6?'Pit '+(i+1):'CPU'));b.setAttribute('aria-label',(i<6?'Your pit '+(i+1):'Computer pit')+', '+s.board[i]+' stones');b.disabled=!s.board[i]||s.done||(local()?(s.turn===0?i>=7:i<7):i>=7||s.turn!==0);b.onclick=()=>manMove(i);stones(b,s.board[i],i);middle.appendChild(b)}
    const humanStore=h('div','mancala-store');humanStore.append(h('small','',local()?'Player 1':'You'),h('b','',s.board[6]));stones(humanStore,s.board[6],6);wrap.appendChild(humanStore);animateSow(wrap);
  }
  const goal=side=>R.camps[side===1?0:3];
  function allStarMoves(board,side){const moves=[];board.forEach((p,from)=>{if(p===side)for(const [to,path]of R.starTargets(board,from,goal(side)))moves.push({from,to,path})});return moves}
  const starBest=(board,side,seen=new Map(),level=s?.level||500)=>R.starBest(board,side,seen,level);
  function starTurn(){
    s.selected=null;s.targets=new Map();const moves=allStarMoves(s.board,s.turn);
    if(goal(3-s.turn).every(i=>s.board[i]===3-s.turn))finish(s.turn===2?'All your marbles are home. You win!':'The computer reaches its destination first.',s.turn===2);
    else if(s.ply>=800||notePosition())finish('Draw by repeated position or the move limit.',false);
    else if(!moves.length){if(!allStarMoves(s.board,3-s.turn).length)finish('Neither side has a legal move. Draw.',false);else{s.turn=3-s.turn;s.notice='No legal move: turn passed.';return starTurn()}}
    render();if(!s.done&&s.turn===2)later(()=>computer(starMove));
  }
  function starMove(m){s.board[m.from]=0;s.board[m.to]=s.turn;s.last=m;s.turn=3-s.turn;s.ply++;starTurn()}
  function starClick(i){if(s.done||!local()&&s.turn!==1)return;if(s.targets.has(i))return starMove({from:s.selected,to:i,path:s.targets.get(i)});if(s.board[i]===s.turn){s.selected=i;s.targets=R.starTargets(s.board,i,goal(s.turn));render()}}
  function renderStar(area){
    const board=h('div','star-board');area.appendChild(board);
    R.star.forEach((p,i)=>{const x=50+(p.q+p.r/2)*5.5,y=50+p.r*5.5,b=h('button','star-hole'+(p.arm===0?' target-camp':p.arm===3?' home-camp':'')+(s.targets.has(i)?' legal':'')+(s.selected===i?' selected':''));b.style.left=x+'%';b.style.top=y+'%';b.setAttribute('aria-label','Hole '+(i+1)+': '+(s.board[i]===1?'your marble':s.board[i]===2?'computer marble':'empty')+(s.targets.has(i)?', legal destination':''));b.disabled=s.done||!local()&&s.turn!==1;b.onclick=()=>starClick(i);if(s.board[i])b.appendChild(h('span','marble '+(s.board[i]===1?'human':'computer')));board.appendChild(b)});
  }
  function mahSelect(id){
    if(s.done)return;if(!R.mahFree(s.tiles,id))return toast('Use an uncovered tile with a free left or right edge');
    s.hint=null;if(s.selected===id)s.selected=null;
    else if(s.selected!==null&&s.tiles[s.selected].face===s.tiles[id].face&&R.mahFree(s.tiles,s.selected)){
      const pair=[s.selected,id];pair.forEach(i=>s.tiles[i].gone=true);s.history.push(pair);s.selected=null;
      if(s.tiles.every(t=>t.gone)){sv.mahMax=Math.max(Number(sv.mahMax)||1,s.level);finish('Level '+s.level+' cleared!',true);persist();if(s.level<1000&&!window.DemoSession){const lv=s.level;clearTimeout(advance);advance=setTimeout(()=>{advance=null;if(s&&s.type==='mahjong'&&s.done&&s.level===lv)start('mahjong',lv+1)},1800)}}
    }else s.selected=id;render();
  }
  function mahUndo(){if(s.done||!s.history.length)return;s.history.pop().forEach(id=>s.tiles[id].gone=false);s.selected=null;s.hint=null;render()}
  function mahHint(){if(s.done)return;const pairs=R.mahPairs(s.tiles);if(!pairs.length)return toast('No matching free pair. Undo or restart.');s.hint=s.solution.find(pair=>pair.every(id=>R.mahFree(s.tiles,id)))||pairs[0];s.selected=null;render()}
  function tileName(face){if(face<27)return (face%9+1)+' '+['Bamboo','Dots','Characters'][Math.floor(face/9)];return ['East Wind','South Wind','West Wind','North Wind','Red Dragon','Green Dragon','White Dragon','Flower','Season'][face-27]}
  function renderMahjong(area,actions){
    const controls=row(area),input=h('input','level-input');input.type='number';input.min='1';input.max='1000';input.value=s.level;input.setAttribute('aria-label','Mahjong level, 1 to 1000');controls.appendChild(input);
    const go=()=>{const n=Number(input.value);if(!Number.isInteger(n)||n<1||n>1000)return toast('Choose a whole level from 1 to 1000');start('mahjong',n)};
    button(controls,'Go to level',go);input.onkeydown=e=>{if(e.key==='Enter')go()};
    const label=h('label','mah-style-label','Tile set '),select=h('select','mah-style-select');select.setAttribute('aria-label','Mahjong tile style');for(const name of window.MahjongTiles.styles){const option=h('option','',name);option.value=name;option.selected=name===window.MahjongTiles.style;select.appendChild(option)}select.onchange=()=>{window.MahjongTiles.style=select.value;render()};label.appendChild(select);controls.appendChild(label);
    const scroll=h('div','mah-scroll'),board=h('div','mah-board');board.dataset.style=window.MahjongTiles.style.toLowerCase();scroll.appendChild(board);area.appendChild(scroll);
    s.tiles.filter(t=>!t.gone).forEach(t=>{const free=R.mahFree(s.tiles,t.id),b=h('button','mah-tile suit-'+Math.floor(t.face/9)+(free?' free':' blocked')+(s.selected===t.id?' selected':'')+(s.hint&&s.hint.includes(t.id)?' hint':''));b.style.left='calc('+t.x+' * var(--mw) + '+t.z*5+'px)';b.style.top='calc('+t.y+' * var(--mh) - '+t.z*5+'px + 25px)';b.style.zIndex=t.z*100+t.y*10+t.x;b.setAttribute('aria-label',tileName(t.face)+(free?', free':', blocked'));b.disabled=s.done||!free;b.onclick=()=>mahSelect(t.id);b.appendChild(window.MahjongTiles.face(t.face));board.appendChild(b)});
    button(actions,'Hint',mahHint,s.done);button(actions,'Undo pair',mahUndo,s.done||!s.history.length);
    if(s.done&&s.level<1000)button(actions,'Next level',()=>start('mahjong',s.level+1));
    if(!s.done&&!R.mahPairs(s.tiles).length)area.appendChild(h('p','board-notice','No matching free pair. Undo a pair or start a fresh deal.'));
  }
  function render(){
    let status=s.result;
    if(!status){if(s.type==='checkers')status=(s.turn===1?'Your turn':'Computer thinking')+(s.moves&&s.moves[0]&&s.moves[0].captures.length?' | Captures are compulsory':'')+(s.prefix.length>1?' | Continue jumping':'');else if(s.type==='mancala')status=s.notice;else if(s.type==='chinesecheckers')status=(s.turn===1?'Your turn: move to the top camp':'Computer thinking')+' | You '+goal(1).filter(i=>s.board[i]===1).length+'/10 home';else status='Mahjong Solitaire | Level '+s.level+'/1000 | '+s.tiles.filter(t=>!t.gone).length+' tiles left'}
    if(local()&&s.type!=='mahjong')status=s.done?s.result.replaceAll('The computer','Player 2').replaceAll('Computer','Player 2').replaceAll('You','Player 1'):(s.type==='mancala'?'Player '+(s.turn+1):'Player '+(s.turn===1?1:2))+' to move';
    const {area,actions}=frame(status,()=>start(s.type,s.level,true));area.classList.add('board-area');
    if(s.type!=='mahjong'){const controls=row(area),input=h('input','level-input');input.type='number';input.min=1;input.max=1000;input.value=s.level;input.setAttribute('aria-label',s.type+' level, 1 to 1000');controls.appendChild(input);const go=()=>{const n=Number(input.value);if(!Number.isInteger(n)||n<1||n>1000)return toast('Choose a whole level from 1 to 1000');start(s.type,n)};button(controls,'Go to level',go);input.onkeydown=e=>{if(e.key==='Enter')go()};controls.appendChild(h('small','mb-difficulty',R.difficultyLabel(s.level)+' · '+s.level+'/1000 · Higher settings search farther; not rated skill.'));}

    if(s.type==='checkers')renderCheckers(area);else if(s.type==='mancala')renderMancala(area);else if(s.type==='chinesecheckers')renderStar(area);else renderMahjong(area,actions);
  }
  if(window.DemoSession)window.DemoSession.boards={start,checkBest,checkCommit,manBest,manMove,starBest,starMove,mahSelect,get s(){return s}};
  const definitions={
    checkers:['Checkers','American checkers against the computer.','American/English 8 x 8 checkers. You play the light-blue pieces at the bottom and move first. Men move and capture one diagonal step forward; a capture jumps an adjacent opponent onto the empty square beyond. Captures are compulsory. If another capture is available after a jump, continue with the same piece. Click each highlighted landing square. Reaching the far row crowns a King and ends that turn, even during a capture. Kings move and capture both diagonal directions; they are not flying Kings. Win by leaving the opponent without a piece or legal move. Threefold position repetition, or forty full moves without a capture or a move by an uncrowned man, is a draw. Levels 1-1000 increase bounded lookahead, tactical capture search and positional evaluation. The selected level is saved; levels are search effort, not calibrated ratings.'],
    chinesecheckers:['Chinese Checkers','Race ten marbles across the star against the computer.','Two-player Chinese checkers on the full 121-hole star. Your ten blue marbles start in the bottom camp; the computer starts at the top. Select a marble, then any highlighted destination. A turn is either one adjacent step in one of six directions, or one or more jumps over adjacent marbles of either colour into empty holes. Jumps never capture. Highlighted jump destinations already include all legal multi-hop paths, so one destination click completes your chosen chain. Empty side camps are playable. Once a marble enters its destination camp it cannot leave it, although it may move within that camp. First to occupy all ten holes in the opposite camp wins. Levels 1-1000 increase assignment-based planning, opponent-reply lookahead and repetition avoidance. The selected level is saved. No legal move passes the turn. Threefold repetition or 800 individual turns draws the game.'],
    mancala:['Mancala','Kalah sowing, captures and extra turns against the computer.','Kalah rules: six pits per side, four stones per pit, 48 stones total. You own the bottom row and the store on the right; the computer owns the top row and left store. Choose a nonempty pit on your side. Its stones are sown counterclockwise one at a time, including your store but skipping the opponent store. Landing the last stone in your store gives another turn. Landing in a previously empty pit on your side captures that stone and all stones in the opposite pit, but only if that opposite pit contains stones. When either side has no stones in its six pits, play ends immediately: all remaining pit stones go to their owner store. More stones in the store wins; 24 each draws. Levels 1-1000 increase bounded lookahead, accounting for captures, extra turns and final store scores. The selected level is saved.'],
    mahjong:['Mahjong Solitaire','Fresh, solvable tile deals across 1,000 difficulty profiles.','Single-player Mahjong Solitaire, not four-player riichi or Chinese Mahjong. There are 1,000 difficulty profiles. Every new game and level selection shuffles a fresh solvable deal. Matching faces are not tied to mirrored positions, so outside tiles do not automatically match. Enter any level from 1 to 1000 and press Go to level. A tile is free only when no tile covers it and at least one horizontal edge (left or right) is open on the same layer. Click two free tiles with the same printed face to remove them. Bamboo, Dots and Characters match by both suit and number; Winds and Dragons by name. All Flowers match Flowers; all Seasons match Seasons. Clear every tile to win. Early levels have fewer tiles and fewer layers; later levels grow up to 144 tiles and five layers. Every initial deal has a verified removal sequence, but choosing different pairs can still create a dead end. Hint highlights a legal pair, not a promise that your current position remains solvable. Undo restores the last pair; it is disabled after a completed level. With no matches, undo or restart. Level number and highest completed level are saved.']
  };
  for(const [key,[title,description,rules]]of Object.entries(definitions)){api.games[key]={t:title,d:description,k:key,category:'board',s:()=>start(key)};api.help[key]=title.toUpperCase()+'\n'+rules}
  api.remember(Object.keys(definitions),()=>s,saved=>{s=saved;render();if(!s.done&&!local()){if(s.type==='checkers'&&s.turn===-1)later(checkCpu);if(s.type==='mancala'&&s.turn===1)later(()=>computer(manMove));if(s.type==='chinesecheckers'&&s.turn===2)later(()=>computer(starMove))}});
})();
