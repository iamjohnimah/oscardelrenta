import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const {build}=require(process.env.ESBUILD_MODULE||'esbuild');
const out=process.env.OSCAR_OUTPUT_DIR||path.resolve(root,'../associate');
await fs.mkdir(out+'/assets/fonts',{recursive:true});
for(const f of ['afacad-400.ttf','afacad-500.ttf','afacad-600.ttf','afacad-700.ttf'])await fs.copyFile(root+'/public/fonts/'+f,out+'/assets/fonts/'+f);
const result=await build({absWorkingDir:root,entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'esm',jsx:'automatic',write:false,metafile:true,outdir:out+'/assets',entryNames:'atelier-[hash]',assetNames:'[name]-[hash]',loader:{'.svg':'file','.png':'file','.jpg':'file','.woff2':'file','.ttf':'file'},external:['/spreeai-always-on-demo/*','/oscardelrenta/*','./fonts/*'],define:{'process.env.NODE_ENV':'"production"'}});
for(const f of result.outputFiles)await fs.writeFile(f.path,f.contents);
const js=result.outputFiles.find(f=>f.path.endsWith('.js')),css=result.outputFiles.find(f=>f.path.endsWith('.css'));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="robots" content="noindex,nofollow"><title>Oscar de la Renta × SPREEAI · Atelier</title><link rel="stylesheet" href="/oscardelrenta/associate/assets/'+path.basename(css.path)+'"><script type="module" src="/oscardelrenta/associate/assets/'+path.basename(js.path)+'"></script></head><body><div id="root"></div></body></html>';
for(const p of ['in-store','vic','client']){await fs.mkdir(out+'/'+p,{recursive:true});await fs.writeFile(out+'/'+p+'/index.html',html)}
await fs.writeFile(out+'/release.json',JSON.stringify({version:'2.0.0',builtAt:new Date().toISOString(),js:path.basename(js.path),css:path.basename(css.path),sourceDigest:crypto.createHash('sha256').update(js.contents).digest('hex')},null,2));
await fs.writeFile(root+'/build-meta.json',JSON.stringify(result.metafile));
console.log(JSON.stringify({version:'2.0.0',files:result.outputFiles.map(f=>({file:path.basename(f.path),bytes:f.contents.length}))}));
