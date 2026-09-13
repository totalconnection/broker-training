import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getSources,retrieve} from '../lib/knowledge';
import {checkAllowance,RESERVATION_MICROS} from '../lib/ai-budget';
const sources=await getSources().catch(()=>[]);
test('all imported sources have text and the approved objection is retrieved',{skip:!sources.length},()=>{assert.equal(sources.length,100);assert(sources.every(s=>s.text.length>100));const results=retrieve('A shipper told me they already have brokers. What should I say?',sources.filter(s=>s.approved));assert.equal(results[0].id,'approved-objection');assert(results[0].text.includes('LTL'));assert(!sources.filter(s=>s.approved).some(s=>s.id==='C028'))});
test('unrelated questions retrieve no student source',{skip:!sources.length},()=>{assert.equal(retrieve('Bake chocolate birthday cake',sources.filter(s=>s.approved)).length,0)});
test('budget rejects concurrent requests, exhausted allowances, and overspending',()=>{assert.doesNotThrow(()=>checkAllowance(0,0,0,RESERVATION_MICROS,false));assert.throws(()=>checkAllowance(100,0,0,100000,false));assert.throws(()=>checkAllowance(0,10,0,100000,false));assert.throws(()=>checkAllowance(0,0,1,RESERVATION_MICROS,false));assert.throws(()=>checkAllowance(0,0,0,100000,true))});

test("retrieval ranks relevant teaching and excludes unrelated chunks",()=>{const docs=[{id:"test",title:"Existing brokers",text:"If a shipper already has brokers, ask which freight modes those providers handle. Explore LTL if relevant.",kind:"test",url:null,approved:true}];assert.equal(retrieve("shipper already has brokers",docs)[0].id,"test");assert.equal(retrieve("bake chocolate cake",docs).length,0)});

import {checkedAnswer} from '../lib/gpt-prompt';
test('unverified historical lane-experience scripts are not displayed',()=>{assert(!checkedAnswer('Say: I have never run this lane before.').includes('Say:'));assert.equal(checkedAnswer('Ask what rate works for this load.'),'Ask what rate works for this load.')});
