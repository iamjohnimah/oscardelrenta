import type {Product} from '../data';
export function clientEditLink(ids:string[],origin:string){
 const url=new URL('/oscardelrenta/associate/client/',origin);
 url.hash=new URLSearchParams({pieces:ids.slice(0,5).map(id=>id.replace(/^spree-/, '')).join(',')}).toString();return url.href;
}
export function parseEdit(hash:string,catalogue:Product[]){
 const raw=new URLSearchParams(hash.replace(/^#/, '')).get('pieces')||'';if(raw.length>1500)return [];
 return [...new Set(raw.split(','))].slice(0,5).map(id=>catalogue.find(p=>p.garmentId===id)).filter((p):p is Product=>!!p);
}
