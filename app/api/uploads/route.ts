import {NextResponse} from 'next/server';
import {requireAdmin,checkOrigin} from '@/lib/access';
import {uploadPdf} from '@/lib/storage';
export async function POST(r:Request){try{await checkOrigin();const m=await requireAdmin();if(Number(r.headers.get('content-length')||0)>16*1024*1024)throw Error('PDF must be under 15 MB');const f=(await r.formData()).get('file');if(!(f instanceof File)||f.size>15*1024*1024)throw Error('Choose a PDF under 15 MB');return NextResponse.json({key:await uploadPdf(new Uint8Array(await f.arrayBuffer()),m.demo)})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Upload failed'},{status:400})}}
