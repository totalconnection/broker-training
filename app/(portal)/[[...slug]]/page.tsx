import {redirect} from 'next/navigation';
import {readFile} from 'node:fs/promises';
import {member} from '@/lib/access';
import {listItems,publications} from '@/lib/store';
import Portal from '@/components/portal';
export const dynamic='force-dynamic';
export default async function Page(){const m=await member();if(!m)redirect('/login');if(!m.enrolled)return <main className="setup"><h1>Your learning workspace is almost ready.</h1><p>Enrollment and checkout will be connected before launch. Your account does not yet have course access.</p><a href="/login">Back to sign in</a></main>;let media={};if(m.demo&&m.admin){try{media=JSON.parse(await readFile('private-media.json','utf8'))}catch{}}return <Portal member={m} initialItems={await listItems(m)} initialPublications={(await publications(m)).filter(p=>m.admin||p.published)} media={media} skool={process.env.SKOOL_URL||'https://www.skool.com/freightskills-community-5835'}/>}
