import {gradedPair,isOneSize,ladderSize} from './fit-scale';
export function previewPlan(sizes:string[],selected:string,recommended:string){
 if(isOneSize(sizes))return {size:'',base:'',reason:''};
 if(!recommended)return {size:'',base:'',reason:'Add your profile to discover your recommended size.'};
 if(!sizes.includes(selected)||!sizes.includes(recommended))return {size:'',base:'',reason:'A preview is not available for this size.'};
 if(sizes.indexOf(selected)<sizes.indexOf(recommended))return {size:'',base:'',reason:`Previews below the recommended size ${recommended} are not available yet.`};
 const pair=gradedPair(selected,recommended),anchor=ladderSize(recommended);
 if(pair)return {size:pair.size,base:pair.baseSize,reason:''};
 if(selected===recommended&&anchor)return {size:anchor,base:anchor,reason:''};
 return {size:'',base:'',reason:'Visual previews for this sizing system are not available yet.'};
}
import {fitStepFor} from './fit-scale';
import type {FitMap} from './connection';
export function sizeFitLabel(sizes:string[],size:string,recommended:string,map?:FitMap|null){
 if(size===recommended)return 'Recommended';
 const verdicts=map?.sizes.find(s=>s.size===size)?.zones.filter(z=>/waist|hip|bust|chest/.test(z.point)).map(z=>z.verdict)||[];
 if(verdicts.includes('too_small'))return 'Tight fit';
 if(verdicts.includes('snug'))return 'Snug fit';
 if(verdicts.includes('loose'))return 'Oversized fit';
 if(verdicts.includes('room'))return 'Relaxed fit';
 if(verdicts.includes('true'))return 'Also fits';
 const step=fitStepFor(sizes,size,recommended);return step?step.label+' fit':'';
}
