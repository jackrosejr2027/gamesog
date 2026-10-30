(() => {
  const api=window.CardArcade,U=window.Tabletop,{button,face,row,frame,piles,value:v,top,red}=U;
  let s;
  const defs={
    yukon:['Yukon','Move face-up groups, even out of sequence.',{yukon:1,group:'any',build:'alternate',empty:'king'}],
    russian:['Russian Solitaire','Yukon with same-suit building.',{yukon:1,group:'any',build:'suit',empty:'king'}],
    bakersgame:["Baker's Game",'Four cells; build down in suit.',{cols:8,cells:4,group:'run',build:'suit',empty:'any'}],
    eightoff:['Eight Off','Eight cells, four already occupied.',{cols:8,size:6,cells:8,occupied:4,group:'run',build:'suit',empty:'king'}],
    seahaven:['Seahaven Towers','Ten towers and four free cells.',{cols:10,size:5,cells:4,occupied:2,group:'run',build:'suit',empty:'king'}],
    fortythieves:['Forty Thieves','Two decks, ten columns, one card at a time.',{decks:2,cols:10,size:4,stock:1,group:'single',build:'suit',empty:'any'}],
    josephine:['Josephine','Forty Thieves with movable suited runs.',{decks:2,cols:10,size:4,stock:1,group:'run',build:'suit',empty:'any'}],
    canfield:['Canfield','Thirteen-card reserve and rotating foundations.',{cols:4,size:1,reserve:13,stock:1,draw:3,recycles:Infinity,base:'random',group:'run',build:'alternate',empty:'reserve',wrap:1}],
    duchess:['Duchess','Choose the foundation base from four reserves.',{cols:4,size:1,reserveFans:1,stock:1,recycles:1,base:'choose',group:'run',build:'alternate',empty:'any',wrap:1}],
    scorpion:['Scorpion','Move exposed groups; complete four suited runs.',{scorpion:1,group:'any',build:'suit',empty:'king',runs:1}],
    wasp:['Wasp','Scorpion with freely fillable empty columns.',{scorpion:1,group:'any',build:'suit',empty:'any',runs:1}],
    simplesimon:['Simple Simon','Ten columns, suited moves, mixed-suit building.',{simon:1,group:'suitrun',build:'rank',empty:'any',runs:1}],
    acesup:['Aces Up','Discard lower cards of matching suits.',{special:'aces'}],
    bakersdozen:["Baker's Dozen",'Thirteen columns; no filling empty spaces.',{cols:13,size:4,kings:1,group:'single',build:'rank',empty:'none'}],
    bisley:['Bisley','Build up from Aces and down from Kings.',{cols:12,size:4,aces:1,bisley:1,group:'single',build:'either',empty:'none'}],
    littlespider:['Little Spider','Open-deal variant: red Aces and black Kings.',{cols:8,size:6,little:1,group:'single',build:'either',empty:'any'}],
    flowergarden:['Flower Garden','Six beds and a sixteen-card bouquet.',{cols:6,size:6,bouquet:16,group:'single',build:'rank',empty:'any'}],
    bristol:['Bristol','Eight columns and three waste piles.',{cols:8,size:3,stock:1,wastes:3,kings:1,group:'single',build:'rank',empty:'none'}],
    gaps:['Gaps (Montana)','Arrange four suit rows from Two to King.',{special:'gaps'}],
    nestor:['Nestor','Match exposed ranks; clear all fifty-two.',{special:'nestor'}]
  };
  function start(key){
    const cfg=defs[key][2],d=shuf(Array.from({length:cfg.decks||1},()=>deck52()).flat());
    s={key,cfg,p:[],f:Array.from({length:cfg.bisley?8:(cfg.decks||1)*4},()=>[]),cells:Array(cfg.cells||0).fill(null),reserve:[],bouquet:[],stock:[],waste:Array.from({length:cfg.wastes||1},()=>[]),sel:null,base:cfg.base==='choose'?null:1,passes:0,done:false,result:'',sets:0};
    if(cfg.special==='aces'){s.p=[[],[],[],[]];s.stock=d;dealAces()}
    else if(cfg.special==='gaps'){s.grid=d.map(c=>v(c)===1?null:c);s.redeals=3}
    else if(cfg.special==='nestor'){
      s.bouquet=d.splice(0,4);const order=shuf(Array.from({length:13},(_,i)=>i));d.sort((a,b)=>order.indexOf(a.r)-order.indexOf(b.r));s.p=Array.from({length:6},()=>[]);d.forEach((c,i)=>s.p[i%6].push({c,up:true}));s.p.forEach(shuf);
    }else if(cfg.yukon){for(let col=0;col<7;col++)s.p.push(d.splice(0,col===0?1:col+5).map((c,i)=>({c,up:col===0||i>=col})))}
    else if(cfg.scorpion){for(let col=0;col<7;col++)s.p.push(d.splice(0,7).map((c,i)=>({c,up:col>=4||i>=3})));s.stock=d}
    else if(cfg.simon){s.p=[8,8,8,7,6,5,4,3,2,1].map(n=>d.splice(0,n).map(c=>({c,up:true})))}
    else{
      if(cfg.aces)for(let suit=0;suit<4;suit++)s.f[suit].push(d.splice(d.findIndex(c=>c.s===suit&&v(c)===1),1)[0]);
      if(cfg.little)for(let suit=0;suit<4;suit++)s.f[suit].push(d.splice(d.findIndex(c=>c.s===suit&&v(c)===(red(c)?1:13)),1)[0]);
      if(cfg.base==='random'){const c=d.pop();s.base=v(c);s.f[c.s].push(c)}
      if(cfg.reserve)s.reserve=[d.splice(0,cfg.reserve)];
      if(cfg.reserveFans)s.reserve=Array.from({length:4},()=>d.splice(0,3));
      if(cfg.bouquet)s.bouquet=d.splice(0,cfg.bouquet);
      if(cfg.occupied)for(let i=0;i<cfg.occupied;i++)s.cells[i]=d.pop();
      if(cfg.size)s.p=Array.from({length:cfg.cols},()=>d.splice(0,cfg.size).map(c=>({c,up:true})));
      else {s.p=Array.from({length:cfg.cols},()=>[]);d.splice(0).forEach((c,i)=>s.p[i%cfg.cols].push({c,up:true}))}
      if(cfg.kings)for(const p of s.p)p.sort((a,b)=>(v(b.c)===13)-(v(a.c)===13));
      if(cfg.stock)s.stock=d;
    }
    render();
  }
  function finish(message,win){if(s.done)return;s.done=true;s.result=message;if(win){sv.coins+=40;persist();header();jingle([523,659,784,1047]);toast('Solved! +40 coins')}}
  const countFound=()=>s.f.reduce((a,b)=>a+b.length,0);
  function relation(a,b,kind){
    const av=v(a),bv=v(b),down=s.cfg.wrap?(bv%13)+1===av:av===bv+1;
    if(kind==='either')return Math.abs(av-bv)===1&&a.s===b.s;
    return down&&(kind==='suit'?a.s===b.s:kind==='alternate'?red(a)!==red(b):true);
  }
  function source(q){if(q.type==='p')return s.p[q.col].slice(q.index).map(o=>o.c);if(q.type==='cell')return s.cells[q.col]?[s.cells[q.col]]:[];if(q.type==='bouquet')return s.bouquet[q.col]?[s.bouquet[q.col]]:[];return top(s[q.type][q.col])?[top(s[q.type][q.col])]:[]}
  function take(q){if(q.type==='p')return s.p[q.col].splice(q.index).map(o=>o.c);if(q.type==='cell'){const c=s.cells[q.col];s.cells[q.col]=null;return[c]}if(q.type==='bouquet')return s.bouquet.splice(q.col,1);return[s[q.type][q.col].pop()]}
  function selectable(col,index){
    const p=s.p[col],cfg=s.cfg;if(index<0||!p[index]||p.slice(index).some(o=>!o.up))return false;
    if(cfg.group==='single')return index===p.length-1;
    if(cfg.group==='any')return true;
    const kind=cfg.group==='suitrun'?'suit':cfg.build;
    return p.slice(index).every((o,j,a)=>!j||relation(a[j-1].c,o.c,kind));
  }
  function foundationFits(c,i){
    const f=s.f[i],suit=i%4;if(c.s!==suit||f.length===13)return false;
    if(s.cfg.bisley)return i<4?v(c)===f.length+1:v(c)===13-f.length;
    if(s.cfg.little)return v(c)===(red(c)?f.length+1:13-f.length);
    if(s.base===null)return !f.length;
    return v(c)===((s.base-1+f.length)%13)+1;
  }
  function foundation(i){if(s.done||!s.sel)return;const cs=source(s.sel);if(cs.length!==1||!foundationFits(cs[0],i))return toast('That card does not fit this foundation');if(s.base===null){if(s.sel.type!=='reserve')return toast('Choose your base from an exposed reserve card');s.base=v(cs[0])}s.f[i].push(...take(s.sel));s.sel=null;resolve();render()}
  function resolve(){
    for(const p of s.p)if(p.length)top(p).up=true;
    if(s.cfg.empty==='reserve')for(const p of s.p)if(!p.length&&s.reserve[0]?.length)p.push({c:s.reserve[0].pop(),up:true});
    if(s.cfg.runs)for(const p of s.p)if(p.length>=13){const last=p.slice(-13);if(v(last[0].c)===13&&last.every((o,i)=>o.up&&(!i||last[i-1].c.s===o.c.s&&v(last[i-1].c)===v(o.c)+1))){p.splice(-13);s.sets++;if(p.length)top(p).up=true}}
    if(s.cfg.runs?s.sets===4:countFound()===(s.cfg.decks||1)*52)finish('All cards cleared!',true);
  }
  function choose(type,col,index=0){
    if(s.done)return;const q={type,col,index};
    if(s.cfg.special==='nestor')return nestor(q);
    if(s.sel&&s.sel.type===type&&s.sel.col===col&&s.sel.index===index){const cs=source(s.sel),f=cs.length===1?s.f.findIndex((_,i)=>foundationFits(cs[0],i)):-1;if(f>=0&&!s.cfg.runs)return foundation(f);s.sel=null;return render()}
    if(type==='p'&&s.sel){
      const cs=source(s.sel),p=s.p[col],cfg=s.cfg,from=s.sel;
      const empty=!p.length,king=cs.length&&v(cs[0])===13;
      const fits=cs.length&&(empty?(cfg.empty==='any'||cfg.empty==='king'&&king||cfg.empty==='reserve'&&!s.reserve[0].length):relation(top(p).c,cs[0],cfg.build));
      const free=s.cells.filter(c=>!c).length,empties=cfg.empty==='any'?s.p.filter((a,i)=>!a.length&&i!==col).length:0;
      const capacity=!cfg.cells||cs.length<=(free+1)*2**empties;
      if((from.type!=='p'||from.col!==col)&&fits&&capacity){p.push(...take(from).map(c=>({c,up:true})));s.sel=null;resolve();return render()}
      if(fits&&!capacity)toast('Not enough free cells or empty columns for that run');
    }
    if(type==='cell'&&!s.cells[col]&&s.sel){const cs=source(s.sel);if(cs.length===1){s.cells[col]=take(s.sel)[0];s.sel=null;resolve();return render()}}
    if(type==='p')s.sel=selectable(col,index)?q:null;else s.sel=source(q).length?q:null;render();
  }
  function draw(){
    if(s.done)return;s.sel=null;
    if(!s.stock.length){if(s.passes>=(s.cfg.recycles||0))return;s.stock=s.waste[0].reverse();s.waste[0]=[];s.passes++}
    if(s.cfg.scorpion){for(let i=0;i<3&&s.stock.length;i++)s.p[i].push({c:s.stock.pop(),up:true});resolve()}
    else if(s.cfg.wastes){for(let i=0;i<3&&s.stock.length;i++)s.waste[i].push(s.stock.pop())}
    else for(let i=0;i<(s.cfg.draw||DrawCount.count)&&s.stock.length;i++)s.waste[0].push(s.stock.pop());
    render();
  }
  function render(){
    if(s.cfg.special==='gaps')return renderGaps();if(s.cfg.special==='aces')return renderAces();
    const {area,actions}=frame(s.result||(s.cfg.special==='nestor'?(s.p.reduce((n,p)=>n+p.length,0)+s.bouquet.length)+' cards left':s.cfg.runs?'Runs '+s.sets+'/4':countFound()+'/'+(s.cfg.decks||1)*52+' on foundations')+(s.cfg.stock&&!s.cfg.wastes&&!s.cfg.scorpion?' | Draw '+(s.cfg.draw||DrawCount.count):''),()=>start(s.key));
    if(!s.cfg.runs&&s.cfg.special!=='nestor'){
      const frow=row(area);frow.classList.add('more-foundations');
      s.f.forEach((f,i)=>{const cell=h('div','sol-cell');if(f.length)cell.appendChild(face(top(f),()=>foundation(i)));else button(cell,(s.cfg.bisley&&i>=4?'K':s.base===null?'Base':R[(s.base+11)%13])+' '+S[i%4],()=>foundation(i)).classList.add('sol-found-empty');cell.appendChild(h('small','',f.length+'/13'+(s.cfg.bisley?(i<4?' up':' down'):'')));frow.appendChild(cell)});
    }
    if(s.cells.length){const cells=row(area);s.cells.forEach((c,i)=>{if(c)cells.appendChild(face(c,()=>choose('cell',i),s.sel&&s.sel.type==='cell'&&s.sel.col===i));else button(cells,'Cell',()=>choose('cell',i)).classList.add('sol-found-empty')})}
    if(s.reserve.length){const r=row(area);s.reserve.forEach((a,i)=>{const cell=h('div','sol-cell');if(a.length)cell.appendChild(face(top(a),()=>choose('reserve',i),s.sel&&s.sel.type==='reserve'&&s.sel.col===i));cell.appendChild(h('small','','Reserve '+a.length));r.appendChild(cell)})}
    if(s.stock.length||s.waste.some(a=>a.length)){
      const w=row(area);s.waste.forEach((a,i)=>{if(a.length)w.appendChild(face(top(a),()=>choose('waste',i),s.sel&&s.sel.type==='waste'&&s.sel.col===i))});
      button(actions,s.stock.length?'Draw ('+s.stock.length+')':'Recycle',draw,s.done||!s.stock.length&&(s.passes>=(s.cfg.recycles||0)||!s.waste[0].length));
      if(!s.cfg.draw&&!s.cfg.wastes&&!s.cfg.scorpion&&!s.done)actions.appendChild(DrawCount.button(render));
    }
    piles(area,s.p,(c,i)=>choose('p',c,i),s.sel&&s.sel.type==='p'?s.sel:null);
    if(s.bouquet.length){area.appendChild(h('p','',s.cfg.special==='nestor'?'Reserve: match these with any exposed equal rank.':'Bouquet: any of these cards may be played.'));const b=row(area);s.bouquet.forEach((c,i)=>b.appendChild(face(c,()=>choose('bouquet',i),s.sel&&s.sel.type==='bouquet'&&s.sel.col===i)))}
  }
  function dealAces(){for(const p of s.p)if(s.stock.length)p.push(s.stock.pop())}
  function aceLegal(col){const c=top(s.p[col]),rank=x=>v(x)===1?14:v(x);return c&&s.p.some((p,i)=>i!==col&&p.length&&top(p).s===c.s&&rank(top(p))>rank(c))}
  function acesMove(col){
    if(s.done)return;const p=s.p[col];
    if(!p.length){if(s.sel===null||!s.p[s.sel]?.length){s.sel=null;return render()}p.push(s.p[s.sel].pop());s.sel=null}
    else if(aceLegal(col)){p.pop();s.sel=null}
    else s.sel=s.sel===col?null:col;
    acesCheck();render();
  }
  function acesCheck(){
    if(!s.stock.length&&s.p.every(p=>p.length===1&&v(p[0])===1))finish('Four Aces remain. Victory!',true);
    else if(!s.stock.length&&!s.p.some((_,i)=>aceLegal(i))&&s.p.every(p=>p.length))finish('No more discards. Try another deal.',false);
  }
  function renderAces(){
    const {area,actions}=frame(s.result||'Stock '+s.stock.length+' | Discard lower exposed cards of the same suit. Aces are high.',()=>start(s.key));
    const r=row(area);s.p.forEach((p,i)=>{const cell=h('div','sol-cell');if(p.length)cell.appendChild(face(top(p),()=>acesMove(i),s.sel===i));else button(cell,'Empty',()=>acesMove(i)).classList.add('sol-found-empty');cell.appendChild(h('small','',p.length+' cards'));r.appendChild(cell)});
    button(actions,'Deal four',()=>{if(s.done)return;dealAces();s.sel=null;acesCheck();render()},s.done||!s.stock.length);
  }
  function nestor(q){
    if(q.type==='p'&&q.index!==s.p[q.col].length-1)return;
    if(!source(q).length)return;
    if(s.sel){const a=source(s.sel)[0],b=source(q)[0];if((s.sel.type!==q.type||s.sel.col!==q.col)&&a.r===b.r){
      const from=s.sel;
      if(from.type==='bouquet'&&q.type==='bouquet'){const hi=Math.max(from.col,q.col),lo=Math.min(from.col,q.col);s.bouquet.splice(hi,1);s.bouquet.splice(lo,1)}else {take(q);take(from)}
      s.sel=null;
      if(!s.p.some(p=>p.length)&&!s.bouquet.length)finish('All pairs removed!',true);
      else {const a=[...s.p.filter(p=>p.length).map(p=>top(p).c),...s.bouquet];if(!a.some((c,i)=>a.some((d,j)=>j!==i&&c.r===d.r)))finish('No exposed pairs left.',false)}
      return render();
    }}s.sel=q;render();
  }
  function gapLegal(from,to){const c=s.grid[from];if(!c||s.grid[to])return false;if(to%13===0)return v(c)===2;const left=s.grid[to-1];return left&&left.s===c.s&&v(left)!==13&&v(c)===v(left)+1}
  function gapsWon(){return [0,1,2,3].every(r=>{const start=r*13,c=s.grid[start];return c&&v(c)===2&&Array.from({length:12},(_,i)=>s.grid[start+i]).every((d,i)=>d&&d.s===c.s&&v(d)===i+2)})}
  function gapRedeal(){
    const held=new Set();for(let r=0;r<4;r++){const st=r*13,c=s.grid[st];if(c&&v(c)===2){held.add(st);for(let i=1;i<12;i++){const x=s.grid[st+i];if(x&&x.s===c.s&&v(x)===i+2)held.add(st+i);else break}}}
    const pool=shuf(s.grid.filter((c,i)=>c&&!held.has(i)));for(let r=0;r<4;r++){let n=0;while(held.has(r*13+n))n++;for(let j=n;j<13;j++)s.grid[r*13+j]=j===n?null:pool.pop()}
    s.redeals--;s.sel=null;render();
  }
  function renderGaps(){
    const {area,actions}=frame(s.result||'Arrange 2 through K by suit | Redeals '+s.redeals,()=>start(s.key));
    const board=h('div','gaps-board');area.appendChild(board);
    s.grid.forEach((c,i)=>{if(c)board.appendChild(face(c,()=>{if(!s.done){s.sel=s.sel===i?null:i;render()}},s.sel===i));else {const b=button(board,'Gap',()=>{if(s.done||s.sel===null)return;if(gapLegal(s.sel,i)){s.grid[i]=s.grid[s.sel];s.grid[s.sel]=null;s.sel=null;if(gapsWon())finish('Four perfect suit rows!',true);render()}else toast('Fill a gap after the previous card of the same suit; Twos start rows')});b.classList.add('sol-found-empty')}});
    button(actions,'Redeal unsequenced cards',()=>{if(!s.done)gapRedeal()},s.done||!s.redeals);
  }
  if(window.DemoSession)window.DemoSession.more={start,render,get s(){return s},source,selectable,relation,foundationFits,foundation,choose,draw,aceLegal,acesMove,gapLegal,gapRedeal,defs};
  for(const [key,[title,description,cfg]] of Object.entries(defs)){
    let rules='Aces are low. Select a card, then its destination; click a selected single card again to send it to a foundation. Foundations build up by suit. ';
    if(cfg.yukon)rules+='Seven columns, with the last six having five exposed cards. Any face-up card and everything below it can move, even if the group is not ordered. ';
    if(cfg.cells)rules+=cfg.cells+' cells each hold one card. A suited run can move only with enough free cells and usable empty columns. ';
    if(cfg.decks)rules+='Two full decks; eight foundations. The shared Draw 1 / Draw 3 choice controls the stock: Draw 1 is the classical variant; Draw 3 is an optional stock variant. Only the waste top is playable. No redeals. ';
    if(cfg.group==='single')rules+='Only one exposed card moves at a time. ';
    if(cfg.group==='run'||cfg.group==='suitrun')rules+='Movable groups must descend '+(cfg.group==='suitrun'||cfg.build==='suit'?'in the same suit':'in alternating colours')+'. ';
    if(cfg.build)rules+='Columns build '+({suit:'down in the same suit',alternate:'down in alternating colours',rank:'down by rank regardless of suit',either:'up or down one rank in the same suit'}[cfg.build])+'. ';
    if(cfg.empty)rules+='Empty columns '+({king:'accept only Kings',any:'accept any card',none:'cannot be filled',reserve:'are automatically filled from the reserve; once it is empty, any card may fill one'}[cfg.empty])+'. ';
    if(cfg.base==='random')rules+='The first foundation card sets the base rank for all four foundations, which wrap from King to Ace. Draw three; unlimited stock passes. ';
    if(cfg.base==='choose')rules+='Choose an exposed reserve card as the first foundation card: its rank sets all four bases. Foundations and tableau wrap at King/Ace. Four three-card reserves; shared Draw 1 / Draw 3 stock choice, only the waste top playable, and one redeal. ';
    if(cfg.scorpion)rules+='The first three cards of the first four columns start down. Move any exposed card with all cards below it, even if unordered. Deal the three stock cards onto the first three columns. ';
    if(cfg.runs)rules+='Complete same-suit King-to-Ace runs are removed automatically. Clear four runs to win; there are no foundation piles. ';
    if(cfg.simon)rules+='All 52 cards are face up; there is no stock. Columns can mix suits, but moved runs cannot. ';
    if(cfg.kings)rules+='Kings start at the bottom of each column. ';
    if(cfg.bisley)rules+='Four Aces start on ascending foundations. Four additional foundations start with Kings and build down by suit. The two sequences for each suit meet; clear every tableau card. ';
    if(cfg.little)rules='Open-deal Little Spider variant: red Aces and black Kings start on their suit foundations. Red suits build up; black suits build down. All 48 remaining cards are face up in eight columns. Move exposed cards one at a time; tableau builds one rank up or down in the same suit. Any card may fill an empty column. ';
    if(cfg.bouquet)rules+='All sixteen bouquet cards are available individually; move any one to a foundation or column. ';
    if(cfg.wastes)rules+='Deal one card to each of three waste piles. Only each waste top is available. No recycle. ';
    if(cfg.special==='aces')rules='Deal four cards, one onto each pile. Click a top card to discard it if another exposed card of the same suit is higher (Ace high). If it cannot be discarded, click to select it and click an empty pile to move it there. Deal four whenever desired. Win with only the four Aces left after stock is empty.';
    if(cfg.special==='gaps')rules='Four rows of thirteen are dealt and Aces removed to make gaps. Select a card, then a gap. A Two may fill the first position of any row. Other gaps accept the next higher card of the suit immediately to their left. Nothing follows a King or a gap. Three redeals keep each correctly ordered sequence starting with a Two and shuffle the rest. Win with four suit rows Two through King, then a gap.';
    if(cfg.special==='nestor')rules='Six columns of eight and four reserve cards. Each column starts without repeated ranks. Only the top card of a column is available; all reserve cards are available. Select any two available cards of equal rank to remove them. Clear all 26 pairs to win.';
    api.games[key]={t:title,d:description,k:key,category:'solitaire',s:()=>start(key)};api.help[key]=title.toUpperCase()+'\n'+rules;
  }
  api.remember(Object.keys(defs),()=>s,saved=>{s=saved;render()});
})();
