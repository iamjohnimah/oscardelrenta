import type {Product} from './data';
export type Brief={occasion:string;direction:string;budget:number|null;category:string;avoid:string[];presentation:''|'Feminine'|'Masculine'|'A mix';wardrobe:string;preferences:string[]};
export const emptyBrief:Brief={occasion:'',direction:'',budget:null,category:'',avoid:[],presentation:'',wardrobe:'',preferences:[]};
export function understand(text:string,previous:Brief):Brief{
 const s=text.toLowerCase().replaceAll('’',"'"),b={...previous,avoid:[...previous.avoid],preferences:[...(previous.preferences||[])]};
 const positive=s.replace(/(?:heels|wool|leather|silk|white|sleeveless|sequins) (?:is|are) (?:fine|okay|ok)|allow (?:heels|wool|leather|silk|white|sleeveless|sequins)/g,'').replace(/(?:no|not|avoid|without|don't want|do not want)\s+(?:a |any )?(?:dress(?:es)?|gown|wool|heels|leather|silk|white|ivory|sleeveless|sequins|formal)\b/g,'');
 if(/feminine|womenswear/.test(s))b.presentation='Feminine';else if(/masculine|menswear/.test(s))b.presentation='Masculine';else if(/a mix|both styles|all styles/.test(s))b.presentation='A mix';
 if(/no dresses|no dress|not a dress|don't want (?:a |any )?dress|do not want (?:a |any )?dress/.test(s))b.category='Separates';
 if(/wedding/.test(s))b.occasion='A wedding';else if(/work|office|meeting/.test(s))b.occasion='Work';else if(/getaway|holiday|vacation|beach|travel/.test(s))b.occasion='A getaway';else if(/dinner|date|evening|party/.test(s))b.occasion='An evening out';else if(/weekend|everyday|casual/.test(s))b.occasion='Everyday';
 if(/black.tie|formal/.test(positive))b.direction='Formal';else if(/relaxed|comfortable|easy|casual/.test(s))b.direction='Relaxed';else if(/bold|statement|colorful|colourful/.test(s))b.direction='Statement';else if(/minimal|understated|classic|tailored/.test(s))b.direction='Understated';
 if(/\b(dress(?:es)?|gown)\b/.test(positive))b.category='Dresses';
 else if(/\b(jackets?|coats?|blazers?|outerwear)\b/.test(positive))b.category='Outerwear';
 else if(/\b(sweaters?|cardigans?|knitwear)\b/.test(positive))b.category='Knitwear';
 else if(/\b(trousers?|pants|jeans|shorts|skirt)\b/.test(positive))b.category='Bottoms';
 else if(/\b(shirts?|blouses?|tees?|tops?)\b/.test(positive))b.category='Tops';
 else if(/\b(shoes?|sneakers?|boots?|sandals?|heels?)\b/.test(positive))b.category='Shoes';
 else if(/suit|separates|menswear/.test(positive))b.category='Separates';
 else if(/bag|earring|accessor/.test(positive))b.category='Accessories';
 const budget=s.match(/(?:under|below|budget(?: of| is)?|up to|less than)\s*\$?([\d,]+(?:\.\d+)?)/);if(budget)b.budget=Number(budget[1].replaceAll(',',''));if(/no budget|no limit|flexible budget|open budget/.test(s))b.budget=null;
 if(/no (?:white|ivory)|avoid (?:white|ivory)/.test(s)&&!b.avoid.includes('white'))b.avoid.push('white');
 for(const term of ['wool','heels','leather','silk','sleeveless','sequins']){if(new RegExp('(?:no|avoid|without|cannot wear|can’t wear|allergic to) '+term).test(s)&&!b.avoid.includes(term))b.avoid.push(term)}
 for(const term of ['wool','heels','leather','silk','white','sleeveless','sequins']){
  if(new RegExp(`(?:no|avoid|without|can't wear|cannot wear|don't want) (?:any )?${term}`).test(s)&&!b.avoid.includes(term))b.avoid.push(term);
  if(new RegExp(`(?:${term} (?:is|are) (?:fine|okay|ok)|allow ${term})`).test(s))b.avoid=b.avoid.filter(t=>t!==term);
 }
 if(/cheaper|less expensive|more affordable/.test(s)&&b.budget!==null)b.budget=Math.max(1,Math.floor(b.budget*.75));
 for(const word of ['linen','cotton','navy','black','blue','pink','neutral','floral','tailored','relaxed'])if(new RegExp('\\b'+word+'\\b').test(positive)&&!b.preferences.includes(word))b.preferences.push(word);
 if(/clear exclusions|no exclusions/.test(s))b.avoid=[];
 return b;
}
export function eligible(p:Product,brief:Brief){
 const t=(p.name+' '+p.color+' '+p.description+' '+p.material).toLowerCase();
 if(brief.budget!==null&&(p.currency!=='USD'||p.price<=0||p.price>brief.budget))return false;
 const terms:Record<string,RegExp>={white:/white|ivory|cream/,heels:/heel|pump|stiletto/,sequins:/sequin/};
 return ![...brief.avoid,...understand(brief.wardrobe||'',emptyBrief).avoid].some(term=>(terms[term]||new RegExp(term)).test(t));
}
export function reasonFor(p:Product,brief:Brief){
 const reasons:string[]=[];const t=(p.name+' '+p.description).toLowerCase();
 if(brief.direction==='Relaxed'&&/relaxed|cotton|linen|knit|jersey/.test(t))reasons.push('An easy starting point for your relaxed brief');
 else if(brief.occasion==='Work'&&/shirt|blazer|trouser|tailored/.test(t))reasons.push('A versatile option for your work edit');
 else reasons.push('A starting point for '+(brief.occasion||'your plans').toLowerCase());
 if(brief.budget!==null)reasons.push('within your $'+brief.budget+' per-piece budget');
 const owned=(brief.wardrobe||'').split('\n').find(line=>/^already own:|i (?:already )?own/i.test(line));
 if(owned)reasons.push('a piece to consider alongside '+owned.replace(/^already own:|^i (?:already )?own/i,'').trim());
 else if(brief.wardrobe&&brief.wardrobe.toLowerCase().split(/\W+/).some(w=>w.length>3&&t.includes(w)))reasons.push('echoes details you shared about your wardrobe');
 return reasons.join(' · ')+'.';
}
export function selectPieces(catalog:Product[],brief:Brief,offset=0){
 const candidates=catalog.filter(p=>{const t=(p.name+' '+p.color).toLowerCase();if(!eligible(p,brief))return false;if(brief.presentation==='Masculine'&&!brief.category&&p.category==='Dresses')return false;if(brief.budget!==null&&(p.currency!=='USD'||p.price<=0||p.price>brief.budget))return false;if(brief.avoid.includes('white')&&/white|ivory|cream/.test(t))return false;if(brief.category==='Dresses')return p.category==='Dresses';if(brief.category==='Separates')return ['Outerwear','Shirts','Tops','Bottoms','Knitwear'].includes(p.category);if(brief.category==='Accessories')return ['Accessories','Shoes'].includes(p.category);if(brief.category==='Tops')return ['Tops','Shirts','Knitwear'].includes(p.category);if(brief.category)return p.category===brief.category;return ['Dresses','Outerwear','Shirts','Knitwear','Tops','Bottoms'].includes(p.category)});
 const score=(p:Product)=>{let n=0;const t=(p.name+' '+p.description+' '+p.color).toLowerCase();if(brief.occasion==='A wedding'&&/dress|gown|silk|satin|suit|blazer/.test(t))n+=4;if(brief.occasion==='A getaway'&&/linen|resort|cotton|short|floral/.test(t))n+=4;if(brief.occasion==='Work'&&/shirt|blazer|trouser|tailored/.test(t))n+=4;if(brief.direction==='Statement'&&/floral|printed|pink|red|embellish|sequin/.test(t))n+=4;if(brief.direction==='Understated'&&/black|navy|knit|wool|linen/.test(t))n+=4;if(brief.direction==='Formal'&&/gown|satin|silk|evening|blazer/.test(t))n+=4;if(brief.direction==='Relaxed'&&/relaxed|cotton|linen|knit|jersey/.test(t))n+=4;if(brief.presentation==='Masculine'&&/tailored|shirt|trouser|relaxed|blazer/.test(t))n+=3;if(brief.presentation==='Feminine'&&/dress|skirt|blouse/.test(t))n+=3;for(const word of [...(brief.preferences||[]),...(brief.wardrobe||'').toLowerCase().split(/\W+/)]){if(word.length>3&&t.includes(word))n+=1}const owned=(brief.wardrobe||'').split('\n').filter(line=>/^already own:|i (?:already )?own/i.test(line));if(!brief.category&&owned.some(line=>{const category=understand(line,emptyBrief).category;return category===p.category||(category==='Tops'&&['Shirts','Tops','Knitwear'].includes(p.category))}))n-=12;return n};
 return candidates.map((p,i)=>({p,i,score:score(p)})).sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.p).slice(offset,offset+4);
}
export function completePieces(catalog:Product[],anchor:Product,brief:Brief){const other=catalog.filter(p=>eligible(p,brief)&&p.id!==anchor.id&&(p.environment||'dev')===(anchor.environment||'dev')&&(brief.budget===null||(p.currency==='USD'&&p.price>0&&p.price<=brief.budget)));const rows=[anchor];if(!['Dresses','Bottoms'].includes(anchor.category)){const bottom=other.find(p=>p.category==='Bottoms');if(bottom)rows.push(bottom)}if(anchor.category==='Bottoms'){const top=other.find(p=>['Shirts','Tops','Knitwear'].includes(p.category));if(top)rows.push(top)}for(const category of ['Shoes','Accessories']){const p=other.find(p=>p.category===category);if(p&&!rows.some(x=>x.id===p.id))rows.push(p)}return rows}
