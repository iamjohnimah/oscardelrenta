import {useEffect,useRef,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {render,renderPose,turn,useConnectedProfile} from '../connection';
import {usePersonalImage,type Result} from '../personalization';
import type {Product} from '../data';
import type {ClientLook} from './client-book';
export function Modal({open,onOpenChange,title,description,children,wide=false}:{open:boolean;onOpenChange:(v:boolean)=>void;title:string;description:string;children:React.ReactNode;wide?:boolean}){
 return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="atelier-overlay"/><Dialog.Content className={'atelier-modal'+(wide?' wide':'')}><header><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div><Dialog.Close className="icon-button" aria-label={'Close '+title}>×</Dialog.Close></header>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
export function BlobPicture({blob,alt,fallback}:{blob?:Blob;alt:string;fallback?:string}){
 const[url,setUrl]=useState('');useEffect(()=>{if(!blob){setUrl('');return}const u=URL.createObjectURL(blob);setUrl(u);return()=>URL.revokeObjectURL(u)},[blob]);
 return url||fallback?<img src={url||fallback} alt={alt}/>:<div className="picture-empty">Preview not saved</div>;
}
export function LookComparison({looks,onOpen,onChoose}:{looks:ClientLook[];onOpen:(v:boolean)=>void;onChoose:(l:ClientLook)=>void}){
 const[left,setLeft]=useState(looks[0]?.id||''),[right,setRight]=useState(looks[1]?.id||looks[0]?.id||'');
 return <div><p className="quiet">Compare saved previews on the same person. Garment size selections remain unchanged.</p><div className="look-comparison">{[[left,setLeft],[right,setRight]].map(([id,change],i)=>{
 const look=looks.find(l=>l.id===id);return <section key={i}><label>{i?'Second look':'First look'}<select value={id as string} onChange={e=>(change as (s:string)=>void)(e.target.value)}>{looks.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label>{look&&<><BlobPicture blob={look.preview} alt={look.title}/><p>{look.ids.length} pieces · {look.decision||'Awaiting client feedback'}</p><button className="primary" onClick={()=>{onChoose(look);onOpen(false)}}>Work on this look</button></>}</section>;
 })}</div>{looks.length<2&&<p className="status-note">Save another look to compare alternatives side by side.</p>}</div>;
}
type View='front'|'three_quarter'|'editorial'|'back'|'video';
export function PerspectiveTools({items,front,onSource,onResult,onEnlarge}:{items:Product[];front:Result;onEnlarge:()=>void;onSource:(p:Product)=>void;onResult:(url:string,pose:string)=>void}){
 const profile=useConnectedProfile(),[view,setView]=useState<View>('front'),[url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const job=useRef<AbortController|null>(null),cache=useRef(new Map<string,string>());
 const itemKey=items.map(p=>p.id).join('|'),scope=profile.version+':'+itemKey;
 const missingBack=items.filter(p=>!p.hasBack),needsBack=view==='back'||view==='video';
 const matchingFront=usePersonalImage(view!=='front'&&(!needsBack||!missingBack.length)?items:[],'','',attempt);
 useEffect(()=>{if(matchingFront.status==='ready'&&matchingFront.url)onResult(matchingFront.url,'base')},[matchingFront.status,matchingFront.url]);
 useEffect(()=>{job.current?.abort();setView('front');setUrl('');setError('');setBusy(false)},[scope]);
 useEffect(()=>{
  job.current?.abort();setError('');setUrl('');setBusy(false);
  if(view==='front'||!profile.identity||!items.length||(needsBack&&missingBack.length))return;
  if(matchingFront.status!=='ready'||!matchingFront.url||!matchingFront.requestId)return;
  const key=scope+':'+view,cached=cache.current.get(key);if(cached){setUrl(cached);if(view!=='video')onResult(cached,view);return}
  const controller=new AbortController();job.current=controller;setBusy(true);
  void(async()=>{
   const identity=profile.identity!;
   if(view==='three_quarter'||view==='editorial')return (await renderPose([...items].sort((a,b)=>Number(a.category==='Accessories')-Number(b.category==='Accessories')).map(p=>p.garmentId),identity,controller.signal,view,matchingFront.requestId)).image!.url;
   let back=cache.current.get(scope+':back');
   if(!back){const r=await render(items.map(p=>p.garmentId),identity,controller.signal,'back',undefined,undefined,matchingFront.requestId);back=r.image!.url;cache.current.set(scope+':back',back)}
   return view==='video'?await turn(matchingFront.url!,back,controller.signal):back;
  })().then(value=>{if(!controller.signal.aborted){cache.current.set(key,value);setUrl(value);if(view!=='video')onResult(value,view)}}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'This view could not be created.')}).finally(()=>{if(!controller.signal.aborted)setBusy(false)});
  return()=>controller.abort();
 },[scope,view,matchingFront.status,matchingFront.url,matchingFront.requestId,attempt]);
 const displayed=view==='front'?front.url:url;
 return <><div className="perspective-toolbar" role="group" aria-label="Preview perspective">
 {([['front','Front'],['three_quarter','Three-quarter'],['editorial','Side'],['back','Back'],['video','Video']] as [View,string][]).map(([v,label])=><button key={v} aria-pressed={view===v} onClick={()=>{setView(v);if(v==='front'&&front.url)onResult(front.url,'front')}}>{label}</button>)}
 </div>{needsBack&&missingBack.length?<div className="view-explanation"><span className="small-label">{view==='video'?'VIDEO TRY-ON':'BACK TRY-ON'}</span><h3>Back photography is needed.</h3><p>{missingBack.length===1?missingBack[0].name:'The selected pieces'} {missingBack.length===1?'does':'do'} not yet have a verified back image in the catalogue. {view==='video'?'A turn video needs matching front and back previews.':'A matching generated back view needs that source.'}</p><button className="secondary" onClick={()=>onSource(missingBack[0])}>Inspect product photography</button><p className="quiet">Front try-on, poses and styling remain available.</p></div>:<div className="preview-canvas">
 {displayed?(view==='video'?<video src={displayed} controls playsInline poster={matchingFront.url} aria-label="Generated turn video"/>:<button className="preview-enlarge" onClick={onEnlarge} aria-label="Enlarge personal preview"><img src={displayed} alt={'Selected Oscar outfit · '+(view==='editorial'?'side profile':view.replace('_',' '))}/></button>):<div className="preview-empty">{busy||matchingFront.status==='loading'||front.status==='loading'?<><span className="spinner"/><h3>{view==='front'?'Creating the personal preview':'Creating the selected perspective'}</h3><p>You can continue preparing the edit.</p></>:<><span className="preview-mark">O</span><h3>Your personal preview</h3><p>Select pieces, then create a preview on the client’s photo or Twin.</p></>}</div>}
 </div>}{(error||(view!=='front'&&matchingFront.status==='error'))&&<div className="error-note" role="alert"><p>{error||matchingFront.error}</p><button className="secondary" onClick={()=>setAttempt(v=>v+1)}>Retry this view</button></div>}
 {view!=='front'&&displayed&&<p className="quiet">Generated {view==='editorial'?'side profile':view.replace('_',' ')} · Same client and selected pieces. Appearance and garment details may vary.</p>}</>;
}
