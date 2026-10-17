export type Collection = 'dev' | 'prod';
export type VariantKey = { gender: string; style: string; color: string; fit: string };
export type CatalogVariant = {gender?:string;style?:string;fit?:string;color?:{name?:string};images?:{tag?:string|null;url:string}[]};
const variants = new Map<string, VariantKey>();
export function shownVariant<V extends CatalogVariant>(rows: V[]): V | undefined {
 return rows.find(v => (v.images || []).some(i => /^https:\/\//i.test(i.url)));
}
export function rememberVariant(id:string, environment:Collection, variant:CatalogVariant) {
 const {gender,style,fit}=variant,color=variant.color?.name;
 const key=environment+':'+id;
 if(gender&&style&&fit&&color) variants.set(key,{gender,style,fit,color});
 else variants.delete(key);
}
export const variantOf=(id:string,environment:Collection='dev')=>variants.get(environment+':'+id);
export function ownCatalog<T extends {partner_id?:string}>(rows:T[],partner:string) {
 return rows.filter(g=>!g.partner_id||g.partner_id.toLowerCase()===partner.toLowerCase());
}
/** A random rank per piece: stable across filters, loads and live updates in this visit. */
export function createVisitOrder(random:()=>number=Math.random) {
 const rank=new Map<string,number>();
 return <T extends {id:string}>(rows:T[]):T[]=>{
  for(const row of rows) if(!rank.has(row.id)) rank.set(row.id,random());
  return [...rows].sort((a,b)=>rank.get(a.id)!-rank.get(b.id)!||a.id.localeCompare(b.id));
 };
}
