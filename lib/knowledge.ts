import {readFile} from 'node:fs/promises';
import {S3Client,GetObjectCommand} from '@aws-sdk/client-s3';
export type KnowledgeSource={id:string;title:string;text:string;kind:string;url:string|null;approved:boolean};
let cached:{at:number;docs:KnowledgeSource[]}|undefined;
export async function getSources():Promise<KnowledgeSource[]>{if(cached&&Date.now()-cached.at<60000)return cached.docs;let raw:string;if(process.env.RAILWAY_ENVIRONMENT_ID){const s3=new S3Client({endpoint:process.env.S3_ENDPOINT,region:process.env.S3_REGION||'auto',forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID!,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY!}});const result=await s3.send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:'knowledge/library.json'}));raw=await result.Body!.transformToString()}else raw=await readFile(process.cwd()+'/data/knowledge/library.json','utf8');const docs=JSON.parse(raw) as KnowledgeSource[];cached={at:Date.now(),docs};return docs}
import type {Member} from './access';
import {listItems,saveItem} from './store';

export async function knowledgeSettings(m:Member){return (await listItems({...m,id:'teaching-content'},'knowledge_settings'))[0]}
export async function approvedSources(m:Member){const sources=await getSources();const settings=await knowledgeSettings(m);const approvals=(settings?.data.approvals||{}) as Record<string,boolean>;return sources.filter(s=>m.admin||(approvals[s.id]??s.approved))}
export async function approveSource(m:Member,id:string,approved:boolean){const sources=await getSources();if(!m.admin||!sources.some(s=>s.id===id))throw Error('FORBIDDEN');const current=await knowledgeSettings(m);await saveItem({...m,id:'teaching-content'},'knowledge_settings',{approvals:{...(current?.data.approvals as object||{}),[id]:approved}},current?.id)}
const stop=new Set('the and a an to of in for i my me you your it is are have has how what do can would should with that this they them on as be already before after next just got get tell ask say their from about need does'.split(' '));
function words(s:string){return s.toLowerCase().match(/[a-z0-9]+/g)?.filter(w=>w.length>2&&!stop.has(w)).map(w=>w.length>4&&w.endsWith('s')?w.slice(0,-1):w)||[]}
export function retrieve(question:string,docs:KnowledgeSource[]){
 const terms=[...new Set(words(question))];if(!terms.length)return [];
 const chunks=docs.flatMap(s=>{const result:{id:string;title:string;text:string}[]=[];let buffer='';for(const paragraph of s.text.split(/\n\n+/)){buffer+='\n\n'+paragraph;if(buffer.length>=1400){for(let offset=0;offset<buffer.length;offset+=2000)result.push({id:s.id,title:s.title,text:buffer.slice(offset,offset+2400)});buffer=''}}if(buffer.trim())result.push({id:s.id,title:s.title,text:buffer.trim()});return result});
 const tokens=chunks.map(c=>words(c.text));const counts=terms.map(t=>tokens.filter(ws=>ws.includes(t)).length);const avg=tokens.reduce((n,ws)=>n+ws.length,0)/Math.max(1,tokens.length);
 return chunks.map((c,i)=>{const ws=tokens[i],title=words(c.title);let matched=0;let score=0;for(let j=0;j<terms.length;j++){const t=terms[j],tf=ws.filter(w=>w===t).length,idf=Math.log(1+(chunks.length-counts[j]+0.5)/(counts[j]+0.5));if(tf||title.includes(t))matched++;if(tf)score+=idf*(tf*2.2)/(tf+1.2*(0.25+0.75*ws.length/avg));if(title.includes(t))score+=idf*2;}return {...c,score:matched>=Math.min(2,terms.length)?score:0}}).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,5)
}
