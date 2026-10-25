import {hasProduct,type ProductId} from './products';
import {modeSchema,type Mode} from './quote-calculator';
type Access={admin:boolean;products:ProductId[]};
export function allowedQuoteModes(member:Access):readonly Mode[] {
 if(hasProduct(member,'academy')||hasProduct(member,'quote-workshop'))return modeSchema.options;
 return hasProduct(member,'drayage-workshop')?['Drayage']:[];
}
export function canAccessQuote(member:Access,mode:Mode) {return allowedQuoteModes(member).includes(mode);}
