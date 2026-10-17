import {loadImage} from './image-readiness';
import {withPreviewDeadline} from './preview-job';
import {previewCache,persistPreviews} from './preview-cache';
import {isPresignedUrlExpired} from './presigned';
import {previewPlan} from './fit-preview';
import {isOneSize,translateSize} from './fit-scale';
import {beginLoading} from './loading';
import {useEffect,useMemo,useSyncExternalStore} from 'react';
import {currentProfile,useConnectedProfile,render,sizing,fitMap,fitAdvice,hasFitConnection,productionRender,productionSizing,request,productionRequest} from './connection';
import type {Product} from './data';
import {recordHistory,historyWriteToken} from './history';
import type {FitMap} from './connection';
export type Result={status:'idle'|'loading'|'ready'|'error';url?:string;recommended?:string;map?:FitMap|null;error?:string;fitNote?:string;requestId?:string;environment?:'dev'|'prod';recommendationSource?:'chart'|'engine'|'twin'};
const verifiedImages=new Set<string>();
const empty:Result={status:'idle'},cache=previewCache,jobs=new Map<string,Promise<void>>(),listeners=new Set<()=>void>();
const pending:Result={status:'loading'};
const notify=()=>listeners.forEach(f=>f());
export const profileScope=()=>{const p=currentProfile();return p.identity?p.version+':'+p.identity.id:''};
export const renderKey=(ids:string[],size='',base='',environment='dev')=>profileScope()+':'+environment+':image:'+ids.join('|')+':'+size+':'+base;
export const cachedImage=(id:string)=>cache.get(renderKey([id]))?.url;
function start(key:string,load:()=>Promise<Partial<Result>>,scope:string){if(!key||jobs.has(key)||(cache.has(key)&&cache.get(key)?.status!=='loading'&&!isPresignedUrlExpired(cache.get(key)?.url)&&(!cache.get(key)?.url||verifiedImages.has(cache.get(key)!.url!))))return;cache.set(key,{status:'loading'});notify();const finishLoading=beginLoading();const promise=withPreviewDeadline(load).then(value=>{if(scope===profileScope()){cache.set(key,{...value,status:'ready'});persistPreviews()}}).catch(e=>{if(scope===profileScope())cache.set(key,{status:'error',error:e instanceof Error?e.message:'Temporarily unavailable.'})}).finally(()=>{if(scope!==profileScope()&&cache.get(key)?.status==='loading')cache.delete(key);finishLoading();jobs.delete(key);notify()});jobs.set(key,promise)}
function useResult(key:string){return useSyncExternalStore(f=>{listeners.add(f);return()=>{listeners.delete(f)}},()=>key?(cache.get(key)?.status==='ready'&&isPresignedUrlExpired(cache.get(key)?.url)?pending:cache.get(key)||empty):empty)}
export function usePersonalImage(products:Product[],size='',base='',retry=0){
 const profile=useConnectedProfile(),identity=profile.identity,scope=identity?profile.version+':'+identity.id:'',ids=products.map(p=>p.garmentId);const usable=identity&&ids.length>0;const key=usable?scope+':'+(products[0]?.environment||'dev')+':image:'+ids.join('|')+':'+size+':'+base:'';const state=useResult(key),expired=cache.get(key)?.status==='ready'&&isPresignedUrlExpired(cache.get(key)?.url);
 const historyToken=useMemo(()=>historyWriteToken(identity?.id||''),[key,retry,expired]);
 useEffect(()=>{if(!identity||!ids.length)return;if(retry>0&&cache.get(key)?.status==='error')cache.delete(key);const saved=cache.get(key);const timer=setTimeout(()=>start(key,async()=>{if(scope!==profileScope())throw Error('Profile changed');if(saved?.requestId&&isPresignedUrlExpired(saved.url)){const get=saved.environment==='prod'?productionRequest:request;const refreshed=await get<{image?:{url:string}}>('/v1/user-assets/tryon/'+encodeURIComponent(saved.requestId));if(!refreshed.image?.url||isPresignedUrlExpired(refreshed.image.url))throw Error('This preview link is unavailable. Please retry your look.');await loadImage(refreshed.image.url);verifiedImages.add(refreshed.image.url);return {...saved,url:refreshed.image.url}}if(saved?.url&&saved.status==='ready'){try{await loadImage(saved.url);verifiedImages.add(saved.url);return saved}catch{if(saved.requestId){const get=saved.environment==='prod'?productionRequest:request;const fresh=await get<{image?:{url:string}}>('/v1/user-assets/tryon/'+encodeURIComponent(saved.requestId));if(fresh.image?.url){await loadImage(fresh.image.url);verifiedImages.add(fresh.image.url);return {...saved,url:fresh.image.url}}}throw Error('Your saved preview could not be loaded. Retry to create a fresh view.')}}if(products.some(p=>(p.environment||'dev')!==(products[0].environment||'dev')))throw Error('Choose pieces from the same collection for a combined look.');const r=products[0].environment==='prod'?await productionRender(ids,identity,new AbortController().signal,size||undefined,base||undefined):await render(ids,identity,new AbortController().signal,'front',size||undefined,base||undefined);if(!r.image?.url)throw Error('No image was returned. Please retry your look.');await loadImage(r.image.url);verifiedImages.add(r.image.url);if(scope===profileScope())recordHistory({id:key,kind:size?'sizing':'tryon',identityId:identity.id,identityName:identity.name,pieces:products.map(p=>({id:p.id,name:p.name,image:p.image})),images:[r.image.url],size:size||undefined,recommended:base||undefined},historyToken);return {url:r.image!.url,requestId:r.request_id,environment:products[0].environment||'dev'}},scope),size||ids.length>1?450:0);return()=>clearTimeout(timer)},[key,retry,expired]);return state;
}
export function usePersonalFit(product?:Product){
 const profile=useConnectedProfile(),identity=profile.identity,scope=identity?profile.version+':'+identity.id:'',key=identity&&product&&!isOneSize(product.sizes)?scope+':'+(product.environment||'dev')+':fit:'+product.garmentId:'';const state=useResult(key);
 const historyToken=useMemo(()=>historyWriteToken(identity?.id||''),[key]);
 useEffect(()=>{if(!identity||!product||isOneSize(product.sizes))return;start(key,async()=>{if(!identity.height||!identity.weight)throw Error('Add height and weight to get size guidance.');const [a,b,c]=await Promise.allSettled([(product.environment==='prod'?productionSizing:sizing)(product.garmentId,identity,new AbortController().signal),product.environment!=='prod'&&hasFitConnection()?fitMap(product.garmentId,identity,product.name,product.category,product.sizes):Promise.resolve(null),identity.kind==='photo'&&product.environment!=='prod'&&hasFitConnection()?fitAdvice(product.garmentId,identity,product.name,product.category,product.sizes):Promise.resolve(null)]);const map=b.status==='fulfilled'?b.value:null;const advice=c.status==='fulfilled'?c.value:null;const chart=advice?.size||map?.recommended;const engine=a.status==='fulfilled'?a.value.sizing?.size:undefined;const matched=(value:string|undefined)=>product.sizes.find(s=>s.toUpperCase()===value?.toUpperCase());const recommended=matched(chart)||matched(engine)||(identity.kind==='twin'&&identity.usualSize?translateSize(identity.usualSize,product.sizes):null);const recommendationSource=matched(chart)?'chart':matched(engine)?'engine':'twin';if(!recommended||!product.sizes.includes(recommended))throw Error('Personal sizing isn’t available for this piece yet.');if(scope===profileScope())recordHistory({id:key,kind:'sizing',identityId:identity.id,identityName:identity.name,pieces:[{id:product.id,name:product.name,image:product.image}],images:[],recommended,guidance:fitWords(map,recommended).map(w=>w.point+': '+w.label).join(' · ')},historyToken);return {recommended,map,recommendationSource,fitNote:advice?.fit_note}},scope)},[key]);return state;
}
export function fitWords(map:FitMap|null|undefined,size:string){return (map?.sizes.find(s=>s.size===size)?.zones||[]).filter(z=>z.verdict).map(z=>({point:z.point.replace(/_/g,' '),label:({true:'True to size',snug:'Close fit',room:'Room to move',loose:'Relaxed fit',too_small:'May feel tight',short:'Shorter length',long:'Longer length'} as Record<string,string>)[z.verdict!]||'Fit guidance'}))}

