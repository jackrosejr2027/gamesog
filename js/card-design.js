// Presentation only: ranks, suits, motion identities and click targets stay intact.
(() => {
 const layouts={
  2:[[50,18],[50,82]],
  3:[[50,18],[50,50],[50,82]],
  4:[[24,18],[76,18],[24,82],[76,82]],
  5:[[24,18],[76,18],[50,50],[24,82],[76,82]],
  6:[[24,18],[76,18],[24,50],[76,50],[24,82],[76,82]],
  7:[[24,18],[76,18],[50,34],[24,50],[76,50],[24,82],[76,82]],
  8:[[24,18],[76,18],[50,34],[24,50],[76,50],[50,66],[24,82],[76,82]],
  9:[[24,14],[76,14],[24,38],[76,38],[50,50],[24,62],[76,62],[24,86],[76,86]],
  10:[[24,14],[76,14],[50,26],[24,38],[76,38],[24,62],[76,62],[50,74],[24,86],[76,86]]
 };
 const original=card;
 card=function(c,up){
  const d=original(c,up),face=d.querySelector('.f'),rank=R[c.r],suit=S[c.s];
  d.dataset.rank=rank;d.dataset.suit=String(c.s);
  const art=h('div','deck-art');art.setAttribute('aria-hidden','true');
  if(['J','Q','K'].includes(rank)){
   art.classList.add('deck-court');const img=document.createElement('img');img.src='img/court-'+rank.toLowerCase()+'.webp';img.alt='';img.draggable=false;art.appendChild(img);
  }else{
   const points=rank==='A'?[[50,50]]:layouts[Number(rank)];
   for(const [x,y]of points||[]){const pip=h('i','deck-pip'+(y>50?' inverted':''),suit);pip.style.left=x+'%';pip.style.top=y+'%';art.appendChild(pip)}
  }
  const bottom=h('div','deck-bottom','<b>'+rank+'</b><i>'+suit+'</i>');bottom.setAttribute('aria-hidden','true');
  face.append(art,bottom);return d;
 };
 const api=window.CardArcade,previous=api.onOpen;
 api.onOpen=key=>{const game=api.games[key];document.getElementById('g2').classList.toggle('solitaire-deck',!!game&&!['rpg','board','duel','classic'].includes(game.category));previous?.(key)};
})();
