import {ResetPassword} from '@/components/password-recovery';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{token?:string|string[];error?:string|string[]}>}){const p=await searchParams;return <main className="login-form" style={{maxWidth:560,margin:'40px auto'}}><ResetPassword token={typeof p.token==='string'&&p.token.length<=256?p.token:''} invalid={!!p.error}/></main>}
