const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML,Element}=require('linkedom');
const desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{get:desc.get,set(v){desc.set.call(this,String(v))}});
const html=fs.readFileSync('index.html','utf8'),{document}=parseHTML(html),events={},timers=new Map(),storage=new Map();let serial=0;Element.prototype.focus=function(){};Element.prototype.getBoundingClientRect=function(){return {left:0,top:0,width:40,height:60}};document.querySelector('#fx').getContext=()=>({clearRect(){},fillRect(){}});
const ctx={console,document,innerWidth:1100,innerHeight:820,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),setInterval(){},clearInterval(){},requestAnimationFrame(){},addEventListener:(k,fn)=>(events[k]||=[]).push(fn),btoa:s=>Buffer.from(s).toString('base64')};ctx.window=ctx;vm.createContext(ctx);for(const [,file]of html.matchAll(/<script src="([^"]+)"/g))if(file!=='js/pages.js')vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});

const api=ctx.CardArcade,$=q=>document.querySelector(q);
const flush=async()=>{for(let n=0;n<40;n++)await Promise.resolve()};
const serialise=value=>JSON.stringify(value,(_k,v)=>v instanceof Set||Object.prototype.toString.call(v)==='[object Set]'?[...v]:v instanceof Map||Object.prototype.toString.call(v)==='[object Map]'?[...v]:v);
(async()=>{
 let count=0;
 for(const key of Object.keys(api.games)){
  const game=api.games[key];assert(game.session,'Session hook for '+key);
  api.open(key,{fresh:true});await flush();
  const before=serialise(game.session.capture());assert(before&&before!=='null','Started '+key);
  vm.runInContext('A.menu()',ctx);
  api.open(key==='freecell'?'klondike':'freecell');await flush();
  vm.runInContext('A.arcade('+JSON.stringify(key)+')',ctx);await flush();
  assert.equal($('#g2').dataset.game,key);
  assert.equal(serialise(game.session.capture()),before,'Menu retains '+key);
  count++;
 }
 api.open('klondike',{fresh:true});$('#k1 .pl').click();
 const stock=$('#k1 .mlab').textContent,board=$('#k2').innerHTML;
 $('#g2next').click();assert.equal($('#g2').dataset.game,'freecell');
 $('#g2prev').click();assert.equal($('#g2').dataset.game,'klondike');
 assert.equal($('#k1 .mlab').textContent,stock);assert.equal($('#k2').innerHTML,board);
 const last=ctx.GameNav.order().at(-1);api.open(last);$('#g2next').click();assert.equal($('#g2').dataset.game,'klondike');$('#g2prev').click();assert.equal($('#g2').dataset.game,last);
 api.open('klondike');[...document.querySelectorAll('#g2b button')].find(b=>b.textContent==='New game').click();assert.equal($('#k1 .mlab').textContent,'Stock 24');
 vm.runInContext("A.trick('binary')",ctx);
 [...document.querySelectorAll('#mact button')].find(b=>b.textContent==='I have a card in mind').click();
 const prompt=$('#mmsg').textContent,oracleCards=$('#mcols').innerHTML;
 vm.runInContext("A.menu();A.trick('liar');A.menu();A.trick('binary')",ctx);
 assert.equal($('#mmsg').textContent,prompt);assert.equal($('#mcols').innerHTML,oracleCards);
 vm.runInContext("A.menu();A.trick('classic')",ctx);
 [...document.querySelectorAll('#mact button')].find(b=>b.textContent==='I’m thinking of a card').click();await flush();
 const shuffle=$('#mmsg').textContent;
 vm.runInContext("A.menu();A.trick('binary')",ctx);
 const wait=[...timers].find(([,t])=>t.ms===900);assert(wait);timers.delete(wait[0]);wait[1].fn();await flush();
 vm.runInContext("A.menu();A.trick('classic')",ctx);await flush();
 assert.notEqual($('#mmsg').textContent,shuffle);assert($('#mcols .mcol.hot'),'Suspended core trick continues at the pile choice');
 console.log('PASS: all '+count+' registered games retain independent state via menu, arrows retain dealt cards and stock, arrows wrap, and New game explicitly resets.');
})().catch(error=>{console.error(error);process.exitCode=1});
