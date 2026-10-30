// Shared same-device mode. Demo frames always use their isolated computer opponents.
(() => {
 const A=window.CardArcade,supported=new Set(['checkers','chinesecheckers','chess','backgammon','connectfour','othello','mancala','dominoes','dotsboxes','tictactoe','ginrummy','ordinary','pullcrest','classic-battleship']);
 let current=null,modes={},revealed=null,cover=null;
 if(!window.DemoSession)try{modes=JSON.parse(localStorage.getItem('arcade_opponents')||'{}')||{}}catch(e){}
 const local=()=>!window.DemoSession&&supported.has(current)&&modes[current]==='local';
 function clear(){cover?.remove();cover=null;const host=$('#g2b');host.classList.remove('local-private');host.inert=false;host.removeAttribute('aria-hidden')}
 const select=h('select','opponent-select');select.setAttribute('aria-label','Opponent');for(const [value,text]of [['computer','Vs computer'],['local','2 players · this device']]){const o=h('option','',text);o.value=value;select.appendChild(o)}$('#g2t').querySelector('span').prepend(select);
 select.onchange=()=>{if(!current)return;modes[current]=select.value;try{localStorage.setItem('arcade_opponents',JSON.stringify(modes))}catch(e){}A.open(current,{fresh:true})};
 const oldOpen=A.onOpen,oldLeave=A.leave;A.onOpen=key=>{clear();revealed=null;current=key;select.hidden=!!window.DemoSession||!supported.has(key);select.value=modes[key]||'computer';oldOpen(key)};A.leave=()=>{clear();revealed=null;current=null;select.hidden=true;oldLeave()};select.hidden=true;
 function shield(actor,finished=false){if(!local()||finished){clear();return}if(revealed===actor){clear();return}const host=$('#g2b');host.classList.add('local-private');host.inert=true;host.setAttribute('aria-hidden','true');if(cover)return;cover=h('div','local-handoff');cover.setAttribute('role','dialog');cover.setAttribute('aria-label','Pass the device');cover.append(h('h3','','Player '+(actor+1)),h('p','','Pass the device before revealing this hand.'));const b=h('button','','Reveal my turn');b.onclick=()=>{revealed=actor;clear()};cover.appendChild(b);$('#g2').appendChild(cover);b.focus()}
 window.LocalPlay={get local(){return local()},label:p=>local()?'Player '+(p+1):p?'Computer':'You',shield,clear};
})();
