// Public catalog reads can recover without changing a shopper's signed-in identity.
export function createTwinCatalog<T>(load:()=>Promise<T[]>,recover:()=>Promise<T[]>,now=()=>Date.now()){
 let cached:T[]|undefined,expires=0,flight:Promise<T[]>|undefined;
 return function list(forceRefresh=false):Promise<T[]>{
  if(!forceRefresh&&cached&&now()<expires)return Promise.resolve(cached);
  if(flight)return flight;
  const nonempty=(rows:T[])=>{if(!Array.isArray(rows)||!rows.length)throw Error('No Twins were returned. Please try again.');return rows};
  flight=(async()=>{try{let rows:T[];try{rows=nonempty(await load())}catch{rows=nonempty(await recover())}cached=rows;expires=now()+300000;return rows}catch(error){if(cached)return cached;throw error}finally{flight=undefined}})();
  return flight;
 }
}
