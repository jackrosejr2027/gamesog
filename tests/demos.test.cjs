// Uses a DOM implementation, not a browser. Install linkedom outside the project and set NODE_PATH.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const {parseHTML,Element}=require('linkedom');
const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
Object.defineProperty(Element.prototype,'innerHTML',{get:inner.get,set(value){inner.set.call(this,String(value))},configurable:true});
const html=fs.readFileSync('demo.html','utf8'),scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
async function runDemo(key){
 const {document,HTMLElement}=parseHTML(html),events={},timers=new Map(),messages=[],scheduledDelays=[];let clock=0,serial=0,storageCalls=0;
 HTMLElement.prototype.getContext=function(){return new Proxy({},{get:()=>()=>{}})};HTMLElement.prototype.toDataURL=function(){return 'data:image/png;base64,'};
 HTMLElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,width:60,height:90}};
 document.querySelector('#fx').getContext=()=>({clearRect(){},fillRect(){}});
 const context={document,console,fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),innerWidth:1100,innerHeight:820,URLSearchParams,location:{search:'?game='+encodeURIComponent(key)},localStorage:{getItem(){storageCalls++;throw Error('Sandbox storage blocked')},setItem(){storageCalls++;throw Error('Sandbox storage blocked')}},navigator:{},requestAnimationFrame:fn=>{const id=++serial;timers.set(id,{at:clock+16,fn});return id},setTimeout:(fn,ms=0)=>{scheduledDelays.push(ms);const id=++serial;timers.set(id,{at:clock+ms,fn});return id},clearTimeout:id=>timers.delete(id),setInterval:(fn,ms)=>{const id=++serial;timers.set(id,{at:clock+ms,fn,interval:ms});return id},clearInterval:id=>timers.delete(id),addEventListener:(name,fn)=>(events[name]||=[]).push(fn),parent:{postMessage:msg=>messages.push(msg)},btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')};
 context.window=context;vm.createContext(context);
 for(const file of scripts)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
 for(let i=0;i<30;i++)await Promise.resolve();
 const control=action=>{for(const fn of events.message||[])fn({source:context.parent,data:{type:'arcade-demo-control',action}})};
 assert([...timers.values()].some(t=>t.at===9000),key+' 10x opening delay');
 for(const fn of events.message||[])fn({source:{},data:{type:'arcade-card-style',readable:false}});assert(context.CardReadability.readable,'Reject foreign style message');
 for(const fn of events.message||[])fn({source:context.parent,data:{type:'arcade-card-style',readable:false}});assert(!context.CardReadability.readable,'Parent synchronizes Classic demo style');
 control('pause');assert(!messages.some(m=>m.event==='step'),key+' starts paused without taking a step');
 control('next');for(let i=0;i<16;i++)await Promise.resolve();assert.equal(messages.filter(m=>m.event==='step').length,1,key+' manual Next performs one action');
 assert.equal(messages.filter(m=>m.event==='step')[0].playing,false,key+' manual Next leaves autoplay paused');control('play');
 let turns=0;
 while(!messages.some(m=>m.event==='complete'||m.event==='error')&&turns++<16000){
  for(let n=0;n<12;n++)await Promise.resolve();
  const sorted=[...timers].sort((a,b)=>a[1].at-b[1].at),entry=sorted[0];if(!entry)break;
  const [id,t]=entry;clock=t.at;timers.delete(id);if(t.interval)timers.set(id,{...t,at:clock+t.interval});t.fn();
 }
 assert(scheduledDelays.includes(23000),key+' 10x autoplay delay');
 const error=messages.find(m=>m.event==='error');assert(!error,key+': '+error?.text);
 const steps=messages.filter(m=>m.event==='step');assert.equal(steps.length,50,key+' gets exactly fifty explained actions; last state '+JSON.stringify(messages.slice(-2)));
 assert(messages.some(m=>m.event==='complete'),key+' completes');assert(steps.every((m,i)=>m.step===i+1&&m.text.length>25));
 // The counter and moves stop at fifty even when the visitor asks for another step.
 for(const fn of events.message||[])fn({source:context.parent,data:{type:'arcade-demo-control',action:'next'}});
 for(let i=0;i<5;i++)await Promise.resolve();assert.equal(messages.filter(m=>m.event==='step').length,50);
 const count=messages.filter(m=>m.event==='step').length;control('previous');assert.equal(messages.at(-1).step,49,key+' previous step from completion');assert.equal(messages.at(-1).text,steps[48].text,key+' previous explanation restored');assert(document.querySelector('.demo-history-frame'),key+' prior board restored');assert(document.body.classList.contains('demo-review'));control('next');for(let i=0;i<5;i++)await Promise.resolve();assert.equal(messages.at(-1).step,50,key+' recorded forward step');assert.equal(messages.at(-1).text,steps[49].text);assert.equal(context.DemoSession.timeline.length,51,key+' recorded frames do not rerun actions');assert.equal(messages.filter(m=>m.event==='step').length,count+2);for(let i=0;i<50;i++)control('previous');assert.equal(messages.at(-1).step,0,key+' can rewind to the opening');control('previous');assert.equal(messages.at(-1).step,0);control('next');for(let i=0;i<5;i++)await Promise.resolve();assert.equal(messages.at(-1).step,1);assert.equal(messages.at(-1).text,steps[0].text,key+' first move exactly restored');control('play');for(let i=0;i<5;i++)await Promise.resolve();assert.equal(messages.at(-1).step,50,key+' resume returns to the live end');assert.equal(context.DemoSession.timeline.length,51);
 vm.runInContext('persist()',context);assert.equal(storageCalls,0,key+' demo neither reads nor writes player storage');
 return {context,steps};
}
(async()=>{
 const result=await runDemo('stack');const api=result.context.CardArcade,M=result.context.MagicArcade;
 const keys=['stack',...Object.keys(api.games),'hilo',...Object.keys(M.guides).map(k=>'magic:'+k)];assert.equal(keys.length,new Set(keys).size);
 const filter=process.argv.slice(2);for(const key of filter.length?filter:keys){if(key==='stack'&&!filter.length)continue;await runDemo(key);console.log('PASS',key,'50 actual explained actions')}
 console.log('PASS: demo counters, completed-session guards, real engine adapters, sandboxed storage, and all requested demo paths.');
})().catch(error=>{console.error(error);process.exitCode=1});
