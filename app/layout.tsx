import type {Metadata} from 'next';
import './globals.css';
import './teaching.css';
import './quote-calculator.css';
import './products.css';
export const metadata:Metadata={title:'Freight Skills Portal',description:'Your Freight Skills workshops, courses, resources, and working tools.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<footer style={{padding:"16px",fontSize:"12px",textAlign:"center"}}><a href="https://freightskills.com/privacy">Privacy policy</a> · <a href="https://freightskills.com/terms">Terms of use</a> · <a href="https://freightskills.com/data-retention">Data retention</a></footer></body></html>}
