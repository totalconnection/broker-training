import {S3Client,PutObjectCommand,GetObjectCommand} from '@aws-sdk/client-s3';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export const storageReady=()=>!!(process.env.S3_BUCKET&&process.env.S3_ENDPOINT&&process.env.S3_ACCESS_KEY_ID&&process.env.S3_SECRET_ACCESS_KEY);
function s3(){return new S3Client({endpoint:process.env.S3_ENDPOINT,region:process.env.S3_REGION||'auto',forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID!,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY!}})}
export async function uploadPdf(bytes:Uint8Array,demo:boolean){if(bytes.length>15*1024*1024||Buffer.from(bytes).subarray(0,5).toString()!=='%PDF-')throw Error('Upload a valid PDF under 15 MB.');const key=randomUUID()+'.pdf';if(demo){await mkdir(path.join(process.cwd(),'.local','uploads'),{recursive:true});await writeFile(path.join(process.cwd(),'.local','uploads',key),bytes)}else{if(!storageReady())throw Error('Private storage is not configured yet.');await s3().send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:bytes,ContentType:'application/pdf'}))}return key}
// Private files stay behind the authenticated portal routes. Never expose a
// storage URL or ask the browser to contact the storage provider directly.
async function privateFile(key:string,demo:boolean):Promise<Uint8Array<ArrayBuffer>|ReadableStream<Uint8Array>> {
 if(demo)return new Uint8Array(await readFile(path.join(process.cwd(),'.local','uploads',key)));
 if(!storageReady())throw Error('Private storage is not configured yet.');
 const result=await s3().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}));
 if(!result.Body)throw Error('Resource unavailable');
 return result.Body.transformToWebStream();
}
export async function downloadPdf(key:string,demo:boolean){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/.test(key))throw Error('Invalid resource');
 return privateFile(key,demo);
}
export async function downloadContract(key:string,filename:string,demo:boolean){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.docx$/.test(key)||! /^[A-Za-z0-9-]+\.docx$/.test(filename))throw Error('Invalid contract');
 return privateFile(key,demo);
}
