// Shared procedural motion libraries: 1,000 profiles for each game family.
(() => {
 const profiles=family=>Array.from({length:1000},(_,id)=>Object.freeze({id,family,path:id%10,strength:1+Math.floor(id/10)%10,tempo:Math.floor(id/100),duration:(family==='jewels'?140:190)+Math.floor(id/100)*9}));
 const libraries=Object.freeze({jewels:Object.freeze(profiles('jewels')),solitaire:Object.freeze(profiles('solitaire'))}),running=new Map();let sequence={jewels:0,solitaire:0};
 const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 function frames(profile,kind,dx=0,dy=0){const {path:p,strength:a}=profile,angle=(p-4.5)*(a+2),bend=(p%2?1:-1)*(a+3);let from='translate(0,0) scale(1)',middle='translate(0,0) scale(1)',to='translate(0,0) scale(1)',opacity=[1,1,1];
  if(kind==='move'||kind==='swap'||kind==='fall'){from='translate('+dx+'px,'+dy+'px)';middle='translate('+(dx*.32+(p%3===0?bend:0))+'px,'+(dy*.32-(p%3===1?a:0))+'px) rotate('+angle*.25+'deg)';}
  else if(kind==='clear'||kind==='remove'){middle='scale('+(1+a*.025)+') rotate('+angle+'deg)';to='translate('+bend+'px,'+(-a*2)+'px) scale(.15) rotate('+angle*2+'deg)';opacity=[1,.95,0]}
  else if(kind==='deal'||kind==='reveal'){from='translate('+bend+'px,'+(-8-a*2)+'px) rotate('+angle+'deg) scale('+(kind==='reveal'?'.65,1':'.85')+')';middle='translate(0,2px) scale(1.02)';opacity=[.1,1,1]}
  else if(kind==='invalid'){from='translateX(-'+a+'px)';middle='translateX('+a+'px)';}
  else {middle='translateY(-'+(2+a*.3)+'px) rotate('+angle*.1+'deg) scale('+(1+a*.006)+')'}
  return [{transform:from,opacity:opacity[0]},{transform:middle,opacity:opacity[1],offset:.6},{transform:to,opacity:opacity[2]}];
 }
 function play(element,family,kind,options={}){if(!element||!element.animate||reduced())return null;const profile=libraries[family][sequence[family]++%1000],animation=element.animate(frames(profile,kind,options.dx,options.dy),{duration:options.duration||profile.duration,delay:options.delay||0,easing:['ease-out','cubic-bezier(.2,.8,.3,1)','cubic-bezier(.15,.7,.4,1)'][profile.path%3],fill:'none'});running.set(animation,options.cleanup);animation.finished.catch(()=>{}).then(()=>{running.delete(animation);options.cleanup?.()});return animation}
 function cancel(){for(const [animation,cleanup]of running){animation.cancel();cleanup?.()}running.clear()}
 const api=window.CardArcade,host=document.querySelector('#g2b');let current=null,previous=new Map(),pending=false;
 const enabled=()=>current&&(current==='mahjong'||!['board','duel','rpg'].includes(api.games[current]?.category));
 function capture(){const seen=new Map(),result=new Map();for(const element of host.querySelectorAll('.card,.mah-tile')){const base=element.dataset.motionCard||element.getAttribute('aria-label')||'back',n=seen.get(base)||0;seen.set(base,n+1);result.set(base+':'+n,{element,rect:element.getBoundingClientRect(),up:element.classList.contains('up'),selected:element.classList.contains('sel')||!!element.closest?.('.chosen,.selected')})}return result}
 function update(){pending=false;if(!enabled()){previous.clear();return}const next=capture();let index=0;for(const [key,item]of next){index++;const old=previous.get(key),dx=old?old.rect.left-item.rect.left:0,dy=old?old.rect.top-item.rect.top:0;if(old&&old.up!==item.up)play(item.element,'solitaire','reveal');else if(old&&old.selected!==item.selected)play(item.element,'solitaire','select');else if(old&&(Math.abs(dx)>1||Math.abs(dy)>1))play(item.element,'solitaire','move',{dx,dy});else if(!old)play(item.element,'solitaire','deal',{delay:Math.min(90,index%8*9)})}
  let removed=0;for(const [key,item]of previous)if(!next.has(key)&&removed++<8&&item.rect.width&&item.rect.height&&!reduced()){const ghost=item.element.cloneNode(true);ghost.classList.add('motion-ghost');ghost.setAttribute('aria-hidden','true');ghost.removeAttribute('id');Object.assign(ghost.style,{left:item.rect.left+'px',top:item.rect.top+'px',width:item.rect.width+'px',height:item.rect.height+'px'});document.body.appendChild(ghost);if(!play(ghost,'solitaire','remove',{cleanup:()=>ghost.remove()}))ghost.remove()}
  previous=next;
 }
 if(typeof MutationObserver!=='undefined'){new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(update)}).observe(host,{childList:true,subtree:true})}
 host.addEventListener('click',event=>{if(enabled()){const button=event.target.closest('button');if(button)play(button,'solitaire','action')}});
 const onOpen=api.onOpen,leave=api.leave;api.onOpen=key=>{cancel();previous.clear();current=key;onOpen(key)};api.leave=()=>{current=null;previous.clear();cancel();leave()};
 window.ArcadeMotion={libraries,frames,play,cancel,reduced};
})();
