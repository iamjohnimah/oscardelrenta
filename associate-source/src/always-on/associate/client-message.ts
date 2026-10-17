export type SizeNote={name:string;selected?:string;recommended?:string;source?:string};
export function clientMessage(name:string,notes:SizeNote[],twin:boolean){
 const greeting=name.trim()?'Hi '+name.trim()+',':'Hello,';
 const pieces=notes.map(p=>p.name+(p.selected?' · '+(/^os$/i.test(p.selected)?'One size':'Selected size '+p.selected):p.recommended?' · '+(p.source==='twin'?'Twin starting size ':p.source==='one'?'Available size ':'Size guidance ')+p.recommended:' · Size to confirm')).join('\n');
 return greeting+'\n\nI’ve put together a few Oscar pieces for you to consider.'+(twin?' The preview uses your selected Twin.':'')+'\n\n'+pieces+'\n\nWould you like me to prepare your favourites for a fitting?\n\nGenerated previews are visualizations. Garment details and fit may vary; we’ll confirm your sizes together.';
}
