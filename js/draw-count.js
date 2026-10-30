(() => {
  // Stored Draw 1 / Draw 3 choice shared by the Klondike, pyramid and stock-based solitaire games.
  const key='arcade_draw_count';let count=1;
  if(!window.DemoSession)try{count=localStorage.getItem(key)==='3'?3:1}catch(e){}
  const label=()=>'Draw '+count;
  window.DrawCount={
    get count(){return count},
    button(onChange){
      const b=h('button','alt',label());
      b.title='Turn over one or three cards from the stock';
      b.onclick=()=>{
        count=count===1?3:1;
        if(!window.DemoSession)try{localStorage.setItem(key,String(count))}catch(e){}
        onChange();
      };
      return b;
    }
  };
})();
