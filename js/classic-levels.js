// Every numbered profile changes a playable setup or challenge, not just its label.
(() => {
 const E=window.ClassicRules,create=E.create;
 E.create=function(type,level=1,seed=Date.now(),option){
  level=Math.max(1,Math.min(100,Math.trunc(Number(level))||1));
  const s=create(type,level*10,(seed^Math.imul(level,2654435761))>>>0||1,option),r=n=>E.rand(s,n),t=(level-1)/99;
  s.level=level;s.configurationVersion=2;s.pace=Math.round(650-t*410);s.profile='';
  if(type==='triangle'||type==='pegged'){
   s.board.fill(0);s.board[r(s.board.length)]=1;s.route=[];
   const depth=type==='triangle'?3+Math.floor(t*11):6+Math.floor(t*24);
   for(let k=0;k<depth;k++){const choices=E.pegMoves(s,true);if(!choices.length)break;const m=choices[r(choices.length)];s.board[m.from]=0;s.board[m.over]=s.board[m.to]=1;s.route.unshift({type:'jump',from:m.to,over:m.over,to:m.from})}
   if(!s.route.length)return E.create(type,level,(seed+104729)>>>0,option);
   s.profile=s.route.length+' jumps to the verified finish';
  }
  if(type==='hanoi'){
   s.n=option?Math.max(3,Math.min(8,Number(option))):3+Math.floor(t*5);s.pegs=[[],[],[]];
   for(let disk=s.n;disk;disk--)s.pegs[r(3)].push(disk);
   if(s.pegs[2].length===s.n){s.pegs[0].push(s.pegs[2].pop())}
   s.profile=s.n+' disks, mixed starting pegs';
  }
  if(type==='snake'){
   s.target=Array.from({length:23},()=>r(4));s.angles=s.target.slice();
   for(let k=0;k<3+Math.floor(t*20);k++)s.angles[k]=(s.angles[k]+1+r(3))%4;
   s.profile='Match the target angles at '+(3+Math.floor(t*20))+' scrambled joints';
  }
  if(type==='tangram'){
   s.shape=r(2)?'Diamond':'Square';s.rotation=r(4)*90;s.snap=Math.round(18-t*12);
   s.pieces.forEach(p=>{p.x=10+r(280);p.y=320+r(100);p.a=r(8)*45;p.flip=!!r(2)});
   s.profile='Rotated silhouette; snap tolerance '+s.snap+' units';
  }
  if(type==='pyramid'){
   const sockets=Array.from({length:20},(_,i)=>i);for(let i=19;i;i--){const j=r(i+1);[sockets[i],sockets[j]]=[sockets[j],sockets[i]]}
   s.parts=Array.from({length:4},(_,i)=>sockets.slice(i*5,i*5+5));s.piece=r(4);
   s.profile='Four new five-socket footprints';
  }
  if(type==='rings'){
   s.n=3+Math.floor(t*6);const mask=1+r(2**s.n-1);s.rings=Array.from({length:s.n},(_,i)=>mask>>i&1);
   s.profile=s.n+' rings, release the attached pattern';
  }
  if(type==='mastermind'){
   s.n=option?Math.max(3,Math.min(6,Number(option))):3+Math.floor(t*3);s.code=Array.from({length:s.n},()=>r(6));s.guess=Array(s.n).fill(0);s.maxGuesses=12-Math.floor(t*4);
   s.profile=s.n+' code pegs; '+s.maxGuesses+' guesses';
  }
  if(type==='battleship'){s.hunt=Math.round(t*100);s.profile='Computer targeting strength '+s.hunt+'%'}
  if(type==='litebrite'){
   s.target=Array(400).fill(-1);s.goal=8+Math.floor(t*52);
   const positions=Array.from({length:400},(_,i)=>i);for(let i=399;i;i--){const j=r(i+1);[positions[i],positions[j]]=[positions[j],positions[i]]}
   for(const i of positions.slice(0,s.goal))s.target[i]=r(6);
   s.profile='Recreate '+s.goal+' marked light pegs';
  }
  if(type==='etch'){
   s.target=[[40+r(60)*4,40+r(40)*4]];for(let i=0;i<3+Math.floor(t*12);i++){const p=s.target.at(-1).slice(),axis=i%2;do{p[axis]=40+r(axis?55:80)*4}while(p[axis]===s.target.at(-1)[axis]);s.target.push(p)}
   s.pen=s.target[0].slice();s.reached=1;s.profile='Trace '+(s.target.length-1)+' guide segments in order';
  }
  if(type==='simon'||type==='merlin'){
   const count=type==='simon'?4:9;s.sequence=Array.from({length:1+Math.floor(t*4)},()=>r(count));s.goal=5+Math.floor(t*15);s.profile='Complete '+s.goal+' rounds; light interval '+s.pace+' ms';
  }
  if(type==='football'){
   s.defenders=Array.from({length:3+Math.floor(t*3)},(_,i)=>[4+r(6),i%3]);s.goal=7*(1+Math.floor(t*4));s.profile='Score '+s.goal+' points in two minutes';
  }
  if(type==='microvision'||type==='gamewatch'){
   s.player=1+r(4);s.ball=[1+r(6),4+r(3)];s.velocity=[r(2)?1:-1,1];s.goal=type==='microvision'?100+level*10:10+Math.floor(t*40);
   if(type==='microvision')s.bricks=s.bricks.map(()=>r(5)?1:0);
   s.profile='Target score '+s.goal+'; tick '+s.pace+' ms';
  }
  if(type==='tetris'){
   s.goal=1+Math.floor(t*19);
   for(let row=20-Math.floor(t*5);row<20;row++){const hole=r(10);for(let x=0;x<10;x++)s.board[row*10+x]=x===hole?0:1+r(7)}
   s.profile='Clear '+s.goal+' lines; fall interval '+s.pace+' ms';
  }
  if(type==='klotski'){
   let previous=null;for(let k=0;k<20+level*3;k++){const choices=E.blockMoves(s).filter(m=>!previous||m.i!==previous.i||m.dx!==-previous.dx||m.dy!==-previous.dy),m=choices[r(choices.length)];if(!m)break;s.blocks[m.i].x+=m.dx;s.blocks[m.i].y+=m.dy;previous=m}
   if(s.blocks[0].x===1&&s.blocks[0].y===3){const m=E.blockMoves(s).find(m=>m.i===0);if(m){s.blocks[0].x+=m.dx;s.blocks[0].y+=m.dy}}
   s.profile='Reachable shuffled opening; '+(20+level*3)+' shuffle steps';
  }
  if(type==='billiards'){
   const spots=[];for(let y=60;y<=260;y+=50)for(let x=60;x<=420;x+=60)spots.push({x,y});
   for(let i=spots.length-1;i;i--){const j=r(i+1);[spots[i],spots[j]]=[spots[j],spots[i]]}
   s.balls=spots.splice(0,4).map(p=>({...p,vx:0,vy:0}));s.obstacles=spots.slice(0,Math.floor(t*5));s.profile=s.obstacles.length+' bumpers; fresh ball positions';
  }
  if(!s.profile)s.profile=type==='cube'?s.route.length+' scramble turns':type==='lightsout'?s.solution.length+' tracked solution presses':s.route.length+' legal shuffle moves';
  s.initialConfiguration=JSON.stringify(s,(k,v)=>['seed','route'].includes(k)?undefined:v);
  return s;
 };
})();
