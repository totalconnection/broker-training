import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireAdmin,checkOrigin} from '@/lib/access';
import {publish} from '@/lib/store';
import {lessonById} from '@/lib/catalog';
import {vimeoEmbed} from '@/lib/rules';
export async function POST(r:Request){try{await checkOrigin();const m=await requireAdmin();const value=z.object({id:z.string(),published:z.boolean(),vimeo:z.string().max(500),pdfKey:z.string().max(80)}).parse(await r.json());if(!lessonById(value.id))throw Error('Unknown lesson');if(value.vimeo&&!vimeoEmbed(value.vimeo))throw Error('Enter a valid Vimeo video link');if(value.pdfKey&&!/^[0-9a-f-]{36}\.pdf$/.test(value.pdfKey))throw Error('Invalid PDF key');if(value.published&&!value.vimeo)throw Error('Attach the reviewed lesson video before publishing');await publish(m,value);return NextResponse.json({ok:true})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Cannot save'},{status:400})}}
