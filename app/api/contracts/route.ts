import {NextResponse} from 'next/server';
import {requireMember} from '@/lib/access';
import {contractTemplates} from '@/lib/contract-templates';
import {downloadContract} from '@/lib/storage';
export async function GET(request:Request){
 try{
  const member=await requireMember();
  const id=new URL(request.url).searchParams.get('id');
  const template=contractTemplates.find(t=>t.id===id);
  if(!template)return new NextResponse('Not found',{status:404});
  const file=await downloadContract(template.key,template.filename,member.demo);
  
  return new NextResponse(file,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':`attachment; filename="${template.filename}"`,'Cache-Control':'private, no-store'}});
 }catch{return new NextResponse('Resource unavailable',{status:403});}
}
