import {readFile} from 'node:fs/promises';
import {getMigrations} from 'better-auth/db/migration';
import {getAuth} from '../lib/auth';
import {database} from '../lib/db';
const lock=await database().connect();
try{await lock.query('SELECT pg_advisory_lock(78219461)');
const migrations=await getMigrations(getAuth().options);await migrations.runMigrations();await database().query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));console.log('Database migrations complete');}finally{await lock.query('SELECT pg_advisory_unlock(78219461)');lock.release();await database().end();}
