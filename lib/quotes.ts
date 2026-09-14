import type {Member} from './access';
import {listItems,saveItem} from './store';
import type {QuoteRecord,QuoteStatus} from './quote-calculator';
export const QUOTE_KIND='freight_quote';
export async function loadQuote(member:Member,id:string) {
  const item=(await listItems(member,QUOTE_KIND)).find(item=>item.id===id);
  return item?{...item.data,id:item.id} as QuoteRecord:null;
}
export async function saveQuoteRecord(member:Member,quote:QuoteRecord) {
  await saveItem(member,QUOTE_KIND,quote,quote.id);
}
export async function updateQuoteStatus(member:Member,id:string,status:QuoteStatus) {
  const existing=await loadQuote(member,id);
  if(!existing) throw Error('QUOTE_NOT_FOUND');
  await saveQuoteRecord(member,{...existing,status});
}
