import type {ContactSource} from './contact-import';
import type {Identity} from '../connection';
export type ClientLook={id:string;title:string;ids:string[];sizes:Record<string,string>;message:string;ready:string[];preview?:Blob;updatedAt:number;identityId?:string;previewIds?:string[];pose?:string;archivedAt?:number;decision?:string};
export type Brief={occasion:string;date:string;budget:string;fit:string;palette:string;avoid:string;owned:string;access:string};
export type Activity={id:string;type:'Fitting'|'Follow-up'|'Outcome';title:string;at:string;done:boolean;note:string};
export type ClientRecord={id:string;name:string;email:string;phone:string;notes:string;identity?:Identity;contactSource?:ContactSource;photo?:Blob;looks:ClientLook[];updatedAt:number;brief?:Brief;activities?:Activity[]};
const DB='oscar-independent-associate-client-book-v1',STORE='clients';
let database:Promise<IDBDatabase>|undefined;
export const MAX_LOOKS=30;
function open(){if(!database)database=new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id'});req.onblocked=()=>reject(Error('Close another Oscar tab and retry opening the client book.'));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('Client storage is unavailable in this browser.'));}).catch(e=>{database=undefined;throw e});return database}
async function transaction<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode);const req=run(tx.objectStore(STORE));tx.oncomplete=()=>resolve(req.result);tx.onerror=tx.onabort=()=>reject(Error('Your changes could not be saved. Browser storage may be full or unavailable.'))})}
export const listClients=async()=>((await transaction('readonly',s=>s.getAll())) as ClientRecord[]).sort((a,b)=>b.updatedAt-a.updatedAt);
export async function putClient(client:ClientRecord){if(!client.name.trim())throw Error('Enter the client’s name.');if(client.looks.filter(l=>!l.archivedAt).length>MAX_LOOKS)throw Error('Archive a look before saving more.');await transaction('readwrite',s=>s.put(client));return client}
export const removeClient=(id:string)=>transaction('readwrite',s=>s.delete(id));
export function updateLook(client:ClientRecord,look:ClientLook):ClientRecord{if(!look.archivedAt&&!client.looks.some(l=>l.id===look.id&&!l.archivedAt)&&client.looks.filter(l=>!l.archivedAt).length>=MAX_LOOKS)throw Error('Archive a look before saving more.');return {...client,looks:client.looks.some(l=>l.id===look.id)?client.looks.map(l=>l.id===look.id?look:l):[...client.looks,look],updatedAt:Date.now()}}
export function searchClients(clients:ClientRecord[],query:string){const q=query.trim().toLocaleLowerCase();return clients.filter(c=>!q||[c.name,c.email,c.phone,c.notes].some(value=>value.toLocaleLowerCase().includes(q)))}

export function setLookArchived(client:ClientRecord,id:string,archived:boolean):ClientRecord{const look=client.looks.find(l=>l.id===id);if(!look)throw Error('This saved look is unavailable.');return updateLook(client,{...look,archivedAt:archived?Date.now():undefined,updatedAt:Date.now()})}
