import type {Result} from './personalization';
const storageKey='spree-preview-cache-v1',maxAge=24*60*60*1000;
type Saved={key:string;at:number;value:Result};
export function readPreviews(storage:Pick<Storage,'getItem'>,now=Date.now()):Map<string,Result>{try{const rows=JSON.parse(storage.getItem(storageKey)||'[]');if(!Array.isArray(rows))return new Map();return new Map(rows.filter((r:Saved)=>typeof r.key==='string'&&Number.isFinite(r.at)&&now-r.at<maxAge&&r.value?.status==='ready'&&(typeof r.value.url==='string'||typeof r.value.recommended==='string')).slice(-120).map((r:Saved)=>[r.key,r.value]))}catch{return new Map()}}
export const previewCache:Map<string,Result>=typeof sessionStorage==='undefined'?new Map():readPreviews(sessionStorage);
export function persistPreviews(storage:Pick<Storage,'setItem'>=sessionStorage){try{storage.setItem(storageKey,JSON.stringify([...previewCache].filter(([,v])=>v.status==='ready').slice(-120).map(([key,value])=>({key,value,at:Date.now()}))))}catch{}}
export function clearPreviews(){previewCache.clear();try{sessionStorage.removeItem(storageKey)}catch{}}
