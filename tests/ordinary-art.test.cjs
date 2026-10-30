const fs=require('fs'),assert=require('assert'),crypto=require('crypto');
const hashes=new Set(),worker=fs.readFileSync('sw.js','utf8');
for(let f=0;f<6;f++)for(let t=0;t<8;t++){const path='ordinary/art/'+f+'-'+t+'.webp',image=fs.readFileSync(path);assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');assert(worker.includes("'"+path+"'"));hashes.add(crypto.createHash('sha256').update(image).digest('hex'));}assert.equal(hashes.size,48,'All art slots have distinct final image bytes (including recolored adaptations)');
for(const path of ['index.html','demo.html']){const html=fs.readFileSync(path,'utf8');assert(html.includes('ordinary/card-art.css'));assert(html.indexOf('ordinary/card-art.css')>html.indexOf('duel-screen.css'));}
const ui=fs.readFileSync('ordinary/ui.js','utf8');assert(!ui.includes('hue-rotate'));assert(ui.includes('?v=folk-1'));assert(worker.includes("'ordinary/card-art.css'"));
const css=fs.readFileSync('ordinary/card-art.css','utf8');assert(css.includes('.duel-screen .os-card .os-art{display:block'));assert(!css.includes('.pc-'),'Other card duels untouched');
console.log('PASS: all 48 replaced WebP slots, versioned art URLs, authored palettes, both entrypoints, short-screen art visibility, isolated frames and offline precaching.');
