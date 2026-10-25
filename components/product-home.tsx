import Link from 'next/link';
import {ArrowRight, BookOpen, Calculator, Check, FileText} from 'lucide-react';
import type {Member} from '@/lib/access';
import {products,hasProduct} from '@/lib/products';
import ProductShell from './product-shell';

export default function ProductHome({member}: {member: Member}) {
 const available = products.filter(p=>hasProduct(member,p.id));
 return <ProductShell member={member}>
  <div className="tp-heading fs-home-heading"><div><p className="tp-kicker">YOUR FREIGHT SKILLS PORTAL</p><h1>Welcome back, {member.name.split(' ')[0]}.</h1><p>Your workshops, courses, and working tools. Choose where to pick up today.</p></div><span className="fs-count">{available.length} {available.length===1?'product':'products'} available</span></div>
  <div className="fs-product-grid">{available.map(product=><article key={product.id} className={'fs-product-card '+(product.id==='quote-workshop'?'featured':'')}><div className="fs-product-art">{product.id==='quote-workshop'?<Calculator size={40} strokeWidth={1.4}/>:<BookOpen size={40} strokeWidth={1.4}/>}<span>{product.type}</span></div><div className="fs-product-copy"><span className="fs-access"><Check size={13}/>Included in your access</span><h2>{product.name}</h2><p>{product.description}</p><ul>{product.features.map(feature=><li key={feature}><Check size={15}/>{feature}</li>)}</ul><Link className="tp-button" href={product.href}>Open {product.id==='academy'?'Academy':'workshop'}<ArrowRight size={17}/></Link></div></article>)}</div>
  {!available.length&&<section className="tp-card fs-no-access"><BookOpen size={30}/><h2>Your products will appear here.</h2><p>You’re signed in, but this account has no active product access. If you already enrolled, check that you’re using the same email address.</p></section>}
  {available.length>0&&<section className="fs-quick-links"><h2>Go straight to work</h2><div>{hasProduct(member,'quote-workshop')&&<><Link href="/workshops/quote/calculator"><Calculator/><div><strong>Build or revisit a quote</strong><span>Calculator and your saved quote tracker</span></div><ArrowRight size={18}/></Link><Link href="/workshops/quote/resources"><FileText/><div><strong>Find your quoting resources</strong><span>Companion checklists and scripts</span></div><ArrowRight size={18}/></Link></>}{hasProduct(member,'academy')&&<Link href="/resources"><BookOpen/><div><strong>Academy downloads</strong><span>Resources from your course lessons</span></div><ArrowRight size={18}/></Link>}</div></section>}
 </ProductShell>;
}