// Establish the recommended-size render before asking the service to grade it.
export function useSizePreview(product:Product,selectedSize='',retry=0){
 const {identity}=useConnectedProfile(),fit=usePersonalFit(product),oneSize=isOneSize(product.sizes);
 const selected=selectedSize||fit.recommended||(oneSize?product.sizes[0]:'');
 const plan=previewPlan(product.sizes,selected,fit.recommended||'');
 const basis=previewPlan(product.sizes,fit.recommended||'',fit.recommended||'');
 // The public production collection supports standard v3 previews only.
 // Do not send size grading to its unavailable v3.1 endpoint or label a standard image as graded.
 const standardOnly=product.environment==='prod';
 const fallback=standardOnly||oneSize||!identity?.height||!identity?.weight||!selectedSize&&['idle','loading','error'].includes(fit.status);
 const anchor=usePersonalImage(identity&&(fallback||fit.recommended&&!basis.reason)?[product]:[],fallback?'':basis.size,fallback?'':basis.base,retry);
 const alternate=usePersonalImage(identity&&!standardOnly&&!plan.reason&&selected!==fit.recommended&&!oneSize&&anchor.status==='ready'?[product]:[],plan.size,plan.base,retry);
 if(fallback)return {...anchor,reason:'',selected:oneSize?selected:'',fitNote:standardOnly?'Personal try-on preview. Size changes aren’t visualized for this piece yet.':undefined};
 if(!identity)return {...empty,reason:'Add your profile to discover your fit.',selected};
 if(fit.status==='idle'||fit.status==='loading')return {status:'loading' as const,reason:'',selected};
 if(plan.reason)return {...empty,reason:plan.reason,selected};
 if(selected===fit.recommended||anchor.status==='error')return {...anchor,reason:'',selected};
 if(anchor.status!=='ready')return {status:'loading' as const,reason:'',selected};
 return {...alternate,status:alternate.status==='idle'?'loading' as const:alternate.status,reason:'',selected};
}
