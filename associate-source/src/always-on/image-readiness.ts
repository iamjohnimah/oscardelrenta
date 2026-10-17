/** Check the browser can display an image, without requiring storage CORS access. */
export function loadImage(url:string,timeout=15000):Promise<void>{
 return new Promise((resolve,reject)=>{
  if(!url){reject(new Error('No image was returned. Please retry your look.'));return}
  const image=new Image();
  const timer=setTimeout(()=>finish(new Error('Your image could not be loaded. Please retry.')),timeout);
  function finish(error?:Error){clearTimeout(timer);image.onload=null;image.onerror=null;error?reject(error):resolve()}
  image.onload=()=>image.naturalWidth?finish():finish(new Error('This image is empty. Please retry.'));
  image.onerror=()=>finish(new Error('Your image could not be loaded. Please retry.'));
  image.src=url;
 });
}
