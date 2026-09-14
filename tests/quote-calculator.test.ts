import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildQuote,calculateQuote,defaultForm,snapshotSchema,logoSchema,type Rate} from '../lib/quote-calculator';
const rate=(amount:number,extra:Partial<Rate>={}):Rate=>({name:'Carrier',amount,fsc:0,chassis:0,days:0,accessorial:0,...extra});
test('truckload averages entered evidence and distinguishes markup from margin',()=>{
  const value=calculateQuote('Truckload',[rate(1000),rate(2000),rate(0)],20);
  assert.equal(value.buy,1500);assert.equal(value.sell,1800);assert.equal(value.profit,300);
  assert.equal(value.entered.length,2);assert.ok(Math.abs(value.margin-16.6666666667)<0.00001);
});
test('drayage uses each carrier’s fuel, chassis days, and accessorials',()=>{
  const value=calculateQuote('Drayage',[rate(1000,{fsc:20,chassis:50,days:2,accessorial:100}),rate(800,{fsc:25,chassis:80,days:3,accessorial:60}),rate(0)],15);
  assert.deepEqual(value.totals,[1400,1300,0]);assert.equal(value.buy,1350);assert.equal(value.sell,1552.5);
});
test('LTL and custom markup reconcile to cents',()=>{
  const value=calculateQuote('LTL',[rate(100.01),rate(100.02),rate(100.02)],12.5);
  assert.equal(value.buy,100.02);assert.equal(value.sell,112.52);assert.equal(value.profit,12.5);
  assert.equal(calculateQuote('LTL',[rate(0)],0).sell,0);
});
test('negative and non-finite rates or markup are rejected',()=>{
  for(const value of [-1,NaN,Infinity]){assert.throws(()=>calculateQuote('Truckload',[rate(value)],15));assert.throws(()=>calculateQuote('LTL',[rate(100)],value));}
});
test('server derives saved totals from validated evidence and preserves full input',()=>{
  const rates={Truckload:[rate(1600),rate(0),rate(0)],LTL:[rate(0),rate(0),rate(0)],Drayage:[rate(0),rate(0),rate(0)]};
  const snapshot=snapshotSchema.parse({mode:'Truckload',form:{...defaultForm,origin:'Newark, NJ',destination:'Chicago, IL'},rates,markup:20,logo:'',sell:1});
  const quote=buildQuote(snapshot,'a1234567-1234-4321-8123-123456789012',new Date('2026-09-14T00:00:00Z'));
  assert.equal(quote.sell,1920);assert.equal(quote.reference,'FSQ-2026-A1234567');assert.equal(quote.snapshot.form.reference,quote.reference);
  assert.equal(quote.snapshot.form.destination,'Chicago, IL');assert.equal(quote.status,'Open');
  assert.throws(()=>buildQuote({...snapshot,rates:{...rates,Truckload:[rate(0),rate(0),rate(0)]}},quote.id));
});
test('logos cannot load external resources or executable SVG content',()=>{
  assert.equal(logoSchema.safeParse('https://example.com/tracking.png').success,false);
  assert.equal(logoSchema.safeParse('data:image/svg+xml;base64,PHN2Zz4=').success,false);
  assert.equal(logoSchema.safeParse('data:image/png;base64,aGVsbG8=').success,true);
});
