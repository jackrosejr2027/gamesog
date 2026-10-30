const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML,Element}=require('linkedom');
const desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{get:desc.get,set(v){desc.set.call(this,String(v))}});
const html=fs.readFileSync('index.html','utf8'),{document}=parseHTML(html),events={},timers=new Map(),storage=new Map();let serial=0;Element.prototype.focus=function(){};Element.prototype.getBoundingClientRect=function(){return {left:0,top:0,width:40,height:60}};document.querySelector('#fx').getContext=()=>({clearRect(){},fillRect(){}});
const ctx={console,document,innerWidth:1100,innerHeight:820,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),setInterval(){},clearInterval(){},requestAnimationFrame(){},addEventListener:(k,fn)=>(events[k]||=[]).push(fn),btoa:s=>Buffer.from(s).toString('base64')};ctx.window=ctx;vm.createContext(ctx);for(const [,file]of html.matchAll(/<script src="([^"]+)"/g))if(file!=='js/pages.js')vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const api=ctx.CardArcade,B=ctx.MoreBoardArcade,R=ctx.MoreBoardRules,$=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)],click=text=>{const b=$$('#g2b button').find(b=>b.textContent===text&&!b.disabled);assert(b&&!b.disabled,'Button '+text);b.click()};
vm.runInContext('A.arcadeView("grid")',ctx);
const names=['Board Games','Card Puzzles','Solo Adventures','Classic Games','Ticket Games','Stack Showdown','Card Duels'],keys=new Set();let count=0;
for(const name of names){
 const section=$$('.hub-collection').find(s=>s.querySelector('.hub-label').textContent===name);assert(section,name);
 const buttons=[...section.querySelectorAll('.arcade-tile')];assert(buttons.length,name+' populated');
 for(const b of buttons){const img=b.querySelector('.game-art img');assert(img,name+': '+b.dataset.v);assert(b.classList.contains('illustrated'));assert(fs.existsSync(img.getAttribute('src')));assert.equal(img.getAttribute('alt'),'');assert.equal(img.getAttribute('loading'),'lazy');assert(b.dataset.preview);keys.add(b.dataset.v);count++}
}
assert.equal(keys.size,83);assert.equal(count,85);assert.equal($$('.illustrated').length,88);
for(const b of $$('[data-a=trick]'))assert(!b.querySelector('img'),'Card Tricks unchanged');
for(const key of ['klondike','freecell','spider'])assert($('[data-a=arcade][data-v="'+key+'"] img').getAttribute('src').endsWith('-editorial.png'));
const worker=fs.readFileSync('sw.js','utf8');for(const key of keys)assert(worker.includes("'img/game-art/"+key+".webp'"),key+' offline');
const memory=$('[data-a=arcade][data-v=memory]');$('#box').onclick({target:memory.querySelector('img')});assert.equal($('#g2h').textContent,api.games.memory.t);
for(const view of ['shelves','grid','list','compact','compactlist','paper','neon']){vm.runInContext('A.arcadeView("'+view+'")',ctx);assert.equal($('#box').dataset.view,view);if(view==='shelves')vm.runInContext('A.shelfCategory("Board Games")',ctx);assert($$('.arcade-tile').length);}
assert.equal(Object.keys(api.games).length,114,'No games changed');
console.log('PASS: 83 unique artworks cover all 85 requested collection entries, original Solitaire art, unchanged Card Tricks, image-click launching, seven layouts and offline precaching.');
