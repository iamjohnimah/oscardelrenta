let pending=0;const listeners=new Set<()=>void>();
export function beginLoading(){pending++;listeners.forEach(f=>f());let done=false;return()=>{if(done)return;done=true;pending=Math.max(0,pending-1);listeners.forEach(f=>f())}}

export const loadingCount=()=>pending;
export function subscribeLoading(f:()=>void){listeners.add(f);return()=>{listeners.delete(f)}}
