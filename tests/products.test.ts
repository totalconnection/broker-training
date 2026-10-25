import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveProducts,hasProduct} from '../lib/products';
import {quoteCourse,courseForMember,quoteLessonIds} from '../lib/quote-workshop';
import {courseSchema} from '../lib/teaching-schema';
import seed from '../data/teaching-course.json';
import {loadCourseLibrary,libraryImportId} from '../lib/course-library';
const now=new Date('2026-10-25T12:00:00Z'),future='2027-10-25T12:00:00Z',past='2025-10-25T12:00:00Z';
test('existing Academy members retain both products; expired access does not',()=>{
 assert.deepEqual(resolveProducts({expires_at:future},[],now),['academy','quote-workshop']);
 assert.deepEqual(resolveProducts({expires_at:past},[],now),[]);
 assert.deepEqual(resolveProducts(undefined,[],now),[]);
});
test('standalone workshop never grants Academy, and expired/revoked/unknown grants fail closed',()=>{
 const products=resolveProducts(undefined,[{product_id:'quote-workshop',expires_at:future}],now);
 assert.deepEqual(products,['quote-workshop']);assert.equal(hasProduct({admin:false,products},'academy'),false);
 for(const grant of [{product_id:'quote-workshop',expires_at:past},{product_id:'quote-workshop',expires_at:now},{product_id:'quote-workshop',expires_at:future,revoked_at:now},{product_id:'unknown',expires_at:future}])assert.deepEqual(resolveProducts(undefined,[grant],now),[]);
});
test('independent valid workshop grant survives Academy expiry; new Academy grants include workshop',()=>{
 assert.deepEqual(resolveProducts({expires_at:past},[{product_id:'quote-workshop',expires_at:future}],now),['quote-workshop']);
 assert.deepEqual(resolveProducts(undefined,[{product_id:'academy',expires_at:future}],now),['academy','quote-workshop']);
 assert.deepEqual(resolveProducts({is_admin:true,expires_at:past},[],now),['academy','quote-workshop']);
});
test('workshop members receive only published quote lessons, resources, and no Academy connections',()=>{
 const course=courseSchema.parse(seed);
 for(const section of course.sections)for(const lesson of section.lessons){lesson.published=true;lesson.vimeo='https://vimeo.com/12345678';lesson.pdfKey='11111111-1111-1111-1111-111111111111.pdf';}
 course.sections.flatMap(s=>s.lessons).find(l=>l.id==='course-4-2')!.published=false;
 course.settings.skoolUrl='https://example.com/private-academy';
 const member={admin:false,role:'owner',products:['quote-workshop' as const]};
 const visible=courseForMember(course,member),lessons=visible.sections.flatMap(s=>s.lessons);
 assert.deepEqual(lessons.map(l=>l.id),quoteLessonIds.filter(id=>id!=='course-4-2'));
 assert(lessons.every(l=>!l.source&&l.published));assert.equal(visible.settings.skoolUrl,'');
 assert.equal(courseForMember(course,{...member,products:[]}).sections.length,0);
 assert(courseForMember(course,{...member,products:['academy']}).sections.length>1);
});
test('workshop references original lesson IDs and attachments without mutating course or progress',()=>{
 const course=courseSchema.parse(seed),before=structuredClone(course);
 const selected=quoteCourse(course).sections.flatMap(s=>s.lessons);
 assert.deepEqual(selected.map(l=>l.id),quoteLessonIds);
 assert.equal(selected[0],course.sections.flatMap(s=>s.lessons).find(l=>l.id==='course-4-1'));
 assert.deepEqual(course,before);
});
test('a saved library loads without contacting object storage again',async()=>{
 const course={...courseSchema.parse(seed),contentImports:[libraryImportId]};
 let called=false;
 const result=await loadCourseLibrary(course,async()=>{called=true;throw Error('Storage credentials rotated');});
 assert.equal(called,false);assert.equal(result,course);
});
test('optional library failure preserves teaching and reports temporary unavailability',async()=>{
 const course=courseSchema.parse(seed);
 const result=await loadCourseLibrary(course,async()=>{throw Object.assign(Error('Request rejected'),{name:'SignatureDoesNotMatch'});});
 assert.deepEqual(result.sections,course.sections);assert.equal(result.libraryUnavailable,true);
 assert.equal(course.libraryUnavailable,undefined);
 const recovered=await loadCourseLibrary(course,async()=>null);
 assert.equal(recovered.libraryUnavailable,undefined);
});
