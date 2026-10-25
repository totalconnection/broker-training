import type {Metadata} from 'next';
import './globals.css';
import './teaching.css';
import './quote-calculator.css';
import './products.css';
export const metadata:Metadata={title:'Freight Skills Portal',description:'Your Freight Skills workshops, courses, resources, and working tools.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
