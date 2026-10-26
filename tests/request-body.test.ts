import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boundedBytes,boundedFormData} from '../lib/request-body';

test('streamed uploads cannot bypass the byte limit with absent or false content-length',async()=>{
 for(const headers of [{},{'content-length':'1'}]){
  let cancelled=false;
  const body=new ReadableStream<Uint8Array>({pull(c){c.enqueue(new Uint8Array(8));},cancel(){cancelled=true;}});
  const request=new Request('https://example.test',{method:'POST',headers,body,duplex:'half'} as RequestInit);
  await assert.rejects(boundedBytes(request,12),/Request is too large/);
  assert.equal(cancelled,true);
 }
});
test('bounded multipart parsing preserves binary PDF content',async()=>{
 const content=new Uint8Array([37,80,68,70,45,0,255,128]);
 const form=new FormData();form.append('file',new Blob([content],{type:'application/pdf'}),'lesson.pdf');
 const request=new Request('https://example.test',{method:'POST',body:form});
 const parsed=await boundedFormData(request,4096);
 const file=parsed.get('file') as File;
 assert.equal(file.name,'lesson.pdf');assert.deepEqual(new Uint8Array(await file.arrayBuffer()),content);
});
