// Searches run away from the interactive board. Only public/local game state is passed.
self.window=self;
importScripts('../vendor/chess.js','board-rules.js','board-ai.js','more-board-rules.js');
self.onmessage=event=>{
 try{const s=event.data,R=self.BoardRules;const move=s.type==='checkers'?R.checkBest(s.board,s.turn,s.level,s.seen):s.type==='mancala'?R.manBest(s.board,s.turn,s.level):s.type==='chinesecheckers'?R.starBest(s.board,s.turn,s.seen,s.level):self.MoreBoardRules.ai(s);self.postMessage({move})}
 catch(error){self.postMessage({error:String(error.message||error)})}
};
