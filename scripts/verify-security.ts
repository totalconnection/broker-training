import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {database} from '../lib/db';
// Deployment gate: synthetic records exist only inside this rolled-back transaction.
export async function verifySecurity(){
 const c=await database().connect();
 try{await c.query('BEGIN');
 const role=(await c.query("SELECT rolsuper,rolbypassrls,rolcanlogin FROM pg_roles WHERE rolname='freightskills_app_data'")).rows[0];
 assert.deepEqual(role,{rolsuper:false,rolbypassrls:false,rolcanlogin:false});
 const tables=(await c.query("SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class WHERE relname=ANY($1::text[])",[['workspace_items','enrollments','product_enrollments','lesson_publications']])).rows;
 assert.equal(tables.length,4);assert(tables.every(t=>t.relrowsecurity&&t.relforcerowsecurity));
 const a='security-check-'+randomUUID(),b='security-check-'+randomUUID();
 await c.query("INSERT INTO workspace_items(id,user_id,kind,data) VALUES($1,$2,'security_check','{}'),($3,$4,'security_check','{}')",[randomUUID(),a,randomUUID(),b]);
 await c.query('SET LOCAL ROLE freightskills_app_data');
 await c.query("SELECT set_config('app.user_id',$1,true),set_config('app.is_admin','false',true)",[a]);
 assert.equal((await c.query('SELECT * FROM workspace_items WHERE user_id=$1',[a])).rowCount,1);
 assert.equal((await c.query('SELECT * FROM workspace_items WHERE user_id=$1',[b])).rowCount,0);
 assert.equal((await c.query("UPDATE workspace_items SET data='{}' WHERE user_id=$1",[b])).rowCount,0);
 assert.equal((await c.query('DELETE FROM workspace_items WHERE user_id=$1',[b])).rowCount,0);
 console.log('Security verification passed: restricted role, forced RLS, and cross-user read/write isolation.');
 }finally{await c.query('ROLLBACK');c.release();}
}
