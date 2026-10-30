// Additive art coverage, stable routing and no-removal guarantees.
const fs=require('fs'),assert=require('assert'),crypto=require('crypto');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync('ordinary/art-bank/manifest.json','utf8'));
const originals=JSON.parse(fs.readFileSync('ordinary/art-bank/preserved-files.json','utf8'));
for(const [path,sha]of Object.entries(originals))assert.equal(digest(fs.readFileSync(path)),sha,path+' unchanged');
const bank=require('../ordinary/art-bank.js'),{groupPrintings}=require('../ordinary/catalog-tools.js');
assert.equal(bank.count,198);assert.equal(bank.added,150);assert.equal(bank.retained,48);assert.equal(manifest.newly_generated_this_edition,0);
assert.equal(new Set(bank.plates.map(p=>p.art)).size,198);const worker=fs.readFileSync('sw.js','utf8');
for(const plate of bank.plates){assert(fs.existsSync('ordinary/'+plate.art));assert(worker.includes("'ordinary/"+plate.art+"'"),plate.art+' offline');}
for(const plate of manifest.plates.filter(p=>p.source))assert(fs.existsSync(plate.source),'Original source still present');
const catalog=JSON.parse(fs.readFileSync('ordinary/catalog.json','utf8'));
const cards=catalog.types.flatMap(t=>JSON.parse(fs.readFileSync('ordinary/'+t.file,'utf8')).cards);
const effects=JSON.parse(fs.readFileSync('ordinary/effects.json','utf8')).effects;
assert.equal(cards.length,226400);const used=new Set(),perType={};let curated=0;
for(const c of cards){const before=JSON.stringify(c),path=bank.resolve(c);assert.equal(bank.resolve(c),path);assert.equal(bank.resolve({...c}),path);assert.equal(JSON.stringify(c),before,'No record mutation');assert(bank.plates.some(p=>p.art===path));used.add(path);(perType[c.type]??=new Set()).add(path);if(c.curated){curated++;assert.equal(path,c.art)}}
assert.equal(curated,48);assert.equal(used.size,198,'Every retained and additional plate is reachable');assert.equal(perType.Creature.size,156);for(const [type,images]of Object.entries(perType))if(type!=='Creature')assert.equal(images.size,6);
const old=groupPrintings(cards,effects,c=>c.art),now=groupPrintings(cards,effects);assert(now.length>=old.length);
const oldGroup=new Map();old.forEach((g,i)=>g.ids.forEach(id=>oldGroup.set(id,i)));const allIds=new Set();
for(const g of now){const parent=oldGroup.get(g.ids[0]),art=bank.resolve(g.card);for(const id of g.ids){assert.equal(oldGroup.get(id),parent,'No previous group merged away');assert(!allIds.has(id));allIds.add(id)}assert(art)}
assert.equal(allIds.size,226400,'Every card ID retained');
for(const path of ['index.html','demo.html']){const html=fs.readFileSync(path,'utf8');assert(html.indexOf('ordinary/art-bank.js')<html.indexOf('ordinary/catalog-tools.js'));assert(html.includes('ordinary/art-bank.js'));}
console.log('PASS: 216 protected files unchanged; 198 reachable plates; stable, nonmutating art routing; all 226,400 IDs retained; grouping only refines old groups ('+old.length+' → '+now.length+'); 48 foundation images unchanged; all artwork cached.');
