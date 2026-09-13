import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireAdmin,checkOrigin} from '@/lib/access';
import {getSources,knowledgeSettings,approveSource} from '@/lib/knowledge';
export async function GET(r:Request){try{const m=await requireAdmin();const sources=await getSources();const id=new URL(r.url).searchParams.get('id');if(id){const source=sources.find(s=>s.id===id);return NextResponse.json(source||null,{headers:{'Cache-Control':'no-store'}})}const settings=await knowledgeSettings(m);const approvals=(settings?.data.approvals||{}) as Record<string,boolean>;return NextResponse.json(sources.map(({id,title,kind,approved})=>({id,title,kind,approved:approvals[id]??approved})),{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Admin access required'},{status:403})}}
export async function PUT(r:Request){try{await checkOrigin();const m=await requireAdmin();const {id,approved}=z.object({id:z.string().max(100),approved:z.boolean()}).strict().parse(await r.json());await approveSource(m,id,approved);return NextResponse.json({ok:true})}catch{return NextResponse.json({error:'Unable to update source'},{status:403})}}
