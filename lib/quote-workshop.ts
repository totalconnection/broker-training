import {studentCourse, type Course} from './teaching-schema';
import {hasProduct, type ProductId} from './products';

// Reference the original lessons: media, resource edits, and completion stay shared.
export const quoteLessonIds = ['course-4-1', 'course-4-2', 'course-4-3', 'course-4-4', 'course-9-11'] as const;
export function isQuoteLesson(id: string) { return (quoteLessonIds as readonly string[]).includes(id); }
export const quoteSteps = [
  {title: 'Understand the shipment', description: 'Confirm the lane, equipment, commodity, dates, and service requirements. Resolve missing details before pricing.', output: 'A complete shipment brief', lessonId: 'course-4-1'},
  {title: 'Research the carrier cost', description: 'Compare rate evidence and carrier feedback for this shipment. Confirm what each rate includes.', output: 'A supported buy-rate estimate', lessonId: 'course-4-2'},
  {title: 'Set your selling price', description: 'Account for known charges, apply your markup, and check the resulting gross profit and margin in the calculator.', output: 'A reviewed selling price', lessonId: 'course-4-4'},
  {title: 'Prepare the customer quote', description: 'Check the shipment details, quote validity, assumptions, and exclusions. Review the customer copy before sending.', output: 'A customer-ready quote', lessonId: 'course-4-3'},
  {title: 'Save and follow up', description: 'Save the quote, record the customer’s decision, and track open, won, and lost opportunities.', output: 'A saved quote with a recorded outcome', lessonId: null},
] as const;
export function quoteCourse(course: Course): Course {
  const lessons = course.sections.flatMap(s => s.lessons);
  const selected = quoteLessonIds.flatMap(id => {const lesson = lessons.find(l => l.id === id); return lesson ? [lesson] : [];});
  return {...course, settings: {gptUrl: '', skoolUrl: '', checkoutUrl: ''}, sections: [{id: 'quote-workshop', title: 'Quote Workshop', description: 'From shipment request to customer quote.', audience: 'all', lessons: selected}]};
}
export function courseForMember(course: Course, member: {admin: boolean; role: string; products: ProductId[]}): Course {
  if (member.admin) return course;
  if (hasProduct(member, 'academy')) return studentCourse(course, member.role);
  if (hasProduct(member, 'quote-workshop')) return studentCourse(quoteCourse(course), member.role);
  return {...course, settings: {gptUrl: '', skoolUrl: '', checkoutUrl: ''}, sections: []};
}
export function quoteLessonHref(id: string) { return '/workshops/quote/lessons/' + encodeURIComponent(id); }
