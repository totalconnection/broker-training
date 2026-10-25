export const productIds = ['academy', 'quote-workshop', 'drayage-workshop'] as const;
export type ProductId = typeof productIds[number];
export const products = [
  {id: 'quote-workshop', name: 'Quote Workshop', type: 'WORKSHOP', href: '/workshops/quote', description: 'Learn the quoting process, compare carrier costs, and build a customer-ready quote.', features: ['Quoting lessons', 'Calculator & saved quotes', 'Checklists & scripts']},
  {id: 'drayage-workshop', name: 'Drayage Workshop', type: 'WORKSHOP', href: '/workshops/drayage', description: 'Understand container moves, build a drayage quote, and plan the handoff through empty return.', features: ['Container lessons & masterclasses', 'Drayage calculator & saved quotes', 'Move checklist & carrier outreach']},
  {id: 'academy', name: 'Freight Skills Academy', type: 'COURSE', href: '/academy', description: 'Your complete learning path for finding customers, moving freight, and building repeat business.', features: ['Structured learning path', 'Lesson resources', 'Quote & Drayage Workshops included']},
] as const;
export type ProductGrant = {product_id: string; expires_at: string | Date; revoked_at?: string | Date | null};
type LegacyEnrollment = {is_admin?: boolean; expires_at: string | Date} | undefined;

// Product IDs belong to Freight Skills, not a payment provider or Stripe account.
// Existing active Academy enrollments retain their access; Academy includes Quote Workshop.
export function resolveProducts(legacy: LegacyEnrollment, grants: ProductGrant[], now = new Date()): ProductId[] {
  if (legacy?.is_admin) return [...productIds];
  const allowed = new Set<ProductId>();
  if (legacy && new Date(legacy.expires_at).getTime() > now.getTime()) allowed.add('academy');
  for (const grant of grants) {
    if (!grant.revoked_at && new Date(grant.expires_at).getTime() > now.getTime() && productIds.includes(grant.product_id as ProductId)) allowed.add(grant.product_id as ProductId);
  }
  if (allowed.has('academy')) {allowed.add('quote-workshop');allowed.add('drayage-workshop');}
  return productIds.filter(id => allowed.has(id));
}
export function hasProduct(member: {admin: boolean; products: ProductId[]}, product: ProductId) {
  return member.admin || member.products.includes(product);
}
