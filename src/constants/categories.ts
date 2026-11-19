import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type Category = {
  slug: string;
  label: string;
  icon: IconName;
  /** Tons suaves para chips e selos (fundo + texto com contraste AA). */
  tone: { background: string; foreground: string };
};

export const CATEGORIES = [
  { slug: 'beleza', label: 'Beleza & Estética', icon: 'sparkles-outline', tone: { background: '#F6E3DF', foreground: '#8E3B45' } },
  { slug: 'moda', label: 'Moda & Acessórios', icon: 'shirt-outline', tone: { background: '#F1E4F0', foreground: '#6E3563' } },
  { slug: 'gastronomia', label: 'Gastronomia & Doces', icon: 'restaurant-outline', tone: { background: '#FBEBD9', foreground: '#7A4812' } },
  { slug: 'saude', label: 'Saúde & Bem-estar', icon: 'leaf-outline', tone: { background: '#E3F0E8', foreground: '#2A6145' } },
  { slug: 'educacao', label: 'Educação & Mentoria', icon: 'school-outline', tone: { background: '#E6ECF7', foreground: '#30497D' } },
  { slug: 'marketing', label: 'Marketing & Comunicação', icon: 'megaphone-outline', tone: { background: '#FCE7E0', foreground: '#8C3920' } },
  { slug: 'tecnologia', label: 'Tecnologia & Digital', icon: 'laptop-outline', tone: { background: '#E5EEF2', foreground: '#285466' } },
  { slug: 'artesanato', label: 'Artesanato & Arte', icon: 'color-palette-outline', tone: { background: '#F3EAD9', foreground: '#6B4F18' } },
  { slug: 'casa', label: 'Casa & Decoração', icon: 'flower-outline', tone: { background: '#EAF0E4', foreground: '#46602D' } },
  { slug: 'eventos', label: 'Eventos & Festas', icon: 'gift-outline', tone: { background: '#F7E5EC', foreground: '#842B51' } },
  { slug: 'consultoria', label: 'Consultoria & Negócios', icon: 'briefcase-outline', tone: { background: '#ECE8F4', foreground: '#47396F' } },
  { slug: 'financas', label: 'Finanças & Jurídico', icon: 'calculator-outline', tone: { background: '#E4EFEE', foreground: '#285C57' } },
  { slug: 'fotografia', label: 'Fotografia & Audiovisual', icon: 'camera-outline', tone: { background: '#EFEAE6', foreground: '#54453A' } },
  { slug: 'pets', label: 'Pets', icon: 'paw-outline', tone: { background: '#F8EEDC', foreground: '#795616' } },
  { slug: 'servicos', label: 'Serviços & Manutenção', icon: 'construct-outline', tone: { background: '#E9ECEF', foreground: '#3F4A54' } },
  { slug: 'outros', label: 'Outros', icon: 'apps-outline', tone: { background: '#F4ECE4', foreground: '#5E5A60' } },
] as const satisfies readonly Category[];

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_SLUGS = CATEGORIES.map((category) => category.slug) as [CategorySlug, ...CategorySlug[]];

const bySlug = new Map<string, Category>(CATEGORIES.map((category) => [category.slug, category]));

export function getCategory(slug: string | null | undefined): Category | undefined {
  return slug ? bySlug.get(slug) : undefined;
}
