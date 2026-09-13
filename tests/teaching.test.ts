import {test} from 'node:test';
import assert from 'node:assert/strict';
import seed from '../data/teaching-course.json';
import {courseSchema,studentCourse,completedIds} from '../lib/teaching-schema';
test('agreed curriculum has eight new recordings and all lessons start as drafts',()=>{const c=courseSchema.parse(seed);assert.equal(c.sections.length,10);const lessons=c.sections.flatMap(s=>s.lessons);assert.equal(lessons.filter(l=>l.recording==='new').length,8);assert(lessons.every(l=>!l.published));assert.equal(studentCourse(c,'agent').sections.length,0)});
test('students cannot receive drafts or another role’s lesson/media',()=>{const c=courseSchema.parse(seed);for(const s of c.sections){s.lessons[0].published=true;s.lessons[0].vimeo='https://vimeo.com/12345678'}const agent=studentCourse(c,'agent');assert(!agent.sections.some(s=>s.audience==='owner'));assert(agent.sections.every(s=>s.lessons.length===1));assert(agent.sections.flatMap(s=>s.lessons).every(l=>l.source===''));assert(studentCourse(c,'owner').sections.some(s=>s.audience==='owner'))});
test('publishing requires video, IDs are unique, and connection URLs are safe',()=>{let c=structuredClone(seed);c.sections[0].lessons[0].published=true;assert.equal(courseSchema.safeParse(c).success,false);c=structuredClone(seed);c.settings.gptUrl='javascript:alert(1)';assert.equal(courseSchema.safeParse(c).success,false);c=structuredClone(seed);c.sections[1].lessons[0].id=c.sections[0].lessons[0].id;assert.equal(courseSchema.safeParse(c).success,false)});
test('completion totals deduplicate attempts and exclude incomplete records',()=>{assert.deepEqual(completedIds([{kind:'lesson_progress',data:{lessonId:'a',completed:true}},{kind:'lesson_progress',data:{lessonId:'a',completed:true}},{kind:'lesson_progress',data:{lessonId:'b',completed:false}}]),['a'])});

test('each path puts setup after getting started and preserves shared lesson IDs',()=>{const c=courseSchema.parse(seed);const agent=studentCourse(c,'agent',true),owner=studentCourse(c,'owner',true);assert.equal(agent.sections[0].id,'section-1');assert.equal(agent.sections[1].audience,'agent');assert.equal(owner.sections[1].audience,'owner');assert(!owner.sections.some(s=>s.audience==='agent'));const shared=(course:typeof c)=>course.sections.filter(s=>s.audience==='all').flatMap(s=>s.lessons.map(l=>l.id));assert.deepEqual(shared(agent),shared(owner));assert.equal(studentCourse(c,'agent').sections.length,0)});

test('library import preserves edits and progress IDs, and does not repeat after saving',async()=>{
 const {mergeCourseLibrary}=await import('../lib/course-library');
 const original=courseSchema.parse(seed);const existing=original.sections.find(s=>s.audience==='optional')!.lessons[0];
 existing.title='Owner edited title';existing.pdfKey='11111111-1111-1111-1111-111111111111.pdf';
 const library=courseSchema.parse({sections:[{id:'library-test',title:'Library',description:'',audience:'optional',lessons:[{...existing,title:'Import title',vimeo:'https://vimeo.com/12345678',published:true}]}],settings:original.settings});
 const merged=mergeCourseLibrary(original,library);const lesson=merged.sections.find(s=>s.id==='library-test')!.lessons[0];
 assert.equal(lesson.title,'Owner edited title');assert.equal(lesson.pdfKey,existing.pdfKey);assert.equal(lesson.id,existing.id);assert.equal(lesson.published,true);
 assert.equal(merged.sections.flatMap(s=>s.lessons).filter(l=>l.id===existing.id).length,1);
 lesson.vimeo='';lesson.published=false;assert.deepEqual(mergeCourseLibrary(merged,library),merged);
 assert(!studentCourse(merged,'agent').sections.flatMap(s=>s.lessons).some(l=>l.id===existing.id));
});
