// Small shared presentation helpers for the expansion games.
(() => {
  const api=window.CardArcade;
  const button=(parent,label,fn,disabled=false)=>{const b=h('button','alt',label);b.disabled=disabled;b.onclick=fn;parent.appendChild(b);return b};
  const face=(c,fn,selected=false,up=true)=>{const b=h('button','sol-card'+(selected?' chosen':''));b.type='button';b.setAttribute('aria-label',up?R[c.r]+' '+['spades','hearts','diamonds','clubs'][c.s]:'Face-down card');b.setAttribute('aria-pressed',String(selected));b.appendChild(card(c,up));b.onclick=fn;return b};
  const row=parent=>{const e=h('div','row');parent.appendChild(e);return e};
  const frame=(status,restart)=>{const host=$('#g2b');host.innerHTML='';host.classList.add('solitaire-host');host.appendChild(h('div','sol-status',status));const area=h('div','sol-area'),actions=h('div','row sol-actions');host.append(area,actions);button(actions,'New game',restart);return {area,actions}};
  const piles=(parent,arrays,click,sel)=>{const board=h('div','sol-columns');parent.appendChild(board);arrays.forEach((a,col)=>{const p=h('div','sol-column');p.style.height='calc(var(--ch) + '+Math.max(0,a.length-1)*36+'px)';if(!a.length)button(p,'Empty',()=>click(col,-1)).classList.add('sol-empty');a.forEach((o,index)=>{const c=o.c||o,b=face(c,()=>click(col,index),sel&&sel.col===col&&index>=sel.index,o.up!==false);b.style.top=index*36+'px';p.appendChild(b)});board.appendChild(p)});return board};
  window.Tabletop={button,face,row,frame,piles,value:c=>c.r===12?1:c.r+2,top:a=>a[a.length-1],red:c=>c.s===1||c.s===2};
  for(const key of ['scoundrel','longroad','savage','quiet','falk'])api.games[key].category='rpg';
  let current=null;
  const toggle=h('button','alt');toggle.id='rpg-bg';toggle.title='Change the background for RPG games';$('#g2t').querySelector('span').prepend(toggle);
  function theme(){const active=!!current&&api.games[current].category==='rpg';toggle.hidden=!active;toggle.textContent=sv.dungeon?'Dungeon background: On':'Dungeon background: Off';toggle.setAttribute('aria-pressed',String(!!sv.dungeon));$('#g2').classList.toggle('dungeon-scene',active&&!!sv.dungeon)}
  toggle.onclick=()=>{sv.dungeon=!sv.dungeon;persist();theme()};
  api.onOpen=key=>{current=key;theme()};api.leave=()=>{current=null;theme()};theme();
})();
