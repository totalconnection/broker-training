import type {Course} from './teaching-schema';

// Keep the existing content IDs, publication states, attachments, and progress.
export const drayageLessonIds = ['course-9-7','course-9-6','course-9-8','course-9-9','course-9-10'] as const;
export function isDrayageLesson(id:string) {return (drayageLessonIds as readonly string[]).includes(id);}
export function drayageLessonHref(id:string) {return '/workshops/drayage/lessons/'+encodeURIComponent(id);}
export function drayageCourse(course:Course):Course {
 const all=course.sections.flatMap(s=>s.lessons);
 return {...course,settings:{gptUrl:'',skoolUrl:'',checkoutUrl:''},sections:[{id:'drayage-workshop',title:'Drayage Workshop',description:'From container request to empty return.',audience:'all',lessons:drayageLessonIds.flatMap(id=>{const lesson=all.find(l=>l.id===id);return lesson?[lesson]:[];})}]};
}
export const drayageSteps = [
 {title:'Map the container move',description:'Identify import, export, or domestic movement. Confirm the terminal or rail ramp, delivery location, container size, cargo weight, and live unload or drop arrangement.',output:'A complete container move brief',lessonId:'course-9-7'},
 {title:'Confirm availability and deadlines',description:'Record who confirms cargo release, container availability, pickup appointments, last free day, and empty-return instructions. Confirm each date with the responsible party before planning dispatch.',output:'A milestone plan with named contacts',lessonId:'course-9-6'},
 {title:'Source capacity and build the cost',description:'Ask carriers serving the exact facility for availability and an itemized quote. Confirm linehaul, fuel basis, chassis billing days, known accessorials, and possible additional charges.',output:'Comparable carrier costs and a selling price',lessonId:'course-9-8'},
 {title:'Prepare the customer and carrier handoff',description:'Review the scope, assumptions, exclusions, and quote validity with the customer. Match the agreed move to the delivery order, carrier instructions, and written rate confirmation.',output:'An agreed quote and a documented handoff',lessonId:'course-9-9'},
 {title:'Follow the move through empty return',description:'Track pickup, delivery, unloading, and return of the empty container. Keep delivery and return receipts, record exceptions, and reconcile actual charges against the quoted scope.',output:'A closed move file and a clear follow-up',lessonId:'course-9-10'},
] as const;
export const drayageGuidance:Record<string,{summary:string;action:string}> = {
 'course-9-7':{summary:'Start with the vocabulary, parties, and shipment details behind a container move.',action:'Complete the shipment brief in the move checklist before requesting a carrier rate.'},
 'course-9-6':{summary:'Follow the container across the parties and handoffs involved in drayage and intermodal freight.',action:'Map one sample move from its origin facility through delivery and empty return. Assign a contact to each milestone.'},
 'course-9-8':{summary:'Work through quote inputs, carrier sourcing, and the documentation behind a container shipment.',action:'Request an itemized carrier quote and enter the confirmed charges in the drayage calculator.'},
 'course-9-9':{summary:'Explore drayage decisions and examples in this recorded masterclass.',action:'Choose one example and build a move brief, cost comparison, and customer quote for it. Confirm current rates and facility procedures for a real shipment.'},
 'course-9-10':{summary:'Apply the container workflow to opportunities, carrier selection, quoting, and execution.',action:'Use the move checklist to document one complete scenario, including unresolved questions, responsible contacts, and empty-return evidence.'},
};
export const drayageChecklist = [
 {title:'Shipment brief',items:['Import, export, or domestic move; customer and shipment reference','Container number, size/type, gross weight, commodity, and special handling','Exact pickup terminal or rail ramp and delivery address','Expected dates; live unload or drop; receiver appointment and unloading needs']},
 {title:'Availability and deadlines',items:['Release and availability confirmed by the responsible parties','Last free day and its source, confirmation date, and contact','Pickup appointment and any facility-specific requirements','Empty-return location, instructions, deadline, and responsible contact']},
 {title:'Carrier cost and customer quote',items:['Carrier serves the facility and confirms equipment and capacity','Linehaul and fuel basis; chassis rate and confirmed billable days','Known charges for pre-pull, storage, waiting, transload, or other services','Free-time assumptions, additional-charge triggers, quote validity, and exclusions']},
 {title:'Dispatch and closeout',items:['Customer acceptance, delivery order, and carrier instructions agree','Written rate confirmation and required shipment documents are complete','Pickup and delivery milestones tracked; exceptions communicated','Delivery and empty-return receipts saved; charges reviewed and outcome recorded']},
] as const;
