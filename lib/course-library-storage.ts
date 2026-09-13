import {readFile} from 'node:fs/promises';
import {S3Client,GetObjectCommand} from '@aws-sdk/client-s3';
import {courseSchema,type Course} from './teaching-schema';
let cached:{at:number;course:Course}|undefined;
export async function getCourseLibrary():Promise<Course|null>{
 if(cached&&Date.now()-cached.at<60000)return cached.course;
 let raw:string;
 try{
  if(process.env.RAILWAY_ENVIRONMENT_ID){
   const client=new S3Client({endpoint:process.env.S3_ENDPOINT,region:process.env.S3_REGION||'auto',forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID!,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY!}});
   const file=await client.send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:'course/masterclasses.json'}));
   raw=await file.Body!.transformToString();
  }else raw=await readFile(process.cwd()+'/data/knowledge/masterclasses.json','utf8');
 }catch(error){
  if((error as {code?:string}).code==='ENOENT'||(error as {name?:string}).name==='NoSuchKey')return null;
  throw error;
 }
 const course=courseSchema.parse(JSON.parse(raw));cached={at:Date.now(),course};return course;
}
