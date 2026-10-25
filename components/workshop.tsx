'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowRight,ArrowLeft,Calculator,Check,Container,Download,FileText,ListChecks,Play,Printer,Video} from 'lucide-react';
import type {Member} from '@/lib/access';
import type {Course,Lesson} from '@/lib/teaching-schema';
import {quoteSteps} from '@/lib/quote-workshop';
import {drayageSteps,drayageGuidance,drayageChecklist} from '@/lib/drayage-workshop';
import {vimeoEmbed} from '@/lib/rules';
import {QuoteWorkspace} from './quote-workspace';
import MinimalVimeoPlayer from './minimal-vimeo-player';
import ProductShell from './product-shell';

type Props={member:Member;course:Course;completedIds:string[];view?:string;lessonId?:string;kind?:'quote'|'drayage'};
export default function Workshop({member,course,completedIds,view='overview',lessonId,kind='quote'}:Props) {
 const drayage=kind==='drayage',base='/workshops/'+kind,title=drayage?'Drayage Workshop':'Quote Workshop';
 const lessons=course.sections.flatMap(s=>s.lessons),active=lessons.find(l=>l.id===lessonId);
 const [done,setDone]=useState(completedIds),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const router=useRouter(),published=lessons.filter(l=>l.published),completed=published.filter(l=>done.includes(l.id)).length;
 const next=published.find(l=>!done.includes(l.id))||published[0],resources=lessons.filter(l=>l.pdfKey);
 const steps=drayage?drayageSteps:quoteSteps,Icon=drayage?Container:Calculator;
 const lessonHref=(id:string)=>base+'/lessons/'+encodeURIComponent(id);
 const processName=drayage?'The container workflow':'The quoting process';
 const guidance=active&&drayage?drayageGuidance[active.id]:undefined;
 async function mark(lesson:Lesson) {
  setBusy(true);setMessage('');const value=!done.includes(lesson.id);
  try {
   const response=await fetch('/api/teaching',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,completed:value})});
   if(!response.ok)throw Error('Unable to update your progress. Please try again.');
   setDone(old=>value?[...old,lesson.id]:old.filter(id=>id!==lesson.id));setMessage(value?'Lesson complete. Your progress is saved.':'Lesson marked incomplete.');router.refresh();
  }catch(error){setMessage((error as Error).message);}finally{setBusy(false);}
 }
 function lessonList(){return <div className="fs-lessons">
  {lessons.map((lesson,i)=><Link key={lesson.id} href={lessonHref(lesson.id)} className="fs-lesson-row"><span className={'fs-lesson-number '+(done.includes(lesson.id)?'done':'')}>{done.includes(lesson.id)?<Check size={18}/>:String(i+1).padStart(2,'0')}</span><div><strong>{lesson.title}</strong><small>{lesson.minutes} min{lesson.pdfKey?' · Resource included':''}{!lesson.published?' · Draft preview':''}</small></div><Play size={17}/></Link>)}
  {!lessons.length&&<p className="tp-note">The workshop lessons are being prepared. You can use the workflow and calculator now.</p>}
 </div>;}
 function process(){return <div className="fs-process">{steps.map((step,i)=>{
  const linked=lessons.find(l=>l.id===step.lessonId);
  return <article key={step.title}><span className="fs-step-number">0{i+1}</span><div><h2>{step.title}</h2><p>{step.description}</p><span className="fs-output"><Check size={15}/>{step.output}</span></div><Link href={linked?lessonHref(linked.id):base+'/calculator'} className="tp-text">{linked?'View lesson':'Open tool'}<ArrowRight size={15}/></Link></article>;
 })}</div>;}
 function checklist(){return <section className="fs-checklist tp-card" aria-labelledby="checklist-title">
  <div className="tp-heading compact"><div><p className="tp-kicker">YOUR WORKING REFERENCE</p><h2 id="checklist-title">Container move checklist</h2><p>Use one copy per shipment. Record the evidence, contact, and deadline for each open item.</p></div><button className="tp-button fs-print-control" onClick={()=>window.print()}><Printer size={17}/>Print / save PDF</button></div>
  <p className="fs-checklist-reference">Shipment reference: ____________________ &nbsp; Prepared by: ____________________ &nbsp; Date: __________</p>
  <div className="fs-checklist-grid">{drayageChecklist.map(group=><section key={group.title}><h3>{group.title}</h3><ul>{group.items.map(item=><li key={item}><span aria-hidden="true" className="fs-check-box"/>{item}</li>)}</ul></section>)}</div>
  <p className="fs-checklist-note">Use current written carrier quotes and facility instructions for the shipment you are planning. Record confirmed free time and billable days; the calculator does not look up terminal deadlines or live rates.</p>
  <div className="fs-checklist-notes"><strong>Open questions / responsible contact / next action</strong><div/><div/><div/></div>
 </section>;}
 return <ProductShell member={member} workshop={kind}>
  {course.libraryUnavailable&&<p className="tp-note" role="status">Some workshop recordings are temporarily unavailable. You can still use the workflow, calculator, and your saved quotes.</p>}
  {message&&<p className="tp-note" role="status">{message}</p>}
  {view==='calculator'?<QuoteWorkspace drayageOnly={drayage}/>:active?<>
   <Link className="tp-back" href={base+'/lessons'}><ArrowLeft size={16}/>Workshop lessons</Link>
   <div className="tp-heading"><div><p className="tp-kicker">{title.toUpperCase()} · LESSON {lessons.indexOf(active)+1}</p><h1>{active.title}</h1></div>{member.admin&&!active.published&&<span className="tp-status">Draft preview</span>}</div>
   <div className="tp-player-layout"><div><div className="tp-video">{active.vimeo?<MinimalVimeoPlayer src={vimeoEmbed(active.vimeo)!} title={active.title}/>:<div><Video size={40}/><h2>Recording to be added</h2><p>This planned lesson is visible to you as an administrator.</p><Link className="tp-button" href="/studio">Open content studio</Link></div>}</div>
    <div className="tp-under-video"><span>{active.minutes} min</span><span>{done.includes(active.id)?'Completed':active.published?'Workshop lesson':'Draft preview'}</span></div>
    <section className="tp-card"><h2>Put this lesson to work</h2><p className="tp-prewrap">{active.summary||guidance?.summary||'Watch the lesson, then put it into practice with the workshop tools.'}</p>
     {(active.action||guidance?.action)&&<div className="tp-action"><span className="tp-kicker">YOUR NEXT ACTION</span><p>{active.action||guidance?.action}</p></div>}
     <div className="tp-lesson-actions"><button className="tp-button" disabled={busy||!active.published} onClick={()=>mark(active)}>{busy?'Saving…':done.includes(active.id)?'Mark incomplete':'Mark complete'}<Check size={16}/></button>{lessons[lessons.indexOf(active)+1]&&<Link className="tp-text" href={lessonHref(lessons[lessons.indexOf(active)+1].id)}>Next lesson<ArrowRight size={16}/></Link>}</div>
    </section>{active.pdfKey&&<a className="fs-resource" href={'/api/resources?lesson='+encodeURIComponent(active.id)}><FileText/><div><strong>Lesson resource</strong><span>Download the companion PDF</span></div><Download size={20}/></a>}
   </div><aside className="tp-course-rail"><h3>In your workshop</h3>{lessons.map((lesson,i)=><Link href={lessonHref(lesson.id)} key={lesson.id} className={active.id===lesson.id?'current':''}><span>{done.includes(lesson.id)?<Check size={15}/>:i+1}</span><div>{lesson.title}<small>{lesson.minutes} min{!lesson.published?' · Draft':''}</small></div></Link>)}<Link className="tp-rail-help" href={base+'/calculator'}><Calculator size={20}/><div>Apply what you learned<small>Open the {drayage?'drayage':'quote'} calculator</small></div></Link></aside></div>
  </>:view==='process'?<>
   <div className="tp-heading"><div><p className="tp-kicker">YOUR REPEATABLE WORKFLOW</p><h1>{processName}.</h1><p>{drayage?'Five steps from a container request to a documented empty return.':'Five steps from a shipment request to a quote you can follow through.'}</p></div></div>
   {process()}<div className="fs-bottom-action"><Link className="tp-button" href={base+'/calculator'}>Put the process to work<ArrowRight size={17}/></Link>{drayage&&<Link className="tp-text" href={base+'/resources'}>Get the move checklist<ArrowRight size={17}/></Link>}</div>
  </>:view==='lessons'?<>
   <div className="tp-heading"><div><p className="tp-kicker">LEARN THE DECISIONS BEHIND THE WORK</p><h1>Workshop lessons.</h1><p>{drayage?'Build your understanding of container moves, then apply it through quoting and operational examples.':'Work through the quoting foundations, then explore the masterclass.'}</p></div><span className="fs-count">{completed} / {published.length} complete</span></div>
   {member.admin&&lessons.some(l=>!l.published)&&<p className="tp-note">Admin view: draft lessons are shown here for preparation. Members only see published lessons.</p>}{lessonList()}
  </>:view==='resources'?<>
   <div className="tp-heading"><div><p className="tp-kicker">KEEP YOUR TOOLS CLOSE</p><h1>Workshop resources.</h1><p>{drayage?'A container move checklist, companion downloads, and tools for your next shipment.':'Companion downloads from your quoting lessons, together in one place.'}</p></div></div>
   {resources.map(lesson=><a className="fs-resource" key={lesson.id} href={'/api/resources?lesson='+encodeURIComponent(lesson.id)}><FileText size={26}/><div><strong>{lesson.title}</strong><span>Companion PDF{!lesson.published?' · Admin draft preview':''}</span></div><Download size={20}/></a>)}
   {!resources.length&&!drayage&&<div className="tp-card"><FileText size={28}/><h2>Lesson downloads are being prepared.</h2><p>{member.admin?'Attach PDFs to the quoting lessons in Content Studio. They will appear here automatically.':'Use the quoting process and calculator while the companion downloads are prepared.'}</p></div>}
   <Link className="fs-resource" href={base+'/process'}><ListChecks size={26}/><div><strong>{processName}</strong><span>Your five-step reference inside the workshop</span></div><ArrowRight size={20}/></Link>
   <Link className="fs-resource" href={base+'/calculator'}><Calculator size={26}/><div><strong>{drayage?'Drayage':'Quote'} calculator & tracker</strong><span>{drayage?'Compare carrier charges, draft outreach, and save your drayage quotes':'Compare rates, prepare customer quotes, and save your work'}</span></div><ArrowRight size={20}/></Link>
   {drayage&&checklist()}
  </>:<>
   <div className="tp-heading fs-workshop-heading"><div><p className="tp-kicker">YOUR WORKSHOP</p><h1>{title}</h1><p>{drayage?'The teaching, workflow, and working tools for your next container move.':'The process, the teaching, and the tools to put your next quote together.'}</p></div><span className="fs-access"><Check size={14}/>Access included</span></div>
   <section className="fs-workshop-hero"><div><span className="fs-hero-label">{drayage?'FROM CONTAINER REQUEST TO EMPTY RETURN':'FROM REQUEST TO CUSTOMER QUOTE'}</span><h2>{drayage?<>Know the move.<br/>Own the next step.</>:<>Build confidence.<br/>Then build your quote.</>}</h2><p>{drayage?'Understand the handoffs. Confirm the details. Build the cost. Keep the move on track through delivery and empty return.':'Understand the shipment. Research the cost. Set your price. Bring it together in a clear customer quote.'}</p><div className="fs-hero-actions"><Link className="tp-button" href={base+'/process'}>{drayage?'Start with the workflow':'Start with the process'}<ArrowRight size={17}/></Link><Link className="fs-light-link" href={base+'/calculator'}>Open calculator<Calculator size={17}/></Link></div></div>
    <div className="fs-hero-progress"><Icon size={35} strokeWidth={1.3}/><strong>{completed}<span> / {published.length}</span></strong><span>lessons completed</span><div className="tp-track"><span style={{width:(published.length?completed/published.length*100:0)+'%'}}/></div><small>{drayage?'Learn the move. Put it to work.':'Your saved quotes stay with your account.'}</small></div>
   </section>
   <div className="fs-workshop-tools"><Link href={base+'/lessons'}><Video/><div><strong>{drayage?'Understand the move':'Learn the process'}</strong><span>{drayage?'Container lessons & masterclasses':'Quoting lessons & masterclass'}</span></div><ArrowRight size={18}/></Link><Link href={base+'/calculator'}><Calculator/><div><strong>{drayage?'Price & track drayage':'Build & track quotes'}</strong><span>{drayage?'Linehaul, fuel, chassis & more':'Your working calculator'}</span></div><ArrowRight size={18}/></Link><Link href={base+'/resources'}><FileText/><div><strong>{drayage?'Prepare the handoff':'Use your resources'}</strong><span>{drayage?'Move checklist & lesson resources':'Lesson downloads & references'}</span></div><ArrowRight size={18}/></Link></div>
   <div className="tp-heading compact"><div><p className="tp-kicker">LEARN AT YOUR PACE</p><h2>{next&&completed?'Continue your workshop':drayage?'Your drayage lessons':'Your quoting lessons'}</h2></div>{next&&<Link className="tp-text" href={lessonHref(next.id)}>{completed?'Continue learning':'Start learning'}<ArrowRight size={16}/></Link>}</div>{lessonList()}
  </>}
 </ProductShell>;
}
