import {courseSchema,type Course} from './teaching-schema';
export const libraryImportId='vimeo-masterclasses-2026-09';
export function mergeCourseLibrary(course:Course,library:Course):Course{
 if(course.contentImports?.includes(libraryImportId))return course;
 const result=structuredClone(course);
 for(const group of library.sections){
  let target=result.sections.find(s=>s.id===group.id);
  if(!target){target={...group,lessons:[]};result.sections.push(target)}
  for(const incoming of group.lessons){
   const previousSection=result.sections.find(s=>s.lessons.some(l=>l.id===incoming.id));
   const previous=previousSection?.lessons.find(l=>l.id===incoming.id);
   // A deliberately placed core lesson stays in the core course.
   if(previousSection&&previousSection.audience!=='optional')continue;
   if(previousSection)previousSection.lessons=previousSection.lessons.filter(l=>l.id!==incoming.id);
   target.lessons.push(previous?{...previous,vimeo:previous.vimeo||incoming.vimeo,minutes:previous.vimeo?previous.minutes:incoming.minutes,published:previous.vimeo?previous.published:incoming.published}:incoming);
  }
 }
 result.sections=result.sections.filter(s=>s.lessons.length||!library.sections.some(g=>g.id===s.id));
 result.contentImports=[...(result.contentImports||[]),libraryImportId];
 return courseSchema.parse(result);
}
