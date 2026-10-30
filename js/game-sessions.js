// Keep each engine's live state when leaving through any navigation path.
(() => {
  if(window.DemoSession)return;
  const api=window.CardArcade,saved=new Map();let current=null;
  function suspend(){
    if(!current)return;
    const key=current;current=null;
    const hook=api.games[key]?.session;
    if(hook){const state=hook.capture();if(state!=null)saved.set(key,state)}
  }
  const leave=api.leave,stop=api.stopSolitaire,open=api.open;
  api.leave=()=>{suspend();if(typeof cancelAdvance==='function')cancelAdvance();leave()};
  api.stopSolitaire=()=>{suspend();stop()};
  api.open=(key,options={})=>{
    const game=api.games[key];if(!game)return;
    api.leave();
    if(options.fresh)saved.delete(key);
    const start=game.s,snapshot=saved.get(key);
    if(snapshot&&game.session)game.s=()=>game.session.restore(snapshot);
    try{open(key);current=key}finally{game.s=start}
  };
  window.GameSessions={saved,suspend};
})();
