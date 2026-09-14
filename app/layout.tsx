import type {Metadata} from 'next';
import './globals.css';
import './teaching.css';
import './quote-calculator.css';
export const metadata:Metadata={title:'Freight Skills | Learn. Practice. Build.',description:'Your freight broker and agent learning workspace.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
