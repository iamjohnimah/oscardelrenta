import ImageZoom from './ImageZoom';
import {useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type {Product} from './data';
import {useConnectedProfile} from './connection';
import {usePersonalFit,useSizePreview} from './personalization';
import {previewPlan,sizeFitLabel} from './fit-preview';
import {isOneSize,sizeLabel} from './fit-scale';
import LoadingBar from './LoadingBar';
import TryOnBeta from './TryOnBeta';
import './fit-compare.css';
function Preview({product,size}:{product:Product;size:string}){
 const [attempt,setAttempt]=useState(0),[zoom,setZoom]=useState(false),image=useSizePreview(product,size,attempt);
 return <div className="fit-compare-image" aria-live="polite">{image.url?<Dialog.Root open={zoom} onOpenChange={setZoom}><Dialog.Trigger className="fit-compare-zoom-trigger" aria-label={`Enlarge size ${sizeLabel(size)} preview`}><img src={image.url} alt={`${product.name} — size ${sizeLabel(size)}`}/><span className="fit-compare-zoom-hint">View closer</span></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fit-compare-overlay fit-compare-zoom-overlay"/><Dialog.Content className="fit-compare-zoom"><header><div><Dialog.Title>{product.name}</Dialog.Title><Dialog.Description>Size {sizeLabel(size)} · Personal fit preview</Dialog.Description></div><Dialog.Close aria-label="Close enlarged fit preview">×</Dialog.Close></header><ImageZoom allowOriginal key={image.url} src={image.url} alt={`${product.name} — size ${sizeLabel(size)}`}/><TryOnBeta/></Dialog.Content></Dialog.Portal></Dialog.Root>:image.status==='error'?<div><p>We couldn’t load this fit.</p><button onClick={()=>setAttempt(n=>n+1)}>Retry size {sizeLabel(size)}</button></div>:image.reason?<p>{image.reason}</p>:<LoadingBar label={`Generating your look… Size ${sizeLabel(size)}`}/>}</div>
}
function Comparison({product,selected,onSize,onClose}:{product:Product;selected:string;onSize?:(size:string)=>void;onClose:()=>void}){
 const {identity}=useConnectedProfile(),fit=usePersonalFit(product);
 const available=product.sizes.filter(s=>!previewPlan(product.sizes,s,fit.recommended||'').reason);
 const [left,setLeft]=useState(''),[right,setRight]=useState('');
 const first=left||fit.recommended||product.sizes[0],second=right||(selected!==first&&available.includes(selected)?selected:available.find(s=>s!==first))||first;
 const unavailable=!identity?'Add a photo or Twin to your profile to compare fits.':product.environment==='prod'?'Size-specific previews aren’t available for this piece yet. Your standard try-on is available in the gallery.':!fit.recommended?(fit.status==='error'?'Fit comparison is unavailable for this piece.':'Finding your starting size…'):'';
 return <><div className="fit-compare-header"><div><small>ALWAYS ON · VISUAL FIT</small><Dialog.Title>See the difference.</Dialog.Title><Dialog.Description>{product.name}</Dialog.Description><p className="fit-compare-subtitle">One look. Two fits. Find the one that feels like you.</p></div><Dialog.Close aria-label="Close fit comparison">×</Dialog.Close></div><TryOnBeta/>{unavailable?<p className="fit-compare-unavailable" role="status">{unavailable}</p>:<><div className="fit-compare-grid">{[{value:first,set:setLeft,name:'Left'},{value:second,set:setRight,name:'Right'}].map(pane=>{const reason=previewPlan(product.sizes,pane.value,fit.recommended||'').reason;return <section key={pane.name} className={pane.value===fit.recommended?"fit-compare-card is-recommended":"fit-compare-card"}><div className="fit-compare-card-head"><label><span>{pane.name==='Left'?'01':'02'} / SIZE</span><select aria-label={`${pane.name} comparison size`} value={pane.value} onChange={e=>pane.set(e.target.value)}>{product.sizes.map(s=><option key={s} value={s}>{sizeLabel(s)}{previewPlan(product.sizes,s,fit.recommended||'').reason?' · Preview unavailable':''}</option>)}</select></label><p className="fit-compare-label">{pane.value===fit.recommended&&fit.recommendationSource==='twin'?'Starting size':sizeFitLabel(product.sizes,pane.value,fit.recommended||'',fit.map)}</p></div>{reason?<div className="fit-compare-image"><p>{reason}</p></div>:<Preview key={product.id+':'+pane.value} product={product} size={pane.value}/>}<button className="fit-compare-use" disabled={!!reason} onClick={()=>{onSize?.(pane.value);onClose()}}><span className="fit-compare-use-label">Choose size {sizeLabel(pane.value)}</span><span aria-hidden="true"></span></button></section>})}</div><div className="fit-compare-footer"><span>YOUR PERSPECTIVE · {identity?.name}</span></div></>}</>
}
export default function FitCompare({product,selected='',onSize}:{product:Product;selected?:string;onSize?:(size:string)=>void}){
 const [open,setOpen]=useState(false);const {version}=useConnectedProfile();
 if(isOneSize(product.sizes)||product.sizes.length<2)return null;
 return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger className="fit-compare-trigger">Compare sizes ↔</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fit-compare-overlay"/><Dialog.Content className="fit-compare-modal">{open&&<Comparison key={product.id+':'+version} product={product} selected={selected} onSize={onSize} onClose={()=>setOpen(false)}/>}</Dialog.Content></Dialog.Portal></Dialog.Root>
}
