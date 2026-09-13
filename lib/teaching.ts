import seed from '@/data/teaching-course.json';
import {listItems,saveItem} from './store';
import {courseSchema,studentCourse,completedIds,type Course} from './teaching-schema';
import type {Member} from './access';
import {database} from './db';
const contentMember=(m:Member)=>({...m,id:'teaching-content'});
export async function getCourse(m:Member):Promise<Course>{const saved=(await listItems(contentMember(m),'teaching_course'))[0];const data=structuredClone(saved?.data??seed) as unknown as Course;if(!data.sections.some(s=>s.id==='section-agent'))data.sections.splice(1,0,structuredClone(seed.sections.find(s=>s.id==='section-agent')!) as Course['sections'][number]);for(const section of data.sections)for(const lesson of section.lessons){const original=courseSchema.parse(seed).sections.flatMap(s=>s.lessons).find(l=>l.id===lesson.id);if(original){lesson.agentNote??=original.agentNote;lesson.ownerNote??=original.ownerNote}}return courseSchema.parse(data)}
export async function saveCourse(m:Member,course:Course){if(!m.admin)throw Error('FORBIDDEN');const current=(await listItems(contentMember(m),'teaching_course'))[0];await saveItem(contentMember(m),'teaching_course',course,current?.id)}
export type Student={id:string;name:string;email:string;role:string;active:boolean;completed:string[];lastActive:string|null};
export async function roster(m:Member):Promise<Student[]>{if(!m.admin)throw Error('FORBIDDEN');if(m.demo){const items=await listItems(m);return [{id:m.id,name:'Local preview account',email:m.email,role:m.role,active:true,completed:completedIds(items),lastActive:items.filter(i=>i.kind==='lesson_progress').map(i=>i.updated_at).sort().at(-1)??null}]}
const {rows}=await database().query(`SELECT u.id,u.name,u.email,e.role,e.expires_at>now() AS active, COALESCE(jsonb_agg(w.data) FILTER (WHERE w.id IS NOT NULL),'[]') AS progress,max(w.updated_at) AS last_active FROM enrollments e JOIN "user" u ON u.id=e.user_id LEFT JOIN workspace_items w ON w.user_id=u.id AND w.kind='lesson_progress' WHERE e.is_admin=false GROUP BY u.id,u.name,u.email,e.role,e.expires_at ORDER BY u.name`);
return rows.map(r=>({id:r.id,name:r.name,email:r.email,role:r.role,active:r.active,completed:completedIds(r.progress.map((data:Record<string,unknown>)=>({kind:'lesson_progress',data}))),lastActive:r.last_active?.toISOString()??null}))}
export {studentCourse};
