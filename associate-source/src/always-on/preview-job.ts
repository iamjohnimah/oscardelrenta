/** Bound the entire job, including session setup, not just status polling. */
export async function withPreviewDeadline<T>(load:()=>Promise<T>,ms=210000):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([Promise.resolve().then(load),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('This preview took too long. Please retry your look.')),ms)})])}
 finally{clearTimeout(timer)}
}
