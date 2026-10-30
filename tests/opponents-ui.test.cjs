const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML,Element}=require('linkedom');
const desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{get:desc.get,set(v){desc.set.call(this,String(v))}});
const html=fs.readFileSync('index.html','utf8'),{document}=parseHTML(html),events={},timers=new Map(),storage=new Map();let serial=0;Element.prototype.focus=function(){};Element.prototype.getBoundingClientRect=function(){return {left:0,top:0,width:40,height:60}};document.querySelector('#fx').getContext=()=>({clearRect(){},fillRect(){}});
const ctx={console,document,innerWidth:1100,innerHeight:820,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),setInterval(){},clearInterval(){},requestAnimationFrame(){},addEventListener:(k,fn)=>(events[k]||=[]).push(fn),btoa:s=>Buffer.from(s).toString('base64')};ctx.window=ctx;vm.createContext(ctx);for(const [,file]of html.matchAll(/<script src="([^"]+)"/g))if(file!=='js/pages.js')vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});

const jobs=[];
ctx.Worker=class {constructor(path){assert.equal(path,'js/board-worker.js');jobs.push(this)}postMessage(state){this.state=state}terminate(){this.terminated=true}};
const R=ctx.MoreBoardRules,B=ctx.MoreBoardArcade,$=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
function tick(ms){const entry=[...timers].find(([,t])=>t.ms===ms);assert(entry,'Timer '+ms);timers.delete(entry[0]);entry[1].fn()}
function click(text){const b=$$('#g2b button').find(b=>b.textContent===text&&!b.disabled);assert(b,text);b.click()}
function cpu(){ctx.CardArcade.open('connectfour',{fresh:true});B.commit({type:'drop',c:3});tick(380);return jobs.at(-1)}
let job=cpu();const before=B.s.ply;job.onmessage({data:{move:{type:'drop',c:0}}});assert(job.terminated);assert.equal(B.s.ply,before+1);const after=B.s.ply;job.onmessage({data:{move:{type:'drop',c:1}}});assert.equal(B.s.ply,after,'Duplicate worker reply ignored');
job=cpu();job.onmessage({data:{move:{type:'drop',c:99}}});assert.equal(B.s.turn,0,'Invalid worker move recovers');assert.equal(B.s.ply,2);assert(job.terminated);
job=cpu();job.onerror(new Error('worker unavailable'));assert.equal(B.s.turn,0,'Worker exception recovers');assert.equal(B.s.ply,2);
job=cpu();tick(6000);assert.equal(B.s.turn,0,'Hung worker recovers');assert(job.terminated);job.onmessage({data:{move:{type:'drop',c:0}}});assert.equal(B.s.ply,2,'Late watchdog reply ignored');
job=cpu();ctx.CardArcade.open('othello');job.onmessage({data:{move:{type:'drop',c:0}}});assert.equal(B.s.type,'othello');assert.equal(B.s.ply,0,'Switching games invalidates old worker replies');assert(job.terminated);
job=cpu();B.start('connectfour',1000);job.onmessage({data:{move:{type:'drop',c:0}}});assert.equal(B.s.level,1000);assert.equal(B.s.ply,0,'Changing difficulty invalidates old worker replies');
// An exception in the main-thread fallback still commits a legal move.
job=cpu();const oldAI=R.ai;R.ai=()=>{throw Error('forced search failure')};job.onerror();R.ai=oldAI;assert.equal(B.s.ply,2);assert.equal(B.s.turn,0);
for(const type of ['checkers','chinesecheckers','mancala','dominoes','dotsboxes']){
 ctx.CardArcade.open(type);const input=$('.level-input');assert(input,type+' difficulty control');input.value=750;click('Go to level');assert.equal($('.level-input').value,'750');ctx.CardArcade.open('memory');ctx.CardArcade.open(type);assert.equal($('.level-input').value,'750',type+' saved difficulty');
}
ctx.CardArcade.open('checkers',{fresh:true});const squares=$$('.check-square');const state=Array(64).fill(0);for(let r=0;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2&&(r<3||r>4))state[r*8+c]=r<3?-1:1;const move=ctx.BoardRules.checkersMoves(state,1)[0];squares[move.from].click();$$('.check-square')[move.to].click();tick(240);job=jobs.at(-1);assert.equal(job.state.type,'checkers');assert.equal(job.state.level,750);const valid=ctx.BoardRules.checkBest(job.state.board,-1,1);job.onmessage({data:{move:valid}});assert(job.terminated);assert($$('.check-square').some(b=>!b.disabled),'Checkers worker hands turn back');
// Checkers worker failure uses a bounded legal fallback and leaves a playable board.
ctx.CardArcade.open('checkers',{fresh:true});$$('.check-square')[move.from].click();$$('.check-square')[move.to].click();tick(240);job=jobs.at(-1);job.onmessage({data:{move:{from:-5,to:100}}});assert(job.terminated);assert($$('.check-square').some(b=>!b.disabled));
ctx.CardArcade.open('checkers',{fresh:true});$$('.check-square')[move.from].click();$$('.check-square')[move.to].click();tick(240);job=jobs.at(-1);ctx.CardArcade.open('mancala');job.onmessage({data:{move:valid}});assert(job.terminated);assert.equal($$('.mancala-pit').length,12,'Legacy stale worker cannot overwrite a different game');
for(const type of ['mancala','chinesecheckers']){
 ctx.CardArcade.open(type);if(type==='mancala')$('.human-pit').click();else{const board=Array(121).fill(0);ctx.BoardRules.camps[3].forEach(i=>board[i]=1);ctx.BoardRules.camps[0].forEach(i=>board[i]=2);const m=ctx.BoardRules.starMoves(board,1)[0];$$('.star-hole')[m.from].click();$$('.star-hole')[m.to].click()}
 const ms=type==='mancala'?2250:240,entry=[...timers.values()].find(t=>t.ms===ms);assert(entry);const stale=entry.fn;tick(ms);job=jobs.at(-1);assert.equal(job.state.type,type);tick(5000);assert(job.terminated,'Legacy watchdog recovers '+type);const count=jobs.length;stale();assert.equal(jobs.length,count,'Old timer cannot start a second CPU turn');
}
// Reviewed game-experience regressions.
ctx.CardArcade.open('chinesecheckers',{fresh:true});
const opening=$$('.star-hole').map(el=>el.getAttribute('aria-label'));
for(const i of ctx.BoardRules.camps[3])assert(opening[i].includes('your marble'));
for(const i of ctx.BoardRules.camps[0])assert(opening[i].includes('computer marble'));
click('New game');assert.deepEqual($$('.star-hole').map(el=>el.getAttribute('aria-label')),opening,'Chinese Checkers restarts in the standard camps, not a scrambled midgame');
B.start('tictactoe',1000);assert($('.mb-difficulty').textContent.includes('perfect'));
$('.level-input').value=1;click('Go to level');assert.equal(B.s.level,1);assert($('.mb-difficulty').textContent.includes('Beginner'));
ctx.CardArcade.open('memory');ctx.CardArcade.open('tictactoe');assert.equal(B.s.level,1,'Tic-Tac-Toe difficulty persists');
B.start('connectfour',500);B.s.board[35]=B.s.board[36]=B.s.board[37]=1;B.s.turn=0;

assert(B.commit({type:'drop',c:3}));assert(B.s.done&&B.s.winner===0);
for(const [id,t]of [...timers])if(t.ms===1800){timers.delete(id);t.fn()}
assert(B.s.done&&B.s.level===500,'Competitive result stays visible after the toast expires');
console.log('PASS: standard Chinese openings, persistent Tic-Tac-Toe skill selection, and non-disappearing competitive results.');
console.log('PASS: legal recovery from worker errors, invalid replies, timeouts and thrown search; duplicate/late result rejection; restart/game-switch cancellation; original-board worker moves and persisted difficulty controls.');
