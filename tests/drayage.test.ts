import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveProducts,hasProduct} from '../lib/products';
import {drayageCourse,drayageLessonIds} from '../lib/drayage-workshop';
import {quoteLessonIds} from '../lib/quote-workshop';
import {courseForMember} from '../lib/workshop-access';
import {allowedQuoteModes,canAccessQuote} from '../lib/quote-access';
import {courseSchema} from '../lib/teaching-schema';
import {buildQuote,defaultForm,snapshotSchema,type Rate} from '../lib/quote-calculator';
import seed from '../data/teaching-course.json';
const now=new Date('2026-10-25T12:00:00Z'),future='2027-10-25T12:00:00Z';
const member={admin:false,role:'owner',products:['drayage-workshop' as const]};
test('standalone Drayage is independent of both Academy and Quote Workshop',()=>{
 assert.deepEqual(resolveProducts(undefined,[{product_id:'drayage-workshop',expires_at:future}],now),['drayage-workshop']);
 assert.equal(hasProduct(member,'academy'),false);assert.equal(hasProduct(member,'quote-workshop'),false);
 for(const grant of [{product_id:'drayage-workshop',expires_at:now},{product_id:'drayage-workshop',expires_at:future,revoked_at:now}])assert.deepEqual(resolveProducts(undefined,[grant],now),[]);
 assert.deepEqual(resolveProducts({expires_at:now},[{product_id:'drayage-workshop',expires_at:future}],now),['drayage-workshop']);
});
test('drayage projection preserves media and original progress IDs without altering the course',()=>{
 const course=courseSchema.parse(seed),original=structuredClone(course);
 const lessons=drayageCourse(course).sections.flatMap(s=>s.lessons);
 assert.deepEqual(lessons.map(l=>l.id),drayageLessonIds);
 assert.equal(lessons[0],course.sections.flatMap(s=>s.lessons).find(l=>l.id==='course-9-7'));
 assert.deepEqual(course,original);
});
test('Drayage access exposes only published drayage videos and resources; combined purchases get both workshops',()=>{
 const course=courseSchema.parse(seed);
 for(const section of course.sections)for(const lesson of section.lessons){lesson.published=true;lesson.vimeo='https://vimeo.com/12345678';lesson.pdfKey='11111111-1111-1111-1111-111111111111.pdf';}
 course.settings.skoolUrl='https://example.com/private-academy';
 course.sections.flatMap(s=>s.lessons).find(l=>l.id==='course-9-7')!.published=false;
 const visible=courseForMember(course,member),lessons=visible.sections.flatMap(s=>s.lessons);
 assert.deepEqual(lessons.map(l=>l.id),drayageLessonIds.filter(id=>id!=='course-9-7'));
 assert(lessons.every(l=>l.published&&!l.source));assert.equal(visible.settings.skoolUrl,'');
 const combined=courseForMember(course,{...member,products:['quote-workshop','drayage-workshop']}).sections.flatMap(s=>s.lessons);
 assert.deepEqual(combined.map(l=>l.id),[...quoteLessonIds,...drayageLessonIds.filter(id=>id!=='course-9-7')]);
 assert.equal(courseForMember(course,{...member,products:[]}).sections.length,0);
});
test('calculator permissions restrict standalone Drayage without changing existing Quote access',()=>{
 assert.deepEqual(allowedQuoteModes(member),['Drayage']);
 assert.equal(canAccessQuote(member,'Truckload'),false);assert.equal(canAccessQuote(member,'LTL'),false);
 assert.equal(canAccessQuote(member,'Drayage'),true);
 assert.deepEqual(allowedQuoteModes({...member,products:['quote-workshop']}),['Truckload','LTL','Drayage']);
 assert.deepEqual(allowedQuoteModes({...member,products:[]}),[]);
});
test('container details survive quote creation and old saved forms remain compatible',()=>{
 const rate=(amount=0):Rate=>({name:'Carrier',amount,fsc:20,chassis:50,days:amount?2:0,accessorial:amount?100:0});
 const input={mode:'Drayage',form:{...defaultForm,origin:'Terminal',destination:'Warehouse',equipment:'40 ft Container',containerNumber:'TEST1234567',moveType:'Import',unloadType:'Live unload / load',lastFreeDay:'2026-11-03',emptyReturnLocation:'Depot',emptyReturnDate:'2026-11-05'},rates:{Drayage:[rate(1000),rate(),rate()],Truckload:[rate(),rate(),rate()],LTL:[rate(),rate(),rate()]},markup:15,logo:''};
 // Unused carrier rows have no chassis rate or charges, just as the UI does.
 for(const rates of Object.values(input.rates))for(const row of rates)if(!row.amount){row.chassis=0;row.fsc=0;}
 const saved=buildQuote(snapshotSchema.parse(input),'11111111-1111-4111-8111-111111111111',now);
 assert.equal(saved.buy,1400);assert.equal(saved.sell,1610);assert.equal(saved.snapshot.form.containerNumber,'TEST1234567');assert.equal(saved.snapshot.form.emptyReturnDate,'2026-11-05');
 const legacy:Record<string,unknown>={...input.form};for(const key of ['moveType','containerNumber','unloadType','lastFreeDay','emptyReturnLocation','emptyReturnDate'])delete legacy[key];
 assert.equal(snapshotSchema.parse({...input,form:legacy}).form.containerNumber,'');
});
