// About and Release notes: hash routes (#about, #notes) overlaid on the game.
(() => {
  const IDS = { about: 'pg-about', notes: 'pg-notes' };
  const openKey = () => (IDS[location.hash.slice(1)] ? location.hash.slice(1) : null);
  const sync = () => {
    const k = openKey();
    for (const n in IDS) document.getElementById(IDS[n]).hidden = n !== k;
  };
  const go = k => { history.pushState({ pg: k }, '', '#' + k); sync(); };
  const close = () => {
    if (history.state && history.state.pg) history.back();
    else { history.replaceState(null, '', location.pathname + location.search); sync(); }
  };
  A.about = () => go('about');
  A.notes = () => go('notes');
  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('[data-close]')) close();
  });
  addEventListener('keydown', e => {
    if (!openKey()) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    else if (e.key === ' ' || /^[1-4]$/.test(e.key)) e.stopImmediatePropagation();
  }, true);
  addEventListener('popstate', sync);
  addEventListener('hashchange', sync);
  sync();
  let offlineText='Preparing offline library...';
  function offlineStatus(text){offlineText=text;for(const el of document.querySelectorAll('[data-offline-status]'))el.textContent=text}
  window.ArcadeOffline={refresh(){offlineStatus(offlineText)}};
  addEventListener('load', async () => {
    if(!('serviceWorker' in navigator)){offlineStatus('Offline install unavailable. Use the local ZIP.');return}
    try{
      const registration=await navigator.serviceWorker.register('sw.js');
      const watch=worker=>{
        offlineStatus('Downloading complete offline library...');
        const changed=()=>{
          if(worker.state==='activated')offlineStatus('Offline ready | Version 1.0');
          else if(worker.state==='redundant')offlineStatus('Offline install failed. Check free storage or use the ZIP.');
        };
        worker.addEventListener('statechange',changed);changed();
      };
      if(registration.installing)watch(registration.installing);
      else if(registration.waiting)watch(registration.waiting);
      else if(registration.active)offlineStatus('Offline ready | Version 1.0');
      registration.addEventListener('updatefound',()=>{if(registration.installing)watch(registration.installing)});
    }catch(error){offlineStatus('Offline install unavailable. Use the local ZIP.');console.warn('Offline installation unavailable:',error)}
  });
})();
