// Keep immutable rendered frames: revisiting a step never reruns random deals or actions.
(() => {
 const frames=[],D=window.DemoSession;let review=null;
 function live(){review?.remove();review=null;document.body.classList.remove('demo-review')}
 function record(text,round){
  live();const roots=['board','g2','magic','modal'].map(id=>document.getElementById(id)).filter(Boolean);
  const html=roots.map(root=>{const copy=root.cloneNode(true);
   const originals=root.querySelectorAll('input,select,textarea'),inputs=copy.querySelectorAll('input,select,textarea');
   originals.forEach((input,i)=>{const target=inputs[i];target.value=input.value;if(input.tagName==='SELECT')for(let j=0;j<target.options.length;j++)target.options[j].selected=j===input.selectedIndex;else if(input.tagName==='TEXTAREA')target.textContent=input.value;else{target.setAttribute('value',input.value);if(input.checked)target.setAttribute('checked','')}});
   const canvases=root.querySelectorAll('canvas'),clones=copy.querySelectorAll('canvas');
   canvases.forEach((canvas,i)=>{try{const image=document.createElement('img');image.src=canvas.toDataURL();image.className=canvas.className;image.width=canvas.width;image.height=canvas.height;image.style.cssText=canvas.style.cssText;image.alt=canvas.getAttribute('aria-label')||'Recorded game display';clones[i].replaceWith(image)}catch(e){}});
   return copy.outerHTML;
  }).join('');frames.push({html,text,round});
 }
 function show(index){const frame=frames[index];if(!frame)return null;live();review=document.createElement('div');review.className='demo-history-frame';review.inert=true;review.innerHTML=frame.html;document.body.appendChild(review);document.body.classList.add('demo-review');return frame}
 D.timeline={record,show,live,clear(){live();frames.length=0},get length(){return frames.length}};
})();
