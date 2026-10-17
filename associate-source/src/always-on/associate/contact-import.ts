export type ContactSource = 'phone' | 'vcard' | 'manual';
export type ContactDraft = {name:string; email:string; phone:string; source:ContactSource};
export type ContactSelection = {name:string; emails:string[]; phones:string[]; source:ContactSource};
type PickerContact = {name?:string[];email?:string[];tel?:string[]};
type Picker = {select:(properties:string[],options:{multiple:boolean})=>Promise<PickerContact[]>};
export function contactPicker():Picker|undefined {
 return window.isSecureContext && window.self===window.top ? (navigator as Navigator & {contacts?:Picker}).contacts : undefined;
}
const clean=(value:string)=>value.replace(/[\u0000-\u001f\u007f]/g,' ').trim();
const unique=(values:string[])=>[...new Set(values.map(clean).filter(Boolean))];
export function fromPicker(contact:PickerContact):ContactSelection {
 return {name:clean(contact.name?.[0]||''),emails:unique(contact.email||[]),phones:unique(contact.tel||[]),source:'phone'};
}
const unescape=(value:string)=>clean(value.replace(/\\([nN,;\\])/g,(_,c:string)=>/[nN]/.test(c)?' ':c));
export function parseContactCard(text:string):ContactSelection {
 const lines=text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').replace(/\n[ \t]/g,'').split('\n');
 if(lines.filter(l=>/^BEGIN:VCARD$/i.test(l)).length!==1 || lines.filter(l=>/^END:VCARD$/i.test(l)).length!==1)throw Error('Choose a contact card for one person, not a full address book.');
 const start=lines.findIndex(l=>/^BEGIN:VCARD$/i.test(l)),end=lines.findIndex(l=>/^END:VCARD$/i.test(l));
 if(end<=start)throw Error('This contact card could not be read. Try a new export or add the details manually.');
 const card=lines.slice(start+1,end);
 if(!card.some(l=>/^VERSION:(3\.0|4\.0)$/i.test(l)))throw Error('Use a vCard 3.0 or 4.0 contact card, or add the details manually.');
 let name='',structuredName='';const emails:string[]=[],phones:string[]=[];
 for(const line of card){const colon=line.indexOf(':');if(colon<0)continue;const header=line.slice(0,colon),key=header.split(';')[0].split('.').pop()?.toUpperCase(),raw=line.slice(colon+1);
  if(!['FN','N','EMAIL','TEL'].includes(key||''))continue;
  if(/ENCODING=|CHARSET=(?!UTF-8(?:;|$))/i.test(header))throw Error('This contact uses an older text format. Export it again or enter the details manually.');
  const value=unescape(raw);
  if(key==='FN')name=value;
  if(key==='N'){const parts=raw.split(/(?<!\\);/).map(unescape);structuredName=[parts[3],parts[1],parts[2],parts[0],parts[4]].filter(Boolean).join(' ')}
  if(key==='EMAIL')emails.push(value.replace(/^mailto:/i,''));
  if(key==='TEL')phones.push(value.replace(/^tel:/i,''));
 }
 if(!name&&!structuredName&&!emails.length&&!phones.length)throw Error('No name, email or phone number was found. Try another card or add the details manually.');
 return {name:name||structuredName,emails:unique(emails),phones:unique(phones),source:'vcard'};
}
export function matchingContacts<T extends {email:string;phone:string}>(clients:T[],draft:ContactDraft):T[]{
 const email=draft.email.trim().toLowerCase(),phone=draft.phone.replace(/\D/g,'');
 return clients.filter(c=>(!!email&&c.email.trim().toLowerCase()===email)||(phone.length>=7&&c.phone.replace(/\D/g,'')===phone));
}
export const sourceLabel=(source?:ContactSource)=>source==='phone'?'From phone contacts':source==='vcard'?'From contact card':source==='manual'?'Added manually':'Saved in this browser';
