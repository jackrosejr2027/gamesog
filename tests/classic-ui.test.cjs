const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML,Element,HTMLElement}=require('linkedom');
const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{get:inner.get,set(v){inner.set.call(this,String(v))}});
HTMLElement.prototype.getContext=function(){return new Proxy({},{get:()=>()=>{}})};
const html=fs.readFileSync('index.html','utf8'),{document}=parseHTML(html),storage=new Map(),events={};
Element.prototype.focus=function(){};const commands=[];Object.defineProperty(Element.prototype,'contentWindow',{get(){return {postMessage:m=>commands.push(m)}}});
const ctx={document,console,innerWidth:1100,innerHeight:820,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},requestAnimationFrame(){},addEventListener:(k,fn)=>(events[k]||=[]).push(fn),btoa:s=>Buffer.from(s,'binary').toString('base64')};ctx.window=ctx;vm.createContext(ctx);
for(const [,path]of html.matchAll(/<script src="([^"]+)"/g)){if(path==='js/pages.js')continue;vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:path})}
const run=s=>vm.runInContext(s,ctx),C=ctx.ClassicCabinet,E=ctx.ClassicRules;
function config(s){const v=JSON.parse(JSON.stringify(s));for(const k of ['seed','started','notice'])delete v[k];return JSON.stringify(v)}
for(const type of Object.keys(C.definitions)){
 ctx.CardArcade.open('classic-'+type);const first=config(C.state);assert(document.querySelector('[aria-label="Classic game level 1 to 100"]'),type+' level selector');
 const newGame=[...document.querySelectorAll('#g2b button')].find(b=>b.textContent==='New game');assert(newGame);newGame.click();assert.notEqual(config(C.state),first,type+' New game config');assert.equal(C.history.length,0);
 const input=document.querySelector('[aria-label="Classic game level 1 to 100"]');input.value=100;[...document.querySelectorAll('#g2b button')].find(b=>b.textContent==='Go to level').click();assert.equal(C.state.level,100,type+' level selection');assert(document.querySelector('.sol-status').textContent.includes('Level 100 / 100'));
 assert.equal(C.state.pace,E.create(type,100,4).pace,type+' difficulty applied');assert(C.state.profile.length);
 C.stop();console.log('PASS',type,'New game and level controls');
}
assert.equal(Object.keys(ctx.ArcadeThemes.names).length,21);
run('A.carousel()');assert(document.querySelector('[data-a=demoPrevious]').disabled);run('A.demoPrevious()');assert.equal(commands.at(-1).action,'previous');
for(const [game,board] of [['pegsolitaire','.peg-board'],['chinesecheckers','.star-board']]){ctx.CardArcade.open(game);const before=document.querySelector(board).innerHTML;const button=[...document.querySelectorAll('#g2b button')].find(b=>b.textContent==='New game');button.click();assert.notEqual(document.querySelector(board).innerHTML,before,game+' new configuration');assert(document.querySelector('.level-input'),game+' difficulty control');console.log('PASS',game,'shared Classic restart and level controls')}
console.log('PASS: all Classic UI restart/level controls and demo Previous control.');
