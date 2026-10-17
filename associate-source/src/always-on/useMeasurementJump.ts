import {useEffect,useRef,useState} from 'react';

/** Advance to measurements only after an explicit twin selection on stacked mobile layouts. */
export default function useMeasurementJump(){
 const measurementsRef=useRef<HTMLDivElement>(null);
 const [selection,setSelection]=useState(0);
 useEffect(()=>{
  if(!selection||!window.matchMedia('(max-width: 700px)').matches)return;
  const frame=requestAnimationFrame(()=>{
   const target=measurementsRef.current;
   if(!target)return;
   target.focus({preventScroll:true});
   target.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  return()=>cancelAnimationFrame(frame);
 },[selection]);
 return {measurementsRef,jumpToMeasurements:()=>setSelection(n=>n+1)};
}
