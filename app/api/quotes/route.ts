import {randomUUID} from 'node:crypto';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireMember,checkOrigin} from '@/lib/access';
import {listItems,saveItem} from '@/lib/store';
import {buildQuote,snapshotSchema,statusSchema,logoSchema,type QuoteRecord} from '@/lib/quote-calculator';
import {QUOTE_KIND,loadQuote,saveQuoteRecord,updateQuoteStatus} from '@/lib/quotes';
const headers={'Cache-Control':'no-store'};
const bodySchema=z.discriminatedUnion('action',[
  z.object({action:z.literal('save'),snapshot:snapshotSchema}),
  z.object({action:z.literal('status'),id:z.uuid(),status:statusSchema}),
  z.object({action:z.literal('logo'),logo:logoSchema}),
]);
function failure(error:unknown) {
  const message=error instanceof Error?error.message:'Unable to save your quote.';
  const status=message==='UNAUTHENTICATED'?401:message==='FORBIDDEN'||message==='ENROLLMENT_REQUIRED'?403:message==='QUOTE_NOT_FOUND'?404:400;
  return NextResponse.json({error:error instanceof z.ZodError?'Please check the quote fields, rates, and logo.':message==='QUOTE_NOT_FOUND'?'Quote not found.':status===401?'Sign in to use the calculator.':message},{status,headers});
}
export async function GET(request:Request) {
  try {
    const member=await requireMember();
    const id=new URL(request.url).searchParams.get('id');
    if(id){z.uuid().parse(id);const quote=await loadQuote(member,id);if(!quote)throw Error('QUOTE_NOT_FOUND');return NextResponse.json({quote},{headers});}
    const quotes=(await listItems(member,QUOTE_KIND)).map(item=>{const {snapshot:_,...summary}=item.data as QuoteRecord;return {...summary,id:item.id};});
    const branding=(await listItems(member,'quote_branding'))[0];
    return NextResponse.json({quotes,logo:branding?.data.logo||''},{headers});
  }catch(error){return failure(error);}
}
export async function POST(request:Request) {
  try {
    await checkOrigin();
    const member=await requireMember();
    if(Number(request.headers.get('content-length')||0)>2_800_000)throw Error('Quote is too large. Use a smaller logo.');
    const raw=await request.text();
    if(Buffer.byteLength(raw)>2_800_000)throw Error('Quote is too large. Use a smaller logo.');
    const body=bodySchema.parse(JSON.parse(raw));
    if(body.action==='status'){await updateQuoteStatus(member,body.id,body.status);return NextResponse.json({ok:true},{headers});}
    if(body.action==='logo'){const current=(await listItems(member,'quote_branding'))[0];await saveItem(member,'quote_branding',{logo:body.logo},current?.id);return NextResponse.json({ok:true},{headers});}
    const quote=buildQuote(body.snapshot,randomUUID());
    await saveQuoteRecord(member,quote);
    const {snapshot:_,...summary}=quote;
    return NextResponse.json({quote:summary},{headers,status:201});
  }catch(error){return failure(error);}
}
