(() => {
 const KEY='arcade_card_style';
 // [id, name, background-color, background-image, ink, red suit, border]
 const looks=[
  ['mint','Mint','#eefbf3','none','#123d2a','#b3261e','#2e7d5b'],
  ['sky','Sky','#eef6ff','none','#13294b','#c2185b','#3b6ea5'],
  ['rose','Rose','#fff0f3','none','#4a1020','#c4123f','#b5556d'],
  ['lavender','Lavender','#f4f0ff','none','#2b1f57','#b0245e','#7b61c4'],
  ['sand','Sand','#f7efdc','none','#3d2e12','#a33b1d','#9c7a3c'],
  ['night','Night','#1b2233','none','#f2f4f8','#ff6b81','#5a6785'],
  ['slate','Slate','#2f3a4a','none','#eef2f7','#ff8a80','#7d8ba0'],
  ['gold','Gold','#fff7d6','linear-gradient(160deg,#fff7d6,#f3d277)','#3a2a00','#9b1c1c','#b8860b'],
  ['forest','Forest','#1f3d2b','none','#e8f5ec','#ffb4a2','#4f8a64'],
  ['ocean','Ocean','#e0f7fa','linear-gradient(160deg,#e0f7fa,#80cbc4)','#00363a','#b71c1c','#00897b'],
  ['sunset','Sunset','#ffe0b2','linear-gradient(160deg,#ffe0b2,#ffab91)','#4e1d12','#8b0000','#d84315'],
  ['plum','Plum','#3b1d43','none','#f6e9fb','#ff9fc0','#8e5a9b'],
  ['espresso','Espresso','#3e2a1e','none','#f5e6d3','#ff8a65','#8d6e63'],
  ['frost','Frost','#f5fbff','repeating-linear-gradient(45deg,#ffffff 0 6px,#e6f2fb 6px 12px)','#0d2a44','#c62828','#90caf9'],
  ['newsprint','Newsprint','#f4f1ea','none','#222222','#333333','#888888'],
  ['blueprint','Blueprint','#1d3f75','repeating-linear-gradient(0deg,rgba(255,255,255,.12) 0 1px,transparent 1px 12px),repeating-linear-gradient(90deg,rgba(255,255,255,.12) 0 1px,transparent 1px 12px)','#e3f2fd','#ffd54f','#90caf9'],
  ['candy','Candy','#ffffff','repeating-linear-gradient(90deg,#ffffff 0 10px,#fde2ec 10px 20px)','#5c0a3a','#d81b60','#f48fb1'],
  ['teal','Teal','#e0f2f1','none','#004d40','#d84315','#26a69a'],
  ['honey','Honey','#fff8e1','none','#5d4037','#e65100','#ffb300'],
  ['charcoal','Charcoal','#2a2a2a','none','#f0f0f0','#ff5252','#666666'],
  ['lilac','Lilac','#fbf7ff','radial-gradient(circle at 20% 15%,#efe6fb,transparent 60%),radial-gradient(circle at 85% 85%,#efe6fb,transparent 55%)','#3c2a5c','#b5179e','#c8b6e2'],
  ['terracotta','Terracotta','#f6e3d3','none','#4a2315','#b23a2e','#c0704f'],
  ['midnight-gold','Midnight Gold','#0f1d35','none','#f5d76e','#ff7675','#c9a227'],
  ['pastel','Pastel','#fdfbff','linear-gradient(160deg,#fdfbff,#dff3ff)','#2d3a5a','#e0457b','#a8d8ff'],
  ['linen','Linen','#f3ecdf','repeating-linear-gradient(0deg,rgba(120,90,50,.06) 0 1px,transparent 1px 3px)','#2b2118','#9e2b25','#b9a98a']
 ];
 const styles=[{id:'clear',name:'Clear'},{id:'classic',name:'Classic'},...looks.map(([id,name])=>({id,name}))];
 const css=looks.map(([id,,bg,image,ink,red,border])=>{const p='html.card-look-'+id+' .card .f';return 'html.card-look-'+id+'{--playing-bg:'+bg+';--playing-image:'+image+';--playing-ink:'+ink+';--playing-red:'+red+';--playing-edge:'+border+'}'+p+'{background-color:'+bg+';background-image:'+image+';color:'+ink+';border-color:'+border+'}'+p+'.red{color:'+red+'}'+p+' span,'+p+' small{background:transparent}'}).join('');
 const sheet=document.createElement('style');sheet.id='card-look-styles';sheet.textContent=css;document.head.appendChild(sheet);
 const valid=id=>styles.some(s=>s.id===id);
 let style='clear';
 if(!window.DemoSession)try{const saved=localStorage.getItem(KEY);if(valid(saved))style=saved;else if(localStorage.getItem('arcade_readable_cards')==='classic')style='classic'}catch(e){}
 const selects=[];
 const apply=()=>{
  const root=document.documentElement;
  root.classList.toggle('readable-cards',style!=='classic');
  for(const s of styles)if(s.id!=='clear'&&s.id!=='classic')root.classList.toggle('card-look-'+s.id,s.id===style);
  for(const s of selects)s.value=style;
  for(const frame of document.querySelectorAll('.demo-board-frame'))frame.contentWindow?.postMessage({type:'arcade-card-style',style,readable:style!=='classic'},'*');
 };
 const choose=id=>{if(!valid(id))return;style=id;if(!window.DemoSession)try{localStorage.setItem(KEY,style)}catch(e){}apply()};
 const picker=(id,label)=>{const s=h('select','card-style-select');if(id)s.id=id;s.setAttribute('aria-label','Card style');s.title='Card style: changes how playing cards look';for(const st of styles){const o=h('option','',st.name);o.value=st.id;s.appendChild(o)}s.onchange=()=>choose(s.value);selects.push(s);return s};
 if(!window.DemoSession){
  $('#top>div').prepend(picker('card-readability'));
  $('#g2t>span').prepend(picker(''));
  $('#mtop').appendChild(picker(''));
  addEventListener('message',event=>{if(event.data?.type==='arcade-card-style-ready'&&[...document.querySelectorAll('.demo-board-frame')].some(f=>f.contentWindow===event.source))event.source.postMessage({type:'arcade-card-style',style,readable:style!=='classic'},'*')});
 }else{
  addEventListener('message',event=>{if(event.source===parent&&event.data?.type==='arcade-card-style'){const id=event.data.style||(event.data.readable===false?'classic':'clear');style=valid(id)?id:'clear';apply()}});
  parent.postMessage({type:'arcade-card-style-ready'},'*');
 }
 apply();
 window.CardReadability={get readable(){return style!=='classic'},get style(){return style},styles:styles.map(s=>({id:s.id,name:s.name})),choose};
})();
