// Previous and next arrows beside the open game's title. Order follows the carousel.
(() => {
  const arcade = window.CardArcade;
  const g2 = document.getElementById('g2'), title = document.getElementById('g2h');
  if (!arcade || !g2 || !title) return;
  const skip = k => k === 'hilo' || k === 'stack' || k.startsWith('magic:');
  function order() {
    const seen = new Set(), keys = [];
    for (const e of window.CarouselArcade?.entries || []) {
      if (skip(e.key) || seen.has(e.key) || !arcade.games[e.key]) continue;
      seen.add(e.key);
      keys.push(e.key);
    }
    return keys;
  }
  const current = () => {
    const key = g2.dataset.game, game = arcade.games[key];
    return key && game && title.textContent === game.t ? key : null;
  };
  const button = (id, label, text) => {
    const b = document.createElement('button');
    b.id = id; b.type = 'button'; b.className = 'alt';
    b.textContent = text; b.title = label; b.setAttribute('aria-label', label);
    return b;
  };
  const prev = button('g2prev', 'Previous game', '\u2039');
  const next = button('g2next', 'Next game', '\u203a');
  const heading=document.createElement('div');heading.className='game-title-nav';
  title.before(heading);heading.append(prev,title,next);
  function step(d) {
    const list = order(), key = current(), i = list.indexOf(key);
    if (i < 0) return;
    if (typeof g !== 'undefined' && g && g.busy) {
      if (typeof toast === 'function') toast('Finishing this turn...');
      return;
    }
    const target = list[(i + d + list.length) % list.length];
    arcade.stopSolitaire();
    arcade.leave();
    window.MagicArcade.stop();
    window.MagicArcade.stopExtra();
    document.getElementById('box').classList.remove('arcade-box');
    arcade.open(target);
  }
  prev.onclick = () => step(-1);
  next.onclick = () => step(1);
  function sync() {
    const key = current();
    const show = !!key && g2.style.display !== 'none' && order().length > 1 && order().includes(key);
    prev.hidden = next.hidden = !show;
  }
  if (typeof MutationObserver === 'function') {
    new MutationObserver(sync).observe(title, { childList: true, characterData: true, subtree: true });
    new MutationObserver(sync).observe(g2, { attributes: true, attributeFilter: ['style', 'data-game'] });
  }
  const open = arcade.open;
  arcade.open = (...args) => { const result=open(...args); sync(); return result; };
  window.GameNav = { order };
  sync();
})();
