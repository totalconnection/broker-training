import {createHash,timingSafeEqual,randomUUID} from 'node:crypto';
import {hashPassword} from 'better-auth/crypto';
import {database} from './db';
export function validOwnerToken(token:string,expected:string|undefined,expires:string|undefined){if(!expected||!expires||Date.parse(expires)<=Date.now()||!Number.isFinite(Date.parse(expires))||!/^[a-f0-9]{64}$/.test(expected))return false;const actual=createHash('sha256').update(token).digest();return timingSafeEqual(actual,Buffer.from(expected,'hex'))}
export async function claimOwner(token:string,password:string){
 const expected=process.env.OWNER_SETUP_TOKEN_HASH;
 if(!validOwnerToken(token,expected,process.env.OWNER_SETUP_EXPIRES)||!process.env.OWNER_SETUP_EMAIL)throw Error('This invitation is invalid or expired.');
 const email=process.env.OWNER_SETUP_EMAIL.toLowerCase();
 const hashed=await hashPassword(password);const db=await database().connect();
 try{await db.query('BEGIN');await db.query('SELECT pg_advisory_xact_lock(78219462)');
 const used=await db.query('SELECT 1 FROM owner_setup_claims WHERE token_hash=$1',[expected]);
 if(used.rowCount)throw Error('This invitation has already been used. Sign in with your password.');
 const existing=await db.query('SELECT id FROM "user" WHERE lower(email)=$1',[email]);
 if(existing.rowCount)throw Error('An account already exists. This invitation cannot replace its password.');
 const id=randomUUID();
 await db.query('INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$2,$3,true,now(),now())',[id,'Luis',email]);
 await db.query('INSERT INTO account (id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES ($1,$2,$3,$2,$4,now(),now())',[randomUUID(),id,'credential',hashed]);
 await db.query("INSERT INTO enrollments (user_id,role,plan,is_admin,expires_at) VALUES ($1,'owner','core',true,now()+interval '100 years')",[id]);
 await db.query('INSERT INTO owner_setup_claims(token_hash,user_id) VALUES ($1,$2)',[expected,id]);await db.query('COMMIT');return {email};
 }catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}
}
