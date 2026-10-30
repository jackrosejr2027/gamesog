// One local engine frame at a time; demo-bootstrap isolates browser storage.
window.CarouselArcade={install(gridMenu){
 const api=window.CardArcade,M=window.MagicArcade,esc=t=>String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const entries=[...Object.values(api.games).sort((a,b)=>{const order=g=>g.k==='klondike'?-2:g.k==='freecell'?-1:!['board','rpg','duel'].includes(g.category)?0:g.category==='duel'?1:g.category==='board'?2:3;return order(a)-order(b)}).map(g=>({key:g.k,t:g.t,d:g.d,group:g.category==='classic'?'Classic Games':g.category==='duel'?'Card Duels':g.category==='board'?'Board Games':g.category==='rpg'?'Solo Adventures':'Solitaire & Puzzles'})),{key:'hilo',t:'High-Low Streak',d:'Guess the next rank and decide when to bank your streak.',group:'Ticket Games'},{key:'stack',t:'Stack Showdown',d:'Outplay four dealer stacks. Keep a card in reserve with the one-card sideline mode.',group:'Stack Showdown'},...Object.entries(M.guides).map(([k,g])=>({key:'magic:'+k,t:g.t.replace(/^\d+[a-z]?\. /,''),d:g.d,group:'Card Tricks'}))];
 entries.sort((a,b)=>{const rank=e=>e.group==='Card Duels'?4:e.key.startsWith('magic:')?3:e.key==='stack'?2:0;return rank(a)-rank(b)});
 let selected=0,view='shelves',liveFrame=null,expanded=null,resizeObserver,currentKey='klondike',category='Solitaire',search='',hoverPanel=null,hoverTimer,leaveTimer;
 const guide=entry=>{
  const trick=entry.key.startsWith('magic:'),key=trick?entry.key.slice(6):entry.key;
  const raw=trick?M.guides[key].rules:api.help[key];const rules=trick?raw:raw?.slice(raw.indexOf('\n')+1);
  const tips=(trick?M.strategy[key]:api.strategy[key])||'';
  return '<p class=carousel-description>'+esc(entry.d)+'</p><h3>Rules</h3><p>'+esc(rules)+'</p><h3>Strategy</h3><ul>'+tips.split('|').map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>';
 };
 function cleanup(keepPreview=false){clearTimeout(hoverTimer);clearTimeout(leaveTimer);if(resizeObserver)resizeObserver.disconnect();resizeObserver=null;if(liveFrame)liveFrame.remove();liveFrame=null;if(!keepPreview){hoverPanel?.remove();hoverPanel=null}}
 function fit(frame,stage){const w=1100,h=820;frame.style.width=w+'px';frame.style.height=h+'px';frame.style.transform='translate(-50%,-50%) scale('+Math.min(stage.clientWidth/w,stage.clientHeight/h)+')'}
 function mount(root,key,preview=false){
  cleanup(preview);const stage=root.querySelector('.demo-viewport'),frame=document.createElement('iframe');stage.replaceChildren();frame.className='demo-board-frame';frame.title=(entries.find(e=>e.key===key)?.t||key)+' live demonstration';frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.src='demo.html?game='+encodeURIComponent(key)+(preview?'&preview=1':'');if(preview)frame.onload=()=>frame.contentWindow.postMessage({type:'arcade-demo-control',action:'play'},'*');frame.tabIndex=-1;stage.appendChild(frame);liveFrame=frame;
  if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(()=>fit(frame,stage));resizeObserver.observe(stage)}fit(frame,stage);
 }
 function controls(){return '<div class=demo-toolbar><span class=demo-count>Step 0 / 50</span><div><button class=alt data-a=demoPrevious aria-label="Previous demo step" disabled>Previous step</button><button class=alt data-a=demoToggle aria-label="Pause demo">Pause</button><button class=alt data-a=demoNext>Next step</button><button class=alt data-a=demoRestart>Restart</button></div></div><p class=demo-explanation aria-live=polite>Dealing the board. Each move will be played and explained here.</p>'}
 function stopGames(){api.stopSolitaire();api.leave();M.stop();M.stopExtra();$('#g2').style.display='none';$('#magic').style.display='none'}
 function render(){
  if(g&&g.busy)return toast('Finishing this turn...');stopGames();cleanup();header();const e=entries[selected];
  const shelves=[...new Set(entries.map(entry=>entry.group))];
  const shelfNav='<nav class=carousel-shelf-selector aria-label="Choose a game shelf">'+shelves.map(name=>'<button class=alt data-a=carouselShelf data-v="'+esc(name)+'" aria-pressed="'+(name===e.group)+'"><b>'+esc(name)+'</b><small>'+entries.filter(item=>item.group===name).length+'</small></button>').join('')+'</nav>';
  modal('<div class=hub-heading><h2>Card Arcade</h2><button class=alt data-a=grid>All games</button></div>'+shelfNav+'<section class=carousel-shell aria-label="Game carousel"><div class=carousel-title><div><small>'+esc(e.group)+'</small><h2>'+esc(e.t)+'</h2></div><span>'+(selected+1)+' / '+entries.length+'</span></div><div class=carousel-stage><div class=demo-viewport></div><div class=carousel-preview-label>LIVE DEMO · 50 STEPS</div><button class="alt carousel-details-toggle" data-a=carouselInfo aria-label="Show rules and strategy" aria-expanded=false>Rules & Strategy</button><aside class=carousel-info tabindex=0 aria-label="Game description, rules and strategy">'+guide(e)+'</aside></div>'+controls()+'<div class=carousel-navigation><button class=alt data-a=carouselMove data-v=-1 aria-label="Previous game">&#9664; Previous</button><button data-a=carouselPlay>Play '+esc(e.t)+'</button><button class=alt data-a=carouselMove data-v=1 aria-label="Next game">Next &#9654;</button></div>'+(e.key==='ordinary'?'<button class=ordinary-quickplay data-a=ordinaryQuickplay>Quickplay / Random decks</button>':'')+'<div class=carousel-bottom><button class=alt data-a=demo data-v="'+esc(e.key)+'">Expand demo</button><span>Hover over the board for rules and strategy</span></div></section><div class=hub-tools><button class=alt data-a=guides>How to Play</button><button class=alt data-a=io>Save / Load</button><button class=alt data-a=about>About</button><button class=alt data-a=notes>Release Notes</button></div>');
  $('#box').classList.add('arcade-box','carousel-box');hubControls();mount($('#box'),e.key);
 }
 function command(action){if(!liveFrame?.isConnected)return;liveFrame.contentWindow.postMessage({type:'arcade-demo-control',action},'*')}
 function demoRoot(){return expanded||hoverPanel||$('#box')}
 function setPlaying(on){const b=demoRoot().querySelector('[data-a=demoToggle]');if(b){b.textContent=on?'Pause':'Resume';b.setAttribute('aria-label',on?'Pause demo':'Resume demo');b.dataset.playing=String(on)}}
 addEventListener('message',event=>{
  if(!liveFrame||event.source!==liveFrame.contentWindow||event.data?.type!=='arcade-demo')return;
  const data=event.data,root=demoRoot(),count=root.querySelector('.demo-count'),explanation=root.querySelector('.demo-explanation');
  if(count)count.textContent='Step '+data.step+' / 50';if(explanation&&data.text)explanation.textContent=data.text;
  setPlaying(data.playing&&data.step<50);const next=root.querySelector('[data-a=demoNext]');if(next)next.disabled=data.step>=50;const previous=root.querySelector('[data-a=demoPrevious]');if(previous)previous.disabled=data.step<=0;
 });
 const viewNames={carousel:'Carousel',grid:'Grid',list:'List',compact:'Compact',compactlist:'Compact List',shelves:'Shelves',neon:'Neon',paper:'Paper'};
 function hubControls(){const box=$('#box');box.dataset.view=view;const heading=box.querySelector('.hub-heading');if(!heading)return;const label=h('label','arcade-view-control'),select=h('select');select.setAttribute('aria-label','Arcade view');for(const [key,name]of Object.entries(viewNames)){const option=h('option','',name);option.value=key;option.selected=key===view;select.appendChild(option)}select.onchange=()=>A.arcadeView(select.value);label.appendChild(select);const download=h('a','alt local-download');download.href='downloads/offllinecodebbase.zip';download.download='offllinecodebbase.zip';download.title='Download local version';download.setAttribute('aria-label','Download local version');download.innerHTML='&#8681;';heading.append(label,download);const tools=box.querySelector('.hub-tools');if(tools){const status=h('output','offline-status');status.dataset.offlineStatus='';status.setAttribute('aria-live','polite');tools.appendChild(status);window.ArcadeOffline?.refresh()}}
 function renderGrid(){cleanup();$('#box').classList.remove('carousel-box');gridMenu(view,category,search);hubControls();
  const input=$('#box .hub-search');input.oninput=()=>{search=input.value;const at=input.selectionStart;renderGrid();const next=$('#box .hub-search');next.focus();next.setSelectionRange?.(at,at)};
  for(const tile of $('#box').querySelectorAll('[data-preview]')){const show=()=>{clearTimeout(leaveTimer);clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>preview(tile),250)};tile.onmouseenter=show;tile.onfocus=show;tile.onmouseleave=()=>{clearTimeout(hoverTimer);leaveTimer=setTimeout(()=>cleanup(),180)};tile.onblur=()=>{clearTimeout(hoverTimer);leaveTimer=setTimeout(()=>cleanup(),180)};bindPress(tile)}
 }
 function bindPress(tile){let timer=null,held=false;const clear=()=>clearTimeout(timer);tile.addEventListener('touchstart',()=>{held=false;clear();timer=setTimeout(()=>{held=true;clearTimeout(hoverTimer);preview(tile)},420)},{passive:true});tile.addEventListener('touchmove',clear,{passive:true});tile.addEventListener('touchend',clear);tile.addEventListener('touchcancel',clear);tile.addEventListener('contextmenu',e=>{if(held)e.preventDefault()});tile.addEventListener('click',e=>{if(!held)return;held=false;e.preventDefault();e.stopPropagation()},true)}
  function preview(tile){if(!tile.isConnected||expanded||view==='carousel')return;cleanup();const e=entries.find(e=>e.key===tile.dataset.preview);if(!e)return;hoverPanel=h('aside','hover-demo');hoverPanel.setAttribute('aria-label',e.t+' preview');const bar=h('div','hover-demo-heading');bar.appendChild(h('b','',e.t));const details=h('button','alt','Rules & Strategy');details.setAttribute('aria-expanded','false');details.onclick=()=>{const on=hoverPanel.classList.toggle('details-open');details.setAttribute('aria-expanded',String(on))};const close=h('button','alt','Close');close.setAttribute('aria-label','Close preview');close.onclick=()=>cleanup();bar.append(details,close);const info=h('aside','carousel-info');info.tabIndex=0;info.setAttribute('aria-label',e.t+' rules and strategy');info.innerHTML=guide(e);hoverPanel.append(bar,h('div','demo-viewport'),info);const toolbar=h('div','hover-demo-controls');toolbar.innerHTML=controls();toolbar.onclick=event=>{const b=event.target.closest('[data-a]');if(b&&!b.disabled&&A[b.dataset.a])A[b.dataset.a](b.dataset.v)};hoverPanel.appendChild(toolbar);hoverPanel.onmouseenter=()=>clearTimeout(leaveTimer);hoverPanel.onmouseleave=()=>{leaveTimer=setTimeout(()=>cleanup(),180)};document.body.appendChild(hoverPanel);const rect=tile.getBoundingClientRect(),w=Math.min(350,innerWidth-24),height=390;hoverPanel.style.width=w+'px';hoverPanel.style.left=Math.max(12,Math.min(innerWidth-w-12,rect.right+12))+'px';hoverPanel.style.top=Math.max(12,Math.min(innerHeight-height-12,rect.top))+'px';mount(hoverPanel,e.key,true);
 }
 A.shelfCategory=name=>{category=category===name?'Solitaire':name;search='';renderGrid()};
 A.arcadeView=key=>{if(!viewNames[key])return;view=key;if(view==='carousel')render();else renderGrid()};
 A.carousel=()=>A.arcadeView('carousel');A.grid=()=>A.arcadeView('grid');
 menu=()=>view==='carousel'?render():renderGrid();A.menu=menu;$('#hm').onclick=menu;$('#g2x').onclick=menu;$('#g2s').onclick=menu;
 A.carouselMove=delta=>{selected=(selected+Number(delta)+entries.length)%entries.length;render()};
 A.carouselShelf=name=>{const index=entries.findIndex(entry=>entry.group===name);if(index<0)return;selected=index;render()};
 A.carouselInfo=()=>{const stage=$('#box .carousel-stage'),on=stage.classList.toggle('details-open');stage.querySelector('.carousel-details-toggle').setAttribute('aria-expanded',String(on))};
 function play(e){cleanup();$('#box').classList.remove('carousel-box');currentKey=e.key;
  if(e.key==='stack')A.stack();else if(e.key.startsWith('magic:')){A.magic();const key=e.key.slice(6),b=document.querySelector('[data-extra="'+key+'"]')||document.querySelector('[data-id="'+key+'"]');b?.click()}else if(e.key==='hilo')A[e.key]();else A.arcade(e.key);
 }
 A.carouselPlay=()=>play(entries[selected]);
 A.demoToggle=()=>{const b=demoRoot().querySelector('[data-a=demoToggle]'),on=b?.dataset.playing==='false';command(on?'play':'pause');setPlaying(on)};
 A.demoPrevious=()=>{setPlaying(false);command('previous')};A.demoNext=()=>{setPlaying(false);command('next')};A.demoRestart=()=>{setPlaying(true);command('restart')};
 A.demo=key=>{
  key=key||currentKey;const e=entries.find(e=>e.key===key);if(!e)return;
  command('pause');expanded=h('div','expanded-demo');expanded.setAttribute('role','dialog');expanded.setAttribute('aria-modal','true');expanded.setAttribute('aria-label',e.t+' demo');
  expanded.innerHTML='<div class=expanded-demo-inner><div class=carousel-title><div><small>50 explained actions</small><h2>'+esc(e.t)+'</h2></div><button class=alt data-a=demoClose>Close demo</button></div><div class=demo-viewport></div>'+controls()+'</div>';
  expanded.onclick=event=>{const b=event.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset.v)};document.body.appendChild(expanded);mount(expanded,key);expanded.querySelector('[data-a=demoClose]').focus();
 };
 A.demoClose=()=>{if(!expanded)return;const wasHub=$('#modal').style.display==='flex'&&!!$('#box .carousel-shell');expanded.remove();expanded=null;cleanup();if(wasHub)mount($('#box'),entries[selected].key);else launch.focus()};
 const launch=h('button','alt demo-launch','50-step demo');launch.id='demo-launch';launch.onclick=()=>A.demo(M.current?'magic:'+M.current:currentKey);$('#top').appendChild(launch);
 const oldOpen=api.open;api.open=(key,...args)=>{cleanup();currentKey=key;return oldOpen(key,...args)};
 for(const key of ['stack','hilo','magic']){const original=A[key];A[key]=(...args)=>{cleanup();currentKey=key;return original(...args)}}
 const previousModal=modal;modal=html=>{if(!String(html).includes('carousel-shell')){cleanup();$('#box').classList.remove('carousel-box')}previousModal(html);if(String(html).includes('carousel-shell')&&$('#box .demo-board-frame')){$('#box').classList.add('arcade-box','carousel-box');mount($('#box'),entries[selected].key)}};
 addEventListener('keydown',event=>{
  if(hoverPanel&&event.key==='Escape'){cleanup();return}
  if(expanded&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();A.demoClose();return}
  if(expanded&&event.key==='Tab'){const controls=[...expanded.querySelectorAll('button:not(:disabled)')],first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}return}
  if(expanded){event.stopImmediatePropagation();return}
  if(!expanded&&$('#box .carousel-shell')&&$('#modal').style.display==='flex'&&!/INPUT|TEXTAREA/.test(event.target.tagName)&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();A.carouselMove(event.key==='ArrowLeft'?-1:1)}
 },true);
 window.CarouselArcade.entries=entries;
}};
