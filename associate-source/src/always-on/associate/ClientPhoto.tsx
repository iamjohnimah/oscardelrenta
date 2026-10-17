import {useEffect, useRef, useState} from 'react';

/** Separate camera capture from library selection on every associate device. */
export default function ClientPhoto({onPhoto}:{onPhoto:(file:File)=>void}) {
 const video=useRef<HTMLVideoElement>(null), library=useRef<HTMLInputElement>(null);
 const stream=useRef<MediaStream|null>(null), request=useRef(0);
 const [open,setOpen]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState('');
 function stop(){request.current++;stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;setOpen(false);setReady(false)}
 useEffect(()=>()=>{request.current++;stream.current?.getTracks().forEach(track=>track.stop())},[]);
 async function start(){
  stop();const current=++request.current;setError('');setOpen(true);
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access is unavailable in this browser. Open this page in Safari or Chrome over HTTPS.');
   const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:2560}}});
   if(current!==request.current){media.getTracks().forEach(track=>track.stop());return}
   stream.current=media;
   if(video.current){video.current.srcObject=media;await video.current.play()}
  }catch(e){
   if(current!==request.current)return;
   stop();const name=e instanceof Error?e.name:'';
   setError(name==='NotAllowedError'?'Allow camera access in your browser, then tap Take photo again.':name==='NotFoundError'?'No camera was found. Connect a camera or use Upload photo.':name==='NotReadableError'?'The camera is busy. Close other apps using it and try again.':e instanceof Error?e.message:'Could not open the camera. Please try again.');
  }
 }
 function capture(){
  const source=video.current;if(!source?.videoWidth||!source.videoHeight)return;
  const current=request.current, canvas=document.createElement('canvas');
  const scale=Math.min(1,2560/Math.max(source.videoWidth,source.videoHeight));
  canvas.width=Math.round(source.videoWidth*scale);canvas.height=Math.round(source.videoHeight*scale);
  const context=canvas.getContext('2d');if(!context)return;
  context.drawImage(source,0,0,canvas.width,canvas.height);
  canvas.toBlob(blob=>{if(current!==request.current)return;if(!blob){setError('Could not capture the photo. Please try again.');return}stop();onPhoto(new File([blob],'client-photo.jpg',{type:'image/jpeg'}))},'image/jpeg',0.92);
 }
 return <div className="as-client-photo">
  <div className="as-photo-actions"><button type="button" className="as-primary" onClick={()=>void start()}>Take photo</button><button type="button" className="as-secondary" onClick={()=>{stop();setError('');library.current?.click()}}>Upload photo</button></div>
  <input ref={library} type="file" hidden accept="image/jpeg,image/png,image/webp" aria-label="Upload client photo" onChange={e=>{const file=e.target.files?.[0];if(file)onPhoto(file);e.target.value=''}}/>
  {open&&<section className="as-camera" aria-label="Client camera"><video ref={video} autoPlay playsInline muted onLoadedData={()=>setReady(true)}/><p role="status">{ready?'Keep the client’s full body in the frame.':'Opening camera…'}</p><div className="as-photo-actions"><button type="button" className="as-primary" disabled={!ready} onClick={capture}>Capture photo</button><button type="button" className="as-secondary" onClick={stop}>Cancel camera</button></div></section>}
  {error&&<p className="as-error" role="alert">{error}</p>}
 </div>
}
