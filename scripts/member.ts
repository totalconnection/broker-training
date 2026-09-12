import {database} from '../lib/db';
const email=process.argv[2];if(!email)throw Error('Usage: npm run member:create -- email@example.com [admin|core|premium]');
const plan=process.argv[3]??'core';if(!['admin','core','premium'].includes(plan))throw Error('Invalid plan');
const {rows}=await database().query('SELECT id FROM "user" WHERE email=$1',[email]);if(!rows.length)throw Error('Create and verify this account in the application first.');
await database().query("INSERT INTO enrollments(user_id,plan,is_admin,expires_at) VALUES($1,$2,$3,now()+interval '365 days') ON CONFLICT(user_id) DO UPDATE SET plan=$2,is_admin=$3,expires_at=now()+interval '365 days'",[rows[0].id,plan==='premium'?'premium':'core',plan==='admin']);console.log('Access updated. No email was sent.');await database().end();
