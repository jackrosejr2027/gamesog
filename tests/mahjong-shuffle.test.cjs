const fs=require('fs'),vm=require('vm'),assert=require('assert');const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/board-rules.js','utf8'),ctx);const R=ctx.window.BoardRules;
let mirrored=0,comparable=0;const boundary=new Set();
for(const level of [1,50,200,201,400,600,800,999,1000]){
 const fingerprints=new Set(),openings=new Set();
 for(let seed=1;seed<=40;seed++){
  const d=R.mahDeal(level,seed),tiles=d.tiles;assert.equal(d.seed,seed);assert.equal(d.solution.length*2,tiles.length);
  const fingerprint=JSON.stringify(tiles.map(t=>t.face));fingerprints.add(fingerprint);
  if(seed===1)assert.equal(JSON.stringify(R.mahDeal(level,seed).tiles.map(t=>t.face)),fingerprint,'Explicit seed replays its deal');
  const free=tiles.filter(t=>R.mahFree(tiles,t.id));openings.add(free.map(t=>t.face).join(','));
  const counts=new Map();for(const t of tiles)counts.set(t.face,(counts.get(t.face)||0)+1);assert([...counts.values()].every(n=>n%2===0&&n<=4));
  for(const a of free){const b=free.find(t=>t.x===9-a.x&&t.y===a.y&&t.z===a.z);if(b){comparable++;if(a.face===b.face)mirrored++}}
  for(const [a,b]of d.solution){assert.notEqual(a,b);assert(R.mahFree(tiles,a)&&R.mahFree(tiles,b));assert.equal(tiles[a].face,tiles[b].face);tiles[a].gone=tiles[b].gone=true}assert(tiles.every(t=>t.gone));
 }
 assert.equal(fingerprints.size,40,'Fresh seeds create distinct deals at level '+level);assert.equal(openings.size,40,'Outside/free tiles change at level '+level);boundary.add(level);
}
assert(comparable>0);assert(mirrored/comparable<.35,'Mirrored outer tiles must not automatically match');
console.log('PASS 360 seeded randomized deals across nine difficulty boundaries: all solvable, outside faces varied, face counts even and at most four; mirrored opening match rate '+(100*mirrored/comparable).toFixed(1)+'%.');
