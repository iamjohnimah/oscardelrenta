import {useEffect,useState} from 'react';
import {User} from '@phosphor-icons/react';
import {listPhotos,listTwins,type Identity} from './connection';

// A new identity gets its own recovery state; a late response cannot show another person.
export default function IdentityPortrait({identity}:{identity:Identity}){
 return <Portrait key={`${identity.kind}:${identity.id}:${identity.url}`} identity={identity}/>;
}
function Portrait({identity}:{identity:Identity}){
 const [url,setUrl]=useState(identity.url),[failed,setFailed]=useState(!identity.url),[retried,setRetried]=useState(false);
 useEffect(()=>{
  if(!failed||retried)return;
  let active=true;
  const refresh=async()=>{
   try{
    const rows=identity.kind==='twin'?await listTwins(true):(await listPhotos()).images;
    const portrait=rows?.find(row=>row.id===identity.id);
    if(active&&portrait?.url){setUrl(portrait.url);setFailed(false)}
   }catch{/* Keep a neutral portrait rather than a broken image or a different twin. */}
   finally{if(active)setRetried(true)}
  };
  void refresh();
  return()=>{active=false};
 },[failed,retried,identity]);
 if(failed)return <span className="identity-portrait-fallback" role="img" aria-label={`${identity.name} portrait ${retried?'unavailable':'loading'}`} title={retried?'Portrait temporarily unavailable':'Refreshing portrait'}><User size={22} aria-hidden="true"/></span>;
 return <img key={String(retried)} src={url} alt={identity.name} onError={()=>setFailed(true)}/>;
}
