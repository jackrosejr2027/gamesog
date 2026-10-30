// Solitaire engines share only cards, layout helpers and the arcade registry.
(() => {
  const api=window.CardArcade, host=$('#g2b');
  let state,epoch=0;
  api.stopSolitaire=()=>{epoch++;state=null};
  const value=c=>c.r===12?1:c.r+2;
  const ordered=c=>value(c);
  const top=a=>a[a.length-1];
  const fresh=()=>shuf(deck52());
  const total=a=>a.reduce((n,p)=>n+p.length,0);
  function button(label,fn,parent,disabled=false){const b=h('button','alt',label);b.disabled=disabled;b.onclick=fn;parent.appendChild(b);return b}
  function playingCard(c,up,fn,selected=false){
    const b=h('button','sol-card'+(selected?' chosen':''));
    b.type='button';b.setAttribute('aria-label',up?R[c.r]+' '+['spades','hearts','diamonds','clubs'][c.s]:'Face-down card');
    b.setAttribute('aria-pressed',String(selected));b.appendChild(card(c,up));b.onclick=()=>{if(!state.done&&fn)fn()};return b;
  }
  function frame(status){
    host.innerHTML='';host.classList.add('solitaire-host');
    host.appendChild(h('div','sol-status',state.result||status));
    const area=h('div','sol-area');host.appendChild(area);
    const actions=h('div','row sol-actions');host.appendChild(actions);
    button('New game',()=>start(state.kind),actions);
    return {area,actions};
  }
  function end(message,win){
    if(state.done)return;
    state.done=true;state.result=message;
    if(win){sv.coins+=30;persist();header();jingle([523,659,784,1047]);toast('Solved! +30 coins')}
  }
  function columns(parent,piles,click,selected,hidden=false){
    const row=h('div','sol-columns');parent.appendChild(row);
    piles.forEach((pile,col)=>{
      const wrap=h('div','sol-column');wrap.style.height='calc(var(--ch) + '+Math.max(0,pile.length-1)*36+'px)';
      if(!pile.length){const e=button('Empty',()=>{if(!state.done)click(col,-1)},wrap);e.classList.add('sol-empty')}
      pile.forEach((item,i)=>{const c=hidden?item.c:item,up=hidden?item.up:true;
        const b=playingCard(c,up,()=>click(col,i),selected&&selected.col===col&&i>=selected.index);b.style.top=i*36+'px';wrap.appendChild(b)});
      row.appendChild(wrap);
    });
  }
  function grid(parent,cards,click,selected,cols=5){
    const board=h('div','sol-grid');board.style.gridTemplateColumns='repeat('+cols+',var(--cw))';parent.appendChild(board);
    cards.forEach((c,i)=>{if(c)board.appendChild(playingCard(c,true,()=>click(i),selected===i));else board.appendChild(h('div','sol-gap'))});
    return board;
  }
  function remainingMessage(n){return n+' cards remaining'}
  function start(kind){
    epoch++;
    const d=fresh();state={kind,done:false,result:'',sel:null,stock:[],moves:0};
    const s=state;
    if(kind==='spider'){
      const cards=shuf(Array.from({length:8},()=>Array.from({length:13},(_,r)=>({r,s:0}))).flat());
      s.piles=Array.from({length:10},(_,i)=>cards.splice(0,i<4?6:5).map((c,j,a)=>({c,up:j===a.length-1})));s.stock=cards;s.sets=0;
    }else if(kind==='pyramid'){
      s.table=d.splice(0,28);s.stock=d;s.waste=[];s.passes=0;
    }else if(kind==='golf'){
      s.piles=Array.from({length:7},()=>d.splice(0,5));s.waste=[d.pop()];s.stock=d;
    }else if(kind==='tripeaks'){
      s.table=[];
      for(let row=0;row<4;row++)for(const center of [3,9,15])for(let j=0;j<=row;j++){
        const x=center-row+j*2;if(!s.table.some(c=>c.row===row&&c.x===x))s.table.push({c:d.pop(),row,x,removed:false});
      }
      s.stock=d;s.waste=[s.stock.pop()];
    }else if(kind==='accordion')s.piles=d.map(c=>[c]);
    else if(kind==='clock'){
      s.piles=Array.from({length:13},()=>d.splice(0,4));s.shown=Array(13).fill(null);s.active=12;s.flipped=0;s.kings=0;
    }else if(kind==='montecarlo'){s.table=d.splice(0,25);s.stock=d;s.removed=0}
    else if(kind==='castle'){
      s.found=Array.from({length:4},(_,suit)=>[d.splice(d.findIndex(c=>c.s===suit&&value(c)===1),1)[0]]);
      s.piles=Array.from({length:8},()=>d.splice(0,6));
    }else if(kind==='lucie'){
      s.found=[[],[],[],[]];s.piles=Array.from({length:18},()=>d.splice(0,3));
    }else if(kind==='calculation'){
      s.found=[[],[],[],[]];s.piles=[[],[],[],[]];s.stock=d;s.waste=[];
    }else if(kind==='memory'){
      // Each rank has two black cards or two red cards: 26 unambiguous pairs.
      s.cards=d;s.open=[];s.matched=new Set();s.turns=0;s.busy=false;
    }else if(kind==='bowling'){
      s.stock=d;s.hand=d.splice(0,3);s.marked=new Set();s.frames=[[]];s.rolls=[];
    }
    if(kind==='montecarlo'&&!montePairs())end('No adjacent matches in this deal. Try a new game.',false);
    render();
  }
  function render(){
    const renderers={spider:renderSpider,pyramid:renderPyramid,golf:renderGolf,tripeaks:renderTriPeaks,accordion:renderAccordion,clock:renderClock,montecarlo:renderMonte,castle:renderFoundations,lucie:renderFoundations,calculation:renderFoundations,memory:renderMemory,bowling:renderBowling};
    renderers[state.kind]();
  }
  // Spider: only descending, face-up same-suit runs move together.
  function spiderRun(p,i){return i>=0&&p[i].up&&p.slice(i).every((o,j,a)=>!j||(o.up&&a[j-1].c.s===o.c.s&&ordered(a[j-1].c)===ordered(o.c)+1))}
  function spiderResolve(){
    const s=state;
    for(const p of s.piles){
      if(p.length)top(p).up=true;
      if(p.length>=13&&value(p[p.length-13].c)===13&&spiderRun(p,p.length-13)){
        p.splice(-13);s.sets++;if(p.length)top(p).up=true;
      }
    }
    if(s.sets===8)end('All eight sequences cleared!',true);
  }
  function spiderClick(col,index){
    const s=state,p=s.piles[col];
    if(s.sel){
      const from=s.sel;const src=s.piles[from.col],c=src[from.index].c;
      if(from.col!==col&&(!p.length||value(top(p).c)===value(c)+1)){
        p.push(...src.splice(from.index));s.sel=null;spiderResolve();return render();
      }
      s.sel=null;
      if(from.col===col&&from.index===index)return render();
    }
    if(spiderRun(p,index))s.sel={col,index};else toast('Select a descending face-up run');render();
  }
  function renderSpider(){
    const s=state,{area,actions}=frame('Spider - one suit | Completed '+s.sets+'/8 | Stock '+s.stock.length);
    columns(area,s.piles,spiderClick,s.sel,true);
    button('Deal 10 cards',()=>{
      if(s.piles.some(p=>!p.length))return toast('Fill every empty column before dealing');
      s.piles.forEach(p=>p.push({c:s.stock.pop(),up:true}));s.sel=null;spiderResolve();render();
    },actions,s.done||!s.stock.length);
  }
  // Pyramid pairs use A=1, J=11, Q=12, K=13.
  function pyramidFree(i){
    const s=state;let row=0;while((row+1)*(row+2)/2<=i)row++;
    return s.table[i]&&(row===6||(!s.table[i+row+1]&&!s.table[i+row+2]));
  }
  function pyramidClick(id){
    const s=state,get=i=>i===-1?top(s.waste):s.table[i],c=get(id);
    if(!c||(id>=0&&!pyramidFree(id)))return;
    const remove=i=>{if(i===-1)s.waste.pop();else s.table[i]=null};
    if(value(c)===13){remove(id);s.sel=null}
    else if(s.sel!==null&&s.sel!==id&&get(s.sel)&&value(c)+value(get(s.sel))===13){remove(id);remove(s.sel);s.sel=null}
    else s.sel=s.sel===id?null:id;
    if(s.table.every(c=>!c))end('Pyramid cleared!',true);
    pyramidStuck();render();
  }
  function pyramidStuck(){
    const s=state;if(s.done||s.stock.length||s.passes<2&&s.waste.length)return;
    const a=s.table.filter((c,i)=>pyramidFree(i));if(s.waste.length)a.push(top(s.waste));
    if(!a.some((c,i)=>value(c)===13||a.some((d,j)=>i!==j&&value(c)+value(d)===13)))end('No pairs left. Try a new pyramid.',false);
  }
  function renderPyramid(){
    const s=state,{area,actions}=frame('Stock '+s.stock.length+' | Pass '+(s.passes+1)+'/3 | Pair to 13');
    const board=h('div','sol-pyramid');area.appendChild(board);
    s.table.forEach((c,i)=>{
      if(!c)return;let row=0;while((row+1)*(row+2)/2<=i)row++;const col=i-row*(row+1)/2;
      const b=playingCard(c,true,()=>pyramidClick(i),s.sel===i);b.style.left='calc('+((6-row)/2+col)+' * (var(--cw) + 6px))';b.style.top=row*38+'px';
      if(!pyramidFree(i)){b.disabled=true;b.classList.add('covered')}board.appendChild(b);
    });
    const waste=h('div','row sol-waste');area.appendChild(waste);if(s.waste.length)waste.appendChild(playingCard(top(s.waste),true,()=>pyramidClick(-1),s.sel===-1));
    button(s.stock.length?'Draw card':'Recycle waste',()=>{
      s.sel=null;if(s.stock.length)for(let i=0;i<DrawCount.count&&s.stock.length;i++)s.waste.push(s.stock.pop());else{s.stock=s.waste.reverse();s.waste=[];s.passes++}
      pyramidStuck();render();
    },actions,s.done||(!s.stock.length&&(!s.waste.length||s.passes>=2)));
    if(!s.done)actions.appendChild(DrawCount.button(render));
  }
  function adjacent(a,b,wrap){const diff=Math.abs(value(a)-value(b));return diff===1||(wrap&&diff===12)}
  function golfStuck(){const s=state;if(!total(s.piles))end('Golf course cleared!',true);else if(!s.stock.length&&!s.piles.some(p=>p.length&&adjacent(top(p),top(s.waste),false)))end(total(s.piles)+' cards left. Round complete.',false)}
  function renderGolf(){
    const s=state,{area,actions}=frame(total(s.piles)+' cards on the course | Stock '+s.stock.length);
    columns(area,s.piles,(col,i)=>{const p=s.piles[col];if(i===p.length-1&&p.length&&adjacent(top(p),top(s.waste),false)){s.waste.push(p.pop());golfStuck();render()}else toast('Play a top card one rank higher or lower')});
    const waste=h('div','row sol-waste');area.appendChild(waste);waste.appendChild(playingCard(top(s.waste),true,()=>{}));
    button('Draw card ('+s.stock.length+')',()=>{s.waste.push(s.stock.pop());golfStuck();render()},actions,s.done||!s.stock.length);
  }
  function peakFree(item){return !item.removed&&!state.table.some(other=>!other.removed&&other.row===item.row+1&&Math.abs(other.x-item.x)===1)}
  function peakStuck(){
    const s=state;if(s.table.every(c=>c.removed))end('All three peaks cleared!',true);
    else if(!s.stock.length&&!s.table.some(t=>peakFree(t)&&adjacent(t.c,top(s.waste),true)))end('No moves left. The peaks remain.',false);
  }
  function renderTriPeaks(){
    const s=state,{area,actions}=frame(s.table.filter(t=>!t.removed).length+' cards on the peaks | Stock '+s.stock.length);
    const board=h('div','sol-peaks');area.appendChild(board);
    s.table.forEach(t=>{if(t.removed)return;const free=peakFree(t),b=playingCard(t.c,free,()=>{
      if(free&&adjacent(t.c,top(s.waste),true)){s.waste.push(t.c);t.removed=true;peakStuck();render()}else toast('Play one rank higher or lower')
    });b.style.left='calc('+t.x/2+' * (var(--cw) + 4px))';b.style.top=t.row*40+'px';b.disabled=!free;board.appendChild(b)});
    const waste=h('div','row sol-waste');area.appendChild(waste);waste.appendChild(playingCard(top(s.waste),true,()=>{}));
    button('Draw card ('+s.stock.length+')',()=>{s.waste.push(s.stock.pop());peakStuck();render()},actions,s.done||!s.stock.length);
  }
  function accordionLegal(from,to){const p=state.piles;return (from-to===1||from-to===3)&&(top(p[from]).r===top(p[to]).r||top(p[from]).s===top(p[to]).s)}
  function renderAccordion(){
    const s=state,{area}=frame(s.piles.length+' piles | Select a pile, then one or three piles to its left');
    const row=h('div','sol-accordion');area.appendChild(row);
    s.piles.forEach((p,i)=>{const cell=h('div','sol-cell'),b=playingCard(top(p),true,()=>{
      if(s.sel!==null&&accordionLegal(s.sel,i)){
        s.piles[i].push(s.piles[s.sel].pop());if(!s.piles[s.sel].length)s.piles.splice(s.sel,1);s.sel=null;
        if(s.piles.length===1)end('One pile. Perfect compression!',true);
        else if(!s.piles.some((_,j)=>[j-1,j-3].some(k=>k>=0&&accordionLegal(j,k))))end(s.piles.length+' piles remain. No more moves.',false);
      }else s.sel=s.sel===i?null:i;render();
    },s.sel===i);cell.append(b,h('small','',p.length+' card'+(p.length===1?'':'s')));row.appendChild(cell)});
  }
  function renderClock(){
    const s=state,{area,actions}=frame('Revealed '+s.flipped+'/52 | Kings '+s.kings+'/4 | Next: '+(s.active===12?'King':s.active===0?'Ace':s.active+1));
    const clock=h('div','sol-clock');area.appendChild(clock);
    s.piles.forEach((p,i)=>{
      const angle=((i+1)%12)*Math.PI/6-Math.PI/2,cell=h('div','clock-cell'+(s.active===i?' active':''));
      cell.style.left=i===12?'50%':(50+40*Math.cos(angle))+'%';cell.style.top=i===12?'50%':(50+40*Math.sin(angle))+'%';
      const c=s.shown[i]||{r:11,s:0};const b=playingCard(c,!!s.shown[i],()=>clockFlip(i));b.disabled=s.done||s.active!==i;cell.append(b,h('small','',(i===0?'A':i===10?'J':i===11?'Q':i===12?'K':i+1)+' - '+p.length+' left'));clock.appendChild(cell);
    });
    button('Turn next card',()=>clockFlip(s.active),actions,s.done);
  }
  function clockFlip(i){
    const s=state;if(i!==s.active||s.done)return;const c=s.piles[i].pop();if(!c)return;
    s.shown[i]=c;s.flipped++;if(value(c)===13)s.kings++;s.active=value(c)-1;
    if(s.flipped===52)end('All 52 cards revealed. The clock is complete!',true);
    else if(!s.piles[s.active].length)end('The fourth King stops the clock at '+s.flipped+'/52 cards.',false);
    render();
  }
  function montePair(i,j){return i!==j&&state.table[i]&&state.table[j]&&state.table[i].r===state.table[j].r&&Math.abs(i%5-j%5)<=1&&Math.abs(Math.floor(i/5)-Math.floor(j/5))<=1}
  function montePairs(){return state.table.some((c,i)=>c&&state.table.some((d,j)=>montePair(i,j)))}
  function renderMonte(){
    const s=state,{area,actions}=frame('Removed '+s.removed+'/52 | Stock '+s.stock.length);
    grid(area,s.table,i=>{
      if(s.sel!==null&&montePair(s.sel,i)){s.table[s.sel]=null;s.table[i]=null;s.removed+=2;s.sel=null;if(s.removed===52)end('All matching pairs cleared!',true)}else s.sel=s.sel===i?null:i;
      if(!s.done&&!montePairs()&&!s.table.some(c=>!c))end('No adjacent matches. Try a new deal.',false);
      if(!s.done&&!s.stock.length&&!montePairs()&&s.table.every(c=>c))end('No matches left.',false);
      render();
    },s.sel);
    button('Gather & refill',()=>{
      const a=s.table.filter(Boolean);while(a.length<25&&s.stock.length)a.push(s.stock.pop());while(a.length<25)a.push(null);s.table=a;s.sel=null;
      if(!montePairs()&&s.table.filter(Boolean).length&&(!s.stock.length||s.table.every(Boolean)))end('No adjacent matches left.',false);
      render();
    },actions,s.done||s.table.every(Boolean));
  }
  // Foundation games: only exposed cards move. Calculation ignores suit.
  function sourceCard(){const s=state;if(!s.sel)return null;return s.sel.col===-1?top(s.waste):top(s.piles[s.sel.col])}
  function removeSource(){const s=state;return s.sel.col===-1?s.waste.pop():s.piles[s.sel.col].pop()}
  function foundationFits(c,i){
    const s=state,f=s.found[i];
    if(s.kind==='calculation'){const needed=f.length?((value(top(f))+i)%13)+1:1;return f.length<13&&value(c)===needed}
    return c.s===i&&value(c)===f.length+1;
  }
  function foundationClick(i){
    const s=state,c=sourceCard();if(!c)return toast('Select an exposed card first');
    if(!foundationFits(c,i))return toast('That card does not fit this foundation');
    s.found[i].push(removeSource());s.sel=null;
    if(total(s.found)===52)end('All foundations completed!',true);render();
  }
  function foundationColumn(col,index){
    const s=state,p=s.piles[col];
    if(s.sel){
      const c=sourceCard(),same=s.sel.col===col;
      if(same){
        const f=s.found.findIndex((_,i)=>foundationFits(c,i));if(f>=0)return foundationClick(f);
        s.sel=null;return render();
      }
      const ok=s.kind==='calculation'?s.sel.col===-1:(!p.length?s.kind==='castle':value(top(p))===value(c)+1&&(s.kind!=='lucie'||top(p).s===c.s));
      if(ok){p.push(removeSource());s.sel=null;return render()}
    }
    s.sel=p.length&&index===p.length-1?{col,index}:null;render();
  }
  function renderFoundations(){
    const s=state,cal=s.kind==='calculation';
    const {area,actions}=frame(total(s.found)+'/52 on foundations'+(cal?' | Stock '+s.stock.length:''));
    const foundations=h('div','sol-foundations');area.appendChild(foundations);
    s.found.forEach((f,i)=>{
      const cell=h('div','sol-cell');
      if(f.length)cell.appendChild(playingCard(top(f),true,()=>foundationClick(i)));
      else {const b=button(cal?'Ace':S[i]+' A',()=>{if(!s.done)foundationClick(i)},cell);b.classList.add('sol-found-empty')}
      const needed=f.length<13?(f.length?((value(top(f))+(cal?i:0))%13)+1:1):null;
      cell.appendChild(h('small','',cal?'+'+(i+1)+' | '+f.length+'/13 | Next '+(needed===1?'A':needed===11?'J':needed===12?'Q':needed===13?'K':needed||'done'):S[i]+' '+f.length+'/13'));
      foundations.appendChild(cell);
    });
    if(cal){
      const waste=h('div','row sol-waste');area.appendChild(waste);
      if(s.waste.length)waste.appendChild(playingCard(top(s.waste),true,()=>{s.sel=s.sel&&s.sel.col===-1?null:{col:-1,index:0};render()},s.sel&&s.sel.col===-1));
      button('Draw card ('+s.stock.length+')',()=>{s.waste.push(s.stock.pop());s.sel=null;render()},actions,s.done||!s.stock.length);
    }
    if(s.kind==='lucie'){
      const fans=h('div','sol-fans');area.appendChild(fans);
      s.piles.forEach((p,col)=>{const fan=h('div','sol-fan');fans.appendChild(fan);if(!p.length)fan.appendChild(h('small','','Empty fan'));
        p.forEach((c,index)=>{const b=playingCard(c,true,()=>foundationColumn(col,index),s.sel&&s.sel.col===col);b.style.top=index*36+'px';fan.style.height='calc(var(--ch) + '+Math.max(0,p.length-1)*36+'px)';b.disabled=s.done||index!==p.length-1;fan.appendChild(b)})});
    }else columns(area,s.piles,foundationColumn,s.sel);
  }
  function renderMemory(){
    const s=state,{area}=frame('Pairs '+s.matched.size/2+'/26 | Turns '+s.turns);
    const board=h('div','sol-memory');area.appendChild(board);
    s.cards.forEach((c,i)=>{
      const matched=s.matched.has(i),b=playingCard(c,matched||s.open.includes(i),()=>{
        if(s.busy||s.open.includes(i)||s.matched.has(i))return;
        s.open.push(i);
        if(s.open.length===2){
          s.turns++;const [a,b]=s.open,ca=s.cards[a],cb=s.cards[b];
          if(ca.r===cb.r&&(ca.s%3===0)===(cb.s%3===0)){
            s.matched.add(a);s.matched.add(b);s.open=[];if(s.matched.size===52)end('All 26 pairs found in '+s.turns+' turns!',true);
          }else{
            s.busy=true;const current=s,token=epoch;setTimeout(()=>{if(state!==current||token!==epoch)return;current.open=[];current.busy=false;render()},950);
          }
        }
        render();
      });if(matched){b.classList.add('matched');b.disabled=true}board.appendChild(b);
    });
  }
  // Bowling variant: combine any of three cards up to the remaining pin count.
  function bowlingScore(rolls){
    let score=0,index=0;
    for(let frame=0;frame<10;frame++){
      if(rolls[index]===undefined)break;
      if(rolls[index]===10){if(rolls[index+2]===undefined)break;score+=10+rolls[index+1]+rolls[index+2];index++}
      else{if(rolls[index+1]===undefined)break;const pins=rolls[index]+rolls[index+1];if(pins===10){if(rolls[index+2]===undefined)break;score+=10+rolls[index+2]}else score+=pins;index+=2}
    }
    return score;
  }
  function pinsLeft(frame,index){
    if(index<9)return frame.length?10-frame[0]:10;
    if(!frame.length)return 10;
    if(frame.length===1)return frame[0]===10?10:10-frame[0];
    return frame[0]===10?(frame[1]===10?10:10-frame[1]):10;
  }
  function bowl(){
    if(state.done)return;
    const s=state,f=top(s.frames),i=s.frames.length-1,left=pinsLeft(f,i),chosen=Array.from(s.marked),pins=chosen.reduce((n,j)=>n+Math.min(10,value(s.hand[j])),0);
    if(pins>left)return toast('Your cards exceed the '+left+' remaining pins');
    // Unused cards are discarded after every roll, including a gutter.
    s.hand=[];s.marked.clear();s.rolls.push(pins);f.push(pins);
    const finished=i<9?(f[0]===10||f.length===2):(f.length===3||f.length===2&&f[0]!==10&&f[0]+f[1]<10);
    if(finished&&i===9){end('Game complete! Score '+bowlingScore(s.rolls),false);sv.coins+=Math.round(bowlingScore(s.rolls)/10);persist();header()}
    else {if(finished)s.frames.push([]);if(s.stock.length<3)s.stock=fresh();s.hand=s.stock.splice(0,3)}
    render();
  }
  function bowlingMarks(rolls,frame){return rolls.map((n,k)=>{const fresh=k===0||frame===9&&(k===1&&rolls[0]===10||k===2&&(rolls[0]!==10||rolls[1]===10));return n===10&&fresh?'X':k>0&&n===pinsLeft(rolls.slice(0,k),frame)?'/':n===0?'-':n}).join(' ')}
  function renderBowling(){
    const s=state,f=top(s.frames),i=s.frames.length-1,left=pinsLeft(f,i),{area,actions}=frame('Frame '+(i+1)+'/10 | Pins standing '+left+' | Confirmed score '+bowlingScore(s.rolls));
    const scores=h('div','bowling-frames');area.appendChild(scores);
    for(let j=0;j<10;j++){
      const rolls=s.frames[j]||[],cell=h('div','bowling-frame');cell.append(h('small','',j+1),h('b','',bowlingMarks(rolls,j)||' '));scores.appendChild(cell);
    }
    const pins=h('div','bowling-pins');pins.textContent=Array.from({length:10},(_,j)=>j<left?'|':'.').join(' ');area.appendChild(pins);
    const hand=h('div','row');area.appendChild(hand);
    s.hand.forEach((c,j)=>hand.appendChild(playingCard(c,true,()=>{s.marked.has(j)?s.marked.delete(j):s.marked.add(j);render()},s.marked.has(j))));
    const sum=Array.from(s.marked).reduce((n,j)=>n+Math.min(10,value(s.hand[j])),0);
    area.appendChild(h('p','',s.done?'Final score '+bowlingScore(s.rolls):'Selected: '+sum+' pins'));
    button(sum?'Roll '+sum+' pins':'Gutter / discard hand',bowl,actions,s.done||sum>left);
  }
  if(window.DemoSession)window.DemoSession.solitaire={start,render,get s(){return state},spiderRun,spiderClick,spiderResolve,pyramidFree,pyramidClick,adjacent,peakFree,accordionLegal,clockFlip,montePair,foundationFits,foundationClick,foundationColumn,pinsLeft,bowl};
  const definitions={
    spider:['Spider Solitaire','Eight King-to-Ace runs. One suit.', 'One-suit Spider uses 104 cards in ten columns. Select a face-up descending run, then a destination one rank higher, or an empty column. A King-to-Ace run is removed automatically. Deal ten stock cards only when all columns are occupied. Clear eight runs to win. Aces are low.'],
    pyramid:['Pyramid Solitaire','Find uncovered pairs that total 13.', 'Remove uncovered cards in pairs totaling 13. A=1, J=11, Q=12, K=13. Kings are removed alone. A card is uncovered when both cards below it are gone. The waste top may pair with the pyramid. Use the shared Draw 1 / Draw 3 choice to turn over stock cards; only the final waste top is playable. Recycle the waste twice for three passes total. Clear the pyramid to win; stock cards need not be cleared.'],
    golf:['Golf Solitaire','Seven columns. Play one rank up or down.', 'Only the exposed bottom card of each column can be played. Click one rank above or below the waste card. Aces are low; King and Ace do not wrap. Draw from the stock when needed. No recycling. Clear all 35 tableau cards to win.'],
    tripeaks:['TriPeaks Solitaire','Clear three peaks, one rank at a time.', 'Click an uncovered card one rank above or below the waste. King and Ace wrap around. Face-down cards uncover when both cards directly below them are removed. There are 28 tableau cards and 23 stock cards, plus the starting waste. Draw from stock when stuck; there is no recycle. Clear all three peaks.'],
    accordion:['Accordion Solitaire','Top-card variant: compress the deck into one pile.', 'Select a pile, then a pile exactly one or three places to its left. The top cards must share a rank or suit. Only the selected top card moves. An empty pile disappears, and all distances are counted again using the current pile positions. Win with one pile.'],
    clock:['Clock Solitaire','Follow the ranks around the clock.', 'Start at the central King pile. Reveal its top card; its rank chooses the next pile: Ace=1, J=11, Q=12, King=center. Press Turn next card or click the highlighted pile. Revealed cards are counted separately from the remaining face-down cards. The fourth King stops play. Win only if all 52 cards have been revealed at that point; revealing four Kings early is a loss. This is a game of luck.'],
    montecarlo:['Monte Carlo Solitaire','Match neighbouring ranks on a 5 x 5 grid.', 'Select two equal ranks touching horizontally, vertically or diagonally to remove them. Gather & refill compacts the survivors left to right, top to bottom, then fills the remaining cells from stock. You may remove several pairs before gathering. Clear all 52 cards to win.'],
    bowling:['Bowling Solitaire','Combine cards for strikes and spares.', 'A card-bowling variant: select any combination of the three cards whose values total no more than the standing pins. A=1, number cards face value, J/Q/K=10. Roll to knock down that total; select none for a gutter. All three cards are discarded after a roll. Two rolls per frame, with a third in frame ten after a strike or spare. Strikes score ten plus the next two rolls; spares score ten plus the next roll. Play ten frames. The deck reshuffles when needed. Coins equal the final score divided by ten, rounded.'],
    castle:['Beleaguered Castle','Open columns and build suit foundations.', 'The four Aces start on their foundations, with 48 face-up cards in eight columns. Select an exposed card, then a foundation or another column. Columns build down by rank regardless of suit; any card may fill an empty column. Move one exposed card at a time. Foundations build Ace to King by suit. Click a selected card again to send it to its foundation.'],
    calculation:['Calculation Solitaire','Four foundations, four counting sequences.', 'Ace-start Calculation variant: all four foundations start with an Ace, then count by +1, +2, +3 or +4, ignoring suit. Wrap after King: for example +2 goes A,3,5,7,9,J,K,2,4,6,8,10,Q. Each foundation takes thirteen cards. Draw from stock to waste. Select the waste top and send it to a foundation or one of four work piles. Work piles have no building restriction; only their top cards can go to foundations, and cards cannot move between work piles. No recycling.'],
    lucie:['La Belle Lucie','Small fans, tight moves, suit foundations.', 'Seventeen fans of three and one single card are dealt face up. Only the exposed rightmost card of each fan can move. Build foundations Ace to King by suit. Fan-to-fan moves build down one rank in the same suit; empty fans cannot be filled. This is the no-redeal variant. Select a card, then its destination, or click the selected card again to send it to a foundation.'],
    memory:['Card Memory','Find all 26 matching pairs.', 'Flip two cards. Match the same rank AND colour: for example the two red Queens, or the two black Aces. Each card has exactly one partner in this 52-card deck. Matched cards remain face up; mismatches turn down after a moment. Find all 26 pairs in as few turns as possible.']
  };
  for(const [key,[title,description,rules]] of Object.entries(definitions)){
    api.games[key]={t:title,d:description,k:key,s:()=>start(key)};api.help[key]=title.toUpperCase()+'\n'+rules;
  }
  api.remember(Object.keys(definitions),()=>state,saved=>{epoch++;state=saved;if(state.busy){state.busy=false;state.open=[]}render()});
})();
