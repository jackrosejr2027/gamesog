const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('js/page-themes.js','utf8');
function boot(saved,blocked=false){
 const selects=[],hosts={};
 function h(tag,cls,text){const el={tag,children:[],dataset:{},value:'',setAttribute(){},appendChild(child){this.children.push(child)},prepend(child){this.children.unshift(child)},querySelector(){return this}};if(tag==='select')selects.push(el);return el}
 for(const id of ['#top','#g2t','#mtop'])hosts[id]=h('div');
 const storage={value:saved,getItem(){if(blocked)throw Error('Storage blocked');return this.value},setItem(key,value){if(blocked)throw Error('Storage blocked');this.value=value}};
 const context={window:{},document:{documentElement:{dataset:{}},querySelectorAll:()=>selects},localStorage:storage,h,$:id=>hosts[id]};
 vm.runInNewContext(source,context);return {...context,selects,storage};
}
const app=boot(null),themes=app.window.ArcadeThemes;
assert.equal(themes.value,'felt');assert.equal(Object.keys(themes.names).length,21);
const css=fs.readFileSync('page-themes.css','utf8');
for(const name of Object.keys(themes.names)){
 themes.apply(name);assert.equal(app.document.documentElement.dataset.pageTheme,name);
 assert.equal(app.storage.value,name);for(const select of app.selects)assert.equal(select.value,name);
 if(name!=='felt')assert(css.includes('[data-page-theme='+name+']'),'Missing style '+name);
 assert.equal(boot(name).window.ArcadeThemes.value,name);
}
const extra=themes.control();assert.equal(extra.children[0].value,themes.value);
extra.children[0].value='ocean';extra.children[0].onchange();assert.equal(themes.value,'ocean');
themes.apply('unknown');assert.equal(themes.value,'ocean');
assert.equal(boot('unknown').window.ArcadeThemes.value,'felt');
assert.equal(boot(null,true).window.ArcadeThemes.value,'felt');
assert(css.includes('@media(prefers-reduced-motion:reduce)'));
assert(css.includes('html:where([data-page-theme]:not([data-page-theme=felt])){'),'Theme defaults must not override individual texture, glow and animation variables');
assert(css.includes('pointer-events')===false);
const html=fs.readFileSync('index.html','utf8');assert(html.includes('href="page-themes.css"'));assert(html.includes('src="js/page-themes.js"'));
console.log('Page themes: 21 choices, synchronized controls, persistence, invalid/blocked storage and reduced motion passed.');
