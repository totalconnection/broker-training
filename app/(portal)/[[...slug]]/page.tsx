import {redirect} from 'next/navigation';
import {member} from '@/lib/access';
import {listItems} from '@/lib/store';
import {getCourse,studentCourse} from '@/lib/teaching';
import TeachingPortal from '@/components/teaching-portal';
export const dynamic='force-dynamic';
export default async function Page(){const m=await member();if(!m)redirect('/login');const course=await getCourse(m);if(!m.enrolled)return <main className="setup"><h1>Your Freight Skills account</h1><p>You do not have active course access yet.</p>{course.settings.checkoutUrl?<a className="button" href={course.settings.checkoutUrl}>Enroll in the program</a>:<p>Enrollment will open when checkout is connected.</p>}<a href="/login">Back to sign in</a></main>;return <TeachingPortal member={m} initialCourse={m.admin?course:studentCourse(course,m.role)} initialItems={await listItems(m)}/>}
