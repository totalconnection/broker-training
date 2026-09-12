import {getAuth} from '@/lib/auth';
async function handler(request:Request){if(process.env.AUTH_ENABLED!=='true'||!process.env.DATABASE_URL||!process.env.BETTER_AUTH_SECRET||!process.env.BETTER_AUTH_URL)return Response.json({error:'Account access is not enabled in this build preview.'},{status:503});return getAuth().handler(request)}
export {handler as GET,handler as POST};
