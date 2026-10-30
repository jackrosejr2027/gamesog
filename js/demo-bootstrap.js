// Same-origin frames can use the offline service worker; all demo storage is in memory.
window.DemoSession={adapters:{},seen:new Set(),round:1};
for(const name of ['localStorage','sessionStorage']){
  const data=new Map();
  const storage={get length(){return data.size},key(i){return [...data.keys()][i]??null},getItem(k){return data.get(String(k))??null},setItem(k,v){data.set(String(k),String(v))},removeItem(k){data.delete(String(k))},clear(){data.clear()}};
  Object.defineProperty(window,name,{value:storage,configurable:true});
}
