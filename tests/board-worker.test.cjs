const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const messages=[],ctx={postMessage:m=>messages.push(m)};ctx.self=ctx;vm.createContext(ctx);ctx.importScripts=(...files)=>files.forEach(f=>vm.runInContext(fs.readFileSync(path.resolve('js',f),'utf8'),ctx,{filename:f}));vm.runInContext(fs.readFileSync('js/board-worker.js','utf8'),ctx);const R=ctx.MoreBoardRules;
for(const type of ['chess','connectfour','othello','backgammon']){let s=R.create(type,1000,1999);if(type==='backgammon')s=R.apply(s,{type:'roll'});ctx.onmessage({data:s});assert(!messages.at(-1).error);assert(R.apply(s,messages.at(-1).move),type+' worker returns a legal move')}
const B=ctx.BoardRules;
for(const level of [1,500,1000]){
 let board=Array(64).fill(0);for(let r=0;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2&&(r<3||r>4))board[r*8+c]=r<3?-1:1;
 ctx.onmessage({data:{type:'checkers',board,turn:-1,level,seen:new Map()}});assert(!messages.at(-1).error);assert(B.checkersMoves(board,-1).some(m=>JSON.stringify(m)===JSON.stringify(messages.at(-1).move)));
 board=Array(14).fill(4);board[6]=board[13]=0;ctx.onmessage({data:{type:'mancala',board,turn:1,level}});assert(!messages.at(-1).error);assert(B.mancalaApply(board,1,messages.at(-1).move));
 board=Array(121).fill(0);B.camps[3].forEach(i=>board[i]=1);B.camps[0].forEach(i=>board[i]=2);ctx.onmessage({data:{type:'chinesecheckers',board,turn:2,level,seen:new Map()}});assert(!messages.at(-1).error);const m=messages.at(-1).move;assert(B.starTargets(board,m.from,B.camps[3]).has(m.to));
}
console.log('PASS: local workers load every dependency and return legal moves for seven search-based opponents, including original boards at three difficulty boundaries.');
