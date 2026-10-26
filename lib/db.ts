import {Pool} from 'pg';
export const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,max:10}):null;
export function database(){if(!pool)throw Error('Database not configured');return pool}

// Always use the same checked-out connection; SET LOCAL is cleared on commit or rollback.
// Caller identity comes from the verified server session, never a request body/header.
export async function scopedQuery(identity:{id:string;admin?:boolean},text:string,values:unknown[]=[]){
 if(!identity.id || identity.id==='teaching-content')throw Error('FORBIDDEN');
 const client=await database().connect();
 try{await client.query('BEGIN');await client.query('SET LOCAL ROLE freightskills_app_data');
 await client.query("SELECT set_config('app.user_id',$1,true),set_config('app.is_admin',$2,true)",[identity.id,identity.admin?'true':'false']);
 const result=await client.query(text,values);await client.query('COMMIT');return result;
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
