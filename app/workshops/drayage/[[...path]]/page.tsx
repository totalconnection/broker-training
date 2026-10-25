import {redirect,notFound} from 'next/navigation';
import {learningMember} from '@/lib/access';
import {hasProduct} from '@/lib/products';
import {getCourse} from '@/lib/teaching';
import {studentCourse,completedIds} from '@/lib/teaching-schema';
import {drayageCourse} from '@/lib/drayage-workshop';
import {listItems} from '@/lib/store';
import Workshop from '@/components/workshop';
export const dynamic='force-dynamic';
export const metadata={title:'Drayage Workshop | Freight Skills Portal'};
export default async function Page({params}:{params:Promise<{path?:string[]}>}) {
 const member=await learningMember();if(!member)redirect('/login');
 if(!hasProduct(member,'drayage-workshop'))redirect('/app');
 const {path=[]}=await params,view=path[0]||'overview';
 if(!(path.length===0||(path.length===1&&['process','lessons','calculator','resources'].includes(view))||(path.length===2&&view==='lessons')))notFound();
 const course=studentCourse(drayageCourse(await getCourse(member)),member.role,member.admin);
 if(path.length===2&&!course.sections.some(s=>s.lessons.some(l=>l.id===path[1])))notFound();
 const items=await listItems(member,'lesson_progress');
 return <Workshop key={path.join('/')} kind="drayage" member={member} course={course} completedIds={completedIds(items)} view={view} lessonId={path[1]}/>;
}
