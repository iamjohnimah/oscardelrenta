import {useState,useEffect,type Dispatch,type SetStateAction} from 'react';
const prefix='spree-online-shopping:';
export function clearShoppingState(){
 try{for(const key of Object.keys(sessionStorage))if(key.startsWith(prefix))sessionStorage.removeItem(key)}catch{}
 window.dispatchEvent(new Event('spree-shopping-reset'));
}
export default function useShoppingState<T>(key:string,initial:T|(()=>T)):[T,Dispatch<SetStateAction<T>>]{
 const fallback=()=>typeof initial==='function'?(initial as ()=>T)():initial;
 const [value,setValue]=useState<T>(()=>{try{const saved=sessionStorage.getItem(prefix+key);if(saved!==null)return JSON.parse(saved)}catch{}return fallback()});
 useEffect(()=>{try{sessionStorage.setItem(prefix+key,JSON.stringify(value))}catch{}},[key,value]);
 useEffect(()=>{const reset=()=>setValue(fallback());window.addEventListener('spree-shopping-reset',reset);return()=>window.removeEventListener('spree-shopping-reset',reset)},[key]);
 return [value,setValue];
}
