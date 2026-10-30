// The hub uses the same game registry as the individual game overlay.
(() => {
  const arcade = window.CardArcade;
  const puzzleKeys=['bowling','memory'];
  const gameEntry=key=>{const g=arcade.games[key];return {key,t:g.t,d:g.d,action:'arcade',preview:key}};
  function collections(){return [
    ['Solitaire',Object.keys(arcade.games).filter(k=>!['rpg','board','duel','classic'].includes(arcade.games[k].category)&&!puzzleKeys.includes(k)).sort((a,b)=>{const order=k=>({klondike:-3,freecell:-2,spider:-1}[k]??0);return order(a)-order(b)}).map(gameEntry)],
    ['Board Games',Object.keys(arcade.games).filter(k=>arcade.games[k].category==='board').map(gameEntry)],
    ['Card Puzzles',puzzleKeys.map(gameEntry)],
    ['Solo Adventures',Object.keys(arcade.games).filter(k=>arcade.games[k].category==='rpg').map(gameEntry)],
    ['Classic Games',(window.ClassicCabinet?.keys||[]).map(gameEntry)],
    ['Ticket Games',[{key:'hilo',t:'High-Low Streak',d:'Higher or lower? One ticket',action:'hilo',preview:'hilo'}]],
    ['Stack Showdown',[{key:'stack',t:'Stack Showdown',d:'Levels & the dealer',action:'stack',preview:'stack'}]],
    ['Card Tricks',Object.entries(window.MagicArcade.guides).map(([k,v])=>({key:k,t:v.t,d:v.d,action:'trick',preview:'magic:'+k}))],
    ['Card Duels',Object.keys(arcade.games).filter(k=>arcade.games[k].category==='duel').map(gameEntry)]
  ]}
  const escape=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const artworks={klondike:'img/solitaire-editorial.png',freecell:'img/freecell-editorial.png',spider:'img/spider-editorial.png'};
  // Individual generated illustrations; action scoping keeps Card Tricks untouched.
  for(const key of ["alchemist","alquerque","backgammon","bounty","bowling","caravan","checkers","chess","chinesecheckers","chronomancer","classic-battleship","classic-billiards","classic-cube","classic-etch","classic-fifteen","classic-football","classic-gamewatch","classic-hanoi","classic-klotski","classic-lightsout","classic-litebrite","classic-mastermind","classic-merlin","classic-microvision","classic-pegged","classic-pocket15","classic-pyramid","classic-rings","classic-simon","classic-snake","classic-tangram","classic-tetris","classic-triangle","connectfour","corsair","delver","dominoes","dotsboxes","dragonhunt","falk","foxgeese","game2048","hanayama","hilo","hitori","ironarena","jewels","kakuro","longroad","mahjong","mancala","memory","minesweeper","moonheist","morris","necromancer","nonogram","nurikabe","oraclequest","ordinary","othello","pegsolitaire","pentalpha","pullcrest","quiet","relicvault","savage","scoundrel","senet","shieldwall","shutbox","skyspire","soulcrypt","spellforge","stack","starsalvage","sudoku","tchukaruma","tictactoe","ur","vampirecourt","village","wildtrail"])artworks[key]='img/game-art/'+key+'.webp';
  const artwork=e=>e.action==='trick'?null:artworks[e.key];
  const symbols=['♠','♦','♣','♥'];
  const tile=(e,i)=>'<button class="arcade-tile alt'+(artwork(e)?' illustrated':'')+'" data-a="'+e.action+'" data-v="'+e.key+'" data-preview="'+e.preview+'">'+(artwork(e)?'<span class="game-art"><img src="'+artwork(e)+'" alt="" loading="lazy" decoding="async"></span>':'')+'<span class="game-symbol" aria-hidden="true">'+symbols[i%4]+'</span><span class="game-copy"><b>'+escape(e.t)+'</b><small>'+escape(e.d)+'</small></span><span class="game-arrow" aria-hidden="true">↗</span>'+(artwork(e)?'<span class="game-play" aria-hidden="true">Play game <span>↗</span></span>':'')+'</button>';
  const gridMenu = function (view='grid',category=null,search='') {
    if(g&&g.busy)return toast('Finishing this turn...');
    arcade.stopSolitaire();arcade.leave();window.MagicArcade.stop();window.MagicArcade.stopExtra();
    $('#g2').style.display='none';$('#magic').style.display='none';$('#box').classList.add('arcade-box');header();
    const groups=collections(),query=search.trim().toLowerCase();
    let html='<div class="hub-heading"><h2><span class="brand-mark" aria-hidden="true">♠</span> Card Arcade</h2><input class="hub-search" type="search" aria-label="Search games" placeholder="Search games" value="'+escape(search)+'"></div>';
    if(view==='shelves')html+='<nav class="category-shelf" aria-label="Game categories">'+groups.map(([name,games])=>'<button class="shelf-category alt" data-a="shelfCategory" data-v="'+name+'" aria-expanded="'+(name===category)+'"><b>'+name+'</b><small>'+games.length+'</small></button>').join('')+'</nav>';
    let shown=0;
    for(const [title,all]of groups){if(view==='shelves'&&!query&&title!==category)continue;const games=all.filter(e=>!query||(e.t+' '+e.d+' '+title).toLowerCase().includes(query));if(!games.length)continue;shown+=games.length;html+='<section class="hub-collection'+(!query&&title==='Solitaire'?' featured-collection':'')+'"><div class="collection-heading"><h3 class="hub-label">'+title+'</h3><span class="collection-count">'+games.length+' games</span></div><div class="arcade-grid">'+games.map(tile).join('')+'</div></section>'}
    if(query&&!shown)html+='<p class="hub-empty">No matching games.</p>';
    html+='<div class="hub-tools"><button class=alt data-a=carousel>Carousel view</button><button class=alt data-a=guides>How to Play</button><button class=alt data-a=io>Save / Load</button><button class=alt data-a=about>About</button><button class=alt data-a=notes>Release Notes</button></div>';modal(html);
  };
  menu=gridMenu;
  A.menu=menu;
  A.ordinaryQuickplay=()=>{$('#box').classList.remove('arcade-box');window.OrdinaryArcade.launchQuickplay()};
  A.trick=key=>{A.magic();(document.querySelector('[data-extra="'+key+'"]')||document.querySelector('[data-id="'+key+'"]'))?.click()};
  A.arcade=key=>{ $('#box').classList.remove('arcade-box'); arcade.open(key); };
  A.stack=()=>{ $('#box').classList.remove('arcade-box'); stackMenu(); };
  const oldModal=modal;
  modal=function(html){if(!html.includes('hub-heading'))$('#box').classList.remove('arcade-box');oldModal(html)};
  $('#hm').onclick=menu;
  $('#hm').textContent='Arcade';
  $('#g2x').onclick=menu;
  $('#g2s').onclick=menu;
  $('#g2s').textContent='Arcade';
  $('#g2q').title='Rules for this game';
  $('#mx').addEventListener('click',()=>menu());
  $('#box').onclick=e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset.v)};
  // Refresh Stack Showdown's setup without mixing the other games into it.
  const originalStack=stackMenu;
  stackMenu=function(){
    originalStack();
    const box=$('#box');
    const buttons=Array.from(box.querySelectorAll('button'));
    for(const b of buttons)if(['hilo','magic','more','io','about','notes'].includes(b.dataset.a))b.remove();
    for(const p of box.querySelectorAll('p'))if(p.textContent.startsWith('Side games')||!p.textContent.trim())p.remove();
    if(g&&g.left>=0&&!g.finished){const resume=h('button','','Resume game');resume.onclick=()=>{$('#modal').style.display='none';render()};box.appendChild(resume)}
    const back=h('button','alt','Back to Arcade');back.dataset.a='menu';box.appendChild(back);
  };
  if(window.CarouselArcade)window.CarouselArcade.install(gridMenu);
  menu();
})();
