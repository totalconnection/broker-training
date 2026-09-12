import {Pool} from 'pg';
export const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,max:10}):null;
export function database(){if(!pool)throw Error('Database not configured');return pool}
