export async function boundedText(request:Request,maxBytes=65536){
 const reader=request.body?.getReader();if(!reader)return '';
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('Request is too large');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return new TextDecoder().decode(bytes);
}
export async function boundedJson(request:Request,maxBytes=65536){return JSON.parse(await boundedText(request,maxBytes));}
export function safeError(error:unknown){
 const message=error instanceof Error?error.message:'';
 const allowed=['Please wait for your current answer before asking again.','Your monthly question allowance has been reached.','Your daily question allowance has been reached. Please return tomorrow.','AI answers are paused for this month. Your course and downloads remain available.','UNAUTHENTICATED','FORBIDDEN','ENROLLMENT_REQUIRED','QUOTE_NOT_FOUND','Request is too large','Entry is too large','Unknown lesson','Course is too large','Enter a valid Vimeo video link','Invalid PDF key','Attach the reviewed lesson video before publishing','Choose a PDF under 15 MB','PDF must be under 15 MB','Please shorten your message.','This conversation is too long. Start a new chat and bring over the key details.','Freightskills GPT could not answer right now. Please try again later.','No answer was returned. Please try again later.'];
 return allowed.includes(message)?message:'Unable to complete this request. Check your entries and try again.';
}
