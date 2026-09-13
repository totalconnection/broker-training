import {NextResponse} from 'next/server';
import {requireMember} from '@/lib/access';
import {getCourse,studentCourse} from '@/lib/teaching';
import {downloadPdf} from '@/lib/storage';
export async function GET(r:Request){try{const m=await requireMember();const lessonId=new URL(r.url).searchParams.get('lesson');const course=await getCourse(m);const p=(m.admin?course:studentCourse(course,m.role)).sections.flatMap(s=>s.lessons).find(p=>p.id===lessonId);if(!p?.pdfKey||(!p.published&&!m.admin))return new NextResponse('Not found',{status:404});const file=await downloadPdf(p.pdfKey,m.demo);if(typeof file==='string')return NextResponse.redirect(file);return new NextResponse(new Uint8Array(file),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="freight-skills-resource.pdf"','Cache-Control':'private, no-store'}})}catch{return new NextResponse('Resource unavailable',{status:403})}}
