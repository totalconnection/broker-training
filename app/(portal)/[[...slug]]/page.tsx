import {redirect,notFound} from 'next/navigation';
import {learningMember} from '@/lib/access';
import {listItems} from '@/lib/store';
import {getCourse,studentCourse} from '@/lib/teaching';
import TeachingPortal from '@/components/teaching-portal';
import ProductHome from '@/components/product-home';
import {hasProduct} from '@/lib/products';
import {isQuoteLesson,quoteLessonHref} from '@/lib/quote-workshop';
export const dynamic='force-dynamic';
export default async function Page({params}: {params: Promise<{slug?: string[]}>}) {
 const m=await learningMember();if(!m)redirect('/login');
 const {slug=[]}=await params;
 if(!slug.length||slug.join('/')==='app')return <ProductHome member={m}/>;
 if(slug.join('/')==='quote-calculator')redirect('/workshops/quote/calculator');
 if(slug[0]==='learn'&&slug.length===2&&isQuoteLesson(slug[1]))redirect(quoteLessonHref(slug[1]));
 const pages=['academy','library','resources','contracts','gpt','community','studio'];
 if(!(slug.length===1&&pages.includes(slug[0]))&&!(slug[0]==='learn'&&slug.length===2))notFound();
 if(!hasProduct(m,'academy')||(slug[0]==='studio'&&!m.admin))redirect('/app');
 const course=await getCourse(m), available=m.admin?course:studentCourse(course,m.role);
 if(slug[0]==='learn'&&!available.sections.some(s=>s.lessons.some(l=>l.id===slug[1])))notFound();
 return <TeachingPortal member={m} initialCourse={available} initialItems={await listItems(m)}/>;
}
