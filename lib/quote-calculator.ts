import {z} from 'zod';

export const modeSchema = z.enum(['Truckload', 'LTL', 'Drayage']);
export const statusSchema = z.enum(['Open', 'Won', 'Lost']);
export type Mode = z.infer<typeof modeSchema>;
export type QuoteStatus = z.infer<typeof statusSchema>;
const amount = z.number().finite().min(0).max(10_000_000);
export const rateSchema = z.object({name:z.string().max(160),amount,fsc:amount,chassis:amount,days:amount,accessorial:amount});
export type Rate = z.infer<typeof rateSchema>;
export const defaultForm = {
  origin:'',destination:'',pickup:'',delivery:'',equipment:'Dry Van',commodity:'',weight:'',
  pieces:'',dimensions:'',freightClass:'',reference:'',notes:'',miles:'',hazmat:false,
  temperature:'',port:'',customer:'',company:'',contact:'',validDays:'7',
  disclaimer:'Rates are subject to equipment availability and final shipment details. Additional accessorial charges may apply.',
};
const short = z.string().max(500);
export const formSchema = z.object({
  origin:short.trim().min(1),destination:short.trim().min(1),pickup:short,delivery:short,equipment:short,
  commodity:short,weight:short,pieces:short,dimensions:short,freightClass:short,reference:short,
  notes:z.string().max(5000),miles:short,hazmat:z.boolean(),temperature:short,port:short,
  customer:short,company:short,contact:short,validDays:z.string().refine(v=>Number.isInteger(Number(v))&&Number(v)>=1&&Number(v)<=365,'Use 1–365 validity days.'),
  disclaimer:z.string().max(5000),
});
export const logoSchema = z.string().max(2_700_000).refine(v=>!v||/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v),'Use a PNG, JPEG, or WebP logo.');
export const snapshotSchema = z.object({mode:modeSchema,form:formSchema,rates:z.object({Truckload:z.array(rateSchema).length(3),LTL:z.array(rateSchema).length(3),Drayage:z.array(rateSchema).length(3)}),markup:z.number().finite().min(0).max(1000),logo:logoSchema});
export type QuoteSnapshot = z.infer<typeof snapshotSchema>;
export type SavedQuote = {id:string;reference:string;createdAt:string;mode:Mode;lane:string;customer:string;buy:number;sell:number;markup:number;status:QuoteStatus};
export type QuoteRecord = SavedQuote & {snapshot:QuoteSnapshot};
const cents = (value:number)=>Math.round((value+Number.EPSILON)*100);
export function calculateQuote(mode:Mode,rates:Rate[],markup:number) {
  if (!Number.isFinite(markup)||markup<0||markup>1000) throw Error('Markup must be between 0% and 1,000%.');
  const totals=rates.map(rate=>{
    const r=rateSchema.parse(rate);
    return cents(mode==='Drayage'?r.amount*(1+r.fsc/100)+r.chassis*r.days+r.accessorial:r.amount)/100;
  });
  const entered=totals.filter(value=>value>0);
  const buyCents=entered.length?Math.round(entered.reduce((sum,value)=>sum+cents(value),0)/entered.length):0;
  const sellCents=Math.round(buyCents*(1+markup/100));
  return {totals,entered,buy:buyCents/100,sell:sellCents/100,profit:(sellCents-buyCents)/100,margin:sellCents?(sellCents-buyCents)/sellCents*100:0};
}
export function buildQuote(snapshot:QuoteSnapshot,id:string,now=new Date()):QuoteRecord {
  const checked=snapshotSchema.parse(snapshot);
  const {buy,sell}=calculateQuote(checked.mode,checked.rates[checked.mode],checked.markup);
  if (!buy) throw Error('Add at least one carrier rate before saving.');
  const reference=checked.form.reference.trim()||`FSQ-${now.getFullYear()}-${id.slice(0,8).toUpperCase()}`;
  return {id,reference,createdAt:now.toISOString(),mode:checked.mode,lane:`${checked.form.origin} to ${checked.form.destination}`,customer:checked.form.customer||'Unassigned',buy,sell,markup:checked.markup,status:'Open',snapshot:{...checked,form:{...checked.form,reference}}};
}
