import {database} from '../lib/db';
import {productIds, type ProductId} from '../lib/products';
const [action,email,product,date] = process.argv.slice(2);
if (!['grant','revoke'].includes(action) || !email || !productIds.includes(product as ProductId)) throw Error('Usage: npm run product:access -- grant|revoke email@example.com academy|quote-workshop [expiry ISO timestamp]');
const expiry = date ? new Date(date) : null;
if (action === 'grant' && (!expiry || !Number.isFinite(expiry.getTime()) || expiry <= new Date())) throw Error('A future expiry timestamp is required.');
const db = database();
try {
 const {rows} = await db.query('SELECT id FROM "user" WHERE lower(email)=lower($1)', [email]);
 if (!rows.length) throw Error('This account must exist before granting product access.');
 if (action === 'grant') await db.query("INSERT INTO product_enrollments(user_id,product_id,expires_at) VALUES($1,$2,$3) ON CONFLICT(user_id,product_id) DO UPDATE SET expires_at=$3,revoked_at=NULL,source='manual',updated_at=now()", [rows[0].id,product,expiry]);
 else await db.query('UPDATE product_enrollments SET revoked_at=now(),updated_at=now() WHERE user_id=$1 AND product_id=$2', [rows[0].id,product]);
 console.log('Product access updated. Academy includes Quote Workshop; legacy Academy access is managed separately. No email was sent.');
} finally { await db.end(); }
