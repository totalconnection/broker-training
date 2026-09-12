import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {database} from './db';
import type {Member} from './access';
export type Item={id:string;kind:string;data:Record<string,unknown>;updated_at:string};
let serial:Promise<unknown>=Promise.resolve();
const file=path.join(process.cwd(),'.local','workspace.json');
async function localRead():Promise<Record<string,Item[]>>{try{return JSON.parse(await readFile(file,'utf8'))}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {};throw e}}
async function localChange(fn:(state:Record<string,Item[]>)=>void){const run=serial.then(async()=>{const state=await localRead();fn(state);await mkdir(path.dirname(file),{recursive:true});const temp=file+'.'+randomUUID();await writeFile(temp,JSON.stringify(state),{mode:0o600});await rename(temp,file)});serial=run.catch(()=>{});await run}
export async function listItems(m:Member,kind?:string){if(m.demo){await serial;const all=(await localRead())[m.id]??[];return kind?all.filter(x=>x.kind===kind):all}const q=await database().query('SELECT id,kind,data,updated_at FROM workspace_items WHERE user_id=$1'+(kind?' AND kind=$2':'')+' ORDER BY updated_at DESC',kind?[m.id,kind]:[m.id]);return q.rows as Item[]}
export async function saveItem(m:Member,kind:string,data:Record<string,unknown>,id:string=randomUUID()){if(m.demo){await localChange(s=>{const items=s[m.id]??=[];const idx=items.findIndex(x=>x.id===id);const item={id,kind,data,updated_at:new Date().toISOString()};if(idx>=0)items[idx]=item;else items.unshift(item)});return id}await database().query('INSERT INTO workspace_items(id,user_id,kind,data) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,updated_at=now() WHERE workspace_items.user_id=$2 AND workspace_items.kind=$3',[id,m.id,kind,JSON.stringify(data)]);return id}
export async function deleteItem(m:Member,id:string){if(m.demo){await localChange(s=>{s[m.id]=(s[m.id]??[]).filter(x=>x.id!==id)})}else await database().query('DELETE FROM workspace_items WHERE user_id=$1 AND id=$2',[m.id,id])}
export type Publication={id:string;published:boolean;vimeo:string;pdfKey:string};
export async function publications(m:Member):Promise<Publication[]>{if(m.demo)return (await listItems({...m,id:'local-content'},'publication')).map(x=>x.data as unknown as Publication);return (await database().query('SELECT lesson_id AS id,published,vimeo,pdf_key AS "pdfKey" FROM lesson_publications')).rows}
export async function publish(m:Member,value:Publication){if(!m.admin)throw Error('FORBIDDEN');if(m.demo){const a={...m,id:'local-content'};const current=(await listItems(a,'publication')).find(x=>x.data.id===value.id);await saveItem(a,'publication',value,current?.id)}else await database().query('INSERT INTO lesson_publications(lesson_id,published,vimeo,pdf_key) VALUES($1,$2,$3,$4) ON CONFLICT(lesson_id) DO UPDATE SET published=$2,vimeo=$3,pdf_key=$4,updated_at=now()',[value.id,value.published,value.vimeo,value.pdfKey])}
