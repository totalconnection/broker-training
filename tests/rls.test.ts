import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('PostgreSQL policies isolate students, deny privilege changes, and protect shared course writes',async()=>{
 const db=new PGlite();
 try{
 await db.exec(await readFile(new URL('../scripts/schema.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../scripts/security.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../scripts/security.sql',import.meta.url),'utf8'));
 await db.exec(`INSERT INTO workspace_items VALUES ('00000000-0000-4000-8000-000000000001','alice','prospect','{}',now()),('00000000-0000-4000-8000-000000000002','bob','prospect','{}',now()),('00000000-0000-4000-8000-000000000003','teaching-content','teaching_course','{}',now()); INSERT INTO enrollments(user_id,expires_at) VALUES('alice',now()+interval '1 year'),('bob',now()+interval '1 year'); INSERT INTO lesson_publications(lesson_id,published) VALUES('draft',false),('live',true);`);
 const asUser=async(user:string,admin:boolean,fn:()=>Promise<void>)=>{await db.exec('BEGIN; SET LOCAL ROLE freightskills_app_data;');await db.query("SELECT set_config('app.user_id',$1,true),set_config('app.is_admin',$2,true)",[user,String(admin)]);try{await fn();}finally{await db.exec('ROLLBACK');}};
 await asUser('alice',false,async()=>{
  assert.deepEqual((await db.query<{user_id:string}>('SELECT user_id FROM workspace_items ORDER BY user_id')).rows.map(r=>r.user_id),['alice','teaching-content']);
  assert.equal((await db.query("UPDATE workspace_items SET data='{\"changed\":true}' WHERE user_id='bob' RETURNING id")).rows.length,0);
  assert.equal((await db.query("DELETE FROM workspace_items WHERE user_id='bob' RETURNING id")).rows.length,0);
  assert.equal((await db.query("SELECT * FROM enrollments WHERE user_id='bob'")).rows.length,0);
  assert.deepEqual((await db.query<{lesson_id:string}>('SELECT lesson_id FROM lesson_publications')).rows.map(r=>r.lesson_id),['live']);
  assert.equal((await db.query("UPDATE enrollments SET role='agent' WHERE user_id='alice' RETURNING role")).rows.length,1);
 });
 for(const sql of ["INSERT INTO workspace_items(id,user_id,kind,data) VALUES('00000000-0000-4000-8000-000000000004','bob','prospect','{}')","UPDATE enrollments SET is_admin=true WHERE user_id='alice'","INSERT INTO lesson_publications(lesson_id) VALUES('unauthorized')","UPDATE workspace_items SET user_id='bob' WHERE user_id='alice'"]){await asUser('alice',false,async()=>{await assert.rejects(db.query(sql));});}
 await asUser('alice',false,async()=>{assert.equal((await db.query("UPDATE workspace_items SET data='{\"bad\":true}' WHERE user_id='teaching-content' RETURNING id")).rows.length,0);});
 await asUser('admin',true,async()=>{assert.equal((await db.query("UPDATE workspace_items SET data='{\"ok\":true}' WHERE user_id='teaching-content' RETURNING id")).rows.length,1);});
 await asUser('',false,async()=>{assert.equal((await db.query('SELECT * FROM workspace_items')).rows.length,0);});
 const role=(await db.query<{rolsuper:boolean;rolbypassrls:boolean;rolcanlogin:boolean}>("SELECT rolsuper,rolbypassrls,rolcanlogin FROM pg_roles WHERE rolname='freightskills_app_data'")).rows[0];assert.deepEqual(role,{rolsuper:false,rolbypassrls:false,rolcanlogin:false});
 }finally{await db.close();}
});
