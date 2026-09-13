import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireAdmin,requireMember,checkOrigin} from '@/lib/access';
import {getCourse,saveCourse,studentCourse,roster} from '@/lib/teaching';
import {courseSchema} from '@/lib/teaching-schema';
import {listItems,saveItem} from '@/lib/store';
function error(e:unknown){const message=e instanceof Error?e.message:'Unable to save';return NextResponse.json({error:message},{status:message==='UNAUTHENTICATED'?401:message==='FORBIDDEN'||message==='ENROLLMENT_REQUIRED'?403:400})}
export async function GET(){try{const m=await requireAdmin();return NextResponse.json(await roster(m),{headers:{'Cache-Control':'no-store'}})}catch(e){return error(e)}}
export async function PUT(r:Request){try{await checkOrigin();const m=await requireAdmin();const raw=await r.text();if(raw.length>1000000)throw Error('Course is too large');const course=courseSchema.parse(JSON.parse(raw));await saveCourse(m,course);return NextResponse.json({ok:true})}catch(e){return error(e)}}
export async function POST(r:Request){try{await checkOrigin();const m=await requireMember();const {lessonId,completed}=z.object({lessonId:z.string().max(100),completed:z.boolean()}).parse(await r.json());const course=await getCourse(m);const available=m.admin?course:studentCourse(course,m.role);if(!available.sections.some(s=>s.lessons.some(l=>l.id===lessonId)))throw Error('FORBIDDEN');const items=await listItems(m,'lesson_progress');const current=items.find(i=>i.data.lessonId===lessonId);await saveItem(m,'lesson_progress',{lessonId,completed},current?.id);return NextResponse.json({ok:true})}catch(e){return error(e)}}
