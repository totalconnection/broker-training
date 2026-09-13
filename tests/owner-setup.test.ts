import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validOwnerToken} from '../lib/owner-setup';
test('owner invitation requires an exact token and unexpired configuration',()=>{const token='a'.repeat(64),hash=createHash('sha256').update(token).digest('hex'),future=new Date(Date.now()+60000).toISOString();assert(validOwnerToken(token,hash,future));assert(!validOwnerToken('wrong',hash,future));assert(!validOwnerToken(token,hash,'2000-01-01'));assert(!validOwnerToken(token,hash,'bad date'));assert(!validOwnerToken(token,undefined,future));assert(!validOwnerToken(token,'bad hash',future))});
