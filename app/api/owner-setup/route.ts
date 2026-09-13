import {NextResponse} from 'next/server';
import {z} from 'zod';
import {checkOrigin} from '@/lib/access';
import {claimOwner} from '@/lib/owner-setup';
export async function POST(request:Request){try{await checkOrigin();const raw=await request.text();if(raw.length>2000)throw Error('Invalid request');const {token,password}=z.object({token:z.string().min(40).max(128),password:z.string().min(12).max(128)}).strict().parse(JSON.parse(raw));return NextResponse.json(await claimOwner(token,password),{headers:{'Cache-Control':'no-store'}})}catch(e){const message=e instanceof Error?e.message:'';return NextResponse.json({error:message.startsWith('This invitation')||message.startsWith('An account')?message:'Unable to activate. Use a valid invitation and a password of 12–128 characters.'},{status:400})}}
