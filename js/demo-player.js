(() => {
 const D=window.DemoSession,api=window.CardArcade,key=new URLSearchParams(location.search).get('game')||'stack';
 const preview=new URLSearchParams(location.search).has('preview');
 let step=0,playing=true,busy=false,pendingStep=false,timer,closed=false,pendingPrevious=false;
 muted=true;sv={lvl:1,max:1,coins:100,tickets:999,wins:0,pm:2,sideMode:true};
 const isTrick=key.startsWith('magic:'),id=isTrick?key.slice(6):key;
 let engine=null;
 if(isTrick)engine=['classic','pred','noq','one','spec','ment','big','wide'].includes(id)?'magic':'tricks';
 else if(id.startsWith('classic-'))engine='classics';
 else if(['stack','hilo','ordinary','ginrummy','pullcrest'].includes(id))engine=id;
 else if(['klondike','freecell','scoundrel','longroad','savage','quiet','falk'].includes(id))engine='legacy';
 else if(['checkers','chinesecheckers','mancala','mahjong'].includes(id))engine='boards';
 else if(['sudoku','chess','backgammon','connectfour','othello','dominoes','dotsboxes','tictactoe'].includes(id))engine='moreboards';
 else if(['tchukaruma','shutbox','nurikabe','pegsolitaire','pentalpha','minesweeper','game2048'].includes(id))engine='solopuzzles';
 else if(id==='jewels')engine='jewels';
 else if(Object.hasOwn(window.WorldPuzzleArcade.defs,id))engine='worldpuzzles';
 else if(Object.hasOwn(D.more.defs,id))engine='more';
 else if(['spider','pyramid','golf','tripeaks','accordion','clock','montecarlo','castle','lucie','calculation','memory','bowling'].includes(id))engine='solitaire';
 else if(api.games[id])engine='rpg';
 function tell(type,extra={}){parent.postMessage({type:'arcade-demo',event:type,key,step,playing,...extra},'*')}
 function init(){
  api.stopSolitaire();api.leave();window.MagicArcade.stop();window.MagicArcade.stopExtra();
  $('#modal').style.display='none';$('#g2').style.display='none';$('#magic').style.display='none';
  D.seen.clear();D.memory=null;D.marketTrades=null;D.turns=0;
  if(isTrick){$('#magic').style.display='flex';D[engine][engine==='magic'?'run':'begin'](id)}
  else if(id==='stack')newGame(1);
  else if(id==='hilo'){sv.tickets=999;A[id]()}
  else api.open(id);
 }
 D.adapters.boards=()=>{
  const E=D.boards,s=E.s,R=window.BoardRules;if(s.done)return null;
  if(s.type==='checkers'){const side=s.turn,m=E.checkBest(s.board,side);if(!m)return null;const promoted=Math.abs(s.board[m.from])===1&&(side===1?m.to<8:m.to>=56);E.checkCommit(m);return (side===1?'Blue':'Computer')+' moves from '+String.fromCharCode(97+m.from%8)+(8-(m.from>>3))+' to '+String.fromCharCode(97+m.to%8)+(8-(m.to>>3))+'. '+(m.captures.length?'Capture '+m.captures.length+' piece(s), completing the compulsory jump chain.':'Use a legal diagonal move while looking ahead at the reply.')+(promoted?' The piece is crowned King.':'')}
  if(s.type==='mancala'){const side=s.turn,pit=E.manBest(s.board,side),stones=s.board[pit];E.manMove(pit);return (side===0?'You':'Computer')+' sow '+stones+' stones from pit '+(side===0?pit+1:pit-6)+', skipping the opposing store. '+(s.result||s.notice)+'. Store landings grant extra turns; empty-pit landings may capture.'}
  if(s.type==='chinesecheckers'){const side=s.turn,m=E.starBest(s.board,side,s.seen);if(!m)return null;E.starMove(m);return (side===1?'Blue':'Computer')+' moves marble '+(m.from+1)+' to hole '+(m.to+1)+'. '+(m.path.length>2?'A multi-hop chain uses occupied holes as stepping stones.':'A legal step or hop advances the race.')+' No marble is captured, and destination-camp marbles stay inside.'}
  const pair=s.solution.find(p=>p.every(i=>!s.tiles[i].gone&&R.mahFree(s.tiles,i)));if(!pair)return null;
  const face=s.tiles[pair[0]].face;E.mahSelect(pair[0]);E.mahSelect(pair[1]);return 'Remove matching tile pair '+(pair[0]+1)+' and '+(pair[1]+1)+'. Both are uncovered with an open horizontal edge. Follow the verified removal path to avoid stranding a mate (face '+(face+1)+').';
 };
 D.adapters.stack=async()=>{
  if(g.finished)return null;
  if(!g.cur){if(g.left){draw();return 'Draw '+D.name(g.cur)+'. A strictly higher value beats a dealer card; ties lose.'}if(g.held){reserveCard();return 'Recall the last sidelined '+D.name(g.cur)+'. Storing a card never creates an extra draw.'}return null}
  if(g.sideMode&&!g.held&&g.left&&g.cur.r>=9){const name=D.name(g.cur);reserveCard();return 'Sideline '+name+' for later. The single reserve slot is now occupied, and the next draw is available.'}
  let options=g.stacks.map((p,i)=>({i,c:p[p.length-1]})).filter(o=>o.c),best=options.filter(o=>g.cur.r>o.c.r).sort((a,b)=>b.c.r-a.c.r)[0]||options.sort((a,b)=>a.c.r-b.c.r)[0];
  if(!best)return null;const mine=D.name(g.cur),dealer=D.name(best.c),before=g.pl;await play(best.i);return 'Play '+mine+' against dealer '+dealer+' on stack '+(best.i+1)+'. '+(g.pl>before?'The higher card wins both values and may extend the combo.':'A tied or lower value gives the dealer both values.');
 };
 D.adapters.hilo=()=>{if(!hl.active)return null;const before=hl.n,name=D.name(hl.c),higher=hl.c.r<6;hg(higher?1:-1);return 'From '+name+', guess '+(higher?'Higher':'Lower')+' because more ranks lie that way. '+(!hl.active?'The guess lost; the streak ends.':hl.n===before?'Equal rank: a push preserves the streak.':'Correct: the streak and possible cash-out reward increase.')};
 function review(index){playing=false;pendingStep=false;clearTimeout(timer);const frame=D.timeline.show(index);if(frame){step=index;tell('step',{text:frame.text,round:frame.round})}}
 async function advance(){
  if(!busy&&step<D.timeline.length-1){review(step+1);return}
  if(busy||closed||step>=50)return;busy=true;clearTimeout(timer);
  try{
   D.timeline.live();if(!D.timeline.length)D.timeline.record('Opening configuration. Choose Next step to begin.',D.round);
   let text=await D.adapters[engine](id),prefix='';
   for(let attempts=0;text===null&&attempts<12;attempts++){D.round++;init();prefix='Start demonstration deal '+D.round+' after the previous line of play ended. ';text=await D.adapters[engine](id)}
   if(typeof text==='string'){pendingStep=false;step++;D.timeline.record(prefix+text,D.round);tell('step',{text:prefix+text,round:D.round});if(step===50){playing=false;window.MagicArcade.stop();window.MagicArcade.stopExtra();tell('complete',{text:'All 50 explained actions are complete. Restart the demo or play this game yourself.'})}}
   else if(text===null){playing=false;tell('error',{text:'The demonstration could not find a continuation. Restart to try a fresh deal.'})}
  }catch(error){playing=false;console.error('Demo failed: '+key,error);tell('error',{text:'This demo stopped unexpectedly. Restart it to begin a new deal.'})}
  finally{busy=false;if(pendingPrevious){pendingPrevious=false;review(Math.max(0,step-1));}if((playing||pendingStep)&&!closed&&step<50)timer=setTimeout(advance,pendingStep?250:preview?1500:23000)}
 }
 addEventListener('message',event=>{if(event.source!==parent||event.data?.type!=='arcade-demo-control')return;
  const action=event.data.action;
  if(action==='play'){if(step<D.timeline.length-1){step=D.timeline.length-1;D.timeline.live();const frame=D.timeline.show(step);D.timeline.live();tell('step',{text:frame.text,round:frame.round})}playing=step<50;clearTimeout(timer);if(playing)advance()}
  if(action==='previous'){playing=false;pendingStep=false;clearTimeout(timer);if(busy)pendingPrevious=true;else if(step>0)review(step-1)}
  if(action==='pause'){playing=false;pendingStep=false;clearTimeout(timer);tell('paused')}
  if(action==='next'){playing=false;pendingStep=true;clearTimeout(timer);advance()}
  if(action==='restart'&&!busy){pendingStep=false;pendingPrevious=false;D.timeline.clear();step=0;D.round=1;playing=true;init();tell('ready');advance()}
 });
 addEventListener('pagehide',()=>{closed=true;clearTimeout(timer);api.leave();window.MagicArcade.stop();window.MagicArcade.stopExtra()});
 try{if(!engine)throw Error('Unknown demo '+key);init();tell('ready');timer=setTimeout(advance,preview?300:9000)}catch(error){console.error(error);tell('error',{text:'This demo is unavailable.'})}
})();
