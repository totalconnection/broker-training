import {redirect,notFound} from 'next/navigation';
import {learningMember} from '@/lib/access';
import {hasProduct} from '@/lib/products';
import {getCourse} from '@/lib/teaching';
import {studentCourse,completedIds} from '@/lib/teaching-schema';
import {quoteCourse} from '@/lib/quote-workshop';
import {listItems} from '@/lib/store';
import QuoteWorkshop from '@/components/quote-workshop';
export const dynamic='force-dynamic';
export const metadata={title:'Quote Workshop | Freight Skills Portal'};
export default async function Page({params}: {params: Promise<{path?: string[]}>}) {
 const m=await learningMember();if(!m)redirect('/login');
 if(!hasProduct(m,'quote-workshop'))redirect('/app');
 const {path=[]}=await params;
 const view=path[0]||'overview';
 if(!(path.length===0||(path.length===1&&['process','lessons','calculator','resources'].includes(view))||(path.length===2&&view==='lessons')))notFound();
 const course=studentCourse(quoteCourse(await getCourse(m)),m.role,m.admin);
 if(path.length===2&&!course.sections.some(s=>s.lessons.some(l=>l.id===path[1])))notFound();
 const items=await listItems(m,'lesson_progress');
 return <QuoteWorkshop key={path.join('/')} member={m} course={course} completedIds={completedIds(items)} view={view} lessonId={path[1]}/>;
}
