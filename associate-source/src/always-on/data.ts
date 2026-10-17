import {useSyncExternalStore} from 'react';
import snapshot from './oscar-catalog.json';
import {request} from './connection';
import {rememberVariant,shownVariant} from './catalog-policy';
export type Product={brand?:string;department?:'Men'|'Women'|'Unisex';hasBack?:boolean;environment?:'dev'|'prod';id:string;garmentId:string;partnerId:string;name:string;category:string;price:number;priceLabel:string;currency:string;color:string;row:number;description:string;details:string;material:string;image:string;model:string;sizes:string[];retailerUrl?:string;source?:string[];preview?:'core'|'look'|'imported'};
export type Mode='out'|'twin'|'personal';
type Garment={id:string;title:string;partner_id?:string;buy_link?:string;description?:string;categories?:{name:string}[];variants:{gender?:string;style?:string;fit?:string;color?:{name?:string};price?:{amount?:string;currency?:string};size_groups?:{sizes:string[]}[];images?:{tag?:string;url:string}[]}[]};
export const isOscar=(g:Garment)=>/^https:\/\/(www\.)?oscardelarenta\.com\//i.test(g.buy_link||'');
export function normalizeCatalog(rows:Garment[],environment:'dev'|'prod'='dev'):Product[]{return rows.filter(isOscar).flatMap(g=>{
 const v=shownVariant(g.variants);if(!v)return [];rememberVariant(g.id,environment,v);
 const photos=(v.images||[]).filter(i=>/^https:\/\//.test(i.url));if(!photos.length)return [];
 const flat=photos.find(i=>i.tag==='flat')||photos[0],model=photos.find(i=>i.tag==='model')||flat;
 const n=g.title.toLowerCase(),cats=(g.categories||[]).map(c=>c.name.toLowerCase());
 const category=/earring|clutch|bag|poppy|pochette|minaudi|bracelet|scarf|brooch|necklace|belt|alibi/.test(n)?'Accessories':/dress|gown/.test(n)?'Dresses':/pant|skirt|trouser|short/.test(n)?'Bottoms':/jacket|coat|blazer/.test(n)?'Outerwear':/cardigan|pullover|knit/.test(n)?'Knitwear':cats.includes('footwear')?'Shoes':/shirt|blouse/.test(n)?'Shirts':'Tops';
 const price=Number((v.price?.amount||'').replace(/[^\d.]/g,''))||0,currency=v.price?.currency||'USD';
 const sizes=[...new Set((v.size_groups||[]).flatMap(s=>s.sizes))];
 return [{id:'spree-'+g.id,garmentId:g.id,partnerId:g.partner_id||'demo-site',environment,brand:'Oscar de la Renta',name:g.title,category,price,currency,priceLabel:price?new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:0}).format(price):'Price on request',color:v.color?.name||'As shown',row:-1,description:g.description&&!/^https?:/.test(g.description)?g.description:g.title,details:'Confirm availability, pricing and fulfilment with Oscar de la Renta.',material:'Confirm composition and care with the retailer.',image:flat.url,model:model.url,sizes,hasBack:photos.some(i=>i.tag==='back_flat'),source:photos.map(i=>i.url),retailerUrl:g.buy_link}];
})}
export const products:Product[]=normalizeCatalog(snapshot as Garment[]);
let revision=0,status='snapshot',pending:Promise<void>|undefined;const listeners=new Set<()=>void>();
export function useCatalog(){useSyncExternalStore(f=>{listeners.add(f);return()=>{listeners.delete(f)}},()=>revision);return status}
export function refreshCatalog(){if(pending)return pending;pending=(async()=>{try{const d=await request<{garments:Garment[]}>('/v3/protea/garments');const next=normalizeCatalog(d.garments||[]);if(!next.length)throw Error('Oscar catalogue unavailable');products.splice(0,products.length,...next);status='live'}catch{status='snapshot'}finally{revision++;listeners.forEach(f=>f())}})().finally(()=>{pending=undefined});return pending}
export const categories=['All','Dresses','Tops','Shirts','Bottoms','Outerwear','Knitwear','Shoes','Accessories'];
export const photoBackground=(_src:string)=>'#f5f4f0';
export const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export const sampleProfile={name:'',height:170,weight:65,gender:'Female',fit:'Regular',photo:'',consent:false};export type Profile=typeof sampleProfile;
