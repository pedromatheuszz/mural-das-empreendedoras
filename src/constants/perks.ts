/**
 * Cortesias que uma empreendedora pode oferecer às outras empreendedoras do Mural.
 * Opcional — ninguém precisa oferecer cortesia para estar no Mural.
 * Os slugs são validados também no banco (constraint entrepreneur_profiles_perks_valid).
 */
export const COMMUNITY_PERKS = [
  { slug: 'priority-service', label: 'Prioridade no atendimento' },
  { slug: 'free-quote', label: 'Orçamento sem compromisso' },
  { slug: 'free-first-talk', label: 'Primeira conversa sem custo' },
  { slug: 'local-delivery', label: 'Entrega no bairro' },
  { slug: 'hub-discount', label: 'Desconto para empreendedoras do Mural' },
] as const;

export type PerkSlug = (typeof COMMUNITY_PERKS)[number]['slug'];

export const PERK_SLUGS = COMMUNITY_PERKS.map((perk) => perk.slug) as [PerkSlug, ...PerkSlug[]];

export function getPerkLabel(slug: string): string | undefined {
  return COMMUNITY_PERKS.find((perk) => perk.slug === slug)?.label;
}
