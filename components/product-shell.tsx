'use client';
import {useState, type ReactNode} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ArrowLeft, BookOpen, Calculator, Container, FileText, LayoutGrid, ListChecks, LogOut, Menu, Settings2, Video, X} from 'lucide-react';
import type {Member} from '@/lib/access';
import {hasProduct} from '@/lib/products';

export default function ProductShell({member, workshop, children}: {member: Member; workshop?: 'quote'|'drayage'; children: ReactNode}) {
 const [mobile,setMobile] = useState(false), [error,setError] = useState('');
 const pathname = usePathname();
 const title=workshop==='drayage'?'Drayage Workshop':'Quote Workshop', base='/workshops/'+workshop;
 const nav = workshop ? [
  {href: base, label: 'Workshop overview', Icon: LayoutGrid},
  {href: base+'/process', label: workshop==='drayage'?'The container workflow':'The quoting process', Icon: ListChecks},
  {href: base+'/lessons', label: 'Workshop lessons', Icon: Video},
  {href: base+'/calculator', label: 'Calculator & quotes', Icon: Calculator},
  {href: base+'/resources', label: 'Workshop resources', Icon: FileText},
 ] : [
  {href: '/app', label: 'My products', Icon: LayoutGrid},
  ...(hasProduct(member,'quote-workshop') ? [{href: '/workshops/quote', label: 'Quote Workshop', Icon: Calculator}] : []),
  ...(hasProduct(member,'drayage-workshop') ? [{href: '/workshops/drayage', label: 'Drayage Workshop', Icon: Container}] : []),
  ...(hasProduct(member,'academy') ? [{href: '/academy', label: 'Freight Skills Academy', Icon: BookOpen}] : []),
 ];
 async function signOut() {
  try {const response = await fetch('/api/auth/sign-out', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}'}); if (!response.ok) throw Error(); window.location.href = '/login';}
  catch {setError('Unable to sign out. Please try again.');}
 }
 return <div className={'tp fs-product-shell'+(workshop==='drayage'?' fs-drayage':'')}>
  <a href="#product-main" className="skip">Skip to content</a>
  <aside className={'tp-sidebar '+(mobile?'open':'')}>
   <Link href="/app" className="tp-brand"><img src="/brand/freightskills-logo.png" alt="Freight Skills" width="151" height="50"/><span className="tp-academy">PORTAL</span></Link>
   {workshop && <Link className="fs-all-products" href="/app"><ArrowLeft size={15}/>All my products</Link>}
   <div className="tp-nav-label">{workshop?title.toUpperCase():'YOUR LEARNING HUB'}</div>
   <nav aria-label={workshop?title+' navigation':'Portal navigation'}>{nav.map(({href,label,Icon}) => <Link onClick={()=>setMobile(false)} key={href} href={href} aria-current={pathname===href || (href.endsWith('/lessons')&&pathname.startsWith(href+'/'))?'page':undefined} className={pathname===href || (href.endsWith('/lessons')&&pathname.startsWith(href+'/'))?'selected':''}><Icon size={19}/>{label}</Link>)}</nav>
   {workshop && <div className="fs-side-note"><span>LEARN → APPLY → IMPROVE</span><p>{workshop==='drayage'?'From the first container request to a documented empty return.':'One place to learn the process and put your next quote together.'}</p></div>}
   <div className="tp-side-bottom">{member.admin && <Link href="/studio"><Settings2 size={18}/>Content studio</Link>}<div className="tp-person"><span>{member.name.charAt(0)}</span><div><strong>{member.name}</strong><small>{member.demo?'Local preview':'Member account'}</small></div>{!member.demo&&<button aria-label="Sign out" onClick={signOut}><LogOut size={17}/></button>}</div>{error&&<p role="alert">{error}</p>}</div>
  </aside>
  {mobile&&<button className="fs-mobile-scrim" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}
  <div className="tp-body"><header className="tp-top"><button className="tp-mobile" aria-label={mobile?'Close navigation':'Open navigation'} onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button><span>Freight Skills Portal <span className="fs-crumb">/ {workshop?title:'My products'}</span></span><div><span className="fs-member-label">{member.demo?'LOCAL PREVIEW':'MEMBER WORKSPACE'}</span></div></header><main id="product-main" className="tp-main">{children}</main><footer className="tp-footer"><span>FREIGHT SKILLS PORTAL</span><span>Learn it. Put it to work.</span></footer></div>
 </div>;
}
