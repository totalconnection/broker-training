import {headers} from 'next/headers';
import {getAuth} from './auth';
import {pool} from './db';
export type Member={id:string;name:string;email:string;role:'agent'|'owner';plan:'core'|'premium';admin:boolean;demo:boolean;enrolled:boolean};
export async function isDemo(){const h=await headers();const host=(h.get('host')||'').split(':')[0];return process.env.DEMO_MODE==='true'&&!process.env.RAILWAY_ENVIRONMENT_ID&&['localhost','127.0.0.1','[::1]'].includes(host)}
export async function member():Promise<Member|null>{if(await isDemo())return {id:'local-review',name:'Alex',email:'review@localhost',role:'owner',plan:'core',admin:true,demo:true,enrolled:true};if(process.env.AUTH_ENABLED!=='true'||!pool||!process.env.BETTER_AUTH_SECRET||!process.env.BETTER_AUTH_URL)return null;const session=await getAuth().api.getSession({headers:await headers()});if(!session)return null;const {rows}=await pool.query('SELECT role,plan,is_admin,expires_at FROM enrollments WHERE user_id=$1',[session.user.id]);const e=rows[0];return {id:session.user.id,name:session.user.name,email:session.user.email,role:e?.role??'owner',plan:e?.plan??'core',admin:e?.is_admin??false,demo:false,enrolled:!!e&&(e.is_admin||new Date(e.expires_at)>new Date())}}
export async function requireMember(){const m=await member();if(!m)throw Error('UNAUTHENTICATED');if(!m.enrolled)throw Error('ENROLLMENT_REQUIRED');return m}
export async function requireAdmin(){const m=await requireMember();if(!m.admin)throw Error('FORBIDDEN');return m}
export async function checkOrigin(){const h=await headers();const origin=h.get('origin');const expected=process.env.APP_URL;const local=await isDemo();if(!origin||(!local&&origin!==expected)||(local&&!['http://localhost:3000','http://127.0.0.1:3000'].includes(origin)))throw Error('FORBIDDEN')}
